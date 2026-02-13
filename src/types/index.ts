export interface Bookmark {
  id: string;
  title: string;
  url: string;
  icon: string;
  category: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
}

export interface Settings {
  syncToChrome: boolean;
  viewMode: "grid" | "list";
  openInNewTab: boolean;
  storageType: "local" | "chrome";
}

export interface Category {
  id: string;
  name: string;
  color?: string; // Hex code or generic color name
  isSystem?: boolean; // To identify "All" or "Uncategorized"
  icon?: string;
}

export const DEFAULT_SETTINGS: Settings = {
  syncToChrome: true,
  viewMode: "grid",
  openInNewTab: true,
  storageType: "local",
};

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "all", name: "全部", color: "#6366f1", isSystem: true }, // Indigo
];

export const EMOJI_OPTIONS = [
  "📊",
  "🎨",
  "🛠️",
  "📈",
  "📱",
  "☁️",
  "🎯",
  "📝",
  "🎵",
  "🎮",
  "📚",
  "💡",
  "🔗",
  "🖥️",
  "📷",
  "🎬",
  "🛒",
  "💼",
  "🏠",
  "⭐",
  "🚀",
  "🔥",
  "💎",
  "🌈",
  "🎪",
  "🏆",
  "🔑",
  "📌",
  "🗂️",
  "💻",
];
