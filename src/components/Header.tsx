import React from "react";
import { Compass, Sun, Moon, Bookmark } from "lucide-react";

interface HeaderProps {
  status: "scanning" | "ready" | "error";
  bookmarkCount: number;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onNavigateToBookmarks: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  bookmarkCount,
  theme,
  onToggleTheme,
  onNavigateToBookmarks,
}) => {
  return (
    <header className="app-header glass-panel">
      <div className="brand-title">
        <Compass size={24} className="brand-logo" />
        <span>PatentFlow</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {/* Scanner Indicator Dot */}
        <div className={`scanner-status ${status}`}>
          <span className="dot"></span>
          <span>
            {status === "scanning"
              ? "Scanning"
              : status === "error"
              ? "Offline"
              : "Ready"}
          </span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="theme-toggle-btn"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
          style={{ padding: "6px", borderRadius: "50%" }}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Bookmarks Icon Shortcut */}
        <button
          onClick={onNavigateToBookmarks}
          className="theme-toggle-btn"
          title="View Bookmarks"
          style={{ padding: "6px", borderRadius: "50%", position: "relative" }}
        >
          <Bookmark size={18} />
          {bookmarkCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: "-4px",
                right: "-4px",
                background: "hsl(var(--accent))",
                color: "hsl(var(--bg-primary))",
                fontSize: "0.65rem",
                fontWeight: "bold",
                borderRadius: "50%",
                width: "16px",
                height: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid hsl(var(--bg-secondary))",
              }}
            >
              {bookmarkCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
