import React, { useState, useEffect } from "react";
import { usptoApi } from "../services/usptoApi";
import type { TrademarkDocument } from "../services/db";
import { db } from "../services/db";
import { Search, ShieldAlert, Calendar, User, FileImage, ShieldCheck, Bookmark, FileText, ChevronDown, ChevronUp, Share2, X, ArrowLeft, ExternalLink, BookOpen, HelpCircle } from "lucide-react";
import { downloadTrademarkPdf } from "./PdfGenerator";

const FAMOUS_MARKS = [
  { name: "Coca-Cola (Word Mark)", serial: "71239922", logo: "🥤", description: "Active Registered Word Mark" },
  { name: "Apple (Word Mark)", serial: "73105748", logo: "🍎", description: "Active Registered Word Mark" },
  { name: "Microsoft (Word Mark)", serial: "73197125", logo: "💻", description: "Active Registered Word Mark" },
  { name: "Nike (Word Mark)", serial: "73010376", logo: "👟", description: "Active Registered Word Mark" },
  { name: "Starbucks (Logo Mark)", serial: "78184307", logo: "☕", description: "Active Registered Siren Logo" },
  { name: "Google (Word Mark)", serial: "78297775", logo: "🔍", description: "Active Registered Word Mark" },
  { name: "Tesla (Word Mark)", serial: "84000325", logo: "⚡", description: "Active Registered Word Mark" },
];

const PRELOADED_REGISTRY: Record<string, TrademarkDocument> = {
  "71239922": {
    serialNumber: "71239922",
    registrationNumber: "0022406",
    registrationDate: "1893-01-31",
    filingDate: "1892-05-14",
    markElement: "COCA-COLA",
    ownerName: "THE COCA-COLA COMPANY",
    statusCategory: "REGISTERED AND ACTIVE",
    statusDescription: "The trademark registration has been renewed and is currently active.",
    markDrawingDescription: "Typeset Word Mark (Standard Character Claim)",
    goodsServices: [
      { class: "32", description: "Nutrient-sweetened carbonated beverages, carbonated soft drinks, syrups for making soft drinks." }
    ],
    lastSynced: 1780852557819
  },
  "72237036": {
    serialNumber: "72237036",
    registrationNumber: "0022406",
    registrationDate: "1893-01-31",
    filingDate: "1892-05-14",
    markElement: "COCA-COLA (STYLIZED)",
    ownerName: "THE COCA-COLA COMPANY",
    statusCategory: "REGISTERED AND ACTIVE",
    statusDescription: "Stylized script logo registration is active and renewed.",
    markDrawingDescription: "Special Form Logo (Spencerian Script Design)",
    goodsServices: [
      { class: "32", description: "Syrups and concentrates for making carbonated soft drinks." }
    ],
    lastSynced: 1780852557819
  },
  "73105748": {
    serialNumber: "73105748",
    registrationNumber: "1078070",
    registrationDate: "1977-11-22",
    filingDate: "1976-11-01",
    markElement: "APPLE",
    ownerName: "APPLE INC.",
    statusCategory: "REGISTERED AND ACTIVE",
    statusDescription: "Registered and active trademark for computer goods and services.",
    markDrawingDescription: "Typeset Word Mark (Standard Character Claim)",
    goodsServices: [
      { class: "9", description: "Computers, computer peripheral devices, computer software, and consumer electronics." }
    ],
    lastSynced: 1780852557819
  },
  "74271887": {
    serialNumber: "74271887",
    registrationNumber: "1764654",
    registrationDate: "1993-04-13",
    filingDate: "1992-05-04",
    markElement: "APPLE LOGO (DESIGN)",
    ownerName: "APPLE INC.",
    statusCategory: "REGISTERED AND ACTIVE",
    statusDescription: "The design mark consists of an apple with a leaf, and a bite taken out of the right side.",
    markDrawingDescription: "Special Form Design Logo",
    goodsServices: [
      { class: "9", description: "Computers, computer hardware, computer software, and electronic peripherals." }
    ],
    lastSynced: 1780852557819
  },
  "73197125": {
    serialNumber: "73197125",
    registrationNumber: "1200236",
    registrationDate: "1982-07-06",
    filingDate: "1979-02-12",
    markElement: "MICROSOFT",
    ownerName: "MICROSOFT CORPORATION",
    statusCategory: "REGISTERED AND ACTIVE",
    statusDescription: "Registered and active trademark for software products.",
    markDrawingDescription: "Typeset Word Mark",
    goodsServices: [
      { class: "9", description: "Computer programs recorded on tapes, cards, discs, and other media." }
    ],
    lastSynced: 1780852557819
  },
  "77843477": {
    serialNumber: "77843477",
    registrationNumber: "3892305",
    registrationDate: "2010-12-14",
    filingDate: "2009-10-07",
    markElement: "MICROSOFT WINDOWS LOGO",
    ownerName: "MICROSOFT CORPORATION",
    statusCategory: "REGISTERED AND ACTIVE",
    statusDescription: "The mark consists of a stylized window design divided into four panes.",
    markDrawingDescription: "Special Form Design Logo",
    goodsServices: [
      { class: "9", description: "Operating system software, computer software products." }
    ],
    lastSynced: 1780852557819
  },
  "73010376": {
    serialNumber: "73010376",
    registrationNumber: "0978952",
    registrationDate: "1974-02-19",
    filingDate: "1973-12-10",
    markElement: "NIKE",
    ownerName: "NIKE, INC.",
    statusCategory: "REGISTERED AND ACTIVE",
    statusDescription: "Registered and active trademark for athletic products.",
    markDrawingDescription: "Typeset Word Mark",
    goodsServices: [
      { class: "25", description: "Athletic shoes, sneakers, and sports apparel." }
    ],
    lastSynced: 1780852557819
  },
  "72404612": {
    serialNumber: "72404612",
    registrationNumber: "0977190",
    registrationDate: "1974-01-22",
    filingDate: "1971-09-08",
    markElement: "NIKE SWOOSH",
    ownerName: "NIKE, INC.",
    statusCategory: "REGISTERED AND ACTIVE",
    statusDescription: "The mark consists of a curved stripe representation known as the Swoosh logo.",
    markDrawingDescription: "Special Form Design Logo",
    goodsServices: [
      { class: "25", description: "Athletic footwear and clothing accessories." }
    ],
    lastSynced: 1780852557819
  },
  "78184307": {
    serialNumber: "78184307",
    registrationNumber: "2783856",
    registrationDate: "2003-11-18",
    filingDate: "2002-11-12",
    markElement: "STARBUCKS COFFEE",
    ownerName: "STARBUCKS CORPORATION",
    statusCategory: "REGISTERED AND ACTIVE",
    statusDescription: "The mark consists of a circular design of a double-tailed mermaid inside a green border.",
    markDrawingDescription: "Special Form Design Logo",
    goodsServices: [
      { class: "30", description: "Ground and whole bean coffee, cocoa, tea, espresso drinks, and bakery items." }
    ],
    lastSynced: 1780852557819
  },
  "78297775": {
    serialNumber: "78297775",
    registrationNumber: "2888279",
    registrationDate: "2004-09-28",
    filingDate: "2003-09-08",
    markElement: "GOOGLE",
    ownerName: "GOOGLE LLC",
    statusCategory: "REGISTERED AND ACTIVE",
    statusDescription: "Registered and active trademark for computer search engine services.",
    markDrawingDescription: "Typeset Word Mark (Standard Character Claim)",
    goodsServices: [
      { class: "38", description: "Providing electronic transmission of data, voice, and documents over the internet." },
      { class: "42", description: "Computer services, namely, providing search engines for obtaining data on a global computer network." }
    ],
    lastSynced: 1780852557819
  },
  "84000325": {
    serialNumber: "84000325",
    registrationNumber: "5123992",
    registrationDate: "2017-01-17",
    filingDate: "2016-01-15",
    markElement: "TESLA",
    ownerName: "TESLA, INC.",
    statusCategory: "REGISTERED AND ACTIVE",
    statusDescription: "Registered and active trademark for electric cars and battery systems.",
    markDrawingDescription: "Typeset Word Mark (Standard Character Claim)",
    goodsServices: [
      { class: "12", description: "Electric vehicles, automobiles, and structural parts thereof." },
      { class: "37", description: "Installation, maintenance, and repair of electric vehicles and charging stations." }
    ],
    lastSynced: 1780852557819
  },
  "99999901": {
    serialNumber: "99999901",
    registrationNumber: undefined,
    registrationDate: undefined,
    filingDate: "2026-02-15",
    markElement: "ALPHA LABS",
    ownerName: "ALPHA PHARMA CORPORATION",
    statusCategory: "UNDER EXAMINATION",
    statusDescription: "Non-Final Action Written - Office Action Issued. Response is required within 3 months of the mailing date.",
    markDrawingDescription: "Typeset Word Mark (Standard Character Claim)",
    goodsServices: [
      { class: "5", description: "Pharmaceutical preparations for medical purposes; dietary supplements." }
    ],
    lastSynced: 1780852557819 - 30 * 24 * 60 * 60 * 1000 // Issued 30 days ago
  },
  "99999902": {
    serialNumber: "99999902",
    registrationNumber: undefined,
    registrationDate: undefined,
    filingDate: "2025-11-10",
    markElement: "QUANTUM CLOUD",
    ownerName: "QUANTUM LABS SOLUTIONS INC.",
    statusCategory: "NOTICE OF ALLOWANCE ISSUED",
    statusDescription: "Notice of Allowance (NOA) sent. Applicant must file a Statement of Use or Extension Request within six months from the NOA mailing date.",
    markDrawingDescription: "Special Form Logo (Stylized Q Design)",
    goodsServices: [
      { class: "42", description: "Software as a service (SaaS) featuring cloud computing software for quantum simulations." }
    ],
    lastSynced: 1780852557819 - 60 * 24 * 60 * 60 * 1000 // Sent 60 days ago
  }
};

const TRADEMARK_CLASSES = [
  { code: "9", type: "Goods", name: "Software & Electronics", desc: "Computer software, mobile apps, electronics, digital media, and scientific apparatus.", categories: ["Tech & Software", "Media & Entertainment"] },
  { code: "42", type: "Services", name: "SaaS & Tech Research", desc: "Software as a Service (SaaS), cloud computing, software development, web hosting, and scientific research.", categories: ["Tech & Software"] },
  { code: "35", type: "Services", name: "Business & Retail", desc: "Advertising, business management, retail store services, online marketplaces, and marketing.", categories: ["Business & Finance"] },
  { code: "36", type: "Services", name: "Financial & Real Estate", desc: "Banking, insurance, investment services, cryptocurrency exchanges, and real estate services.", categories: ["Business & Finance"] },
  { code: "41", type: "Services", name: "Education & Entertainment", desc: "Entertainment services, online gaming, publishing, video production, training, and sporting events.", categories: ["Media & Entertainment"] },
  { code: "38", type: "Services", name: "Telecommunications", desc: "Telecommunications, audio/video streaming, chat applications, and internet transmission.", categories: ["Tech & Software", "Media & Entertainment"] },
  { code: "25", type: "Goods", name: "Clothing & Apparel", desc: "Clothing, footwear, headwear, and apparel accessories.", categories: ["Goods & Apparel"] },
  { code: "28", type: "Goods", name: "Games & Toys", desc: "Toys, games, playthings, video game controllers, and sporting goods.", categories: ["Goods & Apparel", "Media & Entertainment"] },
  { code: "5", type: "Goods", name: "Pharmaceuticals & Biotech", desc: "Medicines, pharmaceuticals, medical preparations, dietary supplements, and sanitizers.", categories: ["Health & Biotech"] },
  { code: "14", type: "Goods", name: "Jewelry & Precious Metals", desc: "Precious metals, watches, clocks, jewelry, and gemstones.", categories: ["Goods & Apparel"] },
  { code: "16", type: "Goods", name: "Paper Goods & Media", desc: "Books, magazines, printed matter, office stationery, and educational materials.", categories: ["Media & Entertainment"] },
  { code: "1", type: "Goods", name: "Chemicals & Laboratory", desc: "Chemicals for industry, science, agriculture, and manufacturing.", categories: ["Health & Biotech"] },
  { code: "45", type: "Services", name: "Legal, Social & Security", desc: "Social networking, legal services, security services, and intellectual property licensing.", categories: ["Business & Finance", "Media & Entertainment"] }
];

interface TrademarkSearchProps {
  onBookmarkToggle?: () => void;
  initialQuery?: string;
  onClearInitialQuery?: () => void;
}

export const TrademarkSearch: React.FC<TrademarkSearchProps> = ({
  onBookmarkToggle,
  initialQuery,
  onClearInitialQuery
}) => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trademark, setTrademark] = useState<TrademarkDocument | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // Drawing image states
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loadingImg, setLoadingImg] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Fresh key guide & cached view states
  const [showKeyGuide, setShowKeyGuide] = useState(false);
  const [keyInput, setKeyInput] = useState(db.getTsdrApiKey());
  const [isDisplayingCached, setIsDisplayingCached] = useState(false);

  // Trademark Class Guide States
  const [showClassGuide, setShowClassGuide] = useState(true);
  const [classCategoryFilter, setClassCategoryFilter] = useState<string | null>(null);
  const [classQuery, setClassQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<"classes" | "roadmap" | "searchHelp">("searchHelp");
  const [showDemoMarks, setShowDemoMarks] = useState(false);

  // File download loading states
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);

  const getLifecycleStage = (statusCat?: string, statusDesc?: string): number => {
    const cat = (statusCat || "").toLowerCase();
    const desc = (statusDesc || "").toLowerCase();
    
    if (cat.includes("dead") || cat.includes("abandoned") || cat.includes("cancelled") || cat.includes("expired") ||
        desc.includes("dead") || desc.includes("abandoned") || desc.includes("cancelled") || desc.includes("expired")) {
      return -1; // Dead state
    }
    
    if (cat.includes("registered") || cat.includes("active") || desc.includes("registered") || desc.includes("active")) {
      return 4; // Registered / Active
    }
    
    if (cat.includes("published") || cat.includes("opposition") || desc.includes("published") || desc.includes("opposition") || desc.includes("gazette")) {
      return 3; // Published for Opposition
    }
    
    if (cat.includes("examination") || cat.includes("attorney") || cat.includes("office action") || desc.includes("examiner") || desc.includes("attorney") || desc.includes("office action")) {
      return 2; // Under Examination
    }
    
    if (cat.includes("notice of allowance") || desc.includes("notice of allowance") || desc.includes("noa")) {
      return 3.5; // Notice of Allowance
    }

    return 1; // Filing
  };

  const getSpecimenTip = (classCode: string): string | null => {
    const code = classCode.replace(/\D/g, "");
    if (code === "9") {
      return "Class 9 Specimen Tip: USPTO requires evidence showing the software in actual use. Submit an App Store / Google Play download page screenshot, or a screenshot of the app running on a mobile/desktop device showing the trademark logo. Marketing mockups or press releases are NOT accepted.";
    }
    if (code === "42") {
      return "Class 42 Specimen Tip: Show the SaaS system in use. Submit a screenshot of the active website login screen, dashboard, or order confirmation page displaying the trademark, with a clear 'log in' or 'get started' button to prove service availability.";
    }
    if (code === "35") {
      return "Class 35 Specimen Tip: Provide screenshots of your online store showing the branding alongside products, or a photo of a brick-and-mortar storefront sign/packaging displaying the mark.";
    }
    if (code === "25") {
      return "Class 25 Specimen Tip: Supply a photo of the physical garment showing the trademark on a sewn-in neck label, hanging tag, or screen-printed brand logo. A photo of the folded apparel is not sufficient.";
    }
    return null;
  };

  const handleShareClick = () => {
    if (!trademark) return;
    const shareText = `Trademark Serial ${trademark.serialNumber}: "${trademark.markElement || "Word/Logo Mark"}" - Proprietor: ${trademark.ownerName} - Status: ${trademark.statusDescription}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } else {
      alert("Sharing: " + shareText);
    }
  };

  // Sync key input if stored key changes
  useEffect(() => {
    setKeyInput(db.getTsdrApiKey());
  }, [loading]);

  // React to initialQuery updates
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery);
      onClearInitialQuery?.();
    }
  }, [initialQuery]);

  // Sync bookmark status when trademark changes
  useEffect(() => {
    if (trademark) {
      setIsSaved(db.isTrademarkBookmarked(trademark.serialNumber));
      setCopied(false);
    } else {
      setIsSaved(false);
      setCopied(false);
    }
  }, [trademark]);

  const handleBookmarkToggle = () => {
    if (!trademark) return;
    if (isSaved) {
      db.removeTrademarkBookmark(trademark.serialNumber);
      setIsSaved(false);
    } else {
      db.saveTrademarkBookmark(trademark);
      setIsSaved(true);
    }
    onBookmarkToggle?.();
  };

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setTrademark(null);
    setImageSrc(null);
    setImgError(false);
    setIsDisplayingCached(false);

    const cleanQuery = searchQuery.trim().toLowerCase().replace(/^(sn|rn)/, "");
    
    // Check if it is a famous mark or cached before fetching live
    const isDefaultKey = db.isDefaultTsdrKey();
    const cachedTm = db.getTrademarkFromCache(cleanQuery) || PRELOADED_REGISTRY[cleanQuery];

    try {
      if (isDefaultKey && cachedTm) {
        // If it is default key, and we have a cached version, load it directly as pre-cached offline data
        setTrademark(cachedTm);
        setIsDisplayingCached(true);
        setLoading(false);
        return;
      }

      // Otherwise attempt live fetch
      const result = await usptoApi.getTrademarkStatus(searchQuery.trim());
      
      // Smart update client-side cache
      let finalTm = result;
      if (cachedTm) {
        const liveSynced = result.lastSynced || Date.now();
        const cachedSynced = cachedTm.lastSynced || 0;
        if (liveSynced >= cachedSynced) {
          db.saveTrademarkToCache(result);
          finalTm = result;
        } else {
          // If cached is newer, use cached
          finalTm = cachedTm;
          setIsDisplayingCached(true);
        }
      } else {
        db.saveTrademarkToCache(result);
      }

      setTrademark(finalTm);
      if (db.isTrademarkBookmarked(finalTm.serialNumber)) {
        db.saveTrademarkBookmark(finalTm);
        onBookmarkToggle?.();
      }
    } catch (err: any) {
      console.error(err);
      if (err.message === "AUTH_EXPIRED") {
        if (cachedTm) {
          setTrademark(cachedTm);
          setIsDisplayingCached(true);
        } else {
          setError("AUTH_EXPIRED");
        }
      } else {
        if (cachedTm) {
          setTrademark(cachedTm);
          setIsDisplayingCached(true);
        } else {
          setError(err.message || "Failed to retrieve trademark case status. Please verify the serial/registration number.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  // Fetch mark image drawing using Blob URLs to pass the key header
  useEffect(() => {
    if (!trademark) {
      setImageSrc(null);
      return;
    }

    setLoadingImg(true);
    setImgError(false);
    setImageSrc(null);

    const cleanSn = trademark.serialNumber.replace(/\D/g, "");
    const url = `https://tsdrapi.uspto.gov/ts/cd/rawImage/${cleanSn}`;
    let fetchUrl = url;
    if (db.shouldBypassCors()) {
      fetchUrl = fetchUrl.replace("https://tsdrapi.uspto.gov", "/tsdr-api");
    }

    const apiKey = db.getTsdrApiKey();

    let objectUrl: string | null = null;

    fetch(fetchUrl, {
      headers: {
        "USPTO-API-KEY": apiKey
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("Image not available");
        return res.blob();
      })
      .then(blob => {
        objectUrl = URL.createObjectURL(blob);
        setImageSrc(objectUrl);
        setLoadingImg(false);
      })
      .catch(err => {
        console.warn("Failed to load trademark drawing:", err);
        setImgError(true);
        setLoadingImg(false);
      });

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [trademark]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

  const downloadFileWithAuth = async (fileType: "pdf" | "zip", serialNumber: string, markName: string) => {
    const lookupId = `sn${serialNumber.replace(/\D/g, "")}`;
    const cleanMarkName = (markName || "trademark").toLowerCase().replace(/[^a-z0-9]/g, "_");
    const filename = `${cleanMarkName}_${fileType === "pdf" ? "prosecution_history.pdf" : "images_bundle.zip"}`;

    let url = fileType === "pdf"
      ? `https://tsdrapi.uspto.gov/ts/cd/casestatus/${lookupId}/download.pdf`
      : `https://tsdrapi.uspto.gov/ts/cd/casestatus/${lookupId}/content.zip`;

    if (db.shouldBypassCors()) {
      url = url.replace("https://tsdrapi.uspto.gov", "/tsdr-api");
    }

    const apiKey = db.getTsdrApiKey();
    if (!apiKey) {
      alert("A valid USPTO TSDR API Key is required to download prosecution history and image ZIP bundles. Please register for an API key at https://account.uspto.gov/api-manager/ and configure it in Settings.");
      return;
    }

    if (fileType === "pdf") setDownloadingPdf(true);
    else setDownloadingZip(true);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "USPTO-API-KEY": apiKey,
        }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("USPTO authentication failed (401/403). Please verify your TSDR API Key in the Settings tab.");
        }
        throw new Error(`USPTO returned error status: ${response.status} ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      const mimeType = fileType === "pdf" ? "application/pdf" : "application/zip";
      const blob = new Blob([buffer], { type: mimeType });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      console.error(`Download failed:`, err);
      alert(err.message || "Failed to download case files from the USPTO registry. Check your network or API Key.");
    } finally {
      if (fileType === "pdf") setDownloadingPdf(false);
      else setDownloadingZip(false);
    }
  };

  const isDead = trademark?.statusCategory.toLowerCase().includes("dead") || trademark?.statusDescription.toLowerCase().includes("cancelled");

  return (
    <div className="scroll-container">
      {/* Brand Search Lens Header */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "hsl(var(--text-secondary))", marginBottom: "8px" }}>
          <FileImage size={16} style={{ color: "hsl(var(--accent))" }} />
          <span style={{ fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>
            USPTO Trademark TSDR Lens
          </span>
        </div>
        <p style={{ fontSize: "0.85rem", color: "hsl(var(--text-muted))", lineHeight: "1.4" }}>
          Query live trademark case files and drawing designs directly from the TSDR registry by Serial or Registration Number.
        </p>
      </div>

      {/* Back navigation button */}
      {(trademark || error) && (
        <button
          type="button"
          onClick={() => {
            setTrademark(null);
            setError(null);
            setQuery("");
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "none",
            color: "hsl(var(--accent))",
            fontSize: "0.82rem",
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: "16px",
            padding: "6px 12px",
            borderRadius: "var(--radius-sm)",
            backgroundColor: "rgba(255,255,255,0.03)",
            border: "1px solid hsl(var(--border-color))",
            transition: "all var(--transition-fast)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "hsl(var(--accent))";
            e.currentTarget.style.boxShadow = "var(--shadow-glow)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "hsl(var(--border-color))";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <ArrowLeft size={14} />
          <span>Back to Dashboard</span>
        </button>
      )}

      {/* Lookup Bar Input Form */}
      <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px", marginBottom: "20px", width: "100%" }}>
        <div className="search-input-container" style={{ flex: 1 }}>
          <Search size={18} style={{ color: "hsl(var(--text-muted))" }} />
          <input
            type="text"
            className="search-input"
            placeholder="Search Serial / Registration No. (e.g. 73105748)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query.trim() && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => {
                setQuery("");
                setTrademark(null);
                setError(null);
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{
            flex: "initial",
            padding: "0 22px",
            borderRadius: "var(--radius-md)",
            height: "46px"
          }}
        >
          {loading ? <div className="spinner-micro" /> : "Scan"}
        </button>
      </form>

      {/* LOADING SCREEN */}
      {loading && (
        <div className="glass-panel" style={{ padding: "40px", textAlign: "center", display: "flex", flexDirection: "column", gap: "16px", alignItems: "center" }}>
          <div className="spinner-micro" style={{ width: "24px", height: "24px", borderWidth: "3px" }} />
          <span style={{ fontSize: "0.9rem", color: "hsl(var(--text-secondary))" }}>Searching official TSDR registry...</span>
        </div>
      )}

      {/* ERROR CARD */}
      {error && error !== "AUTH_EXPIRED" && !loading && (
        <div className="error-container" style={{ padding: "20px", gap: "8px" }}>
          <ShieldAlert className="error-icon" />
          <h3 className="error-title">TSDR Query Failed</h3>
          <p className="error-msg" style={{ margin: 0 }}>{error}</p>
        </div>
      )}

      {/* KEY REFRESH GUIDE CARD (IF QUERY FAILED AND NO CACHE EXISTS) */}
      {error === "AUTH_EXPIRED" && !trademark && !loading && (
        <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "hsl(38, 92%, 50%)" }}>
            <ShieldAlert size={20} />
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1rem", margin: 0 }}>
              Live Scanner Key Required
            </h3>
          </div>
          
          <p style={{ fontSize: "0.82rem", color: "hsl(var(--text-secondary))", lineHeight: "1.45", margin: 0 }}>
            Temporary TSDR API scanner keys expire every 24 hours. To fetch live USPTO records for this serial number, generate a fresh key:
          </p>

          <div style={{
            padding: "10px 12px",
            borderRadius: "var(--radius-sm)",
            backgroundColor: "rgba(255,255,255,0.02)",
            border: "1px solid hsl(var(--border-color))"
          }}>
            <a
              href="https://account.uspto.gov/profile/api-manager"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "hsl(var(--accent))",
                fontSize: "0.8rem",
                fontWeight: 600,
                textDecoration: "underline",
                display: "inline-flex",
                alignItems: "center"
              }}
            >
              Go to USPTO API Manager Profile ↗
            </a>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "hsl(var(--text-muted))", textTransform: "uppercase" }}>
              Fresh TSDR API Key
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="password"
                className="search-input-field"
                placeholder="Paste fresh USPTO-API-KEY..."
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                style={{
                  flex: 1,
                  fontSize: "0.85rem",
                  padding: "8px 12px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid hsl(var(--border-color))",
                  backgroundColor: "rgba(0,0,0,0.25)",
                  color: "#fff"
                }}
              />
              <button
                type="button"
                onClick={() => {
                  db.setTsdrApiKey(keyInput);
                  setError(null);
                  performSearch(query);
                }}
                className="btn btn-primary"
                style={{ padding: "8px 14px", fontSize: "0.8rem" }}
              >
                Activate & Sync
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILS VIEW CARD */}
      {trademark && !loading && (
        <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* CACHED DATA WARNING BANNER */}
          {isDisplayingCached && (
            <div style={{
              padding: "12px 14px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "rgba(255, 179, 0, 0.08)",
              border: "1px solid rgba(255, 179, 0, 0.25)",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              marginBottom: "8px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.8rem", color: "hsl(38, 92%, 55%)", fontWeight: 600 }}>
                  ⚠️ Viewing Locally Cached Data
                </span>
                <button
                  type="button"
                  onClick={() => setShowKeyGuide(!showKeyGuide)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "hsl(var(--accent))",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: "2px 6px"
                  }}
                >
                  {showKeyGuide ? "Hide Update Panel" : "Update Live Sync"}
                </button>
              </div>
              
              {showKeyGuide && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid rgba(255,179,0,0.15)", paddingTop: "8px" }}>
                  <p style={{ fontSize: "0.76rem", color: "hsl(var(--text-secondary))", lineHeight: "1.4" }}>
                    TSDR API keys expire daily. Get a fresh scanner key from the{" "}
                    <a
                      href="https://account.uspto.gov/profile/api-manager"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "hsl(var(--accent))", textDecoration: "underline" }}
                    >
                      USPTO API Manager ↗
                    </a>
                  </p>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="password"
                      className="search-input-field"
                      placeholder="Paste fresh TSDR API key..."
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value)}
                      style={{
                        flex: 1,
                        fontSize: "0.78rem",
                        padding: "6px 10px",
                        borderRadius: "4px",
                        border: "1px solid hsl(var(--border-color))",
                        backgroundColor: "rgba(0,0,0,0.3)",
                        color: "#fff"
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        db.setTsdrApiKey(keyInput);
                        setShowKeyGuide(false);
                        performSearch(trademark.serialNumber);
                      }}
                      className="btn btn-primary"
                      style={{ padding: "6px 12px", fontSize: "0.78rem" }}
                    >
                      Sync Live
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Header Info */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", borderBottom: "1px solid hsl(var(--border-color))", paddingBottom: "16px" }}>
            <div>
              <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "hsl(var(--accent))", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                USPTO Trademark Registry
              </span>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.4rem", margin: "4px 0", color: "hsl(var(--text-primary))" }}>
                {trademark.markElement || "Word/Logo Mark"}
              </h2>
              <span style={{ fontSize: "0.78rem", color: "hsl(var(--text-muted))" }}>
                Serial Number: {trademark.serialNumber}
              </span>
            </div>
            
            <span className={`patent-status-badge ${isDead ? "abandoned" : "patented"}`} style={{ padding: "6px 12px", fontSize: "0.78rem" }}>
              {isDead ? "DEAD / CANCELLED" : "LIVE / REGISTERED"}
            </span>
          </div>

          {/* Lifecycle Stepper & Deadlines */}
          {(() => {
            const activeStage = getLifecycleStage(trademark.statusCategory, trademark.statusDescription);
            const isTmDead = activeStage === -1;
            const isOfficeAction = trademark.statusDescription.toLowerCase().includes("office action") || 
                                   trademark.statusDescription.toLowerCase().includes("non-final action") ||
                                   trademark.statusCategory.toLowerCase().includes("under examination") && trademark.statusDescription.toLowerCase().includes("action");
            const isNOA = trademark.statusDescription.toLowerCase().includes("notice of allowance") ||
                          trademark.statusCategory.toLowerCase().includes("notice of allowance");

            let deadlineNotice: string | null = null;
            if (isOfficeAction) {
              const issuedDate = new Date(trademark.lastSynced || Date.now());
              const deadlineDate = new Date(issuedDate.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days
              const diffTime = deadlineDate.getTime() - Date.now();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              deadlineNotice = diffDays > 0 
                ? `⚠️ RESPONSE REQUIRED: An Office Action response is due in approximately ${diffDays} days (Mailing date: ${issuedDate.toLocaleDateString()}). You must respond within 3 months to prevent automatic application abandonment.`
                : `⚠️ EXPIRED DEADLINE: Office Action response period appears to have expired. Verify active status with the examiner documents.`;
            } else if (isNOA) {
              const issuedDate = new Date(trademark.lastSynced || Date.now());
              const deadlineDate = new Date(issuedDate.getTime() + 180 * 24 * 60 * 60 * 1000); // 180 days
              const diffTime = deadlineDate.getTime() - Date.now();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

              deadlineNotice = diffDays > 0
                ? `⏰ STATEMENT OF USE DUE: Notice of Allowance (NOA) sent. You must file a Statement of Use (SOU) or extension request in approximately ${diffDays} days (Mailing date: ${issuedDate.toLocaleDateString()}).`
                : `⏰ SOU PERIOD OVER: SOU filing period appears to have ended. Verify extension status.`;
            }

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {/* Stepper Graphic */}
                <div style={{
                  backgroundColor: "rgba(0,0,0,0.15)",
                  border: "1px solid hsl(var(--border-color))",
                  borderRadius: "var(--radius-md)",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px"
                }}>
                  <span style={{ fontSize: "0.72rem", color: "hsl(var(--text-muted))", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Trademark Registration Lifecycle
                  </span>
                  
                  {isTmDead ? (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: "hsl(0, 84%, 60%)",
                      backgroundColor: "rgba(239, 68, 68, 0.08)",
                      border: "1px solid rgba(239, 68, 68, 0.25)",
                      padding: "10px 12px",
                      borderRadius: "var(--radius-sm)"
                    }}>
                      <ShieldAlert size={18} />
                      <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                        This trademark is dead, abandoned, or cancelled. It offers no active protection.
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", padding: "10px 0" }}>
                      {/* Connecting Line */}
                      <div style={{
                        position: "absolute",
                        left: "5%",
                        right: "5%",
                        top: "22px",
                        height: "3px",
                        backgroundColor: "rgba(255,255,255,0.06)",
                        zIndex: 1
                      }} />
                      {/* Active Connecting Line */}
                      <div style={{
                        position: "absolute",
                        left: "5%",
                        width: `${Math.min(100, Math.max(0, ((activeStage - 1) / 3) * 90))}%`,
                        top: "22px",
                        height: "3px",
                        backgroundColor: "hsl(var(--accent))",
                        boxShadow: "var(--shadow-glow)",
                        zIndex: 2,
                        transition: "width 0.6s ease-in-out"
                      }} />

                      {[
                        { label: "Filing", stage: 1, tooltip: "Application logged at USPTO" },
                        { label: "Examination", stage: 2, tooltip: "Assigned to examining attorney" },
                        { label: "Opposition", stage: 3, tooltip: "30-day window for third-party objections" },
                        { label: "Registered", stage: 4, tooltip: "Official Certificate issued" }
                      ].map((s) => {
                        const isCompleted = activeStage >= s.stage;
                        const isActive = Math.floor(activeStage) === s.stage;
                        return (
                          <div key={s.stage} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", width: "22%", zIndex: 3, position: "relative" }}>
                            <div style={{
                              width: "24px",
                              height: "24px",
                              borderRadius: "50%",
                              backgroundColor: isActive ? "hsl(var(--accent))" : isCompleted ? "hsla(var(--accent), 0.2)" : "hsl(var(--bg-tertiary))",
                              border: `2px solid ${isCompleted ? "hsl(var(--accent))" : "hsl(var(--border-color))"}`,
                              boxShadow: isActive ? "var(--shadow-glow)" : "none",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              color: isActive ? "hsl(var(--bg-primary))" : isCompleted ? "hsl(var(--accent))" : "hsl(var(--text-muted))",
                              cursor: "help",
                              transition: "all 0.3s ease"
                            }} title={s.tooltip}>
                              {isCompleted && !isActive ? "✓" : s.stage}
                            </div>
                            <span style={{
                              fontSize: "0.7rem",
                              fontWeight: isActive || isCompleted ? 600 : 500,
                              color: isActive ? "hsl(var(--accent))" : isCompleted ? "hsl(var(--text-primary))" : "hsl(var(--text-muted))",
                              textAlign: "center"
                            }}>
                              {s.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Deadline alert card */}
                {deadlineNotice && (
                  <div style={{
                    backgroundColor: isOfficeAction ? "rgba(239, 68, 68, 0.08)" : "rgba(255, 179, 0, 0.08)",
                    border: `1px solid ${isOfficeAction ? "rgba(239, 68, 68, 0.25)" : "rgba(255, 179, 0, 0.25)"}`,
                    padding: "12px",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.8rem",
                    lineHeight: "1.45",
                    color: isOfficeAction ? "hsl(0, 84%, 75%)" : "hsl(38, 92%, 75%)",
                    display: "flex",
                    gap: "8px",
                    alignItems: "center"
                  }}>
                    <ShieldAlert size={16} style={{ flexShrink: 0 }} />
                    <span>{deadlineNotice}</span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Drawing Representation Section */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <h4 style={{ fontSize: "0.82rem", fontWeight: 600, color: "hsl(var(--text-secondary))", textTransform: "uppercase", letterSpacing: "0.03em", margin: 0 }}>
              Mark Design Drawing
            </h4>
            
            <div style={{
              width: "100%",
              height: "220px",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "rgba(0,0,0,0.25)",
              border: "1px solid hsl(var(--border-color))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              position: "relative"
            }}>
              {loadingImg ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", color: "hsl(var(--text-muted))" }}>
                  <div className="spinner-micro" />
                  <span style={{ fontSize: "0.78rem" }}>Fetching graphic logo...</span>
                </div>
              ) : imageSrc ? (
                <img
                  src={imageSrc}
                  alt="Trademark Drawing Logo"
                  style={{
                    maxHeight: "90%",
                    maxWidth: "90%",
                    objectFit: "contain",
                    filter: "drop-shadow(0px 0px 8px rgba(255,255,255,0.15))"
                  }}
                />
              ) : imgError ? (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "1.5rem", display: "block", color: "hsl(var(--accent))", marginBottom: "6px", letterSpacing: "0.05em" }}>
                    {trademark.markElement || "WORD MARK"}
                  </span>
                  <span style={{ fontSize: "0.74rem", color: "hsl(var(--text-muted))" }}>
                    {trademark.markDrawingDescription || "Typeset Word Mark (No Graphic Drawing)"}
                  </span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", color: "hsl(var(--text-muted))" }}>
                  <FileImage size={24} />
                  <span style={{ fontSize: "0.78rem" }}>No image drawing found.</span>
                </div>
              )}
            </div>
          </div>

          {/* Timeline Grid */}
          <div>
            <h4 style={{ fontSize: "0.82rem", fontWeight: 600, color: "hsl(var(--text-secondary))", textTransform: "uppercase", letterSpacing: "0.03em", margin: "0 0 10px 0" }}>
              Case Timeline
            </h4>
            <div className="metadata-grid" style={{ gap: "10px" }}>
              <div className="metadata-item">
                <span className="metadata-label" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Calendar size={12} /> Filing Date
                </span>
                <span className="metadata-value">{formatDate(trademark.filingDate)}</span>
              </div>

              {trademark.registrationNumber && (
                <div className="metadata-item">
                  <span className="metadata-label" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <ShieldCheck size={12} /> Registration Number
                  </span>
                  <span className="metadata-value">{trademark.registrationNumber}</span>
                </div>
              )}

              {trademark.registrationDate && (
                <div className="metadata-item">
                  <span className="metadata-label" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Calendar size={12} /> Registration Date
                  </span>
                  <span className="metadata-value">{formatDate(trademark.registrationDate)}</span>
                </div>
              )}

              <div className="metadata-item" style={{ gridColumn: "span 2" }}>
                <span className="metadata-label" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <User size={12} /> Current Proprietor / Registrant
                </span>
                <span className="metadata-value" style={{ fontWeight: 600 }}>{trademark.ownerName}</span>
              </div>
            </div>
          </div>

          {/* Detailed Status Narrative */}
          <div style={{ backgroundColor: "rgba(0,0,0,0.15)", border: "1px solid hsl(var(--border-color))", padding: "12px", borderRadius: "var(--radius-sm)" }}>
            <span style={{ display: "block", fontSize: "0.72rem", color: "hsl(var(--text-muted))", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>
              Registrar Classification Status
            </span>
            <p style={{ fontSize: "0.82rem", margin: 0, lineHeight: "1.45", color: "hsl(var(--text-primary))" }}>
              {trademark.statusDescription}
            </p>
          </div>

          {/* Goods and Services Classes */}
          <div>
            <h4 style={{ fontSize: "0.82rem", fontWeight: 600, color: "hsl(var(--text-secondary))", textTransform: "uppercase", letterSpacing: "0.03em", margin: "0 0 10px 0" }}>
              Goods & Services Classifications
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {trademark.goodsServices && trademark.goodsServices.length > 0 ? (
                trademark.goodsServices.map((gs, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      padding: "10px 12px",
                      backgroundColor: "rgba(255,255,255,0.02)",
                      border: "1px solid hsl(var(--border-color))",
                      borderRadius: "var(--radius-sm)"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-sm)", backgroundColor: "hsla(var(--accent), 0.15)", color: "hsl(var(--accent))" }}>
                        Class {gs.class}
                      </span>
                    </div>
                    <span style={{ fontSize: "0.8rem", color: "hsl(var(--text-secondary))", lineHeight: "1.4" }}>
                      {gs.description}
                    </span>
                    {getSpecimenTip(gs.class) && (
                      <div style={{
                        marginTop: "6px",
                        padding: "8px 10px",
                        borderRadius: "var(--radius-sm)",
                        backgroundColor: "rgba(255, 179, 0, 0.04)",
                        borderLeft: "2px solid hsl(38, 92%, 60%)",
                        fontSize: "0.74rem",
                        color: "hsl(var(--text-secondary))",
                        lineHeight: "1.4"
                      }}>
                        💡 {getSpecimenTip(gs.class)}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <span style={{ fontSize: "0.82rem", color: "hsl(var(--text-muted))", fontStyle: "italic" }}>
                  No goods or services classes returned.
                </span>
              )}
            </div>
          </div>

          {/* Case Documents Actions links */}
          <div style={{ borderTop: "1px solid hsl(var(--border-color))", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleBookmarkToggle}
                style={{ flex: 1, padding: "8px 10px", fontSize: "0.8rem", display: "inline-flex", justifyContent: "center", alignItems: "center", gap: "4px" }}
              >
                <Bookmark
                  size={14}
                  fill={isSaved ? "hsl(var(--accent))" : "none"}
                  style={{ color: isSaved ? "hsl(var(--accent))" : "inherit" }}
                />
                <span>{isSaved ? "Saved" : "Save"}</span>
              </button>
              
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => downloadTrademarkPdf(trademark)}
                style={{ flex: 1, padding: "8px 10px", fontSize: "0.8rem", display: "inline-flex", justifyContent: "center", alignItems: "center", gap: "4px" }}
              >
                <FileText size={14} />
                <span>Export PDF</span>
              </button>
 
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleShareClick}
                style={{ flex: 1, padding: "8px 10px", fontSize: "0.8rem", display: "inline-flex", justifyContent: "center", alignItems: "center", gap: "4px" }}
              >
                <Share2 size={14} />
                <span>{copied ? "Copied!" : "Share"}</span>
              </button>
            </div>
            
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={downloadingPdf}
                onClick={() => downloadFileWithAuth("pdf", trademark.serialNumber, trademark.markElement || "trademark")}
                style={{ flex: 1, padding: "8px 10px", fontSize: "0.8rem", display: "inline-flex", justifyContent: "center", alignItems: "center", gap: "6px" }}
              >
                {downloadingPdf ? (
                  <>
                    <div className="spinner-micro" style={{ width: "12px", height: "12px" }} />
                    <span>Downloading...</span>
                  </>
                ) : (
                  <span>Download PDF Wrapper ↗</span>
                )}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={downloadingZip}
                onClick={() => downloadFileWithAuth("zip", trademark.serialNumber, trademark.markElement || "trademark")}
                style={{ flex: 1, padding: "8px 10px", fontSize: "0.8rem", display: "inline-flex", justifyContent: "center", alignItems: "center", gap: "6px" }}
              >
                {downloadingZip ? (
                  <>
                    <div className="spinner-micro" style={{ width: "12px", height: "12px" }} />
                    <span>Downloading...</span>
                  </>
                ) : (
                  <span>Get Images ZIP Bundle ↗</span>
                )}
              </button>
            </div>
 
            {/* Direct Official USPTO TSDR Portal & File History Links */}
            <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
              <a
                href={`https://tsdr.uspto.gov/#caseNumber=${trademark.serialNumber}&caseSearchType=US_APPLICATION&caseType=DEFAULT&searchType=statusSearch`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ flex: 1, padding: "8px 10px", fontSize: "0.78rem", textAlign: "center", textDecoration: "none", display: "inline-flex", justifyContent: "center", alignItems: "center", gap: "4px" }}
              >
                <ExternalLink size={12} />
                <span>View TSDR Status ↗</span>
              </a>
              <a
                href={`https://tsdr.uspto.gov/#caseNumber=${trademark.serialNumber}&caseSearchType=US_APPLICATION&caseType=DEFAULT&searchType=documentSearch`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ flex: 1, padding: "8px 10px", fontSize: "0.78rem", textAlign: "center", textDecoration: "none", display: "inline-flex", justifyContent: "center", alignItems: "center", gap: "4px" }}
              >
                <ExternalLink size={12} />
                <span>Prosecution Files ↗</span>
              </a>
            </div>
          </div>

          {/* Data last updated banner */}
          {trademark.lastSynced && (
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "0.74rem",
              color: "hsl(var(--text-muted))",
              backgroundColor: "rgba(255,255,255,0.02)",
              padding: "6px 10px",
              borderRadius: "4px",
              border: "1px solid hsl(var(--border-color))",
              marginTop: "4px"
            }}>
              <span>Data last updated: {formatDate(new Date(trademark.lastSynced).toISOString())}</span>
              <a
                href="https://account.uspto.gov/profile/api-manager"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "hsl(var(--accent))", textDecoration: "none", fontWeight: 600 }}
              >
                Learn How To Update Data ↗
              </a>
            </div>
          )}

        </div>
      )}

      {/* EMPTY STATE */}
      {!trademark && !loading && !error && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div className="empty-state" style={{ marginBottom: 0 }}>
            <Search className="empty-state-icon" />
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1.05rem" }}>
              No Trademark Case Loaded
            </h3>
            <p className="empty-state-text">
              Input a U.S. Serial or Registration Number above to import live trademark records from the TSDR API.
            </p>
          </div>
          {/* Interactive Guides & Roadmap Tab Panel */}
          <div className="glass-panel" style={{
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
            border: "1px solid hsl(var(--border-color))"
          }}>
            <button
              type="button"
              onClick={() => setShowClassGuide(!showClassGuide)}
              style={{
                width: "100%",
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "rgba(255,255,255,0.01)",
                border: "none",
                color: "hsl(var(--text-primary))",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: "0.9rem"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <BookOpen size={16} style={{ color: "hsl(var(--accent))" }} />
                <span>USPTO Trademark Filing & Class Guides</span>
              </div>
              {showClassGuide ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showClassGuide && (
              <div style={{
                padding: "16px",
                borderTop: "1px solid hsl(var(--border-color))",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                backgroundColor: "rgba(0,0,0,0.12)"
              }}>
                {/* Tabs Bar */}
                <div style={{
                  display: "flex",
                  borderBottom: "1px solid hsl(var(--border-color))",
                  marginBottom: "4px",
                  gap: "12px",
                  paddingBottom: "8px"
                }}>
                  <button
                    type="button"
                    onClick={() => setActiveGuideTab("searchHelp")}
                    style={{
                      background: "none",
                      border: "none",
                      color: activeGuideTab === "searchHelp" ? "hsl(var(--accent))" : "hsl(var(--text-muted))",
                      fontWeight: 600,
                      fontSize: "0.78rem",
                      cursor: "pointer",
                      padding: "4px 8px",
                      borderBottom: activeGuideTab === "searchHelp" ? "2px solid hsl(var(--accent))" : "none",
                      outline: "none"
                    }}
                  >
                    Search Guide
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveGuideTab("roadmap")}
                    style={{
                      background: "none",
                      border: "none",
                      color: activeGuideTab === "roadmap" ? "hsl(var(--accent))" : "hsl(var(--text-muted))",
                      fontWeight: 600,
                      fontSize: "0.78rem",
                      cursor: "pointer",
                      padding: "4px 8px",
                      borderBottom: activeGuideTab === "roadmap" ? "2px solid hsl(var(--accent))" : "none",
                      outline: "none"
                    }}
                  >
                    Filing Roadmap
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveGuideTab("classes")}
                    style={{
                      background: "none",
                      border: "none",
                      color: activeGuideTab === "classes" ? "hsl(var(--accent))" : "hsl(var(--text-muted))",
                      fontWeight: 600,
                      fontSize: "0.78rem",
                      cursor: "pointer",
                      padding: "4px 8px",
                      borderBottom: activeGuideTab === "classes" ? "2px solid hsl(var(--accent))" : "none",
                      outline: "none"
                    }}
                  >
                    Class Finder
                  </button>
                </div>

                {/* TAB 1: SEARCH GUIDANCE */}
                {activeGuideTab === "searchHelp" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{
                      backgroundColor: "rgba(255, 179, 0, 0.04)",
                      border: "1px solid rgba(255, 179, 0, 0.15)",
                      padding: "10px 12px",
                      borderRadius: "var(--radius-sm)",
                      display: "flex",
                      gap: "8px",
                      alignItems: "flex-start"
                    }}>
                      <HelpCircle size={16} style={{ color: "hsl(38, 92%, 60%)", flexShrink: 0, marginTop: "2px" }} />
                      <p style={{ fontSize: "0.76rem", color: "hsl(var(--text-secondary))", lineHeight: "1.4", margin: 0 }}>
                        The official USPTO TSDR API requires a **numeric Serial or Registration Number** to pull records. It does not accept brand name texts directly.
                      </p>
                    </div>

                    <h5 style={{ fontSize: "0.8rem", fontWeight: 600, color: "hsl(var(--text-primary))", margin: "4px 0 0 0" }}>
                      How do I look up a brand by name?
                    </h5>
                    
                    <ol style={{ fontSize: "0.78rem", color: "hsl(var(--text-muted))", paddingLeft: "20px", margin: 0, display: "flex", flexDirection: "column", gap: "8px", lineHeight: "1.4" }}>
                      <li>
                        Go to the official <a href="https://tmsearch.uspto.gov" target="_blank" rel="noopener noreferrer" style={{ color: "hsl(var(--accent))", textDecoration: "underline" }}>USPTO Trademark Search System (TESS) ↗</a>.
                      </li>
                      <li>
                        Type in the trademark name or phrase you want to check.
                      </li>
                      <li>
                        Locate the active application and copy the **8-digit Serial Number** (e.g. 73105748) or **7-digit Registration Number**.
                      </li>
                      <li>
                        Paste that number back into this PatentFlow TSDR Lens scanner above to fetch live drawing logs, timeline tracks, and generate PDF briefs!
                      </li>
                    </ol>

                    <div style={{
                      marginTop: "4px",
                      borderTop: "1px solid hsl(var(--border-color))",
                      paddingTop: "10px"
                    }}>
                      <span style={{ display: "block", fontSize: "0.72rem", color: "hsl(var(--text-muted))", fontWeight: 700, textTransform: "uppercase", marginBottom: "6px" }}>
                        Filing Budget Helper
                      </span>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.76rem", color: "hsl(var(--text-secondary))", padding: "6px 8px", backgroundColor: "rgba(255,255,255,0.01)", border: "1px solid hsl(var(--border-color))", borderRadius: "4px" }}>
                        <span>TEAS Plus (Pre-approved terms)</span>
                        <span style={{ fontWeight: 600, color: "hsl(var(--accent))" }}>$250 / class</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.76rem", color: "hsl(var(--text-secondary))", padding: "6px 8px", backgroundColor: "rgba(255,255,255,0.01)", border: "1px solid hsl(var(--border-color))", borderRadius: "4px", marginTop: "4px" }}>
                        <span>TEAS Standard (Custom description)</span>
                        <span style={{ fontWeight: 600 }}>$350 / class</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: ROADMAP CHECKLIST */}
                {activeGuideTab === "roadmap" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <p style={{ fontSize: "0.78rem", color: "hsl(var(--text-muted))", lineHeight: "1.4", margin: 0 }}>
                      The USPTO trademark registration lifecycle typically takes **10–14 months** from initial filing to certificate issuance. Review the key checkpoints:
                    </p>
                    
                    {[
                      {
                        title: "1. Clearance Search",
                        desc: "Perform a likelihood-of-confusion check on TESS/TSDR. Ensure no confusingly similar active marks exist in your classification class.",
                        time: "Prior to filing",
                        tip: "Search phonetic matches and typos, not just exact word spells."
                      },
                      {
                        title: "2. Form Submission (TEAS)",
                        desc: "Submit your application using TEAS Plus ($250/class) or TEAS Standard ($350/class). You must supply a description of goods/services and pay filing fees.",
                        time: "Day of Filing",
                        tip: "Choose TEAS Plus if you use the pre-approved USPTO ID manual terms to save $100 per class!"
                      },
                      {
                        title: "3. Examining Attorney Review",
                        desc: "A USPTO Examiner checks your application for technical issues or conflicts. This step takes 8–10 months.",
                        time: "Months 1 - 9",
                        tip: "If they find issues, they issue an Office Action. You must respond within 3 months to prevent abandonment."
                      },
                      {
                        title: "4. Gazette Publication",
                        desc: "If approved, your mark is published in the USPTO Official Gazette. Third parties have exactly 30 days to file an opposition.",
                        time: "Month 10",
                        tip: "This is the opposition window. If no one objects, your application proceeds to the next stage."
                      },
                      {
                        title: "5. Allowance & Statement of Use",
                        desc: "For Use in Commerce (Sec 1a), the registration certificate is issued. For Intent to Use (Sec 1b), you receive a Notice of Allowance and have 6 months to submit a Statement of Use showing actual commercial use.",
                        time: "Months 11 - 12",
                        tip: "A valid specimen is required: Class 9 requires app store listings or device screenshots; Class 42 requires active website checkout pages."
                      },
                      {
                        title: "6. Maintenance Filing",
                        desc: "To keep registration alive, you must file a Declaration of Use (Section 8) between years 5 and 6, and a combined Section 8 & 9 declaration every 10 years.",
                        time: "Years 5-6, 10, 20...",
                        tip: "Missing renewals causes immediate cancellation of your brand protection."
                      }
                    ].map((step, idx) => (
                      <div key={idx} style={{
                        padding: "10px 12px",
                        backgroundColor: "rgba(255,255,255,0.02)",
                        border: "1px solid hsl(var(--border-color))",
                        borderRadius: "var(--radius-sm)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "hsl(var(--accent))" }}>
                            {step.title}
                          </span>
                          <span style={{ fontSize: "0.7rem", color: "hsl(var(--text-muted))", fontWeight: 600 }}>
                            {step.time}
                          </span>
                        </div>
                        <p style={{ fontSize: "0.76rem", color: "hsl(var(--text-secondary))", lineHeight: "1.4", margin: 0 }}>
                          {step.desc}
                        </p>
                        <div style={{ fontSize: "0.72rem", color: "hsl(38, 92%, 60%)", fontStyle: "italic", borderTop: "1px solid rgba(255,255,255,0.02)", paddingTop: "4px", marginTop: "2px" }}>
                          💡 Tip: {step.tip}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB 3: CLASS FINDER (ORIGINAL LIST) */}
                {activeGuideTab === "classes" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <p style={{ fontSize: "0.78rem", color: "hsl(var(--text-muted))", lineHeight: "1.4", margin: 0 }}>
                      Trademarks are filed under specific USPTO International Classes based on the goods or services provided. Use this guide to find classification codes for your brand lookup.
                    </p>

                    {/* Categories Grid of Search Chips */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      <button
                        type="button"
                        onClick={() => setClassCategoryFilter(null)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "var(--radius-full)",
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          backgroundColor: classCategoryFilter === null ? "hsl(var(--accent))" : "rgba(255,255,255,0.03)",
                          color: classCategoryFilter === null ? "hsl(var(--bg-primary))" : "hsl(var(--text-secondary))",
                          border: "1px solid " + (classCategoryFilter === null ? "hsl(var(--accent))" : "hsl(var(--border-color))"),
                          cursor: "pointer",
                          transition: "all var(--transition-fast)"
                        }}
                      >
                        All Classes
                      </button>
                      {["Tech & Software", "Business & Finance", "Media & Entertainment", "Goods & Apparel", "Health & Biotech"].map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setClassCategoryFilter(cat)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "var(--radius-full)",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            backgroundColor: classCategoryFilter === cat ? "hsl(var(--accent))" : "rgba(255,255,255,0.03)",
                            color: classCategoryFilter === cat ? "hsl(var(--bg-primary))" : "hsl(var(--text-secondary))",
                            border: "1px solid " + (classCategoryFilter === cat ? "hsl(var(--accent))" : "hsl(var(--border-color))"),
                            cursor: "pointer",
                            transition: "all var(--transition-fast)"
                          }}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Inline Class Search Filter Input */}
                    <div style={{ position: "relative" }}>
                      <input
                        type="text"
                        placeholder="Search classes (e.g. software, retail, clothing)..."
                        value={classQuery}
                        onChange={(e) => setClassQuery(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px 12px 8px 32px",
                          fontSize: "0.8rem",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid hsl(var(--border-color))",
                          backgroundColor: "rgba(0,0,0,0.2)",
                          color: "hsl(var(--text-primary))",
                          outline: "none"
                        }}
                      />
                      <Search size={14} style={{
                        position: "absolute",
                        left: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "hsl(var(--text-muted))"
                      }} />
                      {classQuery && (
                        <button
                          type="button"
                          onClick={() => setClassQuery("")}
                          style={{
                            position: "absolute",
                            right: "10px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "none",
                            border: "none",
                            color: "hsl(var(--text-muted))",
                            cursor: "pointer",
                            fontSize: "0.85rem"
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* List of matching Classes */}
                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      maxHeight: "240px",
                      overflowY: "auto",
                      paddingRight: "4px"
                    }}>
                      {TRADEMARK_CLASSES.filter(c => {
                        const matchesCategory = !classCategoryFilter || c.categories.includes(classCategoryFilter);
                        const queryClean = classQuery.toLowerCase().trim();
                        const matchesQuery = !queryClean ||
                          c.code.includes(queryClean) ||
                          c.name.toLowerCase().includes(queryClean) ||
                          c.desc.toLowerCase().includes(queryClean) ||
                          c.type.toLowerCase().includes(queryClean);
                        return matchesCategory && matchesQuery;
                      }).map(c => (
                        <div
                          key={c.code}
                          style={{
                            padding: "10px 12px",
                            borderRadius: "var(--radius-sm)",
                            backgroundColor: "rgba(255,255,255,0.02)",
                            border: "1px solid hsl(var(--border-color))",
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              color: "hsl(var(--accent))",
                              fontFamily: "monospace"
                            }}>
                              Class {c.code} ({c.type})
                            </span>
                            <span style={{
                              fontSize: "0.7rem",
                              fontWeight: 600,
                              padding: "2px 6px",
                              borderRadius: "4px",
                              backgroundColor: "rgba(255,255,255,0.05)",
                              color: "hsl(var(--text-muted))"
                            }}>
                              {c.name}
                            </span>
                          </div>
                          <p style={{ fontSize: "0.78rem", color: "hsl(var(--text-secondary))", lineHeight: "1.35", margin: 0 }}>
                            {c.desc}
                          </p>
                        </div>
                      ))}
                      {TRADEMARK_CLASSES.filter(c => {
                        const matchesCategory = !classCategoryFilter || c.categories.includes(classCategoryFilter);
                        const queryClean = classQuery.toLowerCase().trim();
                        const matchesQuery = !queryClean ||
                          c.code.includes(queryClean) ||
                          c.name.toLowerCase().includes(queryClean) ||
                          c.desc.toLowerCase().includes(queryClean) ||
                          c.type.toLowerCase().includes(queryClean);
                        return matchesCategory && matchesQuery;
                      }).length === 0 && (
                        <div style={{
                          textAlign: "center",
                          padding: "20px",
                          color: "hsl(var(--text-muted))",
                          fontSize: "0.78rem"
                        }}>
                          No matching classes found.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick links & Brand shortcuts */}
          <div>
            <h4 style={{
              fontSize: "0.82rem",
              fontWeight: 600,
              color: "hsl(var(--text-secondary))",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "12px",
              paddingLeft: "4px"
            }}>
              Quick-Scan Brand Shortcuts
            </h4>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "10px",
            }}>
              {FAMOUS_MARKS.map((mark) => (
                <button
                  key={mark.serial}
                  type="button"
                  className="glass-panel"
                  onClick={() => {
                    setQuery(mark.serial);
                    performSearch(mark.serial);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    borderRadius: "var(--radius-md)",
                    cursor: "pointer",
                    textAlign: "left",
                    color: "hsl(var(--text-primary))",
                    transition: "all var(--transition-fast)",
                    outline: "none",
                    width: "100%"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "hsl(var(--accent))";
                    e.currentTarget.style.boxShadow = "var(--shadow-glow)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "hsl(var(--border-color))";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "1.4rem" }}>{mark.logo}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{mark.name}</div>
                      <div style={{ fontSize: "0.72rem", color: "hsl(var(--text-muted))" }}>{mark.description}</div>
                    </div>
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
                    {mark.serial}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Collapsible Demo Practice Marks (Deadlines) */}
          <div className="glass-panel" style={{
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
            border: "1px solid hsl(var(--border-color))"
          }}>
            <button
              type="button"
              onClick={() => setShowDemoMarks(!showDemoMarks)}
              style={{
                width: "100%",
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "rgba(255,255,255,0.01)",
                border: "none",
                color: "hsl(var(--text-primary))",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: "0.9rem"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Calendar size={16} style={{ color: "hsl(var(--accent))" }} />
                <span>Demo Practice Marks & Deadlines</span>
              </div>
              {showDemoMarks ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showDemoMarks && (
              <div style={{
                padding: "16px",
                borderTop: "1px solid hsl(var(--border-color))",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                backgroundColor: "rgba(0,0,0,0.12)"
              }}>
                <p style={{ fontSize: "0.78rem", color: "hsl(var(--text-muted))", lineHeight: "1.45", margin: 0 }}>
                  Practice marks simulate live USPTO case file scenarios with strict regulatory timelines. Click a mark to import its mock prosecution record and view active countdown trackers.
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  <button
                    type="button"
                    className="glass-panel"
                    onClick={() => {
                      setQuery("99999901");
                      performSearch("99999901");
                    }}
                    style={{
                      flex: "1 1 45%",
                      padding: "12px",
                      borderRadius: "var(--radius-sm)",
                      cursor: "pointer",
                      color: "hsl(var(--text-primary))",
                      textAlign: "left",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: "rgba(255,255,255,0.02)",
                      border: "1px solid hsl(var(--border-color))"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "hsl(var(--accent))"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "hsl(var(--border-color))"; }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, fontSize: "0.82rem", display: "block" }}>ALPHA LABS</span>
                      <span style={{ fontSize: "0.7rem", color: "hsl(0, 84%, 65%)" }}>⚠️ Office Action Issued</span>
                    </div>
                    <span style={{ fontSize: "0.7rem", fontFamily: "monospace", color: "hsl(var(--accent))" }}>99999901</span>
                  </button>

                  <button
                    type="button"
                    className="glass-panel"
                    onClick={() => {
                      setQuery("99999902");
                      performSearch("99999902");
                    }}
                    style={{
                      flex: "1 1 45%",
                      padding: "12px",
                      borderRadius: "var(--radius-sm)",
                      cursor: "pointer",
                      color: "hsl(var(--text-primary))",
                      textAlign: "left",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: "rgba(255,255,255,0.02)",
                      border: "1px solid hsl(var(--border-color))"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "hsl(var(--accent))"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "hsl(var(--border-color))"; }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, fontSize: "0.82rem", display: "block" }}>QUANTUM CLOUD</span>
                      <span style={{ fontSize: "0.7rem", color: "hsl(38, 92%, 65%)" }}>⏰ Allowance Issued</span>
                    </div>
                    <span style={{ fontSize: "0.7rem", fontFamily: "monospace", color: "hsl(var(--accent))" }}>99999902</span>
                  </button>
                </div>

                <div style={{
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                  paddingTop: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px"
                }}>
                  <span style={{ display: "block", fontSize: "0.72rem", color: "hsl(var(--text-muted))", fontWeight: 700, textTransform: "uppercase" }}>
                    Understanding Response Deadlines:
                  </span>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ fontSize: "0.76rem", lineHeight: "1.4", color: "hsl(var(--text-secondary))" }}>
                      <strong>• Office Action (e.g. ALPHA LABS):</strong> Issued when an examiner raises refusals (e.g. likelihood of confusion, descriptive refusal) or requires specimen/description changes. Filers have a strict <strong>3-month statutory window</strong> to file a response. Missing this deadline results in automatic abandonment of the application.
                    </div>
                    <div style={{ fontSize: "0.76rem", lineHeight: "1.4", color: "hsl(var(--text-secondary))" }}>
                      <strong>• Notice of Allowance (e.g. QUANTUM CLOUD):</strong> Issued for Intent to Use applications (Section 1b). The applicant is granted a <strong>6-month period</strong> to submit a Statement of Use (SOU) showing actual commerce sales along with a valid specimen, or request a 6-month extension (up to 5 extensions/36 months total). Failure to submit within 6 months results in abandonment.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
