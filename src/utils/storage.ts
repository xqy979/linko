import type { Bookmark, Settings, Category } from "../types";
import { DEFAULT_SETTINGS, DEFAULT_CATEGORIES } from "../types";

const STORAGE_KEYS = {
  BOOKMARKS: "linko_bookmarks",
  SETTINGS: "linko_settings",
  CATEGORIES: "linko_categories",
};

// Check if running inside Chrome extension environment
const isChromeExtension = (): boolean => {
  return typeof chrome !== "undefined" && !!chrome?.storage?.local;
};

// ─── Generic Storage ─────────────────────────────────────────────

async function getItem<T>(key: string, fallback: T): Promise<T> {
  try {
    if (isChromeExtension()) {
      const result = await chrome.storage.local.get(key);
      return (result[key] as T) ?? fallback;
    }
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

async function setItem<T>(key: string, value: T): Promise<void> {
  try {
    if (isChromeExtension()) {
      await chrome.storage.local.set({ [key]: value });
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (e) {
    console.error("Storage setItem error:", e);
  }
}

// ─── Bookmarks ───────────────────────────────────────────────────

export async function getBookmarks(): Promise<Bookmark[]> {
  return getItem<Bookmark[]>(STORAGE_KEYS.BOOKMARKS, []);
}

export async function saveBookmarks(bookmarks: Bookmark[]): Promise<void> {
  await setItem(STORAGE_KEYS.BOOKMARKS, bookmarks);
}

/**
 * Internal helper to sync a single bookmark to Chrome bookmarks bar.
 * Ensures the category folder exists and the bookmark is in it.
 */
async function syncBookmarkToChrome(
  bookmark: Bookmark | Omit<Bookmark, "id" | "createdAt" | "updatedAt">,
  categories: Category[],
  settings: Settings,
) {
  if (!isChromeExtension() || !settings.syncToChrome || !chrome.bookmarks)
    return;

  try {
    const categoryName =
      categories.find((c) => c.id === bookmark.category)?.name || "未分类";

    // 1. Ensure Category Folder exists in Bookmarks Bar ("1")
    const searchFolderResults = await chrome.bookmarks.search({
      title: categoryName,
    });
    let parentId = "";
    const existingFolder = searchFolderResults.find(
      (n) => !n.url && n.title === categoryName && n.parentId === "1",
    );

    if (existingFolder) {
      parentId = existingFolder.id;
    } else {
      const created = await chrome.bookmarks.create({
        parentId: "1",
        title: categoryName,
      });
      parentId = created.id;
    }

    // 2. Search for the bookmark by URL in Chrome
    const searchResults = await chrome.bookmarks.search({ url: bookmark.url });

    if (searchResults.length > 0) {
      // Find one that is likely under our management (or just pick first)
      const chromeBookmark = searchResults[0];

      // If it exists but in a different folder, move it
      if (chromeBookmark.parentId !== parentId) {
        await chrome.bookmarks.move(chromeBookmark.id, { parentId });
      }

      // If title changed, update it
      if (chromeBookmark.title !== bookmark.title) {
        await chrome.bookmarks.update(chromeBookmark.id, {
          title: bookmark.title,
        });
      }
    } else {
      // Create new bookmark in the correct folder
      await chrome.bookmarks.create({
        parentId,
        title: bookmark.title,
        url: bookmark.url,
      });
    }
  } catch (e) {
    console.error("Failed to sync to Chrome:", e);
  }
}

export async function addBookmark(
  bookmark: Omit<Bookmark, "id" | "createdAt" | "updatedAt">,
): Promise<Bookmark> {
  const bookmarks = await getBookmarks();
  const settings = await getSettings();
  const categories = await getCategories();

  // Check for duplicate URL and overwrite
  const existingIndex = bookmarks.findIndex((b) => b.url === bookmark.url);
  if (existingIndex !== -1) {
    const existing = bookmarks[existingIndex];
    const updatedBookmark: Bookmark = {
      ...existing,
      ...bookmark,
      updatedAt: Date.now(),
      // Keep original ID and createdAt
    };
    bookmarks[existingIndex] = updatedBookmark;
    await saveBookmarks(bookmarks);

    // Sync update to Chrome
    await syncBookmarkToChrome(updatedBookmark, categories, settings);

    return updatedBookmark;
  }

  const newBookmark: Bookmark = {
    ...bookmark,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // Sync to Chrome Bookmarks
  await syncBookmarkToChrome(newBookmark, categories, settings);

  bookmarks.unshift(newBookmark);
  await saveBookmarks(bookmarks);
  return newBookmark;
}

export async function updateBookmark(
  id: string,
  updates: Partial<Bookmark>,
): Promise<Bookmark | null> {
  const bookmarks = await getBookmarks();
  const index = bookmarks.findIndex((b) => b.id === id);
  if (index === -1) return null;

  const updated = { ...bookmarks[index], ...updates, updatedAt: Date.now() };
  bookmarks[index] = updated;
  await saveBookmarks(bookmarks);

  // Sync to Chrome if needed
  const settings = await getSettings();
  const categories = await getCategories();
  await syncBookmarkToChrome(updated, categories, settings);

  return updated;
}

export async function deleteBookmark(id: string): Promise<boolean> {
  const bookmarks = await getBookmarks();
  const filtered = bookmarks.filter((b) => b.id !== id);
  if (filtered.length === bookmarks.length) return false;
  await saveBookmarks(filtered);
  return true;
}

// ─── Settings ────────────────────────────────────────────────────

export async function getSettings(): Promise<Settings> {
  return getItem<Settings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
}

export async function saveSettings(settings: Settings): Promise<void> {
  await setItem(STORAGE_KEYS.SETTINGS, settings);
}

// ─── Categories ──────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  return getItem<Category[]>(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
}

export async function saveCategories(categories: Category[]): Promise<void> {
  await setItem(STORAGE_KEYS.CATEGORIES, categories);
}

export async function addCategory(
  name: string,
  color?: string,
): Promise<Category> {
  const categories = await getCategories();
  const settings = await getSettings();

  const newCategory: Category = {
    id: name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now(),
    name,
    color: color || "#6366f1", // Default to Indigo if not provided
  };

  // Sync to Chrome (Create Folder)
  if (isChromeExtension() && settings.syncToChrome && chrome.bookmarks) {
    try {
      // Check if folder exists to avoid duplicates
      const results = await chrome.bookmarks.search({ title: name });
      const existing = results.find(
        (n) => !n.url && n.title === name && n.parentId === "1",
      );
      if (!existing) {
        await chrome.bookmarks.create({ parentId: "1", title: name });
      }
    } catch (e) {
      console.error("Failed to sync category to Chrome:", e);
    }
  }

  categories.push(newCategory);
  await saveCategories(categories);
  return newCategory;
}

export async function deleteCategory(id: string): Promise<void> {
  // Remove category
  const categories = await getCategories();
  await saveCategories(categories.filter((c) => c.id !== id));

  // Remove bookmarks in this category
  const bookmarks = await getBookmarks();
  const remaining = bookmarks.filter((b) => b.category !== id);
  if (remaining.length !== bookmarks.length) {
    await saveBookmarks(remaining);
  }
}

export async function updateCategory(
  id: string,
  updates: Partial<Omit<Category, "id">>,
): Promise<Category | null> {
  const categories = await getCategories();
  const index = categories.findIndex((c) => c.id === id);
  if (index === -1) return null;
  categories[index] = { ...categories[index], ...updates };
  await saveCategories(categories);
  return categories[index];
}

export async function reorderCategories(newOrder: Category[]): Promise<void> {
  await saveCategories(newOrder);
}

// ─── Import / Export ─────────────────────────────────────────────

export interface ExportData {
  version: string;
  exportedAt: string;
  bookmarks: Bookmark[];
  categories: Category[];
  settings: Settings;
}

export async function exportData(): Promise<ExportData> {
  const [bookmarks, categories, settings] = await Promise.all([
    getBookmarks(),
    getCategories(),
    getSettings(),
  ]);
  return {
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    bookmarks,
    categories,
    settings,
  };
}

export async function importData(data: ExportData): Promise<void> {
  if (!data.bookmarks || !Array.isArray(data.bookmarks)) {
    throw new Error("Invalid data format");
  }
  await Promise.all([
    saveBookmarks(data.bookmarks),
    data.categories ? saveCategories(data.categories) : Promise.resolve(),
    data.settings ? saveSettings(data.settings) : Promise.resolve(),
  ]);
}

export function downloadJSON(data: ExportData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `linko-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function pickJSONFile(): Promise<ExportData> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return reject(new Error("No file selected"));
      try {
        const text = await file.text();
        const data = JSON.parse(text) as ExportData;
        resolve(data);
      } catch {
        reject(new Error("Invalid JSON file"));
      }
    };
    input.click();
  });
}

// ─── Chrome Bookmark Import ─────────────────────────────────────

export interface ChromeFolder {
  id: string;
  title: string;
  count: number;
}

export async function getChromeRootFolders(): Promise<ChromeFolder[]> {
  if (!isChromeExtension() || !chrome?.bookmarks) return [];

  const process = (nodes: chrome.bookmarks.BookmarkTreeNode[]) =>
    nodes
      .filter((n) => !n.url)
      .map((n) => ({
        id: n.id,
        title: n.title,
        count: n.children ? n.children.length : 0,
      }));

  try {
    const bar = await chrome.bookmarks.getChildren("1");
    const other = await chrome.bookmarks.getChildren("2");
    return [...process(bar), ...process(other)];
  } catch {
    return [];
  }
}

export async function importSelectedFolders(
  folderIds: string[],
): Promise<number> {
  let count = 0;
  for (const id of folderIds) {
    try {
      const [node] = await chrome.bookmarks.getSubTree(id);
      if (!node) continue;

      const categoryName = node.title || "Imported";
      const category = await addCategory(categoryName);

      const bookmarks: { title: string; url: string }[] = [];
      const collect = (n: chrome.bookmarks.BookmarkTreeNode) => {
        if (n.url) bookmarks.push({ title: n.title, url: n.url });
        if (n.children) n.children.forEach(collect);
      };
      if (node.children) node.children.forEach(collect);

      for (const b of bookmarks) {
        await addBookmark({
          title: b.title,
          url: b.url,
          icon: "🔗",
          category: category.id,
        });
        count++;
      }
    } catch (e) {
      console.error("Import folder error:", e);
    }
  }
  return count;
}

export async function importChromeBookmarks(): Promise<Bookmark[]> {
  if (!isChromeExtension() || !chrome?.bookmarks) {
    // For dev environment, return mock data
    const mockBookmarks: Bookmark[] = [
      {
        id: crypto.randomUUID(),
        title: "Google",
        url: "https://google.com",
        icon: "🔍",
        category: "tools",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: crypto.randomUUID(),
        title: "GitHub",
        url: "https://github.com",
        icon: "💻",
        category: "development",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: crypto.randomUUID(),
        title: "Dribbble",
        url: "https://dribbble.com",
        icon: "🎨",
        category: "design",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
    const existing = await getBookmarks();
    const merged = [...existing, ...mockBookmarks];
    await saveBookmarks(merged);
    return mockBookmarks;
  }

  // Real Chrome bookmark import
  const tree = await chrome.bookmarks.getTree();
  const imported: Bookmark[] = [];

  function walk(nodes: chrome.bookmarks.BookmarkTreeNode[]) {
    for (const node of nodes) {
      if (node.url) {
        imported.push({
          id: crypto.randomUUID(),
          title: node.title || "Untitled",
          url: node.url,
          icon: "🔗",
          category: "all",
          createdAt: node.dateAdded ?? Date.now(),
          updatedAt: Date.now(),
        });
      }
      if (node.children) walk(node.children);
    }
  }

  walk(tree);
  const existing = await getBookmarks();
  const existingUrls = new Set(existing.map((b) => b.url));
  const newBookmarks = imported.filter((b) => !existingUrls.has(b.url));
  await saveBookmarks([...existing, ...newBookmarks]);
  return newBookmarks;
}

// ─── Background Image ───────────────────────────────────────────
