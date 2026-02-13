import { useState, useRef } from "react";
import {
  Search,
  Settings,
  LayoutGrid,
  List as ListIcon,
  Trash2,
  Edit2,
  X,
  Languages,
  Flame,
  TrendingUp,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { GlassCard } from "./components/GlassCard";
import { SettingsModal } from "./components/SettingsModal";
import { BookmarkModal } from "./components/BookmarkModal";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { CategoryModal } from "./components/CategoryModal";
import { TranslatorSidebar } from "./components/TranslatorSidebar";
import { GithubTrendingSidebar } from "./components/GithubTrendingSidebar";
import { AiNewsSidebar } from "./components/AiNewsSidebar";
import { cn } from "./utils/cn";
import { AnimatePresence, motion, Reorder } from "framer-motion";
import { useBookmarks, useCategories } from "./hooks/useBookmarks";
import { useSettings } from "./hooks/useSettings";
import type { Bookmark, Category } from "./types";
import "./components/sidebars.css";

function App() {
  const {
    bookmarks,
    add: addBookmark,
    update: updateBookmark,
    remove: removeBookmark,
    reload: reloadBookmarks,
  } = useBookmarks();

  const {
    categories,
    add: addCategory,
    update: updateCategory,
    remove: removeCategory,
    reload: reloadCategories,
    reorder: reorderCategories,
  } = useCategories();
  const { settings, update: updateSettings } = useSettings();

  const [dropdownPos, setDropdownPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const isDraggingRef = useRef(false);

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [activeCategoryDropdown, setActiveCategoryDropdown] = useState<
    string | null
  >(null);

  // Sidebar states
  const [isTranslatorOpen, setIsTranslatorOpen] = useState(false);
  const [isGithubOpen, setIsGithubOpen] = useState(false);
  const [isAiNewsOpen, setIsAiNewsOpen] = useState(false);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleSaveCategory = async (name: string, color: string) => {
    if (editingCategory) {
      await updateCategory(editingCategory.id, { name, color });
    } else {
      await addCategory(name, color);
    }
    setEditingCategory(null);
    setIsCategoryOpen(false);
  };

  const filteredBookmarks = bookmarks
    .filter((b) => {
      const matchesSearch =
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.url.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeTab === "all" || b.category === activeTab;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      // Sort by category order if in 'all' tab
      if (activeTab === "all") {
        const indexA = categories.findIndex((c) => c.id === a.category);
        const indexB = categories.findIndex((c) => c.id === b.category);
        // If category not found, push to end
        const orderA = indexA === -1 ? 9999 : indexA;
        const orderB = indexB === -1 ? 9999 : indexB;
        if (orderA !== orderB) return orderA - orderB;
      }
      // Default sort (e.g. by time added, implied by array order or updated?)
      // Keep existing relative order or by creation?
      // For now, stable sort based on index difference is enough for category grouping.
      return 0;
    });

  const handleSaveBookmark = async (data: {
    title: string;
    url: string;
    icon: string;
    category: string;
    description?: string;
  }) => {
    if (editingBookmark) {
      await updateBookmark(editingBookmark.id, data);
    } else {
      await addBookmark(data);
    }
    setEditingBookmark(null);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await removeBookmark(deleteId);
      setDeleteId(null);
    }
  };

  const handleOpenLink = (url: string) => {
    if (settings.openInNewTab) {
      window.open(url, "_blank");
    } else {
      window.location.href = url;
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 text-slate-800 relative overflow-hidden font-sans antialiased transition-all duration-700 bg-slate-50">
      <>
        <div className="fixed inset-0 z-0 bg-slate-50 transition-all duration-700" />
        <div className="fixed top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-purple-200/40 rounded-full blur-[120px] pointer-events-none z-0 mix-blend-multiply" />
        <div className="fixed bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-blue-200/40 rounded-full blur-[120px] pointer-events-none z-0 mix-blend-multiply" />
      </>

      <main className="relative w-full px-2 md:px-6 space-y-4 z-10 max-w-[1920px] mx-auto">
        {/* Header & Search Section */}
        <header className="flex items-center gap-4 md:gap-8 mb-4">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="p-1 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <img
                src="/logo.png"
                alt="Linko Logo"
                className="w-9 h-9 object-cover rounded-lg"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                Linko
              </h1>
            </div>
          </div>

          {/* Search Bar - Flexible Width */}
          <div className="relative flex-1 max-w-2xl group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索书签..."
              className="w-full h-11 pl-11 pr-10 bg-white border border-slate-200 rounded-xl hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400 text-slate-800 shadow-sm font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Toggles */}
            <div className="hidden md:flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg shadow-sm mr-2">
              <button
                onClick={() => updateSettings({ viewMode: "grid" })}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  settings.viewMode === "grid"
                    ? "bg-slate-100 text-slate-900 shadow-sm"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50",
                )}
                title="网格视图"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => updateSettings({ viewMode: "list" })}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  settings.viewMode === "list"
                    ? "bg-slate-100 text-slate-900 shadow-sm"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50",
                )}
                title="列表视图"
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsTranslatorOpen(true)}
                className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 transition-all hover:scale-105 active:scale-95 group shadow-sm"
                title="翻译"
              >
                <Languages className="w-5 h-5 text-blue-500 group-hover:text-blue-600" />
              </button>

              <button
                onClick={() => setIsGithubOpen(true)}
                className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 transition-all hover:scale-105 active:scale-95 group shadow-sm"
                title="GitHub 热榜"
              >
                <Flame className="w-5 h-5 text-orange-500 group-hover:text-orange-600" />
              </button>

              <button
                onClick={() => setIsAiNewsOpen(true)}
                className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 transition-all hover:scale-105 active:scale-95 group shadow-sm"
                title="股市资讯"
              >
                <TrendingUp className="w-5 h-5 text-red-500 group-hover:text-red-600" />
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 transition-all hover:scale-105 active:scale-95 shadow-sm"
              >
                <Settings className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
        </header>

        {/* Categories */}
        <nav className="pb-2 pt-2 px-1 min-h-[50px]">
          <div className="flex flex-wrap items-center gap-3">
            {/* Add Category Button */}
            <button
              onClick={() => {
                setEditingCategory(null);
                setIsCategoryOpen(true);
              }}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-dashed border-slate-300 text-slate-400 hover:bg-slate-50 hover:text-slate-600 hover:border-slate-400 transition-all shrink-0 shadow-sm"
              title="添加分类"
            >
              <Plus className="w-5 h-5" />
            </button>

            {/* Fixed "全部" tab — always first, not draggable */}
            <div
              onClick={() => setActiveTab("all")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full border transition-all whitespace-nowrap select-none shadow-sm cursor-pointer shrink-0",
                activeTab === "all"
                  ? "bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/20"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300",
              )}
            >
              <div
                className="w-2 h-2 rounded-full shrink-0 shadow-[0_0_8px_currentColor]"
                style={{ backgroundColor: "#6366f1", color: "#6366f1" }}
              />
              <span className="font-semibold text-sm tracking-wide">全部</span>
            </div>

            {/* Draggable category tabs */}
            <Reorder.Group
              axis="x"
              values={categories.filter((c) => c.id !== "all")}
              onReorder={(newOrder) => {
                const allCat = categories.find((c) => c.id === "all");
                if (allCat) {
                  reorderCategories([allCat, ...newOrder]);
                } else {
                  reorderCategories(newOrder);
                }
              }}
              className="contents"
            >
              {categories
                .filter((cat) => cat.id !== "all")
                .map((cat) => (
                  <Reorder.Item
                    key={cat.id}
                    value={cat}
                    className="relative group shrink-0"
                    ref={(el: any) => {
                      categoryRefs.current[cat.id] = el;
                    }}
                    onDragStart={() => (isDraggingRef.current = true)}
                    onDragEnd={() =>
                      setTimeout(() => (isDraggingRef.current = false), 100)
                    }
                  >
                    <div
                      onClick={() => {
                        if (!isDraggingRef.current) {
                          setActiveTab(cat.id);
                        }
                      }}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full border transition-all whitespace-nowrap select-none shadow-sm cursor-pointer",
                        activeTab === cat.id
                          ? "bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/20"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300",
                      )}
                    >
                      <div
                        className="w-2 h-2 rounded-full shrink-0 shadow-[0_0_8px_currentColor]"
                        style={{
                          backgroundColor: cat.color || "#6366f1",
                          color: cat.color || "#6366f1",
                        }}
                      />
                      <span className="font-semibold text-sm tracking-wide">
                        {cat.name}
                      </span>

                      {/* Dropdown Trigger */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect =
                            categoryRefs.current[
                              cat.id
                            ]?.getBoundingClientRect();
                          if (rect) {
                            setDropdownPos({
                              x: rect.left,
                              y: rect.bottom + 8,
                            });
                          }
                          setActiveCategoryDropdown(
                            activeCategoryDropdown === cat.id ? null : cat.id,
                          );
                        }}
                        className="p-1 rounded-full hover:bg-black/5 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* Dropdown Menu - Fixed Position to avoid clipping */}
                    {activeCategoryDropdown === cat.id && dropdownPos && (
                      <div
                        className="fixed z-[999] w-32 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden flex flex-col py-1 animate-in fade-in zoom-in-95 duration-150"
                        style={{ top: dropdownPos.y, left: dropdownPos.x }}
                      >
                        {/* Overlay to close when clicking outside */}
                        <div
                          className="fixed inset-0 z-[-1]"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveCategoryDropdown(null);
                          }}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCategory(cat);
                            setIsCategoryOpen(true);
                            setActiveCategoryDropdown(null);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          编辑
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (
                              confirm(
                                `确定要删除 "${cat.name}" 分类吗？该分类下的所有书签也将被永久删除。`,
                              )
                            ) {
                              await removeCategory(cat.id);
                              reloadBookmarks();
                            }
                            setActiveCategoryDropdown(null);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          删除
                        </button>
                      </div>
                    )}
                  </Reorder.Item>
                ))}
            </Reorder.Group>
          </div>
        </nav>

        {/* Content Grid */}
        <div
          className={cn(
            "grid gap-4 transition-all duration-500 pb-20",
            settings.viewMode === "grid"
              ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8"
              : "grid-cols-1",
          )}
        >
          <AnimatePresence mode="popLayout">
            {filteredBookmarks.map((bookmark) => (
              <motion.div
                layout
                key={bookmark.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <GlassCard
                  interactive
                  className={cn(
                    "group relative flex gap-3 p-4 transition-all duration-300",
                    settings.viewMode === "grid"
                      ? "flex-col h-full"
                      : "flex-row items-center py-3",
                  )}
                  onClick={() => handleOpenLink(bookmark.url)}
                >
                  {/* Icon */}
                  <div className="shrink-0">
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform duration-300 overflow-hidden text-slate-700">
                      {(() => {
                        let src = bookmark.icon;
                        try {
                          if (
                            typeof chrome !== "undefined" &&
                            chrome.runtime &&
                            chrome.runtime.getURL
                          ) {
                            const urlObj = new URL(
                              chrome.runtime.getURL("/_favicon/"),
                            );
                            urlObj.searchParams.set("pageUrl", bookmark.url);
                            urlObj.searchParams.set("size", "64");
                            src = urlObj.toString();
                          } else {
                            const domain = new URL(bookmark.url).hostname;
                            src = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
                          }
                        } catch {
                          /* Fallback */
                        }

                        return (
                          <img
                            src={src}
                            alt=""
                            className="w-6 h-6 rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                              (
                                e.target as HTMLImageElement
                              ).parentElement!.textContent = bookmark.icon;
                            }}
                          />
                        );
                      })()}
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {bookmark.title}
                    </h3>
                    <div
                      className={cn(
                        "mt-1",
                        settings.viewMode === "grid"
                          ? "space-y-1.5"
                          : "flex items-center gap-3",
                      )}
                    >
                      <p className="text-xs text-slate-400 group-hover:text-slate-500 transition-colors line-clamp-1">
                        {(() => {
                          try {
                            return new URL(bookmark.url).hostname.replace(
                              "www.",
                              "",
                            );
                          } catch {
                            return bookmark.url;
                          }
                        })()}
                      </p>
                      {activeTab === "all" && (
                        <div className="flex">
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] border whitespace-nowrap"
                            style={{
                              backgroundColor:
                                (categories.find(
                                  (c) => c.id === bookmark.category,
                                )?.color || "#64748b") + "15",
                              color:
                                categories.find(
                                  (c) => c.id === bookmark.category,
                                )?.color || "#64748b",
                              borderColor:
                                (categories.find(
                                  (c) => c.id === bookmark.category,
                                )?.color || "#64748b") + "30",
                            }}
                          >
                            {categories.find((c) => c.id === bookmark.category)
                              ?.name || bookmark.category}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    className={cn(
                      "flex gap-1 transition-opacity",
                      settings.viewMode === "grid"
                        ? "absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                        : "ml-auto",
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        setEditingBookmark(bookmark);
                        setIsAddOpen(true);
                      }}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteId(bookmark.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty state */}
        {filteredBookmarks.length === 0 && bookmarks.length > 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400 text-sm">没有找到匹配的书签</p>
          </div>
        )}
      </main>

      {/* Modals */}
      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            settings={settings}
            onUpdateSettings={updateSettings}
            onReload={() => {
              reloadBookmarks();
              reloadCategories();
            }}
          />
        )}

        {isCategoryOpen && (
          <CategoryModal
            isOpen={isCategoryOpen}
            onClose={() => setIsCategoryOpen(false)}
            onSave={handleSaveCategory}
            initialCategory={editingCategory}
          />
        )}

        {isAddOpen && (
          <BookmarkModal
            isOpen={isAddOpen}
            onClose={() => {
              setIsAddOpen(false);
              setEditingBookmark(null);
            }}
            onSave={handleSaveBookmark}
            categories={categories}
            editingBookmark={editingBookmark}
            onAddCategory={addCategory}
          />
        )}

        {deleteId && (
          <ConfirmDialog
            isOpen={!!deleteId}
            title="删除书签"
            message="确定要删除这个书签吗？此操作无法撤销。"
            confirmText="删除"
            variant="danger"
            onConfirm={handleDelete}
            onCancel={() => setDeleteId(null)}
          />
        )}
      </AnimatePresence>

      {/* Sidebars */}
      <TranslatorSidebar
        isOpen={isTranslatorOpen}
        onClose={() => setIsTranslatorOpen(false)}
      />
      <GithubTrendingSidebar
        isOpen={isGithubOpen}
        onClose={() => setIsGithubOpen(false)}
      />
      <AiNewsSidebar
        isOpen={isAiNewsOpen}
        onClose={() => setIsAiNewsOpen(false)}
      />
    </div>
  );
}

export default App;
