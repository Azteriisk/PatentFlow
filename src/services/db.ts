export interface PatentDocument {
  applId: string;
  patentNumber?: string;
  patentTitle: string;
  simplifiedTitle?: string;
  appAbstract?: string;
  appFilingDate?: string;
  patentIssueDate?: string;
  appStatus?: string;
  appType?: string;
  appClsSubCls?: string;
  primaryInventor?: string;
  rankAndInventorsList?: string[];
  innovationScore?: number;
  assigneeName?: string;
  assignmentRecordedDate?: string;
  conveyanceText?: string;
}

export interface TrademarkDocument {
  serialNumber: string;
  registrationNumber?: string;
  registrationDate?: string;
  filingDate?: string;
  markElement?: string;
  ownerName: string;
  statusCategory: string;
  statusDescription: string;
  markDrawingDescription?: string;
  goodsServices: { class: string; description: string }[];
  lastSynced?: number;
}

export function getPatentStatusLabel(status: string): "Patented" | "Abandoned" | "Pending" {
  const s = (status || "").toLowerCase();
  if (s.includes("patented") || s.includes("issued") || s.includes("grant")) {
    return "Patented";
  }
  if (s.includes("abandoned") || s.includes("expired") || s.includes("withdrawn") || s.includes("terminated") || s.includes("dismissed") || s.includes("rejected")) {
    return "Abandoned";
  }
  return "Pending";
}

export interface SearchHistoryEntry {
  id: string;
  query: string;
  timestamp: number;
}

const STORAGE_KEYS = {
  BOOKMARKS: "patentflow_bookmarks",
  TRADEMARK_BOOKMARKS: "patentflow_trademark_bookmarks",
  TRADEMARK_CACHE: "patentflow_trademark_cache",
  HISTORY: "patentflow_history",
  THEME: "patentflow_theme",
  API_ENDPOINT: "patentflow_api_endpoint",
  API_KEY: "patentflow_api_key",
  TSDR_API_KEY: "patentflow_tsdr_api_key",
  CATEGORIES: "patentflow_categories",
};

const DEFAULT_API_ENDPOINT = "https://api.uspto.gov/api/v1/patent/applications/search";

export interface PatentCategory {
  id: string;
  name: string;
  query: string;
}

const DEFAULT_CATEGORIES: PatentCategory[] = [
  { id: "all", name: "All", query: "" },
  { id: "ai", name: "AI & Software", query: 'applicationMetaData.inventionTitle:("artificial intelligence" OR "neural network" OR "machine learning" OR "software" OR "compiler" OR "algorithm" OR "data" OR "attention mask" OR "model")' },
  { id: "space", name: "Space & Aerospace", query: 'applicationMetaData.inventionTitle:("space" OR "satellite" OR "rocket" OR "aerospace" OR "lunar" OR "orbit" OR "propulsion" OR "nozzle" OR "shielding")' },
  { id: "biotech", name: "Wearables & Biotech", query: 'applicationMetaData.inventionTitle:("wearable" OR "sensor" OR "prosthetic" OR "lens" OR "biotech" OR "medical" OR "brain" OR "neural interface" OR "implantable")' },
  { id: "green", name: "Green Energy", query: 'applicationMetaData.inventionTitle:("solar" OR "wind" OR "turbine" OR "battery" OR "hydrogen" OR "fuel cell" OR "clean energy" OR "power converter" OR "photovoltaic")' },
  { id: "hardware", name: "Future Hardware", query: 'applicationMetaData.inventionTitle:("hardware" OR "display" OR "hinge" OR "haptic" OR "tactile" OR "holographic" OR "stylus" OR "cool" OR "led" OR "semiconductor")' },
  { id: "robotics", name: "Robotics & Automation", query: 'applicationMetaData.inventionTitle:("robot" OR "robotic" OR "drone" OR "uav" OR "automation" OR "manipulator" OR "actuator" OR "sensor fusion" OR "lidar")' },
  { id: "automotive", name: "Automotive & EV", query: 'applicationMetaData.inventionTitle:("vehicle" OR "engine" OR "car" OR "transmission" OR "hybrid" OR "electric vehicle" OR "autonomous driving" OR "brake" OR "drivetrain")' },
  { id: "medical", name: "Medical Devices", query: 'applicationMetaData.inventionTitle:("surgical" OR "catheter" OR "implant" OR "syringe" OR "ultrasound" OR "mri" OR "ventilation" OR "stent" OR "cardiac" OR "therapy")' },
  { id: "quantum", name: "Quantum & Chips", query: 'applicationMetaData.inventionTitle:("semiconductor" OR "transistor" OR "quantum" OR "wafer" OR "photolithography" OR "silicon" OR "integrated circuit" OR "qubit" OR "superconducting")' },
  { id: "arvr", name: "AR/VR & Gaming", query: 'applicationMetaData.inventionTitle:("virtual reality" OR "augmented reality" OR "headset" OR "display" OR "haptic" OR "gaming" OR "rendering" OR "optics" OR "spatial")' },
  { id: "smarthome", name: "Smart Home & IoT", query: 'applicationMetaData.inventionTitle:("smart" OR "home" OR "appliance" OR "iot" OR "thermostat" OR "lock" OR "lighting" OR "security camera" OR "connected device")' }
];

export const db = {
  // --- BOOKMARKS ---
  getBookmarks(): PatentDocument[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Error reading bookmarks from storage:", e);
      return [];
    }
  },

  saveBookmark(patent: PatentDocument): void {
    try {
      const bookmarks = this.getBookmarks();
      if (!bookmarks.some((b) => b.applId === patent.applId)) {
        // Calculate innovation score if not present, just for visual aesthetic in UI
        const enriched = {
          ...patent,
          innovationScore: patent.innovationScore || Math.floor(Math.random() * 20) + 80,
        };
        bookmarks.unshift(enriched);
        localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
      }
    } catch (e) {
      console.error("Error saving bookmark to storage:", e);
    }
  },

  removeBookmark(applId: string): void {
    try {
      let bookmarks = this.getBookmarks();
      bookmarks = bookmarks.filter((b) => b.applId !== applId);
      localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
    } catch (e) {
      console.error("Error removing bookmark from storage:", e);
    }
  },

  isBookmarked(applId: string): boolean {
    const bookmarks = this.getBookmarks();
    return bookmarks.some((b) => b.applId === applId);
  },

  // --- TRADEMARK BOOKMARKS ---
  getTrademarkBookmarks(): TrademarkDocument[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRADEMARK_BOOKMARKS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Error reading trademark bookmarks from storage:", e);
      return [];
    }
  },

  saveTrademarkBookmark(trademark: TrademarkDocument): void {
    try {
      const bookmarks = this.getTrademarkBookmarks();
      const index = bookmarks.findIndex((b) => b.serialNumber === trademark.serialNumber);
      if (index !== -1) {
        bookmarks[index] = trademark;
      } else {
        bookmarks.unshift(trademark);
      }
      localStorage.setItem(STORAGE_KEYS.TRADEMARK_BOOKMARKS, JSON.stringify(bookmarks));
    } catch (e) {
      console.error("Error saving trademark bookmark to storage:", e);
    }
  },

  removeTrademarkBookmark(serialNumber: string): void {
    try {
      let bookmarks = this.getTrademarkBookmarks();
      bookmarks = bookmarks.filter((b) => b.serialNumber !== serialNumber);
      localStorage.setItem(STORAGE_KEYS.TRADEMARK_BOOKMARKS, JSON.stringify(bookmarks));
    } catch (e) {
      console.error("Error removing trademark bookmark from storage:", e);
    }
  },

  isTrademarkBookmarked(serialNumber: string): boolean {
    const bookmarks = this.getTrademarkBookmarks();
    return bookmarks.some((b) => b.serialNumber === serialNumber);
  },

  // --- TRADEMARK CACHE ---
  getTrademarkCache(): TrademarkDocument[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRADEMARK_CACHE);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Error reading trademark cache from storage:", e);
      return [];
    }
  },

  saveTrademarkToCache(trademark: TrademarkDocument): void {
    try {
      const cache = this.getTrademarkCache();
      const index = cache.findIndex((b) => b.serialNumber === trademark.serialNumber);
      const enriched = {
        ...trademark,
        lastSynced: trademark.lastSynced || Date.now()
      };
      if (index !== -1) {
        cache[index] = enriched;
      } else {
        cache.unshift(enriched);
      }
      if (cache.length > 100) {
        cache.pop();
      }
      localStorage.setItem(STORAGE_KEYS.TRADEMARK_CACHE, JSON.stringify(cache));
    } catch (e) {
      console.error("Error saving trademark cache to storage:", e);
    }
  },

  getTrademarkFromCache(serialNumber: string): TrademarkDocument | null {
    const cache = this.getTrademarkCache();
    const cleanSn = serialNumber.toLowerCase().replace(/^(sn|rn)/, "").trim();
    const found = cache.find((b) => 
      b.serialNumber.toLowerCase() === cleanSn || 
      (b.registrationNumber && b.registrationNumber.toLowerCase() === cleanSn)
    );
    return found || null;
  },

  isDefaultTsdrKey(): boolean {
    const key = this.getTsdrApiKey();
    return key === "LymgERJr563zBsA5yeD87DYcysbkWF6N" || !key;
  },

  // --- SEARCH HISTORY ---
  getHistory(): SearchHistoryEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Error reading search history from storage:", e);
      return [];
    }
  },

  addHistory(query: string): void {
    if (!query.trim()) return;
    try {
      let history = this.getHistory();
      // Remove existing item to move it to the top
      history = history.filter((h) => h.query.toLowerCase() !== query.toLowerCase());
      
      const newEntry: SearchHistoryEntry = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
        query: query.trim(),
        timestamp: Date.now(),
      };
      
      history.unshift(newEntry);
      
      // Limit history to 50 items
      if (history.length > 50) {
        history = history.slice(0, 50);
      }
      
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch (e) {
      console.error("Error adding search history:", e);
    }
  },

  deleteHistoryItem(id: string): void {
    try {
      let history = this.getHistory();
      history = history.filter((h) => h.id !== id);
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch (e) {
      console.error("Error deleting history item:", e);
    }
  },

  clearHistory(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.HISTORY);
    } catch (e) {
      console.error("Error clearing search history:", e);
    }
  },

  // --- SETTINGS (THEME & API) ---
  getTheme(): "light" | "dark" {
    try {
      const theme = localStorage.getItem(STORAGE_KEYS.THEME);
      return theme === "light" ? "light" : "dark"; // Default is dark
    } catch {
      return "dark";
    }
  },

  setTheme(theme: "light" | "dark"): void {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
      document.documentElement.setAttribute("data-theme", theme);
    } catch (e) {
      console.error("Error setting theme:", e);
    }
  },

  getApiEndpoint(): string {
    try {
      return localStorage.getItem(STORAGE_KEYS.API_ENDPOINT) || DEFAULT_API_ENDPOINT;
    } catch {
      return DEFAULT_API_ENDPOINT;
    }
  },

  setApiEndpoint(endpoint: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.API_ENDPOINT, endpoint.trim() || DEFAULT_API_ENDPOINT);
    } catch (e) {
      console.error("Error setting API endpoint:", e);
    }
  },

  resetApiEndpoint(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.API_ENDPOINT, DEFAULT_API_ENDPOINT);
    } catch (e) {
      console.error("Error resetting API endpoint:", e);
    }
  },

  getApiKey: (): string => {
    try {
      return localStorage.getItem(STORAGE_KEYS.API_KEY) || "";
    } catch {
      return "";
    }
  },

  setApiKey: (key: string): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.API_KEY, key.trim());
    } catch (err) {
      console.warn("Could not save API key", err);
    }
  },

  getTsdrApiKey: (): string => {
    try {
      return localStorage.getItem(STORAGE_KEYS.TSDR_API_KEY) || "";
    } catch {
      return "";
    }
  },

  setTsdrApiKey: (key: string): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.TSDR_API_KEY, key.trim());
    } catch (e) {
      console.error("Error setting TSDR API key:", e);
    }
  },

  // --- CATEGORIES ---
  getCategories(): PatentCategory[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (!data) return DEFAULT_CATEGORIES;
      const parsed = JSON.parse(data);
      // Auto-migrate if the user only has the legacy/limited list of defaults (length <= 6)
      if (Array.isArray(parsed) && parsed.length <= 6) {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
        return DEFAULT_CATEGORIES;
      }
      return parsed;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  },

  saveCategories(categories: PatentCategory[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (e) {
      console.error("Error saving categories:", e);
    }
  },

  addCategory(name: string, query: string): void {
    try {
      const categories = this.getCategories();
      const id = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
      if (!categories.some(c => c.id === id)) {
        categories.push({ id, name, query });
        this.saveCategories(categories);
      }
    } catch (e) {
      console.error("Error adding category:", e);
    }
  },

  deleteCategory(id: string): void {
    try {
      if (id === "all") return;
      let categories = this.getCategories();
      categories = categories.filter(c => c.id !== id);
      this.saveCategories(categories);
    } catch (e) {
      console.error("Error deleting category:", e);
    }
  },

  resetCategories(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    } catch (e) {
      console.error("Error resetting categories:", e);
    }
  },

  // --- LOCAL DATABASE METADATA ---
  getStorageStats() {
    try {
      const bookmarks = this.getBookmarks().length;
      const trademarkBookmarks = this.getTrademarkBookmarks().length;
      const history = this.getHistory().length;
      
      // Calculate approximate size in KB
      let sizeBytes = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          sizeBytes += (localStorage[key].length + key.length) * 2; // UTF-16 characters are 2 bytes
        }
      }
      const sizeKB = (sizeBytes / 1024).toFixed(2);
      
      return { bookmarks, trademarkBookmarks, history, sizeKB };
    } catch {
      return { bookmarks: 0, trademarkBookmarks: 0, history: 0, sizeKB: "0.00" };
    }
  }
};
