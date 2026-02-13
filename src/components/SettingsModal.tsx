import { useState } from "react";
import {
  X,
  Cloud,
  Smartphone,
  Chrome,
  Download,
  Upload,
  LayoutGrid,
  List,
  Check,
  Loader2,
} from "lucide-react";
import { cn } from "../utils/cn";
import { motion } from "framer-motion";
import type { Settings } from "../types";
import * as storage from "../utils/storage";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onUpdateSettings: (updates: Partial<Settings>) => void;
  onReload: () => void;
}

export const SettingsModal = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onReload,
}: SettingsModalProps) => {
  const [importing, setImporting] = useState(false);
  const [importStep, setImportStep] = useState<"idle" | "selecting">("idle");
  const [folders, setFolders] = useState<storage.ChromeFolder[]>([]);
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  if (!isOpen) return null;

  const handleStartImport = async () => {
    setImporting(true);
    setImportResult(null);
    try {
      const folders = await storage.getChromeRootFolders();
      setFolders(folders);
      setImportStep("selecting");
    } catch {
      setImportResult("无法获取书签文件夹");
    } finally {
      setImporting(false);
    }
  };

  const handleConfirmImport = async () => {
    if (selectedFolderIds.length === 0) return;
    setImporting(true);
    try {
      const count = await storage.importSelectedFolders(selectedFolderIds);
      setImportResult(`成功导入 ${count} 个书签！`);
      setImportStep("idle");
      setSelectedFolderIds([]);
      onReload();
    } catch {
      setImportResult("导入失败，请重试");
    } finally {
      setImporting(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const data = await storage.exportData();
      storage.downloadJSON(data);
    } catch (e) {
      console.error("Export failed:", e);
    } finally {
      setExporting(false);
    }
  };

  const handleImportData = async () => {
    try {
      const data = await storage.pickJSONFile();
      await storage.importData(data);
      onReload();
      setImportResult("数据导入成功！");
    } catch {
      setImportResult("导入失败：文件格式不正确");
    }
  };

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
        className="relative w-full max-w-lg z-50 rounded-2xl bg-[#f8fafc] border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white sticky top-0 z-10">
          <h2 className="text-xl font-bold text-slate-800">设置</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Sync to Chrome Bookmarks */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-slate-800 mb-1">
                同步到 Chrome 书签
              </h3>
              <p className="text-xs text-slate-500">
                开启后，添加的书签会同时保存到 Chrome 书签
              </p>
            </div>
            <Switch
              checked={settings.syncToChrome}
              onChange={(v) => onUpdateSettings({ syncToChrome: v })}
            />
          </div>

          {/* View Mode */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-slate-800 mb-1">
                视图模式
              </h3>
              <p className="text-xs text-slate-500">选择书签显示方式</p>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => onUpdateSettings({ viewMode: "grid" })}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  settings.viewMode === "grid"
                    ? "bg-white text-slate-800 shadow-sm border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50",
                )}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                网格
              </button>
              <button
                onClick={() => onUpdateSettings({ viewMode: "list" })}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  settings.viewMode === "list"
                    ? "bg-white text-slate-800 shadow-sm border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50",
                )}
              >
                <List className="w-3.5 h-3.5" />
                列表
              </button>
            </div>
          </div>

          {/* Link Opening Method */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-slate-800 mb-1">
                链接打开方式
              </h3>
              <p className="text-xs text-slate-500">
                {settings.openInNewTab ? "在新标签页打开" : "在当前页面打开"}
              </p>
            </div>
            <Switch
              checked={settings.openInNewTab}
              onChange={(v) => onUpdateSettings({ openInNewTab: v })}
            />
          </div>

          {/* Cloud Sync */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-medium text-slate-800 mb-1 flex items-center gap-2">
                <Cloud className="w-4 h-4 text-blue-500" />
                云同步
              </h3>
              <p className="text-xs text-slate-500">选择数据存储位置</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onUpdateSettings({ storageType: "local" })}
                className={cn(
                  "flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all shadow-sm",
                  settings.storageType === "local"
                    ? "bg-blue-50 border-blue-200 text-blue-600"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300",
                )}
              >
                <Smartphone className="w-4 h-4" />
                本地存储
                {settings.storageType === "local" && (
                  <Check className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={() => onUpdateSettings({ storageType: "chrome" })}
                className={cn(
                  "flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all shadow-sm",
                  settings.storageType === "chrome"
                    ? "bg-blue-50 border-blue-200 text-blue-600"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300",
                )}
              >
                <Chrome className="w-4 h-4" />
                Chrome 同步
                {settings.storageType === "chrome" && (
                  <Check className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Import Chrome Bookmarks */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div>
              <h3 className="text-sm font-medium text-slate-800 mb-1 flex items-center gap-2">
                <Download className="w-4 h-4 text-slate-500" />
                导入 Chrome 书签
              </h3>
              <p className="text-xs text-slate-500">
                从 Chrome 书签栏导入现有书签，自动创建分类
              </p>
            </div>
            {importStep === "selecting" ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-slate-700">
                    选择要导入的文件夹
                  </h4>
                  <button
                    onClick={() => {
                      setImportStep("idle");
                      setImportResult(null);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-700"
                  >
                    取消
                  </button>
                </div>
                {folders.length === 0 ? (
                  <p className="text-xs text-slate-500 py-2">未找到文件夹</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 bg-slate-50">
                    {folders.map((f) => (
                      <label
                        key={f.id}
                        className="flex items-center gap-2 text-sm cursor-pointer p-1.5 hover:bg-white rounded transition-colors group"
                      >
                        <input
                          type="checkbox"
                          checked={selectedFolderIds.includes(f.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFolderIds([
                                ...selectedFolderIds,
                                f.id,
                              ]);
                            } else {
                              setSelectedFolderIds(
                                selectedFolderIds.filter((id) => id !== f.id),
                              );
                            }
                          }}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        />
                        <div className="flex-1 flex items-center justify-between">
                          <span className="text-slate-700 group-hover:text-slate-900 font-medium">
                            {f.title}
                          </span>
                          <span className="text-xs text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-100 group-hover:border-slate-200">
                            {f.count}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleConfirmImport}
                    disabled={importing || selectedFolderIds.length === 0}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        导入中...
                      </>
                    ) : (
                      `确认导入 (${selectedFolderIds.length})`
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleStartImport}
                disabled={importing}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    准备中...
                  </>
                ) : (
                  "选择文件夹导入"
                )}
              </button>
            )}
            {importResult && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-center text-green-500"
              >
                {importResult}
              </motion.p>
            )}
          </div>

          {/* Data Backup & Recovery */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-medium text-slate-800 mb-1">
                数据备份与恢复
              </h3>
              <p className="text-xs text-slate-500">
                导出或导入书签数据（JSON 格式）
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleExportData}
                disabled={exporting}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-sm text-slate-700 transition-all disabled:opacity-50"
              >
                <Upload className="w-4 h-4 text-blue-500" />
                {exporting ? "导出中..." : "导出数据"}
              </button>
              <button
                onClick={handleImportData}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-sm text-slate-700 transition-all"
              >
                <Download className="w-4 h-4 text-purple-500" />
                导入数据
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 text-center border-t border-slate-100 bg-slate-50/50">
          <p className="text-xs text-slate-400 font-mono">Linko v1.0.0</p>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Switch Component ─────────────────────────────────────────────

const Switch = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={cn(
      "w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 border border-transparent shadow-inner",
      checked ? "bg-blue-500" : "bg-slate-200 hover:bg-slate-300",
    )}
  >
    <div
      className={cn(
        "absolute top-0.5 left-0.5 w-[1.125rem] h-[1.125rem] rounded-full bg-white shadow-sm transition-transform duration-200",
        checked && "translate-x-5",
      )}
    />
  </button>
);
