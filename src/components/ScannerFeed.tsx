import React from "react";
import { SearchBar } from "./SearchBar";
import { PatentCard } from "./PatentCard";
import type { PatentDocument, SearchHistoryEntry } from "../services/db";
import { AlertCircle, RotateCcw, Cpu } from "lucide-react";

interface ScannerFeedProps {
  query: string;
  onChangeQuery: (q: string) => void;
  onSearch: (q: string) => void;
  history: SearchHistoryEntry[];
  onDeleteHistoryItem: (id: string) => void;
  
  category: string;
  categories: string[];
  onChangeCategory: (c: string) => void;

  statusFilter: string;
  onChangeStatusFilter: (status: string) => void;
  sortBy: string;
  onChangeSortBy: (sort: string) => void;
  
  loading: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  error: string | null;
  patents: PatentDocument[];
  totalLoaded: number;
  totalResults: number;
  onRetry: () => void;
  onSelectPatent: (p: PatentDocument) => void;
}

export const ScannerFeed: React.FC<ScannerFeedProps> = ({
  query,
  onChangeQuery,
  onSearch,
  history,
  onDeleteHistoryItem,
  
  category,
  categories,
  onChangeCategory,

  statusFilter,
  onChangeStatusFilter,
  sortBy,
  onChangeSortBy,
  
  loading,
  loadingMore,
  onLoadMore,
  error,
  patents,
  totalLoaded,
  totalResults,
  onRetry,
  onSelectPatent,
}) => {
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      {
        root: null,
        rootMargin: "200px",
        threshold: 0.1,
      }
    );

    observer.observe(sentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, [onLoadMore, totalLoaded, totalResults]);

  return (
    <div className="scroll-container">
      {/* Visual top scanning header inside feed */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "hsl(var(--text-secondary))", marginBottom: "8px" }}>
          <Cpu size={16} style={{ color: "hsl(var(--accent))" }} />
          <span style={{ fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>
            USPTO Scanner Lens
          </span>
        </div>
        <p style={{ fontSize: "0.85rem", color: "hsl(var(--text-muted))", lineHeight: "1.4" }}>
          Type keywords or select a category below to query filings directly from the patent database.
        </p>
      </div>

      {/* Prominent Search Input */}
      <SearchBar
        query={query}
        onChangeQuery={onChangeQuery}
        onSearch={onSearch}
        history={history}
        onDeleteHistoryItem={onDeleteHistoryItem}
      />

      {/* Category Scroll Filter */}
      <div className="category-scroll">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`category-chip ${category === cat ? "active" : ""}`}
            onClick={() => onChangeCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Interactive Sorting and Filtering Row */}
      {!error && !loading && (
        <div style={{
          display: "flex",
          gap: "12px",
          marginBottom: "16px",
          width: "100%",
        }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "hsl(var(--text-secondary))", display: "block", marginBottom: "4px" }}>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => onChangeStatusFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "hsl(var(--bg-tertiary))",
                border: "1px solid hsl(var(--border-color))",
                color: "hsl(var(--text-primary))",
                fontSize: "0.82rem",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Only</option>
              <option value="patented">Patented Only</option>
              <option value="abandoned">Abandoned Only</option>
            </select>
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "hsl(var(--text-secondary))", display: "block", marginBottom: "4px" }}>Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => onChangeSortBy(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "hsl(var(--bg-tertiary))",
                border: "1px solid hsl(var(--border-color))",
                color: "hsl(var(--text-primary))",
                fontSize: "0.82rem",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="recent-desc">Most Recent</option>
              <option value="recent-asc">Least Recent</option>
              <option value="popular-desc">Most Popular</option>
              <option value="popular-asc">Least Popular</option>
            </select>
          </div>
        </div>
      )}

      {/* Results Header Info */}
      {!error && !loading && patents.length > 0 && (
        <div className="feed-header">
          <div>
            <span className="feed-title">Search Results</span>
            <span className="feed-subtitle"> ({totalResults} filings found)</span>
          </div>
        </div>
      )}

      {/* ERROR PANEL (Explicit connection failure) */}
      {error && (
        <div className="error-container" style={{ gap: "12px", padding: "24px 20px" }}>
          <AlertCircle className="error-icon" style={{ marginBottom: "2px" }} />
          <h3 className="error-title">USPTO Connection Error</h3>
          <p className="error-msg" style={{ margin: 0 }}>
            {error}
          </p>
          
          <div style={{
            width: "100%",
            textAlign: "left",
            fontSize: "0.82rem",
            lineHeight: "1.4",
            backgroundColor: "rgba(0, 0, 0, 0.15)",
            border: "1px solid hsl(var(--border-color))",
            borderRadius: "var(--radius-sm)",
            padding: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "8px"
          }}>
            <span style={{ fontWeight: 600, color: "hsl(var(--text-primary))" }}>
              How to resolve connection issues:
            </span>
            <ul style={{ paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "4px", color: "hsl(var(--text-secondary))" }}>
              <li>The active USPTO API (api.uspto.gov) requires a free API key.</li>
              <li>Register an account on <strong>developer.uspto.gov</strong> (requires ID.me).</li>
              <li>Input your key in the <strong>Settings</strong> tab to run searches.</li>
            </ul>
            <a
              href="https://developer.uspto.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{
                width: "100%",
                padding: "8px 12px",
                fontSize: "0.78rem",
                textDecoration: "none",
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "6px",
                marginTop: "4px",
                backgroundColor: "hsl(var(--bg-secondary))"
              }}
            >
              <span>Get USPTO API Key</span>
              <span style={{ fontSize: "0.9em" }}>↗</span>
            </a>
          </div>

          <div style={{ display: "flex", width: "100%", gap: "10px" }}>
            <button className="error-retry-btn" onClick={onRetry} style={{ flex: 1 }}>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <RotateCcw size={14} /> Retry Connection
              </span>
            </button>
          </div>
        </div>
      )}

      {/* LOADING SKELETON SCREENS */}
      {loading && (
        <div className="patent-card-list">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="patent-card"
              style={{ cursor: "default", pointerEvents: "none" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <div className="skeleton skeleton-meta" style={{ width: "30%" }}></div>
                <div className="skeleton skeleton-meta" style={{ width: "15%" }}></div>
              </div>
              <div className="skeleton skeleton-text skeleton-title"></div>
              <div className="skeleton skeleton-text skeleton-body" style={{ height: "36px" }}></div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "12px",
                  borderTop: "1px solid hsl(var(--border-color))",
                  paddingTop: "8px",
                }}
              >
                <div className="skeleton skeleton-meta" style={{ width: "30%" }}></div>
                <div className="skeleton skeleton-meta" style={{ width: "20%" }}></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PATENT CARDS LIST */}
      {!loading && !error && patents.length > 0 && (
        <>
          <div className="patent-card-list">
            {patents.map((patent) => (
              <PatentCard
                key={patent.applId}
                patent={patent}
                onSelect={onSelectPatent}
              />
            ))}
          </div>

          {/* Sentinel for intersection observer */}
          {totalLoaded < totalResults && (
            <div
              ref={sentinelRef}
              style={{
                height: "60px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                margin: "12px 0 24px 0",
              }}
            >
              {loadingMore ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "hsl(var(--accent))", fontSize: "0.85rem" }}>
                  <div className="spinner-micro" />
                  <span>Scanning more filings...</span>
                </div>
              ) : (
                <span style={{ fontSize: "0.8rem", color: "hsl(var(--text-muted))" }}>
                  Scroll down to scan more filings
                </span>
              )}
            </div>
          )}
        </>
      )}

      {/* EMPTY FEED STATES */}
      {!loading && !error && patents.length === 0 && (
        <div className="empty-state">
          <AlertCircle className="empty-state-icon" />
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1.05rem" }}>
            No Patent Filings Active
          </h3>
          <p className="empty-state-text">
            {query.trim() || category !== "All"
              ? "Your search query returned no matching patent filings. Try shortening the keywords."
              : "Search using keywords above or select a category to scan the USPTO database."}
          </p>
        </div>
      )}
    </div>
  );
};
