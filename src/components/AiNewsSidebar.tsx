import { useState, useEffect, useCallback } from "react";
import { ExternalLink, RefreshCw, X, Loader2, TrendingUp } from "lucide-react";

interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  date: string;
  category: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  利好: "linear-gradient(135deg, #22c55e, #16a34a)",
  利空: "linear-gradient(135deg, #ef4444, #dc2626)",
  政策: "linear-gradient(135deg, #3b82f6, #2563eb)",
  行业: "linear-gradient(135deg, #f59e0b, #d97706)",
  公司: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
  市场: "linear-gradient(135deg, #06b6d4, #0891b2)",
  其他: "linear-gradient(135deg, #64748b, #475569)",
};

interface AiNewsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Categorize a stock news item based on keywords in the title/content.
 */
function categorizeStockNews(text: string): string {
  const s = text.toLowerCase();

  // 利好 (Positive)
  if (
    /增长|上涨|利好|盈利|突破|涨停|大涨|签约|中标|增持|回购|净利|营收增|分红|创新高|战略合作|获批|订单|业绩预增|扭亏/.test(
      s,
    )
  )
    return "利好";

  // 利空 (Negative)
  if (
    /下跌|利空|亏损|减持|退市|暴跌|跌停|警告|处罚|违规|暂停|终止|诉讼|业绩预减|风险|问询|ST|违约|商誉/.test(
      s,
    )
  )
    return "利空";

  // 政策 (Policy)
  if (
    /政策|央行|证监会|银保监|监管|法规|改革|方案|意见|通知|国务院|发改委|财政部|两会|降准|降息|LPR|MLF|公开市场|专项债/.test(
      s,
    )
  )
    return "政策";

  // 行业 (Industry)
  if (
    /行业|产业|赛道|板块|概念|半导体|新能源|光伏|锂电|芯片|医药|消费|地产|汽车|军工|AI|人工智能|算力|数据中心/.test(
      s,
    )
  )
    return "行业";

  // 公司 (Company)
  if (
    /公司|企业|集团|股份|控股|董事|公告|年报|季报|财报|股东|管理层|人事|董秘/.test(
      s,
    )
  )
    return "公司";

  // 市场 (Market)
  if (
    /市场|大盘|指数|A股|沪深|港股|美股|创业板|科创板|北证|沪指|深成|恒生|纳斯达克|道琼斯|成交|缩量|放量|北向资金/.test(
      s,
    )
  )
    return "市场";

  return "其他";
}

/**
 * Format a timestamp to a readable date like "2月13日 10:30"
 */
function formatDate(timestamp: number | string): string {
  const d = new Date(
    typeof timestamp === "number" && timestamp < 1e12
      ? timestamp * 1000
      : timestamp,
  );
  if (isNaN(d.getTime())) return "";
  return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/**
 * Detect if running inside a Chrome extension context.
 * In extension mode, API requests go through the background service worker
 * via chrome.runtime.sendMessage to avoid CORS issues.
 * In dev mode (Vite), we use the dev server proxy.
 */
const isExtension =
  typeof chrome !== "undefined" && !!chrome.runtime && !!chrome.runtime.id;

/**
 * Fetch JSON data — in extension mode, delegates to background service worker;
 * in dev mode, uses the Vite proxy directly.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeFetch(url: string): Promise<any> {
  if (isExtension) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: "FETCH_URL", url }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (response?.success) {
          resolve(response.data);
        } else {
          reject(new Error(response?.error || "Fetch failed"));
        }
      });
    });
  }
  // Dev mode: direct fetch through Vite proxy
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Fetch from Sina Finance roll news — verified working.
 */
async function fetchSinaFinanceNews(): Promise<NewsItem[]> {
  const url = isExtension
    ? `https://feed.mix.sina.com.cn/api/roll/get?pageid=153&lid=2516&k=&num=50&page=1&r=${Math.random()}`
    : `/api/sina/api/roll/get?pageid=153&lid=2516&k=&num=50&page=1&r=${Math.random()}`;

  const json = await safeFetch(url);
  const data = json?.result?.data || [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((item: any) => {
    const title = (item.title || "").replace(/<[^>]+>/g, "");
    return {
      id: item.id || item.oid || `sina-${Math.random()}`,
      title,
      url: item.url || item.wapurl || "#",
      source: item.media_name || item.author || "新浪财经",
      date: formatDate(Number(item.ctime) || item.ctime || ""),
      category: categorizeStockNews(title),
    };
  });
}

/**
 * Fetch from East Money stock announcements API — verified working.
 */
async function fetchEastMoneyNews(): Promise<NewsItem[]> {
  const url = isExtension
    ? `https://np-anotice-stock.eastmoney.com/api/security/ann?page_size=50&page_index=1&ann_type=SHA,SZA&client_source=web&f_node=0`
    : `/api/eastmoney/api/security/ann?page_size=50&page_index=1&ann_type=SHA,SZA&client_source=web&f_node=0`;

  const json = await safeFetch(url);
  const list = json?.data?.list || [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return list.map((item: any, index: number) => {
    const title = (item.title || item.title_ch || "").replace(/<[^>]+>/g, "");
    const stockInfo = item.codes?.[0];
    const source = stockInfo
      ? `${stockInfo.short_name}(${stockInfo.stock_code})`
      : "东方财富";
    return {
      id: item.art_code || `em-${index}`,
      title,
      url: `https://data.eastmoney.com/notices/detail/${stockInfo?.stock_code || ""}/${item.art_code}.html`,
      source,
      date: formatDate(item.display_time || item.notice_date || ""),
      category: categorizeStockNews(title),
    };
  });
}

/**
 * Attempt multiple API sources with fallbacks.
 */
async function fetchStockNews(): Promise<NewsItem[]> {
  const sources = [fetchSinaFinanceNews, fetchEastMoneyNews];

  for (const fetchFn of sources) {
    try {
      const items = await fetchFn();
      if (items.length > 0) return items;
    } catch {
      // Try next source
    }
  }

  throw new Error("无法获取股市资讯，请检查网络连接后重试");
}

// ─── Active filter state ──────────────────────────────────────────
const ALL_CATEGORIES = [
  "全部",
  "利好",
  "利空",
  "政策",
  "行业",
  "公司",
  "市场",
  "其他",
];

export const AiNewsSidebar = ({ isOpen, onClose }: AiNewsSidebarProps) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("全部");

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await fetchStockNews();
      setNews(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      fetchNews();
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, fetchNews]);

  const filteredNews =
    activeFilter === "全部"
      ? news
      : news.filter((item) => item.category === activeFilter);

  if (!isOpen) return null;

  return (
    <>
      <div className="sidebar-overlay" onClick={onClose} />
      <div className={`ainews-sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-title">
            <TrendingUp
              size={20}
              className="title-icon"
              style={{ color: "#ef4444" }}
            />
            <h2>股票市场资讯</h2>
          </div>
          <div className="sidebar-actions">
            <button
              className="refresh-btn"
              onClick={fetchNews}
              disabled={loading}
              title="刷新"
            >
              <RefreshCw size={18} className={loading ? "spinning" : ""} />
            </button>
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="stock-filter-bar">
          {ALL_CATEGORIES.map((cat) => {
            const count =
              cat === "全部"
                ? news.length
                : news.filter((n) => n.category === cat).length;
            if (cat !== "全部" && count === 0) return null;
            return (
              <button
                key={cat}
                className={`stock-filter-tab ${activeFilter === cat ? "active" : ""}`}
                onClick={() => setActiveFilter(cat)}
                style={
                  activeFilter === cat && cat !== "全部"
                    ? {
                        background:
                          CATEGORY_COLORS[cat] || CATEGORY_COLORS["其他"],
                      }
                    : undefined
                }
              >
                {cat}
                <span className="stock-filter-count">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="sidebar-content">
          {loading ? (
            <div className="loading-state">
              <Loader2 size={32} className="spinning" />
              <span>加载中...</span>
            </div>
          ) : error && news.length === 0 ? (
            <div className="error-state">
              <span>📉</span>
              <p>{error}</p>
              <button onClick={fetchNews}>重试</button>
            </div>
          ) : filteredNews.length === 0 ? (
            <div className="loading-state">
              <span style={{ fontSize: 28 }}>🔍</span>
              <span>暂无「{activeFilter}」类别的资讯</span>
            </div>
          ) : (
            <div className="news-list">
              {filteredNews.map((item, i) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="news-card"
                  title={item.title}
                >
                  <div className="news-number">{i + 1}</div>
                  <div className="news-info">
                    <div className="news-badge-row">
                      <span
                        className="news-badge"
                        style={{
                          background:
                            CATEGORY_COLORS[item.category] ||
                            CATEGORY_COLORS["其他"],
                        }}
                      >
                        {item.category}
                      </span>
                      <span className="news-date">{item.date}</span>
                    </div>
                    <p className="news-title">
                      {item.title}
                      <ExternalLink size={12} className="external-icon" />
                    </p>
                    <span className="news-source">{item.source}</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
