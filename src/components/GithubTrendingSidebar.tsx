import { useState, useEffect, useCallback } from "react";
import {
  Star,
  GitFork,
  ExternalLink,
  RefreshCw,
  X,
  Loader2,
} from "lucide-react";

interface TrendingRepo {
  rank: number;
  username: string;
  repositoryName: string;
  url: string;
  description: string;
  descriptionCn?: string;
  language: string;
  languageColor: string;
  totalStars: number;
  forks: number;
  starsSince: number;
  since: string;
  builtBy: { username: string; avatar: string }[];
}

const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Java: "#b07219",
  Go: "#00ADD8",
  Rust: "#dea584",
  "C++": "#f34b7d",
  C: "#555555",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
};

const LANGUAGES = [
  { value: "", label: "全部语言" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "c++", label: "C++" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
];

const DATE_OPTIONS = [
  { value: "daily", label: "今日" },
  { value: "weekly", label: "本周" },
  { value: "monthly", label: "本月" },
];

interface GithubTrendingSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

async function translateText(text: string): Promise<string> {
  if (!text || text.trim() === "") return "暂无描述";
  if (/[\u4e00-\u9fa5]/.test(text)) return text;
  try {
    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=${encodeURIComponent(text)}`,
    );
    if (res.ok) {
      const json = await res.json();
      if (json?.[0]) return json[0].map((r: string[]) => r[0]).join("");
    }
  } catch {
    /* ignore */
  }
  return text;
}

export const GithubTrendingSidebar = ({
  isOpen,
  onClose,
}: GithubTrendingSidebarProps) => {
  const [repos, setRepos] = useState<TrendingRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState("");
  const [since, setSince] = useState("daily");
  const [translating, setTranslating] = useState(false);

  const translateDescriptions = async (items: TrendingRepo[]) => {
    setTranslating(true);
    try {
      const translated = await Promise.all(
        items.map(async (item) => {
          const cn = await translateText(item.description);
          return { ...item, descriptionCn: cn };
        }),
      );
      setRepos(translated);
    } catch {
      /* ignore */
    } finally {
      setTranslating(false);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const periodMap: Record<string, string> = {
      daily: "past_24_hours",
      weekly: "past_week",
      monthly: "past_month",
    };
    try {
      const langParam = lang ? `&language=${encodeURIComponent(lang)}` : "";
      const res = await fetch(
        `https://api.ossinsight.io/v1/trends/repos?period=${periodMap[since] || "past_24_hours"}${langParam}`,
      );
      if (!res.ok) throw new Error("获取数据失败");
      const json = await res.json();
      const rows = (json.data?.rows || []).slice(0, 25);
      const items: TrendingRepo[] = rows.map(
        (row: Record<string, string>, i: number) => {
          const [username, repoName] = (row.repo_name || "").split("/");
          const contributors = (row.contributor_logins || "")
            .split(",")
            .filter(Boolean)
            .slice(0, 5);
          return {
            rank: i + 1,
            username: username || "",
            repositoryName: repoName || row.repo_name || "",
            url: `https://github.com/${row.repo_name}`,
            description: row.description || "",
            language: row.primary_language || "",
            languageColor: LANGUAGE_COLORS[row.primary_language] || "#858585",
            totalStars: parseInt(row.stars) || 0,
            forks: parseInt(row.forks) || 0,
            starsSince: parseInt(row.stars) || 0,
            since,
            builtBy: contributors.map((c: string) => ({
              username: c.trim(),
              avatar: `https://github.com/${c.trim()}.png?size=40`,
            })),
          };
        },
      );
      setRepos(items);
      translateDescriptions(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
      // Fallback to GitHub API
      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateStr = yesterday.toISOString().split("T")[0];
        const res = await fetch(
          `https://api.github.com/search/repositories?q=created:>${dateStr}&sort=stars&order=desc&per_page=25`,
        );
        if (res.ok) {
          const json = await res.json();
          const items: TrendingRepo[] = json.items.map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (item: any, i: number) => ({
              rank: i + 1,
              username: item.owner.login,
              repositoryName: item.name,
              url: item.html_url,
              description: item.description || "",
              language: item.language || "",
              languageColor: LANGUAGE_COLORS[item.language] || "#858585",
              totalStars: item.stargazers_count,
              forks: item.forks_count,
              starsSince: item.stargazers_count,
              since,
              builtBy: [
                {
                  username: item.owner.login,
                  avatar: item.owner.avatar_url,
                },
              ],
            }),
          );
          setRepos(items);
          setError(null);
          translateDescriptions(items);
        }
      } catch {
        /* ignore */
      }
    } finally {
      setLoading(false);
    }
  }, [lang, since]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      fetchData();
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, lang, since, fetchData]);

  const formatNum = (n: number) =>
    n >= 1000 ? (n / 1000).toFixed(1) + "k" : n.toString();

  if (!isOpen) return null;

  return (
    <>
      <div className="sidebar-overlay" onClick={onClose} />
      <div className={`github-sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-title">
            <span className="github-icon">🔥</span>
            <h2>GitHub 每日热榜</h2>
          </div>
          <div className="sidebar-actions">
            <button
              className="refresh-btn"
              onClick={fetchData}
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

        <div className="sidebar-filter">
          <div className="filter-row">
            <select
              value={since}
              onChange={(e) => setSince(e.target.value)}
              className="date-select"
            >
              {DATE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="language-select"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="sidebar-content">
          {loading ? (
            <div className="loading-state">
              <Loader2 size={32} className="spinning" />
              <span>加载中...</span>
            </div>
          ) : translating ? (
            <div className="loading-state">
              <Loader2 size={32} className="spinning" />
              <span>翻译中...</span>
            </div>
          ) : error && repos.length === 0 ? (
            <div className="error-state">
              <span>😔</span>
              <p>{error}</p>
              <button onClick={fetchData}>重试</button>
            </div>
          ) : (
            <div className="repo-list">
              {repos.map((repo, i) => (
                <a
                  key={`${repo.username}/${repo.repositoryName}`}
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="repo-card"
                >
                  <div className="repo-rank">#{i + 1}</div>
                  <div className="repo-info">
                    <div className="repo-name">
                      <span className="repo-owner">{repo.username}/</span>
                      <span className="repo-title">{repo.repositoryName}</span>
                      <ExternalLink size={14} className="external-icon" />
                    </div>
                    <p className="repo-desc">
                      {repo.descriptionCn || repo.description || "暂无描述"}
                    </p>
                    <div className="repo-meta">
                      {repo.language && (
                        <span className="repo-language">
                          <span
                            className="language-dot"
                            style={{
                              backgroundColor: repo.languageColor,
                            }}
                          />
                          {repo.language}
                        </span>
                      )}
                      <span className="repo-stars">
                        <Star size={14} />
                        {formatNum(repo.totalStars)}
                      </span>
                      <span className="repo-forks">
                        <GitFork size={14} />
                        {formatNum(repo.forks)}
                      </span>
                      {repo.starsSince > 0 && (
                        <span className="repo-today">
                          {since === "daily"
                            ? "今日"
                            : since === "weekly"
                              ? "本周"
                              : "本月"}{" "}
                          +{formatNum(repo.starsSince)}
                        </span>
                      )}
                    </div>
                    {repo.builtBy && repo.builtBy.length > 0 && (
                      <div className="repo-contributors">
                        {repo.builtBy.slice(0, 5).map((b) => (
                          <img
                            key={b.username}
                            src={b.avatar}
                            alt={b.username}
                            title={b.username}
                            className="contributor-avatar"
                          />
                        ))}
                      </div>
                    )}
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
