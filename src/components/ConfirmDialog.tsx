import { AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "info";
}

export const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmText = "确认",
  cancelText = "取消",
  onConfirm,
  onCancel,
  variant = "danger",
}: ConfirmDialogProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-sm z-50 bg-[#f8fafc] rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
      >
        <div className="p-6 text-center space-y-4">
          <div
            className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${variant === "danger" ? "bg-red-50" : "bg-blue-50"}`}
          >
            <AlertTriangle
              className={`w-6 h-6 ${variant === "danger" ? "text-red-500" : "text-blue-500"}`}
            />
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">{title}</h3>
            <p className="text-sm text-slate-500">{message}</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 font-medium transition-all"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 py-2.5 rounded-xl text-sm text-white font-medium transition-all shadow-md ${
                variant === "danger"
                  ? "bg-red-600 hover:bg-red-500 active:bg-red-700 shadow-red-500/20"
                  : "bg-blue-600 hover:bg-blue-500 active:bg-blue-700 shadow-blue-500/20"
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
