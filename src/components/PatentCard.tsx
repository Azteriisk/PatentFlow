import React from "react";
import { getPatentStatusLabel } from "../services/db";
import type { PatentDocument } from "../services/db";
import { User, Calendar, Cpu } from "lucide-react";

interface PatentCardProps {
  patent: PatentDocument;
  onSelect: (patent: PatentDocument) => void;
  isSelected?: boolean;
}

export const PatentCard: React.FC<PatentCardProps> = ({
  patent,
  onSelect,
  isSelected = false,
}) => {
  const statusLabel = getPatentStatusLabel(patent.appStatus || "");
  const statusClass = statusLabel.toLowerCase();

  // Format date helper: converts Solr date string (e.g., "2020-04-12T00:00:00Z") to short date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Determine which date to show (issue date if patented, else filing date)
  const isPatented = statusLabel === "Patented";
  const displayDateLabel = isPatented ? "Issued" : "Filed";
  const displayDate = isPatented ? patent.patentIssueDate : patent.appFilingDate;

  return (
    <div
      className={`patent-card ${isSelected ? "selected" : ""}`}
      onClick={() => onSelect(patent)}
    >
      <div className="patent-card-header">
        <span className="patent-card-category">
          {patent.appType || "Utility"} Patent
        </span>
        <span className={`patent-status-badge ${statusClass}`}>
          {statusLabel}
        </span>
      </div>

      <h3 className="patent-card-title">{patent.simplifiedTitle || patent.patentTitle}</h3>
      
      <p className="patent-card-abstract">{patent.appAbstract}</p>

      {patent.assigneeName && (
        <div style={{
          fontSize: "0.76rem",
          color: "hsl(var(--text-secondary))",
          marginBottom: "12px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        }}>
          <span style={{
            fontWeight: 700,
            textTransform: "uppercase",
            fontSize: "0.68rem",
            color: "hsl(var(--accent))",
            letterSpacing: "0.05em",
            flexShrink: 0
          }}>
            Owner:
          </span>
          <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
            {patent.assigneeName}
          </span>
        </div>
      )}

      <div className="patent-card-footer">
        <span className="inventor-name" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <User size={12} style={{ color: "hsl(var(--text-muted))" }} />
          <span>{patent.primaryInventor}</span>
        </span>

        <span className="patent-dates" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <Calendar size={12} />
          <span>
            {displayDateLabel}: {formatDate(displayDate)}
          </span>
        </span>

        {/* Visual score to simulate a food/scanner rating system (aesthetic matching) */}
        {patent.innovationScore && (
          <div className="patent-score-container" title="Technology potential score">
            <Cpu size={11} />
            <span>{patent.innovationScore}%</span>
          </div>
        )}
      </div>
    </div>
  );
};
