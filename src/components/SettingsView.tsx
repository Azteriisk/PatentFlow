import React, { useState, useEffect } from "react";
import { db } from "../services/db";
import type { PatentCategory } from "../services/db";
import { Settings, RefreshCw, HardDrive, Trash2, Download, Upload, ShieldCheck, Sun, Moon, Eye, EyeOff, Plus } from "lucide-react";

interface SettingsViewProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onClearHistory: () => void;
  onRefreshStats: () => void;
  onApiConfigChanged: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  theme,
  onToggleTheme,
  onClearHistory,
  onRefreshStats,
  onApiConfigChanged,
}) => {
  const [apiEndpoint, setApiEndpoint] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  
  const [tsdrApiKey, setTsdrApiKey] = useState("");
  const [showTsdrApiKey, setShowTsdrApiKey] = useState(false);
  const [tsdrSaveStatus, setTsdrSaveStatus] = useState("");
  
  // Category management states
  const [categories, setCategories] = useState<PatentCategory[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [newCatQuery, setNewCatQuery] = useState("");
  
  const [stats, setStats] = useState({ bookmarks: 0, history: 0, sizeKB: "0.00" });
  const [saveStatus, setSaveStatus] = useState("");

  // Local Offline PDF Cache States
  const [cacheSize, setCacheSize] = useState("0.00 MB");
  const [cacheFileCount, setCacheFileCount] = useState(0);

  const loadCacheStats = async () => {
    if (!("caches" in window)) return;
    try {
      const cache = await caches.open("patentflow_documents");
      const keys = await cache.keys();
      let totalBytes = 0;
      for (const key of keys) {
        const res = await cache.match(key);
        if (res) {
          const blob = await res.blob();
          totalBytes += blob.size;
        }
      }
      const sizeMB = (totalBytes / (1024 * 1024)).toFixed(2);
      setCacheSize(`${sizeMB} MB`);
      setCacheFileCount(keys.length);
    } catch (e) {
      console.error("Failed to load cache size stats:", e);
    }
  };

  const handleClearCache = async () => {
    if (!("caches" in window)) return;
    if (confirm("Are you sure you want to clear all offline cached document spec sheets and drawing PDFs? This cannot be undone.")) {
      try {
        await caches.delete("patentflow_documents");
        setCacheSize("0.00 MB");
        setCacheFileCount(0);
        alert("Local document offline cache cleared successfully!");
      } catch (e) {
        console.error("Failed to delete document cache:", e);
        alert("Failed to clear offline cache storage.");
      }
    }
  };

  useEffect(() => {
    setApiEndpoint(db.getApiEndpoint());
    setApiKey(db.getApiKey());
    setTsdrApiKey(db.getTsdrApiKey());
    setCategories(db.getCategories());
    setStats(db.getStorageStats());
    loadCacheStats();
  }, []);

  const handleSaveApi = (e: React.FormEvent) => {
    e.preventDefault();
    db.setApiEndpoint(apiEndpoint);
    db.setApiKey(apiKey);
    setSaveStatus("Saved API settings successfully!");
    onRefreshStats();
    onApiConfigChanged();
    setTimeout(() => setSaveStatus(""), 2500);
  };

  const handleSaveTsdrApi = (e: React.FormEvent) => {
    e.preventDefault();
    db.setTsdrApiKey(tsdrApiKey);
    setTsdrSaveStatus("Saved Trademark TSDR API key successfully!");
    onRefreshStats();
    onApiConfigChanged();
    setTimeout(() => setTsdrSaveStatus(""), 2500);
  };

  const handleResetApi = () => {
    db.resetApiEndpoint();
    const defaultEndpoint = db.getApiEndpoint();
    setApiEndpoint(defaultEndpoint);
    setSaveStatus("Reset to USPTO default endpoint");
    onRefreshStats();
    onApiConfigChanged();
    setTimeout(() => setSaveStatus(""), 2500);
  };

  const handleClearHistoryClick = () => {
    if (confirm("Are you sure you want to clear your local search history? This cannot be undone.")) {
      onClearHistory();
      setStats(db.getStorageStats());
    }
  };

  // Export local bookmarks to JSON
  const handleExportBookmarks = () => {
    try {
      const patents = db.getBookmarks();
      const trademarks = db.getTrademarkBookmarks();
      const categories = db.getCategories();
      const backupData = {
        type: "patentflow_backup",
        version: 1,
        patents: patents,
        trademarks: trademarks,
        categories: categories
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `patentflow_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to export backup data:", e);
      alert("Failed to export backup data.");
    }
  };

  // Import local bookmarks from JSON
  const handleImportBookmarks = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        let patentCount = 0;
        let trademarkCount = 0;
        let categoryCount = 0;

        if (Array.isArray(imported)) {
          // Legacy direct patent array format
          imported.forEach((patent) => {
            if (patent && patent.applId && patent.patentTitle) {
              db.saveBookmark(patent);
              patentCount++;
            }
          });
          setStats(db.getStorageStats());
          onRefreshStats();
          alert(`Successfully imported ${patentCount} patent bookmarks (legacy backup)!`);
        } else if (imported && imported.type === "patentflow_backup") {
          // New structured backup format
          const patentsList = Array.isArray(imported.patents) ? imported.patents : [];
          patentsList.forEach((patent: any) => {
            if (patent && patent.applId && patent.patentTitle) {
              db.saveBookmark(patent);
              patentCount++;
            }
          });

          const trademarksList = Array.isArray(imported.trademarks) ? imported.trademarks : [];
          trademarksList.forEach((tm: any) => {
            if (tm && tm.serialNumber && tm.ownerName) {
              db.saveTrademarkBookmark(tm);
              trademarkCount++;
            }
          });

          // Import categories if present in the backup
          if (Array.isArray(imported.categories)) {
            const currentCategories = db.getCategories();
            imported.categories.forEach((cat: any) => {
              if (cat && cat.id && cat.name && cat.query) {
                if (!currentCategories.some(c => c.id === cat.id)) {
                  currentCategories.push(cat);
                  categoryCount++;
                }
              }
            });
            db.saveCategories(currentCategories);
          }

          setStats(db.getStorageStats());
          onRefreshStats();
          
          let alertMsg = `Successfully imported ${patentCount} patent bookmarks and ${trademarkCount} trademark bookmarks!`;
          if (categoryCount > 0) {
            alertMsg += ` Also imported ${categoryCount} new category filters.`;
          }
          alert(alertMsg);
        } else {
          alert("Invalid backup file format. Must be a valid PatentFlow backup JSON.");
        }
      } catch (err) {
        console.error("Failed to parse backup file:", err);
        alert("Failed to read the backup file. Verify it is a valid JSON document.");
      }
    };
    reader.readAsText(file);
    // Reset target value to allow uploading same file again
    e.target.value = "";
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !newCatQuery.trim()) {
      alert("Please provide both a name and query filter.");
      return;
    }

    db.addCategory(newCatName.trim(), newCatQuery.trim());
    setCategories(db.getCategories());
    setNewCatName("");
    setNewCatQuery("");
    onRefreshStats();
  };

  const handleDeleteCategory = (id: string) => {
    if (id === "all") return;
    if (confirm("Are you sure you want to delete this category filter?")) {
      db.deleteCategory(id);
      setCategories(db.getCategories());
      onRefreshStats();
    }
  };

  const handleResetCategories = () => {
    if (confirm("Reset categories back to defaults? This will erase your custom categories.")) {
      db.resetCategories();
      setCategories(db.getCategories());
      onRefreshStats();
    }
  };

  return (
    <div className="scroll-container">
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
        <Settings size={22} style={{ color: "hsl(var(--accent))" }} />
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.35rem" }}>Settings</h2>
      </div>

      <div className="settings-list">
        {/* Device Mode Toggle */}
        <div className="settings-card">
          <div className="settings-header">
            {theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
            <span>App Appearance</span>
          </div>
          <div className="settings-row">
            <div className="settings-label-group">
              <span className="settings-label">Color Theme</span>
              <span className="settings-description">Switch color layout of the application</span>
            </div>
            <button className="theme-toggle-btn" onClick={onToggleTheme}>
              {theme === "dark" ? (
                <>
                  <Moon size={14} /> <span>Dark Theme</span>
                </>
              ) : (
                <>
                  <Sun size={14} /> <span>Light Theme</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* API CONFIGURATION */}
        <div className="settings-card">
          <div className="settings-header">
            <RefreshCw size={18} />
            <span>USPTO Endpoint Setup</span>
          </div>
          <form onSubmit={handleSaveApi} style={{ width: "100%" }}>
            <div className="settings-label-group">
              <span className="settings-label">REST API Base URL</span>
              <span className="settings-description">
                Targets active ODP search endpoint for queries.
              </span>
            </div>
            <input
              type="text"
              className="api-input-field"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
              placeholder="https://..."
            />

            <div className="settings-label-group" style={{ marginTop: "14px" }}>
              <span className="settings-label">API Key (X-API-KEY)</span>
              <span className="settings-description">
                Required for developer.uspto.gov Open Data APIs.
              </span>
            </div>
            <div style={{ position: "relative", width: "100%", marginTop: "8px" }}>
              <input
                type={showApiKey ? "text" : "password"}
                className="api-input-field"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste your USPTO API key here..."
                style={{ marginTop: 0, paddingRight: "40px" }}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "hsl(var(--text-muted))",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: "4px",
                }}
              >
                {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div style={{
              marginTop: "12px",
              padding: "10px 12px",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "hsla(var(--text-muted), 0.08)",
              border: "1px solid hsl(var(--border-color))",
              fontSize: "0.8rem",
              lineHeight: "1.4",
              display: "flex",
              flexDirection: "column",
              gap: "8px"
            }}>
              <span style={{ fontWeight: 600, color: "hsl(var(--text-primary))" }}>How to get an API Key:</span>
              <ul style={{ paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "4px", color: "hsl(var(--text-secondary))" }}>
                <li>Create an account on the <strong>USPTO Open Data Portal</strong></li>
                <li>Link and verify a validated <strong>ID.me</strong> profile</li>
                <li>Go to the portal key manager and request a free API key</li>
              </ul>
              <a
                href="https://developer.uspto.gov/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{
                  padding: "6px 12px",
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
                <span>Visit USPTO Developer Portal</span>
                <span style={{ fontSize: "0.9em" }}>↗</span>
              </a>
            </div>

            {saveStatus && (
              <div style={{ fontSize: "0.8rem", color: "hsl(var(--accent))", marginTop: "8px" }}>
                {saveStatus}
              </div>
            )}
            <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: "6px 12px", fontSize: "0.8rem" }}
              >
                Apply Changes
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                onClick={handleResetApi}
              >
                Reset Default
              </button>
            </div>
          </form>
        </div>

        {/* TRADEMARK TSDR API CONFIGURATION */}
        <div className="settings-card">
          <div className="settings-header">
            <ShieldCheck size={18} />
            <span>Trademark TSDR Key Setup</span>
          </div>
          <form onSubmit={handleSaveTsdrApi} style={{ width: "100%" }}>
            <div className="settings-label-group">
              <span className="settings-label">Trademark API Key (USPTO-API-KEY)</span>
              <span className="settings-description">
                Required for tsdrapi.uspto.gov Trademark Status requests.
              </span>
            </div>
            <div style={{ position: "relative", width: "100%", marginTop: "8px" }}>
              <input
                type={showTsdrApiKey ? "text" : "password"}
                className="api-input-field"
                value={tsdrApiKey}
                onChange={(e) => setTsdrApiKey(e.target.value)}
                placeholder="Paste your Trademark TSDR API key here..."
                style={{ marginTop: 0, paddingRight: "40px" }}
              />
              <button
                type="button"
                onClick={() => setShowTsdrApiKey(!showTsdrApiKey)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "hsl(var(--text-muted))",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: "4px",
                }}
              >
                {showTsdrApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {tsdrSaveStatus && (
              <div style={{ fontSize: "0.8rem", color: "hsl(var(--accent))", marginTop: "8px" }}>
                {tsdrSaveStatus}
              </div>
            )}
            <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: "6px 12px", fontSize: "0.8rem" }}
              >
                Apply Key
              </button>
            </div>
          </form>
        </div>

        {/* CATEGORY FILTER MANAGER */}
        <div className="settings-card">
          <div className="settings-header">
            <Plus size={18} style={{ color: "hsl(var(--accent))" }} />
            <span>Search Category Filters</span>
          </div>
          <p className="settings-description" style={{ marginBottom: "12px", lineHeight: "1.4" }}>
            Manage custom Solr search query filters displayed as category tabs in the scanner feed.
          </p>

          {/* List of active categories */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
            {categories.map((cat) => (
              <div
                key={cat.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 12px",
                  backgroundColor: "hsla(var(--bg-secondary), 0.5)",
                  border: "1px solid hsl(var(--border-color))",
                  borderRadius: "var(--radius-sm)",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", overflow: "hidden" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{cat.name}</span>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      color: "hsl(var(--text-muted))",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      fontFamily: "monospace",
                    }}
                    title={cat.query || "No filter query applied"}
                  >
                    {cat.query || "All results (no filter)"}
                  </span>
                </div>
                {cat.id !== "all" && (
                  <button
                    type="button"
                    className="history-delete-btn"
                    onClick={() => handleDeleteCategory(cat.id)}
                    style={{ flexShrink: 0 }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add custom category form */}
          <form onSubmit={handleAddCategory} style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            padding: "12px",
            border: "1px solid hsl(var(--border-color))",
            borderRadius: "var(--radius-sm)",
            backgroundColor: "hsla(var(--bg-secondary), 0.3)",
          }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>Add Custom Category</span>
            
            <div>
              <label style={{ fontSize: "0.75rem", color: "hsl(var(--text-secondary))" }}>Category Name</label>
              <input
                type="text"
                className="api-input-field"
                style={{ marginTop: "4px" }}
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. Robotics"
                required
              />
            </div>

            <div>
              <label style={{ fontSize: "0.75rem", color: "hsl(var(--text-secondary))" }}>Solr Query Filter</label>
              <input
                type="text"
                className="api-input-field"
                style={{ marginTop: "4px" }}
                value={newCatQuery}
                onChange={(e) => setNewCatQuery(e.target.value)}
                placeholder='e.g. applicationMetaData.inventionTitle:("robot" OR "autonomous")'
                required
              />
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: "6px 12px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Plus size={14} /> <span>Add Category</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                onClick={handleResetCategories}
              >
                Reset Defaults
              </button>
            </div>
          </form>
        </div>

        {/* LOCAL SECURITY & DATA STORAGE STATS */}
        <div className="settings-card">
          <div className="settings-header">
            <HardDrive size={18} />
            <span>Local Database Storage</span>
          </div>
          <div className="settings-row">
            <div className="settings-label-group">
              <span className="settings-label">Bookmarks Saved</span>
              <span className="settings-description">Total saved patent cards</span>
            </div>
            <span style={{ fontWeight: "bold" }}>{stats.bookmarks}</span>
          </div>
          <div className="settings-row">
            <div className="settings-label-group">
              <span className="settings-label">History Logs</span>
              <span className="settings-description">Total search autocomplete tags</span>
            </div>
            <span style={{ fontWeight: "bold" }}>{stats.history}</span>
          </div>
          <div className="settings-row">
            <div className="settings-label-group">
              <span className="settings-label">Storage Capacity Used</span>
              <span className="settings-description">Local browser storage size</span>
            </div>
            <span style={{ fontWeight: "bold" }}>{stats.sizeKB} KB</span>
          </div>
          <div className="settings-row">
            <div className="settings-label-group">
              <span className="settings-label">Offline PDF File Cache</span>
              <span className="settings-description">Cached drawings & spec sheets</span>
            </div>
            <span style={{ fontWeight: "bold" }}>{cacheFileCount} files ({cacheSize})</span>
          </div>
          <div className="settings-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: "10px" }}>
            <span className="settings-label">Database & Cache Actions</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", width: "100%" }}>
              <button
                className="danger-btn"
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
                onClick={handleClearHistoryClick}
                disabled={stats.history === 0}
              >
                <Trash2 size={13} /> Clear History
              </button>

              <button
                className="danger-btn"
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
                onClick={handleClearCache}
                disabled={cacheFileCount === 0}
              >
                <Trash2 size={13} /> Clear Offline Cache
              </button>
              
              <button
                className="theme-toggle-btn"
                style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem" }}
                onClick={handleExportBookmarks}
                disabled={stats.bookmarks === 0}
              >
                <Download size={13} /> Backup Data
              </button>
              
              <label
                className="theme-toggle-btn"
                style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", cursor: "pointer" }}
              >
                <Upload size={13} /> Restore Backup
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBookmarks}
                  style={{ display: "none" }}
                />
              </label>
            </div>
          </div>
        </div>

        {/* SECURITY PILL */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px",
            borderRadius: "var(--radius-md)",
            border: "1px dashed hsla(var(--success), 0.3)",
            backgroundColor: "hsla(var(--success), 0.05)",
            color: "hsl(var(--success))",
            fontSize: "0.8rem",
            lineHeight: "1.4",
          }}
        >
          <ShieldCheck size={28} style={{ flexShrink: 0 }} />
          <span>
            <strong>Local Privacy Active:</strong> All patent files, searches, and configurations are stored in sandbox sandbox-storage. Absolutely zero network analytics, telemetry, or external clouds are configured.
          </span>
        </div>
      </div>
    </div>
  );
};
