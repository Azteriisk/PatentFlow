import React, { useState, useRef, useEffect } from "react";
import { Search, X, History, CornerDownLeft } from "lucide-react";
import type { SearchHistoryEntry } from "../services/db";

interface SearchBarProps {
  query: string;
  onChangeQuery: (q: string) => void;
  onSearch: (q: string) => void;
  history: SearchHistoryEntry[];
  onDeleteHistoryItem: (id: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  query,
  onChangeQuery,
  onSearch,
  history,
  onDeleteHistoryItem,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
      setShowDropdown(false);
    }
  };

  const handleSuggestionClick = (suggestedQuery: string) => {
    onChangeQuery(suggestedQuery);
    onSearch(suggestedQuery);
    setShowDropdown(false);
  };

  // Filter history to show recommendations that match the typed prefix
  const filteredHistory = history.filter((h) =>
    h.query.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="search-wrapper" ref={dropdownRef}>
      <form onSubmit={handleSubmit}>
        <div className="search-input-container">
          <Search size={18} style={{ color: "hsl(var(--text-muted))" }} />
          <input
            type="text"
            className="search-input"
            placeholder="Search patents (e.g. AI, Solar Hinge)..."
            value={query}
            onChange={(e) => {
              onChangeQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
          />
          {query && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => {
                onChangeQuery("");
                setShowDropdown(true);
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </form>

      {/* Autocomplete Suggestions Panel */}
      {showDropdown && filteredHistory.length > 0 && (
        <div className="suggestions-dropdown glass-panel">
          <div
            style={{
              padding: "8px 16px 4px 16px",
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "hsl(var(--text-muted))",
              borderBottom: "1px solid hsl(var(--border-color))",
              backgroundColor: "hsla(var(--bg-tertiary), 0.5)",
            }}
          >
            Recent Searches
          </div>
          {filteredHistory.map((item) => (
            <div key={item.id} className="suggestion-item">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  flex: 1,
                  cursor: "pointer",
                  overflow: "hidden",
                }}
                onClick={() => handleSuggestionClick(item.query)}
              >
                <History size={14} className="suggestion-history-icon" />
                <span
                  className="history-query"
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.query}
                </span>
              </div>
              
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <span style={{ fontSize: "0.7rem", color: "hsl(var(--text-muted))", display: "flex", alignItems: "center", gap: "2px" }}>
                  <CornerDownLeft size={10} /> search
                </span>
                <button
                  type="button"
                  className="history-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteHistoryItem(item.id);
                  }}
                  title="Remove from history"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
