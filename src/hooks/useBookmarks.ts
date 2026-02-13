import { useState, useEffect, useCallback } from "react";
import type { Bookmark, Category } from "../types";
import * as storage from "../utils/storage";

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const data = await storage.getBookmarks();
    setBookmarks(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const add = useCallback(
    async (bookmark: Omit<Bookmark, "id" | "createdAt" | "updatedAt">) => {
      const created = await storage.addBookmark(bookmark);
      setBookmarks((prev) => [...prev, created]);
      return created;
    },
    [],
  );

  const update = useCallback(async (id: string, updates: Partial<Bookmark>) => {
    const updated = await storage.updateBookmark(id, updates);
    if (updated) {
      setBookmarks((prev) => prev.map((b) => (b.id === id ? updated : b)));
    }
    return updated;
  }, []);

  const remove = useCallback(async (id: string) => {
    const success = await storage.deleteBookmark(id);
    if (success) {
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
    }
    return success;
  }, []);

  const importFromChrome = useCallback(async () => {
    const imported = await storage.importChromeBookmarks();
    await reload();
    return imported;
  }, [reload]);

  return { bookmarks, loading, add, update, remove, reload, importFromChrome };
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);

  const reload = useCallback(async () => {
    const data = await storage.getCategories();
    setCategories(data);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const add = useCallback(async (name: string, color?: string) => {
    const created = await storage.addCategory(name, color);
    setCategories((prev) => [...prev, created]);
    return created;
  }, []);

  const update = useCallback(
    async (id: string, updates: Partial<Omit<Category, "id">>) => {
      const updated = await storage.updateCategory(id, updates);
      if (updated) {
        setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
      }
      return updated;
    },
    [],
  );

  const remove = useCallback(async (id: string) => {
    await storage.deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const reorder = useCallback(async (newOrder: Category[]) => {
    setCategories(newOrder); // Optimistic update
    await storage.reorderCategories(newOrder);
  }, []);

  return { categories, add, update, remove, reorder, reload };
}
