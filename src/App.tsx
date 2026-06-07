import { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { ScannerFeed } from "./components/ScannerFeed";
import { PatentDetail } from "./components/PatentDetail";
import { SettingsView } from "./components/SettingsView";
import { PatentCard } from "./components/PatentCard";
import { TrademarkSearch } from "./components/TrademarkSearch";
import { db } from "./services/db";
import type { PatentDocument, SearchHistoryEntry, TrademarkDocument } from "./services/db";
import { usptoApi } from "./services/usptoApi";
import { Bookmark, Settings, Search, FileImage, RefreshCw, ShieldAlert } from "lucide-react";

type TabType = "feed" | "bookmarks" | "settings" | "trademarks";

function App() {
  // Navigation & Theme
  const [activeTab, setActiveTab] = useState<TabType>("feed");
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [bookmarkCount, setBookmarkCount] = useState(0);

  // Search Feed States
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patents, setPatents] = useState<PatentDocument[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [offset, setOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent-desc");
  const LIMIT = 15;

  // Details Modal States
  const [selectedPatent, setSelectedPatent] = useState<PatentDocument | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Storage Stats & History
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const [bookmarkedPatents, setBookmarkedPatents] = useState<PatentDocument[]>([]);
  const [bookmarkedTrademarks, setBookmarkedTrademarks] = useState<TrademarkDocument[]>([]);
  const [bookmarkType, setBookmarkType] = useState<"patents" | "trademarks">("patents");
  const [trademarkSearchQuery, setTrademarkSearchQuery] = useState("");
  const [categories, setCategories] = useState<string[]>([]);

  // Comparison States
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Clear comparison selection on tab or bookmark type change
  useEffect(() => {
    setSelectedCompareIds([]);
  }, [activeTab, bookmarkType]);

  // 1. Initial configuration sync
  useEffect(() => {
    // Read and apply theme
    const activeTheme = db.getTheme();
    setTheme(activeTheme);
    document.documentElement.setAttribute("data-theme", activeTheme);

    // Load history and bookmarks
    setHistory(db.getHistory());
    const saved = db.getBookmarks();
    const savedTms = db.getTrademarkBookmarks();
    setBookmarkedPatents(saved);
    setBookmarkedTrademarks(savedTms);
    setBookmarkCount(saved.length + savedTms.length);

    // Load dynamic categories
    setCategories(db.getCategories().map(c => c.name));

    // Initial search: load recent entries from USPTO
    performSearch("", "All", true, "recent-desc", "all");
  }, []);

  // 2. Refresh stats callback
  const refreshStorageStats = () => {
    setHistory(db.getHistory());
    const saved = db.getBookmarks();
    const savedTms = db.getTrademarkBookmarks();
    setBookmarkedPatents(saved);
    setBookmarkedTrademarks(savedTms);
    setBookmarkCount(saved.length + savedTms.length);
    
    const updatedCats = db.getCategories();
    setCategories(updatedCats.map(c => c.name));
    
    setCategory((prevCategory) => {
      const exists = updatedCats.some(c => c.name.toLowerCase() === prevCategory.toLowerCase());
      return exists ? prevCategory : "All";
    });
  };

  // 2b. Watchlist status synchronizer states and handler
  const [syncingWatchlist, setSyncingWatchlist] = useState(false);
  const [syncNotification, setSyncNotification] = useState<string | null>(null);
  const [showInlineRenew, setShowInlineRenew] = useState(false);
  const [inlineKeyInput, setInlineKeyInput] = useState("");

  const handleSyncWatchlist = async () => {
    if (bookmarkedTrademarks.length === 0) return;
    setSyncingWatchlist(true);
    setSyncNotification(null);
    setShowInlineRenew(false);

    let updatedCount = 0;
    let changeDetails: string[] = [];

    try {
      for (const tm of bookmarkedTrademarks) {
        await new Promise((r) => setTimeout(r, 500)); // Respect USPTO rate limits
        try {
          const updated = await usptoApi.getTrademarkStatus(tm.serialNumber);
          if (updated.statusDescription !== tm.statusDescription || updated.statusCategory !== tm.statusCategory) {
            changeDetails.push(`"${updated.markElement || updated.serialNumber}" changed to: ${updated.statusCategory}`);
            updatedCount++;
          }
          db.saveTrademarkBookmark(updated);
          db.saveTrademarkToCache(updated);
        } catch (e: any) {
          if (e.message === "AUTH_EXPIRED") {
            setShowInlineRenew(true);
            setInlineKeyInput(db.getTsdrApiKey());
            throw new Error("USPTO TSDR API Key has expired. Please provide a fresh key to sync live records.");
          }
          console.warn(`Failed to sync mark ${tm.serialNumber}:`, e);
        }
      }

      refreshStorageStats();
      if (updatedCount > 0) {
        setSyncNotification(`Watchlist Sync Complete! ${updatedCount} marks updated: ${changeDetails.join(", ")}`);
      } else {
        setSyncNotification(`Watchlist Sync Complete! All ${bookmarkedTrademarks.length} marks are up to date.`);
      }
    } catch (err: any) {
      console.error("Watchlist sync failed:", err);
      if (!showInlineRenew) {
        setSyncNotification(err.message || "Failed to complete watchlist status sync. Check connection.");
      }
    } finally {
      setSyncingWatchlist(false);
    }
  };

  // 3. Perform network search targeting USPTO API
  const performSearch = async (
    searchQuery: string,
    searchCat: string,
    reset = true,
    currentSortBy = sortBy,
    currentStatusFilter = statusFilter
  ) => {
    if (reset) {
      setLoading(true);
      setOffset(0);
    } else {
      setLoadingMore(true);
    }
    setError(null);
    try {
      // Add query to local history database if it has search contents
      if (reset && searchQuery.trim()) {
        db.addHistory(searchQuery);
        setHistory(db.getHistory());
      }

      const nextOffset = reset ? 0 : offset + LIMIT;
      const results = await usptoApi.search(
        searchQuery,
        searchCat,
        nextOffset,
        LIMIT,
        currentSortBy,
        currentStatusFilter
      );
      
      if (reset) {
        setPatents(results.docs);
      } else {
        setPatents((prev) => [...prev, ...results.docs]);
        setOffset(nextOffset);
      }
      setTotalResults(results.total);
    } catch (err: any) {
      console.error("Search query failed:", err);
      if (reset) {
        setPatents([]);
        setTotalResults(0);
      }
      setError(err.message || "Could not complete search. Please check your network and try again.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearchTrigger = (searchQuery: string) => {
    performSearch(searchQuery, category, true, sortBy, statusFilter);
  };

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    performSearch(query, newCat, true, sortBy, statusFilter);
  };

  const handleLoadMore = () => {
    if (loading || loadingMore || patents.length >= totalResults) return;
    performSearch(query, category, false, sortBy, statusFilter);
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    performSearch(query, category, true, newSort, statusFilter);
  };

  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    performSearch(query, category, true, sortBy, newStatus);
  };

  // 4. Bookmark changes callback
  const handleBookmarkToggle = () => {
    if (!selectedPatent) return;
    const applId = selectedPatent.applId;
    
    if (db.isBookmarked(applId)) {
      db.removeBookmark(applId);
    } else {
      db.saveBookmark(selectedPatent);
    }
    
    // Refresh states
    refreshStorageStats();
  };

  const handleThemeToggle = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    db.setTheme(nextTheme);
    setTheme(nextTheme);
  };

  const handleDeleteHistoryItem = (id: string) => {
    db.deleteHistoryItem(id);
    setHistory(db.getHistory());
  };

  const handleClearHistory = () => {
    db.clearHistory();
    setHistory([]);
  };

  const handleSelectPatentCard = (patent: PatentDocument) => {
    setSelectedPatent(patent);
    setIsDetailOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDetailOpen(false);
  };

  const getPatentStatusLabel = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s.includes("patented") || s.includes("issued") || s.includes("grant")) {
      return "Patented";
    }
    if (s.includes("abandoned") || s.includes("expired") || s.includes("withdrawn") || s.includes("terminated") || s.includes("dismissed") || s.includes("rejected")) {
      return "Abandoned";
    }
    return "Pending";
  };

  const visiblePatents = [...patents]
    .filter((p) => {
      if (statusFilter === "all") return true;
      return getPatentStatusLabel(p.appStatus || "").toLowerCase() === statusFilter.toLowerCase();
    })
    .sort((a, b) => {
      if (sortBy === "recent-desc") {
        const dateA = new Date(a.patentIssueDate || a.appFilingDate || 0).getTime();
        const dateB = new Date(b.patentIssueDate || b.appFilingDate || 0).getTime();
        return dateB - dateA;
      }
      if (sortBy === "recent-asc") {
        const dateA = new Date(a.patentIssueDate || a.appFilingDate || 0).getTime();
        const dateB = new Date(b.patentIssueDate || b.appFilingDate || 0).getTime();
        return dateA - dateB;
      }
      if (sortBy === "popular-desc") {
        return (b.innovationScore || 0) - (a.innovationScore || 0);
      }
      if (sortBy === "popular-asc") {
        return (a.innovationScore || 0) - (b.innovationScore || 0);
      }
      return 0;
    });

  return (
    <div className={`app-container ${loading ? "scanner-active" : ""}`}>
      {/* Laser scan line indicator overlay */}
      <div className="scanner-overlay">
        <div className="scan-line" />
      </div>

      {/* Main Header */}
      <Header
        status={loading ? "scanning" : error ? "error" : "ready"}
        bookmarkCount={bookmarkCount}
        theme={theme}
        onToggleTheme={handleThemeToggle}
        onNavigateToBookmarks={() => setActiveTab("bookmarks")}
      />

      {/* Primary Tab View router */}
      {activeTab === "feed" && (
        <ScannerFeed
          query={query}
          onChangeQuery={setQuery}
          onSearch={handleSearchTrigger}
          history={history}
          onDeleteHistoryItem={handleDeleteHistoryItem}
          category={category}
          categories={categories}
          onChangeCategory={handleCategoryChange}
          statusFilter={statusFilter}
          onChangeStatusFilter={handleStatusFilterChange}
          sortBy={sortBy}
          onChangeSortBy={handleSortChange}
          loading={loading}
          loadingMore={loadingMore}
          onLoadMore={handleLoadMore}
          error={error}
          patents={visiblePatents}
          totalLoaded={patents.length}
          totalResults={totalResults}
          onRetry={() => performSearch(query, category, true, sortBy, statusFilter)}
          onSelectPatent={handleSelectPatentCard}
        />
      )}

      {activeTab === "bookmarks" && (
        <div className="scroll-container">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <Bookmark size={22} style={{ color: "hsl(var(--accent))" }} />
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.35rem" }}>
              Saved Resources
            </h2>
          </div>
          
          <p style={{ fontSize: "0.85rem", color: "hsl(var(--text-muted))", marginBottom: "20px", lineHeight: "1.4" }}>
            These patent and trademark case files are saved locally in private sandboxed storage on this device.
          </p>

          {/* Toggle between Patent and Trademark Bookmarks */}
          <div style={{
            display: "flex",
            backgroundColor: "rgba(0,0,0,0.2)",
            border: "1px solid hsl(var(--border-color))",
            borderRadius: "var(--radius-full)",
            padding: "3px",
            marginBottom: "20px",
            gap: "4px"
          }}>
            <button
              type="button"
              onClick={() => setBookmarkType("patents")}
              style={{
                flex: 1,
                border: "none",
                borderRadius: "var(--radius-full)",
                padding: "8px 12px",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
                backgroundColor: bookmarkType === "patents" ? "hsl(var(--accent))" : "transparent",
                color: bookmarkType === "patents" ? "hsl(var(--bg-primary))" : "hsl(var(--text-secondary))",
                transition: "all var(--transition-fast)"
              }}
            >
              Patents ({bookmarkedPatents.length})
            </button>
            <button
              type="button"
              onClick={() => setBookmarkType("trademarks")}
              style={{
                flex: 1,
                border: "none",
                borderRadius: "var(--radius-full)",
                padding: "8px 12px",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
                backgroundColor: bookmarkType === "trademarks" ? "hsl(var(--accent))" : "transparent",
                color: bookmarkType === "trademarks" ? "hsl(var(--bg-primary))" : "hsl(var(--text-secondary))",
                transition: "all var(--transition-fast)"
              }}
            >
              Trademarks ({bookmarkedTrademarks.length})
            </button>
          </div>

          {bookmarkType === "patents" ? (
            bookmarkedPatents.length === 0 ? (
              <div className="empty-state">
                <Bookmark className="empty-state-icon" />
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1.05rem" }}>
                  No Saved Patents
                </h3>
                <p className="empty-state-text">
                  Explore USPTO filings in the feed and select "Save Local" on any detailed view card to save it.
                </p>
              </div>
            ) : (
              <div className="patent-card-list">
                {bookmarkedPatents.map((patent) => {
                  const isChecked = selectedCompareIds.includes(patent.applId);
                  return (
                    <div
                      key={patent.applId}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        width: "100%"
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (isChecked) {
                            setSelectedCompareIds((prev) => prev.filter((id) => id !== patent.applId));
                          } else {
                            setSelectedCompareIds((prev) => [...prev, patent.applId]);
                          }
                        }}
                        style={{
                          width: "22px",
                          height: "22px",
                          borderRadius: "6px",
                          border: "2px solid " + (isChecked ? "hsl(var(--accent))" : "hsl(var(--border-color))"),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          backgroundColor: isChecked ? "hsla(var(--accent), 0.15)" : "transparent",
                          transition: "all var(--transition-fast)",
                          flexShrink: 0,
                          padding: 0,
                          outline: "none"
                        }}
                        aria-label={`Select ${patent.simplifiedTitle || patent.patentTitle} for comparison`}
                      >
                        {isChecked && (
                          <div
                            style={{
                              width: "10px",
                              height: "10px",
                              borderRadius: "2px",
                              backgroundColor: "hsl(var(--accent))"
                            }}
                          />
                        )}
                      </button>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <PatentCard
                          patent={patent}
                          onSelect={handleSelectPatentCard}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            bookmarkedTrademarks.length === 0 ? (
              <div className="empty-state">
                <Bookmark className="empty-state-icon" />
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1.05rem" }}>
                  No Saved Trademarks
                </h3>
                <p className="empty-state-text">
                  Explore brand records in the Trademarks tab and select "Save Local" on any search result card to save it.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                {/* Sync Watchlist Toolbar */}
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 12px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "rgba(255,255,255,0.01)",
                  border: "1px solid hsl(var(--border-color))",
                  flexWrap: "wrap",
                  gap: "10px"
                }}>
                  <span style={{ fontSize: "0.82rem", color: "hsl(var(--text-secondary))", fontWeight: 600 }}>
                    Attorney Portfolio Monitor
                  </span>
                  
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={syncingWatchlist}
                    onClick={handleSyncWatchlist}
                    style={{
                      padding: "6px 12px",
                      fontSize: "0.78rem",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      cursor: "pointer",
                      width: "auto",
                      flex: "initial"
                    }}
                  >
                    <RefreshCw size={12} className={syncingWatchlist ? "spinner-micro" : ""} />
                    <span>{syncingWatchlist ? "Syncing..." : "Sync Watchlist"}</span>
                  </button>
                </div>

                {/* Inline Credential Renewer Alert */}
                {showInlineRenew && (
                  <div className="glass-panel" style={{
                    padding: "16px",
                    border: "1px solid hsl(var(--border-color))",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "rgba(239, 68, 68, 0.04)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "hsl(38, 92%, 60%)" }}>
                      <ShieldAlert size={18} />
                      <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>TSDR API Key Expired</span>
                    </div>
                    <p style={{ fontSize: "0.78rem", color: "hsl(var(--text-muted))", lineHeight: "1.4", margin: 0 }}>
                      USPTO TSDR keys expire daily. Paste a fresh key to synchronize your watchlist live:
                    </p>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="password"
                        placeholder="Paste fresh USPTO-API-KEY..."
                        value={inlineKeyInput}
                        onChange={(e) => setInlineKeyInput(e.target.value)}
                        style={{
                          flex: 1,
                          fontSize: "0.8rem",
                          padding: "8px 12px",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid hsl(var(--border-color))",
                          backgroundColor: "rgba(0,0,0,0.25)",
                          color: "#fff",
                          outline: "none"
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          db.setTsdrApiKey(inlineKeyInput);
                          setShowInlineRenew(false);
                          handleSyncWatchlist();
                        }}
                        className="btn btn-primary"
                        style={{ padding: "8px 14px", fontSize: "0.8rem", flex: "initial" }}
                      >
                        Sync Live
                      </button>
                    </div>
                  </div>
                )}

                {/* Sync notification toast */}
                {syncNotification && (
                  <div style={{
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid hsl(var(--border-color))",
                    fontSize: "0.8rem",
                    lineHeight: "1.4",
                    color: "hsl(var(--text-primary))",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <span style={{ flex: 1, paddingRight: "10px" }}>{syncNotification}</span>
                    <button
                      type="button"
                      onClick={() => setSyncNotification(null)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "hsl(var(--text-muted))",
                        cursor: "pointer",
                        fontSize: "0.95rem"
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className="patent-card-list">
                  {bookmarkedTrademarks.map((tm) => (
                    <div
                      key={tm.serialNumber}
                      className="patent-card"
                      onClick={() => {
                        setTrademarkSearchQuery(tm.serialNumber);
                        setActiveTab("trademarks");
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                        <div>
                          <span className="patent-card-category" style={{ fontSize: "0.72rem" }}>
                            TRADEMARK • Class {tm.goodsServices?.[0]?.class || "N/A"}
                          </span>
                          <h3 className="patent-card-title" style={{ marginTop: "4px", fontSize: "0.95rem" }}>
                            {tm.markElement || "Word/Logo Mark"}
                          </h3>
                          <p style={{ fontSize: "0.78rem", color: "hsl(var(--text-secondary))", marginTop: "4px" }}>
                            Proprietor: {tm.ownerName}
                          </p>
                        </div>
                        
                        <span style={{
                          fontSize: "0.72rem",
                          fontFamily: "monospace",
                          padding: "2px 6px",
                          backgroundColor: "rgba(255,255,255,0.05)",
                          border: "1px solid hsl(var(--border-color))",
                          borderRadius: "4px",
                          color: "hsl(var(--accent))"
                        }}>
                          {tm.serialNumber}
                        </span>
                      </div>

                      <p className="patent-card-abstract" style={{ fontSize: "0.8rem", color: "hsl(var(--text-muted))", marginTop: "4px" }}>
                        {tm.statusDescription}
                      </p>

                      <div className="patent-card-metadata" style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.03)" }}>
                        <span>Filing Date: {tm.filingDate || "N/A"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {activeTab === "settings" && (
        <SettingsView
          theme={theme}
          onToggleTheme={handleThemeToggle}
          onClearHistory={handleClearHistory}
          onRefreshStats={refreshStorageStats}
          onApiConfigChanged={() => performSearch(query, category, true, sortBy, statusFilter)}
        />
      )}

      {activeTab === "trademarks" && (
        <TrademarkSearch
          onBookmarkToggle={refreshStorageStats}
          initialQuery={trademarkSearchQuery}
          onClearInitialQuery={() => setTrademarkSearchQuery("")}
        />
      )}

      {/* Floating Compare Action Bar */}
      {activeTab === "bookmarks" && bookmarkType === "patents" && selectedCompareIds.length >= 2 && (
        <div style={{
          position: "absolute",
          bottom: "80px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 35,
          width: "calc(100% - 32px)",
          maxWidth: "400px",
          padding: "12px 16px",
          borderRadius: "var(--radius-md)",
          backgroundColor: "hsl(var(--bg-tertiary))",
          border: "1px solid hsl(var(--border-color))",
          boxShadow: "var(--shadow-md), var(--shadow-glow)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
        }}>
          <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "hsl(var(--text-primary))" }}>
            Compare Selection ({selectedCompareIds.length})
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={() => setSelectedCompareIds([])}
              style={{
                padding: "6px 12px",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.78rem",
                fontWeight: 600,
                backgroundColor: "transparent",
                color: "hsl(var(--text-secondary))",
                border: "1px solid hsl(var(--border-color))",
                cursor: "pointer"
              }}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setIsCompareModalOpen(true)}
              className="btn btn-primary"
              style={{
                padding: "6px 14px",
                fontSize: "0.78rem",
                flex: "initial",
                boxShadow: "none"
              }}
            >
              Compare
            </button>
          </div>
        </div>
      )}

      {/* Patent Comparison Modal */}
      {isCompareModalOpen && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(6px)",
          zIndex: 60,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-end",
          animation: "fadeIn 0.2s ease-out"
        }}>
          <div style={{
            width: "100%",
            height: "90%",
            backgroundColor: "hsl(var(--bg-secondary))",
            borderTopLeftRadius: "var(--radius-lg)",
            borderTopRightRadius: "var(--radius-lg)",
            borderTop: "1px solid hsl(var(--border-color))",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 -8px 32px rgba(0, 0, 0, 0.5)"
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "16px 20px",
              borderBottom: "1px solid hsl(var(--border-color))",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: "hsl(var(--text-primary))", margin: 0 }}>
                  Patent Comparison Matrix
                </h3>
                <span style={{ fontSize: "0.78rem", color: "hsl(var(--text-muted))" }}>
                  Comparing {selectedCompareIds.length} patents side-by-side
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsCompareModalOpen(false)}
                className="drawer-close-btn"
              >
                ✕
              </button>
            </div>

            {/* Matrix Scrollable Grid */}
            <div style={{
              flex: 1,
              overflow: "auto",
              padding: "16px"
            }}>
              <div style={{
                display: "inline-flex",
                flexDirection: "column",
                minWidth: "100%",
                border: "1px solid hsl(var(--border-color))",
                borderRadius: "var(--radius-md)",
                backgroundColor: "rgba(0,0,0,0.15)",
                overflow: "hidden"
              }}>
                
                {/* Headers Row */}
                <div style={{ display: "flex", borderBottom: "1px solid hsl(var(--border-color))", backgroundColor: "rgba(255,255,255,0.02)" }}>
                  <div style={{
                    width: "110px",
                    flexShrink: 0,
                    padding: "12px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "hsl(var(--text-muted))",
                    borderRight: "1px solid hsl(var(--border-color))",
                    textTransform: "uppercase"
                  }}>
                    Feature
                  </div>
                  {bookmarkedPatents.filter(p => selectedCompareIds.includes(p.applId)).map(p => (
                    <div
                      key={p.applId}
                      style={{
                        width: "180px",
                        flexShrink: 0,
                        padding: "12px",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        color: "hsl(var(--accent))",
                        borderRight: "1px solid hsl(var(--border-color))",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {p.simplifiedTitle || p.patentTitle || "Untitled"}
                    </div>
                  ))}
                </div>

                {/* Rows data */}
                {[
                  {
                    label: "Appl ID",
                    val: (p: PatentDocument) => p.applId
                  },
                  {
                    label: "Title Case",
                    val: (p: PatentDocument) => (
                      <span style={{ fontSize: "0.76rem", lineHeight: "1.3", display: "block" }}>
                        {p.patentTitle}
                      </span>
                    )
                  },
                  {
                    label: "Filing Date",
                    val: (p: PatentDocument) => p.appFilingDate ? new Date(p.appFilingDate).toLocaleDateString() : "N/A"
                  },
                  {
                    label: "Issue Date",
                    val: (p: PatentDocument) => p.patentIssueDate ? new Date(p.patentIssueDate).toLocaleDateString() : "N/A"
                  },
                  {
                    label: "Status",
                    val: (p: PatentDocument) => {
                      const label = getPatentStatusLabel(p.appStatus || "");
                      const badgeClass = label.toLowerCase();
                      return (
                        <span className={`patent-status-badge ${badgeClass}`} style={{ fontSize: "0.65rem", padding: "1px 6px" }}>
                          {label}
                        </span>
                      );
                    }
                  },
                  {
                    label: "Inventor",
                    val: (p: PatentDocument) => p.primaryInventor || "N/A"
                  },
                  {
                    label: "Assignee",
                    val: (p: PatentDocument) => p.assigneeName || "N/A"
                  },
                  {
                    label: "Class / Type",
                    val: (p: PatentDocument) => `${p.appType || "Utility"} / ${p.appClsSubCls || "N/A"}`
                  },
                  {
                    label: "Innovation",
                    val: (p: PatentDocument) => p.innovationScore ? `${p.innovationScore}%` : "N/A"
                  },
                  {
                    label: "Abstract",
                    val: (p: PatentDocument) => (
                      <p style={{
                        fontSize: "0.74rem",
                        color: "hsl(var(--text-secondary))",
                        lineHeight: "1.45",
                        margin: 0,
                        maxHeight: "140px",
                        overflowY: "auto"
                      }}>
                        {p.appAbstract || "No abstract details available."}
                      </p>
                    )
                  }
                ].map((row, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      borderBottom: idx === 9 ? "none" : "1px solid hsl(var(--border-color))",
                      backgroundColor: idx % 2 === 0 ? "rgba(0,0,0,0.08)" : "transparent"
                    }}
                  >
                    <div style={{
                      width: "110px",
                      flexShrink: 0,
                      padding: "12px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "hsl(var(--text-secondary))",
                      borderRight: "1px solid hsl(var(--border-color))",
                      backgroundColor: "rgba(0,0,0,0.1)"
                    }}>
                      {row.label}
                    </div>
                    {bookmarkedPatents.filter(p => selectedCompareIds.includes(p.applId)).map(p => (
                      <div
                        key={p.applId}
                        style={{
                          width: "180px",
                          flexShrink: 0,
                          padding: "12px",
                          fontSize: "0.78rem",
                          color: "hsl(var(--text-primary))",
                          borderRight: "1px solid hsl(var(--border-color))",
                          wordBreak: "break-word"
                        }}
                      >
                        {row.val(p)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div style={{
              padding: "16px 20px",
              borderTop: "1px solid hsl(var(--border-color))",
              backgroundColor: "hsl(var(--bg-tertiary))",
              display: "flex",
              justifyContent: "flex-end"
            }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsCompareModalOpen(false)}
                style={{ flex: "initial", width: "120px" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Immersive Bottom Slider Drawer */}
      <PatentDetail
        patent={selectedPatent}
        isOpen={isDetailOpen}
        onClose={handleCloseDrawer}
        onBookmarkToggle={handleBookmarkToggle}
      />

      {/* Floating App Navigation Bar */}
      <nav className="app-tabs glass-panel">
        <button
          className={`tab-item ${activeTab === "feed" ? "active" : ""}`}
          onClick={() => setActiveTab("feed")}
        >
          <Search />
          <span>Scanner</span>
        </button>

        <button
          className={`tab-item ${activeTab === "bookmarks" ? "active" : ""}`}
          onClick={() => setActiveTab("bookmarks")}
        >
          <Bookmark />
          <span>Saved</span>
        </button>

        <button
          className={`tab-item ${activeTab === "trademarks" ? "active" : ""}`}
          onClick={() => setActiveTab("trademarks")}
        >
          <FileImage />
          <span>Trademarks</span>
        </button>

        <button
          className={`tab-item ${activeTab === "settings" ? "active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          <Settings />
          <span>Settings</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
