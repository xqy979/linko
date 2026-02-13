import { useState, useEffect } from "react";
import {
  Bookmark,
  ChevronDown,
  Plus,
  Check,
  Globe,
  Star,
  Loader2,
} from "lucide-react";
import * as storage from "../utils/storage";
import type { Category } from "../types";

export const PopupApp = () => {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [favicon, setFavicon] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showDropdown, setShowDropdown] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Load current tab info and categories
  useEffect(() => {
    const init = async () => {
      // Load categories
      const cats = await storage.getCategories();
      setCategories(cats);

      // Get current tab info
      try {
        if (typeof chrome !== "undefined" && chrome?.tabs?.query) {
          const tabs = await chrome.tabs.query({
            active: true,
            currentWindow: true,
          });
          const tab = tabs[0];
          if (tab) {
            setTitle(tab.title || "");
            setUrl(tab.url || "");
            if (tab.url) {
              try {
                const domain = new URL(tab.url).hostname;
                setFavicon(
                  `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
                );
              } catch {
                /* ignore */
              }
            }
          }
        } else {
          // Dev fallback
          setTitle(document.title || "Test Page");
          setUrl(window.location.href);
        }
      } catch {
        setTitle(document.title || "");
        setUrl(window.location.href);
      }
    };
    init();
  }, []);

  const handleSave = async () => {
    if (!title.trim() || !url.trim()) {
      setError("请输入标题和网址");
      return;
    }

    setSaving(true);
    setError("");

    try {
      // Get icon from URL domain
      let icon = "🔗";
      try {
        const domain = new URL(url).hostname;
        if (domain.includes("github")) icon = "💻";
        else if (domain.includes("google")) icon = "🔍";
        else if (domain.includes("youtube")) icon = "🎬";
        else if (domain.includes("twitter") || domain.includes("x.com"))
          icon = "🐦";
        else if (domain.includes("dribbble")) icon = "🎨";
        else if (domain.includes("figma")) icon = "🎨";
        else if (domain.includes("notion")) icon = "📝";
        else if (domain.includes("stackoverflow")) icon = "📚";
      } catch {
        /* ignore */
      }

      await storage.addBookmark({
        title: title.trim(),
        url: url.trim(),
        icon,
        category: selectedCategory,
      });

      setSaved(true);
      setTimeout(() => {
        window.close();
      }, 800);
    } catch (err) {
      setError("保存失败，请重试");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const newCat = await storage.addCategory(newCategoryName.trim());
    setCategories((prev) => [...prev, newCat]);
    setSelectedCategory(newCat.id);
    setNewCategoryName("");
    setShowDropdown(false);
  };

  const selectedCatName =
    categories.find((c) => c.id === selectedCategory)?.name || "全部";

  // Success state
  if (saved) {
    return (
      <div className="popup-container">
        <div className="popup-success">
          <div className="success-icon">
            <Check size={28} strokeWidth={3} />
          </div>
          <h3>已保存到 Linko!</h3>
          <p>书签已添加到「{selectedCatName}」</p>
        </div>
      </div>
    );
  }

  return (
    <div className="popup-container">
      {/* Header */}
      <div className="popup-header">
        <div className="popup-logo">
          <Star size={18} className="text-yellow-400" fill="currentColor" />
          <span className="popup-brand">Linko</span>
        </div>
        <span className="popup-subtitle">快速添加书签</span>
      </div>

      {/* Page Preview */}
      <div className="popup-preview">
        {favicon ? (
          <img
            src={favicon}
            alt=""
            className="popup-favicon"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="popup-favicon-placeholder">
            <Globe size={20} />
          </div>
        )}
        <div className="popup-page-info">
          <div className="popup-page-title" title={title}>
            {title || "当前页面"}
          </div>
          <div className="popup-page-url" title={url}>
            {url
              ? (() => {
                  try {
                    return new URL(url).hostname;
                  } catch {
                    return url;
                  }
                })()
              : ""}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="popup-form">
        {/* Title */}
        <div className="popup-field">
          <label className="popup-label">
            <Bookmark size={14} />
            标题
          </label>
          <input
            type="text"
            className="popup-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入书签标题"
          />
        </div>

        {/* URL */}
        <div className="popup-field">
          <label className="popup-label">
            <Globe size={14} />
            网址
          </label>
          <input
            type="text"
            className="popup-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="输入网址"
          />
        </div>

        {/* Category Selector */}
        <div className="popup-field">
          <label className="popup-label">分类</label>
          <div className="popup-category-wrapper">
            <button
              className="popup-category-btn"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <span>{selectedCatName}</span>
              <ChevronDown
                size={16}
                className={`dropdown-chevron ${showDropdown ? "open" : ""}`}
              />
            </button>

            {showDropdown && (
              <div className="popup-dropdown">
                {categories
                  .filter((c) => c.id !== "all")
                  .map((cat) => (
                    <button
                      key={cat.id}
                      className={`dropdown-item ${selectedCategory === cat.id ? "active" : ""}`}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setShowDropdown(false);
                      }}
                    >
                      {cat.name}
                      {selectedCategory === cat.id && <Check size={14} />}
                    </button>
                  ))}
                <div className="dropdown-divider" />
                <div className="dropdown-new">
                  <input
                    type="text"
                    className="dropdown-new-input"
                    placeholder="新建分类..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddCategory();
                    }}
                  />
                  <button
                    className="dropdown-new-btn"
                    onClick={handleAddCategory}
                    disabled={!newCategoryName.trim()}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && <div className="popup-error">{error}</div>}

        {/* Save Button */}
        <button
          className="popup-save-btn"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 size={16} className="spinning" />
              保存中...
            </>
          ) : (
            <>
              <Bookmark size={16} />
              保存书签
            </>
          )}
        </button>
      </div>
    </div>
  );
};
