import { useState, useEffect } from "react";
import {
  Bookmark as BookmarkIcon,
  ChevronDown,
  Plus,
  Globe,
  X,
  Check,
} from "lucide-react";
import { cn } from "../utils/cn";
import { motion, AnimatePresence } from "framer-motion";
import type { Bookmark, Category } from "../types";

interface BookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    url: string;
    icon: string;
    category: string;
    description?: string;
  }) => void;
  categories: Category[];
  editingBookmark?: Bookmark | null;
  onAddCategory?: (name: string) => Promise<Category>;
}

export const BookmarkModal = ({
  isOpen,
  onClose,
  onSave,
  categories,
  editingBookmark,
  onAddCategory,
}: BookmarkModalProps) => {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [icon, setIcon] = useState("🔗");
  const [category, setCategory] = useState("all");
  const [showDropdown, setShowDropdown] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);

  // Auto-detect active tab URL in Chrome extension
  useEffect(() => {
    if (editingBookmark) {
      setTitle(editingBookmark.title);
      setUrl(editingBookmark.url);
      setIcon(editingBookmark.icon);
      setCategory(editingBookmark.category);
    } else {
      // Try to get current tab info
      if (typeof chrome !== "undefined" && chrome?.tabs?.query) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const tab = tabs?.[0];
          if (tab) {
            setUrl(tab.url || "");
            setTitle(tab.title || "");
            if (tab.favIconUrl) {
              setIcon(tab.favIconUrl);
            }
          }
        });
      } else {
        // Dev mode: use current page
        setUrl(window.location.href);
        setTitle(document.title || "New Bookmark");
        setIcon("🔗");
      }
      setCategory("all");
    }
    setShowDropdown(false);
    setShowNewCategory(false);
    setNewCategoryName("");
  }, [editingBookmark, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;
    onSave({
      title: title.trim(),
      url: url.trim(),
      icon: icon.startsWith("http") ? "🔗" : icon,
      category,
    });
    onClose();
  };

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name || !onAddCategory) return;
    const created = await onAddCategory(name);
    setCategory(created.id);
    setNewCategoryName("");
    setShowNewCategory(false);
    setShowDropdown(false);
  };

  const selectedCategory = categories.find((c) => c.id === category);

  const isEditing = !!editingBookmark;

  // Get favicon URL
  const getFaviconUrl = (pageUrl: string) => {
    try {
      const u = new URL(pageUrl);
      return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`;
    } catch {
      return null;
    }
  };

  const faviconUrl = getFaviconUrl(url);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-sm z-50 bg-[#f8fafc] rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 bg-white border-b border-slate-100">
          <div className="flex items-center gap-3">
            <BookmarkIcon className="w-5 h-5 text-blue-500" />
            <h2 className="text-base font-bold text-slate-800">
              {isEditing ? "编辑书签" : "添加书签"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* URL Preview */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
            {faviconUrl && !icon.startsWith("http") ? (
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-lg shrink-0 border border-slate-200">
                {icon}
              </div>
            ) : faviconUrl ? (
              <img
                src={faviconUrl}
                alt=""
                className="w-8 h-8 rounded-lg bg-slate-100 shrink-0 border border-slate-200"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                <Globe className="w-4 h-4 text-slate-400" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-500 truncate font-mono">
                {(() => {
                  try {
                    return new URL(url).hostname.replace("www.", "");
                  } catch {
                    return url || "输入链接地址";
                  }
                })()}
              </p>
            </div>
          </div>

          {/* URL Input */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5 ml-1">
              链接地址
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-mono"
            />
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5 ml-1">
              书签标题
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入书签名称"
              className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
              required
              autoFocus
            />
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <label className="block text-xs font-medium text-slate-500 mb-1.5 ml-1">
              选择分类
            </label>
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm text-left flex items-center justify-between hover:border-slate-300 transition-all"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor:
                      selectedCategory?.color ||
                      (category === "all" ? "#94a3b8" : "#6366f1"),
                  }}
                />
                <span className="text-slate-700">
                  {selectedCategory?.name || "未分类"}
                </span>
              </div>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-slate-400 transition-transform",
                  showDropdown && "rotate-180",
                )}
              />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 z-10">
                  {/* Backdrop for click outside */}
                  <div
                    className="fixed inset-0 z-[-1]"
                    onClick={() => setShowDropdown(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="w-full rounded-xl bg-white border border-slate-100 shadow-xl overflow-hidden max-h-48 overflow-y-auto"
                  >
                    {categories
                      .filter((c) => c.id !== "all")
                      .map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setCategory(cat.id);
                            setShowDropdown(false);
                          }}
                          className={cn(
                            "w-full px-3 py-2.5 text-sm text-left flex items-center gap-2 hover:bg-slate-50 transition-colors",
                            category === cat.id
                              ? "bg-blue-50 text-blue-600 font-medium"
                              : "text-slate-600",
                          )}
                        >
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: cat.color || "#6366f1" }}
                          />
                          {cat.name}
                          {category === cat.id && (
                            <Check className="w-3.5 h-3.5 ml-auto text-blue-500" />
                          )}
                        </button>
                      ))}

                    {/* Add new category inline */}
                    {showNewCategory ? (
                      <div className="flex items-center gap-2 px-3 py-2 border-t border-slate-100 bg-slate-50">
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddCategory();
                            }
                            if (e.key === "Escape") {
                              setShowNewCategory(false);
                            }
                          }}
                          placeholder="分类名称"
                          autoFocus
                          className="flex-1 h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-400 placeholder:text-slate-400"
                        />
                        <button
                          type="button"
                          onClick={handleAddCategory}
                          disabled={!newCategoryName.trim()}
                          className="h-8 px-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs rounded-lg font-medium transition-colors shadow-sm"
                        >
                          添加
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowNewCategory(true)}
                        className="w-full px-3 py-2.5 text-sm text-left flex items-center gap-2 text-blue-500 hover:bg-blue-50 transition-colors border-t border-slate-100 font-medium"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        新建分类
                      </button>
                    )}
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 font-medium transition-all"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl text-sm text-white font-medium transition-all shadow-lg shadow-blue-500/20"
            >
              {isEditing ? "保存修改" : "保存书签"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
