import { useState, useEffect, useRef, useCallback } from "react";
import {
  Languages,
  ArrowRightLeft,
  Volume2,
  Copy,
  Check,
  X,
  Loader2,
} from "lucide-react";

const LANGS = [
  { code: "zh", name: "中文" },
  { code: "en", name: "英语" },
  { code: "ja", name: "日语" },
  { code: "ko", name: "韩语" },
  { code: "fr", name: "法语" },
  { code: "de", name: "德语" },
  { code: "es", name: "西班牙语" },
  { code: "ru", name: "俄语" },
];

const LANG_MAP: Record<string, string> = {
  zh: "zh-CN",
  en: "en",
  ja: "ja",
  ko: "ko",
  fr: "fr",
  de: "de",
  es: "es",
  ru: "ru",
};

interface TranslatorSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TranslatorSidebar = ({
  isOpen,
  onClose,
}: TranslatorSidebarProps) => {
  const [source, setSource] = useState("");
  const [result, setResult] = useState("");
  const [srcLang, setSrcLang] = useState("en");
  const [tgtLang, setTgtLang] = useState("zh");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const translate = useCallback(async () => {
    if (!source.trim()) {
      setResult("");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${LANG_MAP[srcLang]}&tl=${LANG_MAP[tgtLang]}&dt=t&q=${encodeURIComponent(source)}`,
      );
      if (res.ok) {
        const json = await res.json();
        if (json?.[0]) {
          setResult(json[0].map((r: string[]) => r[0]).join(""));
        }
      }
    } catch {
      setResult("翻译失败，请重试");
    } finally {
      setLoading(false);
    }
  }, [source, srcLang, tgtLang]);

  const swap = () => {
    setSrcLang(tgtLang);
    setTgtLang(srcLang);
    setSource(result);
    setResult(source);
  };

  const copyResult = async () => {
    if (result) {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const speak = (text: string, lang: string) => {
    if ("speechSynthesis" in window && text) {
      const u = new SpeechSynthesisUtterance(text);
      const langMap: Record<string, string> = {
        zh: "zh-CN",
        en: "en-US",
        ja: "ja-JP",
        ko: "ko-KR",
        fr: "fr-FR",
        de: "de-DE",
        es: "es-ES",
        ru: "ru-RU",
      };
      u.lang = langMap[lang];
      speechSynthesis.speak(u);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (source.trim()) translate();
    }, 500);
    return () => clearTimeout(timer);
  }, [source, srcLang, tgtLang, translate]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      inputRef.current?.focus();
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="sidebar-overlay" onClick={onClose} />
      <div className={`translator-sidebar ${isOpen ? "open" : ""}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-title">
            <Languages size={20} className="title-icon text-blue-400" />
            <h2>翻译</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="translator-content">
          {/* Language Selector */}
          <div className="language-selector">
            <select
              value={srcLang}
              onChange={(e) => setSrcLang(e.target.value)}
              className="lang-select"
            >
              {LANGS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
            <button className="swap-btn" onClick={swap} title="交换语言">
              <ArrowRightLeft size={18} />
            </button>
            <select
              value={tgtLang}
              onChange={(e) => setTgtLang(e.target.value)}
              className="lang-select"
            >
              {LANGS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Source */}
          <div className="text-section source-section">
            <div className="section-header">
              <span className="section-label">
                {LANGS.find((l) => l.code === srcLang)?.name}
              </span>
              <div className="section-actions">
                <button
                  className="action-btn"
                  onClick={() => speak(source, srcLang)}
                  title="朗读"
                  disabled={!source}
                >
                  <Volume2 size={16} />
                </button>
                {source && (
                  <button
                    className="action-btn clear-btn"
                    onClick={() => {
                      setSource("");
                      setResult("");
                    }}
                    title="清空"
                  >
                    清空
                  </button>
                )}
              </div>
            </div>
            <textarea
              ref={inputRef}
              className="text-input"
              placeholder="输入要翻译的文本..."
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </div>

          {/* Result */}
          <div className="text-section result-section">
            <div className="section-header">
              <span className="section-label">
                {LANGS.find((l) => l.code === tgtLang)?.name}
                {loading && <Loader2 size={14} className="spinning" />}
              </span>
              <div className="section-actions">
                <button
                  className="action-btn"
                  onClick={() => speak(result, tgtLang)}
                  title="朗读"
                  disabled={!result}
                >
                  <Volume2 size={16} />
                </button>
                <button
                  className="action-btn copy-btn"
                  onClick={copyResult}
                  title="复制"
                  disabled={!result}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? "已复制" : "复制"}
                </button>
              </div>
            </div>
            <div className="text-output">
              {loading ? (
                <span className="loading-text">翻译中...</span>
              ) : (
                result || (
                  <span className="placeholder-text">翻译结果将显示在这里</span>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
