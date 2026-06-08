import React, { useState, useEffect } from "react";
import { db } from "../services/db";
import type { PatentDocument } from "../services/db";
import { usptoApi } from "../services/usptoApi";
import { X, Bookmark, Share2, Calendar, Hash, Award, Layers, FileText } from "lucide-react";
import { downloadPatentPdf } from "./PdfGenerator";

const getDownloadFetchUrl = (url: string): string => {
  const isProductionWeb = window.location.protocol.startsWith("http") && 
                          window.location.hostname !== "localhost" && 
                          window.location.hostname !== "127.0.0.1" &&
                          !((window as any).Capacitor || navigator.userAgent?.toLowerCase().includes("electron"));
  if (isProductionWeb) {
    let absoluteUrl = url;
    if (absoluteUrl.startsWith("/uspto-api")) {
      absoluteUrl = absoluteUrl.replace("/uspto-api", "https://api.uspto.gov");
    }
    return `/api/download?url=${encodeURIComponent(absoluteUrl)}`;
  }
  return url;
};

interface PatentDetailProps {
  patent: PatentDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onBookmarkToggle: () => void;
}

export const PatentDetail: React.FC<PatentDetailProps> = ({
  patent,
  isOpen,
  onClose,
  onBookmarkToggle,
}) => {
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [documents, setDocuments] = useState<{ name: string; url: string; pages?: number }[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  
  // Offline caching states
  const [cachedUrls, setCachedUrls] = useState<string[]>([]);
  const [docUrls, setDocUrls] = useState<Record<string, string>>({});

  // Batch downloads selection states
  const [selectedDocUrls, setSelectedDocUrls] = useState<string[]>([]);
  const [batchSyncing, setBatchSyncing] = useState(false);

  useEffect(() => {
    if (patent && isOpen) {
      setIsSaved(db.isBookmarked(patent.applId));
      setCopied(false);
      setSelectedDocUrls([]); // Uncheck all files from previous patent
      
      setDocuments([]);
      setLoadingDocs(true);
      usptoApi.getDocuments(patent.applId).then(docs => {
        setDocuments(docs);
        setLoadingDocs(false);
      }).catch(e => {
        console.error("Failed to load documents:", e);
        setLoadingDocs(false);
      });
    }
  }, [patent, isOpen]);

  // Check storage cache status when documents are loaded
  useEffect(() => {
    const checkCacheStatus = async () => {
      if ("caches" in window && documents.length > 0) {
        try {
          const cache = await caches.open("patentflow_documents");
          const cached: string[] = [];
          for (const doc of documents) {
            const match = await cache.match(doc.url);
            if (match) cached.push(doc.url);
          }
          setCachedUrls(cached);
        } catch (e) {
          console.error("Cache open failure:", e);
        }
      }
    };
    checkCacheStatus();
  }, [documents]);

  // Load offline blob URLs for cached resources
  useEffect(() => {
    let activeBlobUrls: string[] = [];
    const loadCachedBlobs = async () => {
      if (!("caches" in window) || documents.length === 0) return;
      try {
        const cache = await caches.open("patentflow_documents");
        const blobUrls: Record<string, string> = {};
        for (const doc of documents) {
          const match = await cache.match(doc.url);
          if (match) {
            const buffer = await match.arrayBuffer();
            const pdfBlob = new Blob([buffer], { type: "application/pdf" });
            const blobUrl = URL.createObjectURL(pdfBlob);
            blobUrls[doc.url] = blobUrl;
            activeBlobUrls.push(blobUrl);
          }
        }
        setDocUrls(blobUrls);
      } catch (e) {
        console.error("Failed to resolve cache responses:", e);
      }
    };
    loadCachedBlobs();

    return () => {
      activeBlobUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [cachedUrls, documents]);

  const handleToggleCache = async (docUrl: string) => {
    if (!("caches" in window)) {
      alert("Offline document storage is not supported in this browser version.");
      return;
    }
    try {
      const cache = await caches.open("patentflow_documents");
      const isCurrentlyCached = cachedUrls.includes(docUrl);
      
      if (isCurrentlyCached) {
        await cache.delete(docUrl);
        setCachedUrls(prev => prev.filter(url => url !== docUrl));
      } else {
        const apiKey = db.getApiKey();
        const response = await fetch(getDownloadFetchUrl(docUrl), {
          headers: {
            "X-API-KEY": apiKey
          }
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        // Force application/pdf MIME type for safe viewing
        const buffer = await response.arrayBuffer();
        const pdfBlob = new Blob([buffer], { type: "application/pdf" });
        await cache.put(docUrl, new Response(pdfBlob));
        setCachedUrls(prev => [...prev, docUrl]);
      }
    } catch (e) {
      console.error("Failed to toggle document cache:", e);
      alert("Failed to sync file for offline viewing. Please verify your connection.");
    }
  };

  const handleBatchCache = async () => {
    if (!("caches" in window)) {
      alert("Offline document storage is not supported in this browser version.");
      return;
    }
    if (selectedDocUrls.length === 0) return;

    setBatchSyncing(true);
    try {
      const cache = await caches.open("patentflow_documents");
      const urlsToCache = selectedDocUrls.filter(url => !cachedUrls.includes(url));
      
      const fetchPromises = urlsToCache.map(async (url) => {
        try {
          const apiKey = db.getApiKey();
          const response = await fetch(getDownloadFetchUrl(url), {
            headers: {
              "X-API-KEY": apiKey
            }
          });
          if (response.ok) {
            const buffer = await response.arrayBuffer();
            const pdfBlob = new Blob([buffer], { type: "application/pdf" });
            await cache.put(url, new Response(pdfBlob));
            return url;
          }
          throw new Error(`HTTP ${response.status}`);
        } catch (err) {
          console.error(`Failed to cache document: ${url}`, err);
          return null;
        }
      });

      const results = await Promise.all(fetchPromises);
      const successfulUrls = results.filter((url): url is string => url !== null);
      
      setCachedUrls(prev => [...prev, ...successfulUrls]);
      setSelectedDocUrls([]); // Reset selection
      
      if (successfulUrls.length === urlsToCache.length) {
        alert(`Successfully downloaded ${successfulUrls.length} documents for offline viewing.`);
      } else {
        alert(`Downloaded ${successfulUrls.length} of ${urlsToCache.length} documents. Some downloads failed.`);
      }
    } catch (e) {
      console.error("Batch cache failed:", e);
      alert("An error occurred during batch download.");
    } finally {
      setBatchSyncing(false);
    }
  };

  const handleBatchRemoveCache = async () => {
    if (!("caches" in window)) return;
    if (selectedDocUrls.length === 0) return;

    try {
      const cache = await caches.open("patentflow_documents");
      const urlsToRemove = selectedDocUrls.filter(url => cachedUrls.includes(url));
      
      await Promise.all(urlsToRemove.map(url => cache.delete(url)));
      setCachedUrls(prev => prev.filter(url => !urlsToRemove.includes(url)));
      setSelectedDocUrls([]); // Clear selection
      alert(`Removed ${urlsToRemove.length} documents from offline storage.`);
    } catch (e) {
      console.error("Batch remove failed:", e);
    }
  };

  if (!patent) return null;

  const handleBookmarkClick = () => {
    onBookmarkToggle();
    setIsSaved(!isSaved);
  };

  const handleShareClick = () => {
    const shareText = `Patent Application ${patent.applId}: "${patent.patentTitle}" - Primary Inventor: ${patent.primaryInventor}`;
    
    // Attempt system share or fallback to clipboard copy
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } else {
      alert("Sharing: " + shareText);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const handleDocClick = async (e: React.MouseEvent<HTMLAnchorElement>, docUrl: string) => {
    // If it's cached, it's a local blob URL and we let the default behavior happen
    if (cachedUrls.includes(docUrl)) {
      return;
    }
    
    e.preventDefault();
    const apiKey = db.getApiKey();
    if (!apiKey) {
      alert("A valid USPTO API Key is required to retrieve patent prosecution documents. Please configure it in Settings.");
      return;
    }
    
    try {
      const response = await fetch(getDownloadFetchUrl(docUrl), {
        headers: {
          "X-API-KEY": apiKey
        }
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("USPTO authentication failed (401/403). Please verify your API Key in the Settings tab.");
        }
        throw new Error(`USPTO returned error status: ${response.status} ${response.statusText}`);
      }
      
      const buffer = await response.arrayBuffer();
      const pdfBlob = new Blob([buffer], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(pdfBlob);
      window.open(blobUrl, "_blank");
    } catch (err: any) {
      console.error("Failed to load document:", err);
      alert(err.message || "Failed to load document from USPTO registry.");
    }
  };

  return (
    <>
      {/* Background Dim Backdrop */}
      <div className={`detail-overlay ${isOpen ? "open" : ""}`} onClick={onClose} />

      {/* Slide-up Details Panel */}
      <div className={`detail-drawer ${isOpen ? "open" : ""}`}>
        <div className="drawer-drag-handle" />

        <div className="drawer-header">
          <div className="drawer-header-info">
            <span className="patent-card-category" style={{ fontSize: "0.8rem" }}>
              {patent.appType || "Utility"} Patent
            </span>
            <h2
              className="patent-card-title"
              style={{ fontSize: "1.2rem", WebkitLineClamp: "unset", overflow: "visible" }}
            >
              {patent.simplifiedTitle || patent.patentTitle}
            </h2>
          </div>
          <button className="drawer-close-btn" onClick={onClose} title="Close Panel">
            <X size={20} />
          </button>
        </div>

        <div className="drawer-content">
          {/* Original Technical Title (if simplified is shown) */}
          {patent.simplifiedTitle && patent.simplifiedTitle !== patent.patentTitle && (
            <div style={{
              padding: "10px 12px",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "hsla(var(--text-muted), 0.06)",
              border: "1px solid hsl(var(--border-color))",
              marginBottom: "16px",
              fontSize: "0.82rem",
              lineHeight: "1.4",
            }}>
              <span style={{ fontWeight: 600, color: "hsl(var(--text-secondary))", display: "block", marginBottom: "2px", fontSize: "0.75rem", textTransform: "uppercase" }}>Original Technical Title</span>
              <span style={{ color: "hsl(var(--text-primary))", fontFamily: "monospace" }}>{patent.patentTitle}</span>
            </div>
          )}

          {/* Abstract section */}
          <div>
            <h4 className="detail-section-title">Description & Abstract</h4>
            <div className="abstract-text" style={{ fontSize: "0.88rem", lineHeight: "1.5" }}>{patent.appAbstract}</div>
          </div>

          {/* Timeline & Identifiers Grid */}
          <div>
            <h4 className="detail-section-title">Timeline & Identifiers</h4>
            <div className="metadata-grid">
              <div className="metadata-item">
                <span className="metadata-label" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Hash size={12} /> Application ID
                </span>
                <span className="metadata-value">{patent.applId}</span>
              </div>

              {patent.patentNumber && (
                <div className="metadata-item">
                  <span className="metadata-label" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Award size={12} /> Patent Number
                  </span>
                  <span className="metadata-value">{patent.patentNumber}</span>
                </div>
              )}

              <div className="metadata-item">
                <span className="metadata-label" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Calendar size={12} /> Filing Date
                </span>
                <span className="metadata-value">{formatDate(patent.appFilingDate)}</span>
              </div>

              {patent.patentIssueDate && (
                <div className="metadata-item">
                  <span className="metadata-label" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Calendar size={12} /> Issue Date
                  </span>
                  <span className="metadata-value">{formatDate(patent.patentIssueDate)}</span>
                </div>
              )}

              <div className="metadata-item" style={{ gridColumn: "span 2" }}>
                <span className="metadata-label" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Layers size={12} /> USPTO Classification
                </span>
                <span className="metadata-value">{patent.appClsSubCls || "N/A"}</span>
              </div>

              {patent.assigneeName && (
                <div className="metadata-item" style={{ gridColumn: "span 2" }}>
                  <span className="metadata-label" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Award size={12} /> Assignee / Owner
                  </span>
                  <span className="metadata-value" style={{ fontWeight: 600 }}>
                    {patent.assigneeName}
                    {patent.conveyanceText && (
                      <span style={{ display: "block", fontSize: "0.74rem", fontWeight: 400, color: "hsl(var(--text-muted))", marginTop: "2px" }}>
                        Transfer: {patent.conveyanceText} {patent.assignmentRecordedDate ? `(Recorded: ${formatDate(patent.assignmentRecordedDate)})` : ""}
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Inventors List */}
          <div>
            <h4 className="detail-section-title">Inventors</h4>
            <div className="inventors-list">
              {patent.rankAndInventorsList && patent.rankAndInventorsList.length > 0 ? (
                patent.rankAndInventorsList.map((inventor, index) => (
                  <span key={index} className="inventor-chip">
                    {inventor}
                  </span>
                ))
              ) : (
                <span className="inventor-chip">{patent.primaryInventor || "Unknown Inventor"}</span>
              )}
            </div>
          </div>

          {/* Patent status indicator */}
          <div className="metadata-item">
            <span className="metadata-label">Filing Status Description</span>
            <span className="metadata-value" style={{ textTransform: "capitalize" }}>
              {patent.appStatus || "Unknown"}
            </span>
          </div>

          {/* Associated Documents Section */}
          <div style={{ marginTop: "16px", gridColumn: "span 2" }}>
            <h4 className="detail-section-title">Official File Wrapper Documents</h4>
            
            {loadingDocs ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "hsl(var(--text-muted))", padding: "8px 0" }}>
                <div className="spinner-micro" />
                <span>Loading official documents list...</span>
              </div>
            ) : documents.length === 0 ? (
              <span style={{ fontSize: "0.82rem", color: "hsl(var(--text-muted))", fontStyle: "italic" }}>
                No downloadable documents found in the USPTO file wrapper index.
              </span>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {/* Batch Control Action Bar */}
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "6px 10px",
                  backgroundColor: "rgba(0,0,0,0.18)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid hsl(var(--border-color))",
                  gap: "8px"
                }}>
                  <button
                    type="button"
                    onClick={() => {
                      const allUrls = documents.map(d => d.url);
                      const areAllSelected = selectedDocUrls.length === documents.length;
                      setSelectedDocUrls(areAllSelected ? [] : allUrls);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "hsl(var(--accent))",
                      fontSize: "0.76rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: "4px 8px"
                    }}
                  >
                    {selectedDocUrls.length === documents.length ? "Deselect All" : `Select All (${documents.length})`}
                  </button>

                  {selectedDocUrls.length > 0 && (
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        disabled={batchSyncing}
                        onClick={handleBatchCache}
                        className="btn btn-primary"
                        style={{
                          padding: "4px 10px",
                          fontSize: "0.74rem",
                          flex: "initial",
                          boxShadow: "none",
                          borderRadius: "4px"
                        }}
                      >
                        {batchSyncing ? "Downloading..." : `Cache Selected (${selectedDocUrls.length})`}
                      </button>
                      <button
                        type="button"
                        onClick={handleBatchRemoveCache}
                        className="btn btn-secondary"
                        style={{
                          padding: "4px 10px",
                          fontSize: "0.74rem",
                          flex: "initial",
                          borderRadius: "4px",
                          borderColor: "rgba(239, 68, 68, 0.25)",
                          color: "rgb(239, 68, 68)",
                          backgroundColor: "rgba(239, 68, 68, 0.05)"
                        }}
                      >
                        Remove Cache
                      </button>
                    </div>
                  )}
                </div>

                {/* Documents List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
                  {documents.map((doc, idx) => {
                    const isCached = cachedUrls.includes(doc.url);
                    const isChecked = selectedDocUrls.includes(doc.url);
                    return (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "8px 12px",
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: "hsla(var(--bg-secondary), 0.5)",
                          border: "1px solid hsl(var(--border-color))",
                          transition: "all var(--transition-fast)"
                        }}
                      >
                        {/* Custom Checkbox */}
                        <button
                          type="button"
                          onClick={() => {
                            if (isChecked) {
                              setSelectedDocUrls(prev => prev.filter(url => url !== doc.url));
                            } else {
                              setSelectedDocUrls(prev => [...prev, doc.url]);
                            }
                          }}
                          style={{
                            width: "18px",
                            height: "18px",
                            borderRadius: "4px",
                            border: "1.5px solid " + (isChecked ? "hsl(var(--accent))" : "hsl(var(--border-color))"),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            backgroundColor: isChecked ? "hsla(var(--accent), 0.12)" : "transparent",
                            transition: "all var(--transition-fast)",
                            flexShrink: 0,
                            padding: 0,
                            outline: "none"
                          }}
                          aria-label={`Select ${doc.name} for download`}
                        >
                          {isChecked && (
                            <div style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "1px",
                              backgroundColor: "hsl(var(--accent))"
                            }} />
                          )}
                        </button>

                        <a
                          href={docUrls[doc.url] || doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => handleDocClick(e, doc.url)}
                          style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            fontSize: "0.82rem",
                            color: "hsl(var(--accent))",
                            textDecoration: "none",
                            overflow: "hidden"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                            <FileText size={14} style={{ flexShrink: 0 }} />
                            <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                              {doc.name}
                            </span>
                          </div>
                          {doc.pages && (
                            <span style={{ fontSize: "0.72rem", color: "hsl(var(--text-muted))", marginRight: "8px", flexShrink: 0 }}>
                              {doc.pages} page{doc.pages > 1 ? "s" : ""} ↗
                            </span>
                          )}
                        </a>

                        <button
                          type="button"
                          onClick={() => handleToggleCache(doc.url)}
                          title={isCached ? "Remove offline copy" : "Download for offline viewing"}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: isCached ? "hsl(var(--success))" : "hsl(var(--text-muted))",
                            padding: "4px",
                            display: "flex",
                            alignItems: "center",
                            borderRadius: "4px",
                            transition: "all var(--transition-fast)",
                            outline: "none"
                          }}
                        >
                          <span style={{ fontSize: "1rem", fontWeight: 700 }}>
                            {isCached ? "✓" : "⬇"}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="drawer-actions" style={{ gap: "8px" }}>
          <button className="btn btn-secondary" onClick={handleBookmarkClick} style={{ padding: "8px 10px" }}>
            <Bookmark
              size={16}
              fill={isSaved ? "hsl(var(--accent))" : "none"}
              style={{ color: isSaved ? "hsl(var(--accent))" : "inherit" }}
            />
            <span style={{ fontSize: "0.8rem" }}>{isSaved ? "Saved" : "Save"}</span>
          </button>
          
          <button className="btn btn-secondary" onClick={() => downloadPatentPdf(patent)} style={{ padding: "8px 10px" }}>
            <FileText size={16} />
            <span style={{ fontSize: "0.8rem" }}>Export PDF</span>
          </button>
          
          <button className="btn btn-primary" onClick={handleShareClick} style={{ padding: "8px 10px" }}>
            <Share2 size={16} />
            <span style={{ fontSize: "0.8rem" }}>{copied ? "Copied!" : "Share"}</span>
          </button>
        </div>
      </div>
    </>
  );
};
