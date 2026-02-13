import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { motion } from "framer-motion";
import type { Category } from "../types";
import { cn } from "../utils/cn";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, color: string) => Promise<void>;
  initialCategory?: Category | null;
}

const CATEGORY_COLORS = [
  "#ef4444", // Red
  "#f97316", // Orange
  "#eab308", // Yellow
  "#22c55e", // Green
  "#14b8a6", // Teal
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#a855f7", // Purple
  "#ec4899", // Pink
  "#64748b", // Gray
];

export const CategoryModal = ({
  isOpen,
  onClose,
  onSave,
  initialCategory,
}: CategoryModalProps) => {
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[6]); // Default Indigo
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialCategory) {
        setName(initialCategory.name);
        setSelectedColor(initialCategory.color || CATEGORY_COLORS[6]);
      } else {
        setName("");
        setSelectedColor(CATEGORY_COLORS[6]);
      }
      setError("");
    }
  }, [isOpen, initialCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("请输入分类名称");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(name.trim(), selectedColor);
      onClose();
    } catch {
      setError("保存失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm bg-[#f8fafc] dark:bg-[#1e293b] rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 border-b border-black/5 dark:border-white/5">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">
            {initialCategory ? "编辑分类" : "新建分类"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 dark:text-white/50 hover:text-gray-600 dark:hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600 dark:text-white/60">
              分类名称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入分类名称"
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-white/20 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              autoFocus
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-600 dark:text-white/60">
              选择颜色
            </label>
            <div className="flex flex-wrap gap-3">
              {CATEGORY_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-sm",
                    selectedColor === color &&
                      "ring-2 ring-offset-2 ring-offset-[#f8fafc] dark:ring-offset-[#1e293b] ring-blue-500",
                  )}
                  style={{ backgroundColor: color }}
                >
                  {selectedColor === color && (
                    <Check
                      size={14}
                      className="text-white drop-shadow-md"
                      strokeWidth={3}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-white/60 font-medium hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 active:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center shadow-lg shadow-blue-600/20"
            >
              {isSubmitting ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
