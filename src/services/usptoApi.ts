import { db } from "./db";
import type { PatentDocument, TrademarkDocument } from "./db";

class RateLimiter {
  private queue: (() => Promise<void>)[] = [];
  private lastCallTime = 0;
  private minIntervalMs = 500; // Max 2 requests per second
  private running = false;

  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.running || this.queue.length === 0) return;
    this.running = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const elapsed = now - this.lastCallTime;
      const delay = Math.max(0, this.minIntervalMs - elapsed);

      if (delay > 0) {
        await new Promise((r) => setTimeout(r, delay));
      }

      const task = this.queue.shift();
      if (task) {
        this.lastCallTime = Date.now();
        try {
          await task();
        } catch (e) {
          console.error("Queue task execution error:", e);
        }
      }
    }

    this.running = false;
  }
}

const limiter = new RateLimiter();

// Fetch helper with timeout and retry logic
async function fetchWithRetryAndTimeout(
  url: string,
  options: RequestInit,
  retries = 2,
  timeoutMs = 6000
): Promise<Response> {
  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timerId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timerId);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("USPTO authentication failed (401/403). Please verify your API Key in the Settings tab.");
        }
        throw new Error(`USPTO Server returned error status: ${response.status} ${response.statusText}`);
      }
      return response;
    } catch (error: any) {
      clearTimeout(timerId);
      lastError = error;

      const isAbort = error.name === "AbortError";
      console.warn(`API request attempt ${attempt + 1} failed.`, isAbort ? "Timeout" : error.message);

      // If it is an auth error, don't retry
      if (error.message.includes("authentication failed")) {
        throw error;
      }

      if (attempt === retries) {
        if (isAbort) {
          throw new Error(`Connection timed out. USPTO servers are slow or unreachable (limit: ${timeoutMs}ms).`);
        }
        throw error;
      }

      const backoffDelay = (attempt + 1) * 1200;
      await new Promise((r) => setTimeout(r, backoffDelay));
    }
  }
  throw lastError || new Error("Request failed after maximum retries");
}

function simplifyTitle(title: string): string {
  if (!title) return "Patent Filing";
  
  let clean = title.toUpperCase();
  
  const preambles = [
    /^METHOD\s+AND\s+APPARATUS\s+FOR\s+/,
    /^SYSTEM\s+AND\s+METHOD\s+FOR\s+/,
    /^METHOD\s+AND\s+SYSTEM\s+FOR\s+/,
    /^SYSTEM\s+AND\s+DEVICE\s+FOR\s+/,
    /^DEVICE\s+AND\s+METHOD\s+FOR\s+/,
    /^METHOD\s+AND\s+DEVICE\s+FOR\s+/,
    /^METHOD\s+FOR\s+/,
    /^SYSTEM\s+FOR\s+/,
    /^DEVICE\s+FOR\s+/,
    /^APPARATUS\s+FOR\s+/,
    /^COMPUTERIZED-METHOD\s+AND\s+/,
  ];
  
  for (const regex of preambles) {
    clean = clean.replace(regex, "");
  }
  
  const suffixes = [
    /,\s+AND\s+COMPUTER-READABLE\s+STORAGE\s+MEDIUM$/,
    /\s+AND\s+COMPUTER-READABLE\s+STORAGE\s+MEDIUM$/,
    /\s+AND\s+STORAGE\s+MEDIUM$/,
    /\s+USING\s+SAME$/,
    /\s+USING\s+THE\s+SAME$/,
  ];
  
  for (const regex of suffixes) {
    clean = clean.replace(regex, "");
  }
  
  let words = clean.toLowerCase().split(/\s+/);
  words = words.map((word, idx) => {
    const lowerWords = ["and", "or", "for", "with", "in", "on", "at", "by", "of", "to", "a", "an", "the"];
    if (idx > 0 && lowerWords.includes(word)) {
      return word;
    }
    return word.charAt(0).toUpperCase() + word.slice(1);
  });
  
  let result = words.join(" ");
  
  const acronyms: Record<string, string> = {
    "lan": "LAN",
    "rtis": "RTIS",
    "ai": "AI",
    "5g": "5G",
    "cpu": "CPU",
    "wlan": "WLAN",
    "lte": "LTE",
    "rfid": "RFID",
    "led": "LED",
    "pci": "PCI",
    "usb": "USB",
    "gps": "GPS",
    "iot": "IoT",
    "api": "API",
    "v2x": "V2X"
  };
  
  Object.keys(acronyms).forEach(key => {
    const regex = new RegExp(`\\b${key}\\b`, "gi");
    result = result.replace(regex, acronyms[key]);
  });
  
  return result.trim() || title;
}

// Map USPTO Solr response fields into structured PatentDocument objects (Legacy Solr Endpoint)
function mapSolrDoc(doc: any): PatentDocument {
  let inventors: string[] = [];
  if (Array.isArray(doc.rankAndInventorsList)) {
    inventors = doc.rankAndInventorsList.map((inv: string) => inv.split(",")[0].trim());
  } else if (typeof doc.rankAndInventorsList === "string") {
    inventors = [doc.rankAndInventorsList.split(",")[0].trim()];
  } else if (doc.primaryInventor) {
    inventors = [doc.primaryInventor];
  }

  const primary = doc.primaryInventor || (inventors.length > 0 ? inventors[0] : "Unknown Inventor");

  let classStr = "N/A";
  if (doc.appCls && doc.appSubCls) {
    classStr = `${doc.appCls}/${doc.appSubCls}`;
  } else if (doc.appClsSubCls) {
    classStr = doc.appClsSubCls;
  }

  const originalTitle = doc.patentTitle || "Untitled Patent Document";
  const simplifiedTitle = simplifyTitle(originalTitle);

  let abstract = doc.appAbstract || doc.abstractText || doc.abstract || "";
  if (Array.isArray(abstract)) {
    abstract = abstract.join(" ");
  }

  if (!abstract.trim()) {
    const typeLabel = doc.appType || "Utility";
    const statusText = doc.appStatus || "Active Case";
    const filingDate = doc.appFilingDate || doc.filingDate;
    const filing = filingDate ? `filed on ${filingDate}` : "";
    const inventorText = primary && primary !== "Unknown Inventor" ? `invented by ${primary}` : "";
    
    const parts = [
      `A ${typeLabel.toLowerCase()} patent document`,
      filing,
      inventorText,
      `with status "${statusText}".`
    ].filter(Boolean);
    
    abstract = `Official Title: "${originalTitle}". ` + parts.join(" ") + " Detailed specifications, drawings, and full prosecution history files are available under official USPTO records.";
  }

  return {
    applId: doc.applId || String(Math.floor(Math.random() * 100000000)),
    patentNumber: doc.patentNumber || undefined,
    patentTitle: originalTitle,
    simplifiedTitle: simplifiedTitle,
    appAbstract: abstract,
    appFilingDate: doc.appFilingDate || doc.filingDate || "",
    patentIssueDate: doc.patentIssueDate || doc.issueDate || doc.patentGrantDate || doc.grantDate || undefined,
    appStatus: doc.appStatus || "Unknown",
    appType: doc.appType || "Utility",
    appClsSubCls: classStr,
    primaryInventor: primary,
    rankAndInventorsList: inventors,
    innovationScore: Math.floor(Math.random() * 20) + 80,
  };
}

// Map USPTO ODP response fields into structured PatentDocument objects (New Endpoint)
function mapOdpDoc(doc: any): PatentDocument {
  const meta = doc.applicationMetaData || {};
  
  let inventors: string[] = [];
  if (meta.inventorBag && Array.isArray(meta.inventorBag)) {
    inventors = meta.inventorBag.map((inv: any) => inv.inventorNameText).filter(Boolean);
  }
  const primary = meta.firstInventorName || (inventors.length > 0 ? inventors[0] : "Unknown Inventor");

  const originalTitle = meta.inventionTitle || doc.patentTitle || "Untitled Patent Document";
  const simplifiedTitle = simplifyTitle(originalTitle);

  let abstract = doc.abstractText || doc.appAbstract || meta.abstractText || "";
  if (Array.isArray(abstract)) {
    abstract = abstract.join(" ");
  }

  const applicantName = meta.firstApplicantName || (meta.applicantBag?.[0]?.applicantNameText);

  if (!abstract.trim()) {
    const typeLabel = meta.applicationTypeLabelName || "Utility";
    const statusText = meta.applicationStatusDescriptionText || "Active Case";
    const filing = meta.filingDate ? `filed on ${meta.filingDate}` : "";
    const applicantText = applicantName ? `by ${applicantName}` : "";
    const inventorText = primary && primary !== "Unknown Inventor" ? `invented by ${primary}` : "";
    
    const parts = [
      `A ${typeLabel.toLowerCase()} patent application`,
      filing,
      inventorText,
      applicantText,
      `with current status "${statusText}".`
    ].filter(Boolean);
    
    abstract = `Official Title: "${originalTitle}". ` + parts.join(" ") + " Detailed specifications, drawings, and full prosecution history files are available under official USPTO records.";
  }

  let assigneeName: string | undefined = undefined;
  let assignmentRecordedDate: string | undefined = undefined;
  let conveyanceText: string | undefined = undefined;

  if (doc.assignmentBag && Array.isArray(doc.assignmentBag) && doc.assignmentBag.length > 0) {
    const primaryAssignment = doc.assignmentBag[0];
    if (primaryAssignment.assigneeBag && Array.isArray(primaryAssignment.assigneeBag) && primaryAssignment.assigneeBag.length > 0) {
      assigneeName = primaryAssignment.assigneeBag[0].assigneeNameText;
    }
    assignmentRecordedDate = primaryAssignment.assignmentRecordedDate;
    conveyanceText = primaryAssignment.conveyanceText;
  }

  return {
    applId: doc.applicationNumberText || doc.applId || String(Math.floor(Math.random() * 100000000)),
    patentNumber: doc.patentNumber || meta.patentNumber || undefined,
    patentTitle: originalTitle,
    simplifiedTitle: simplifiedTitle,
    appAbstract: abstract,
    appFilingDate: meta.filingDate || doc.appFilingDate || "",
    patentIssueDate: meta.grantDate || meta.patentGrantDate || meta.patentIssueDate || doc.patentGrantDate || doc.patentIssueDate || undefined,
    appStatus: meta.applicationStatusDescriptionText || doc.appStatus || "Unknown",
    appType: meta.applicationTypeLabelName || doc.appType || "Utility",
    appClsSubCls: doc.appClsSubCls || "N/A",
    primaryInventor: primary,
    rankAndInventorsList: inventors,
    innovationScore: Math.floor(Math.random() * 20) + 80,
    assigneeName: assigneeName || applicantName || undefined,
    assignmentRecordedDate: assignmentRecordedDate || undefined,
    conveyanceText: conveyanceText || undefined,
  };
}


export const usptoApi = {
  /**
   * Search patents with Solr format or ODP format dynamically
   */
  async search(query: string, category = "All", offset = 0, limit = 15, sort = "recent-desc", statusFilter = "all"): Promise<{ docs: PatentDocument[]; total: number }> {
    let endpoint = db.getApiEndpoint();
    const isOdp = endpoint.includes("api.uspto.gov");

    // Rewrite endpoint to bypass CORS when running in a web browser
    if (db.shouldBypassCors() && endpoint.startsWith("https://api.uspto.gov")) {
      endpoint = endpoint.replace("https://api.uspto.gov", "/uspto-api");
    }

    if (isOdp) {
      // --- USPTO Open Data Portal (ODP) REST API flow ---
      const apiKey = db.getApiKey();
      if (!apiKey) {
        throw new Error(
          "USPTO API Key missing. The active USPTO Open Data Portal requires an API Key. " +
          "Please request a free key from developer.uspto.gov and configure it in the Settings tab."
        );
      }

      // Build ODP search term query
      let queryStr = "";
      const searchTerms: string[] = [];

      if (query.trim()) {
        searchTerms.push(`applicationMetaData.inventionTitle:${query}*`);
      }

      const activeCategory = db.getCategories().find(c => c.name.toLowerCase() === category.toLowerCase());
      if (activeCategory && activeCategory.query) {
        searchTerms.push(`(${activeCategory.query})`);
      } else if (!query.trim()) {
        // If there's no query and no category filter, default to Utility application type
        searchTerms.push("applicationMetaData.applicationTypeLabelName:Utility");
      }

      if (statusFilter === "patented") {
        searchTerms.push('applicationMetaData.applicationStatusDescriptionText:(Patented* OR "Patent Case" OR "Patent Issued" OR "Reexamination Certificate issued" OR "Patent Grant")');
      } else if (statusFilter === "abandoned") {
        searchTerms.push('applicationMetaData.applicationStatusDescriptionText:(Abandoned* OR Expired* OR Withdrawn* OR Terminated* OR Dismissed* OR Rejected*)');
      } else if (statusFilter === "pending") {
        searchTerms.push('NOT applicationMetaData.applicationStatusDescriptionText:(Patented* OR Abandoned* OR Expired* OR Withdrawn* OR Terminated* OR Dismissed* OR Rejected*)');
      }

      queryStr = searchTerms.join(" AND ");

      let sortParam = "";
      if (sort === "recent-desc") {
        sortParam = "applicationMetaData.filingDate desc";
      } else if (sort === "recent-asc") {
        sortParam = "applicationMetaData.filingDate asc";
      }

      const sortQuery = sortParam ? `&sort=${encodeURIComponent(sortParam)}` : "";
      const url = `${endpoint}?q=${encodeURIComponent(queryStr)}&offset=${offset}&limit=${limit}${sortQuery}`;

      return limiter.enqueue(async () => {
        try {
          const response = await fetchWithRetryAndTimeout(url, {
            method: "GET",
            headers: {
              "X-API-KEY": apiKey,
              "Accept": "application/json",
            },
          });

          const data = await response.json();
          
          // ODP wraps items in 'patentFileWrapperDataBag' array
          const results = Array.isArray(data.patentFileWrapperDataBag) ? data.patentFileWrapperDataBag : [];
          const total = typeof data.count === "number" ? data.count : results.length;

          return {
            docs: results.map(mapOdpDoc),
            total: total,
          };
        } catch (error: any) {
          console.error("USPTO ODP API query failed:", error);
          throw new Error(error.message || "Failed to communicate with USPTO ODP API.");
        }
      });

    } else {
      // --- Legacy Solr POST format (for proxy stubs or PEDS-compatible services) ---
      const fq: string[] = [];
      
      const activeCategory = db.getCategories().find(c => c.name.toLowerCase() === category.toLowerCase());
      if (activeCategory && activeCategory.query) {
        // Rewrite ODP title filter prefix to legacy Solr field prefix
        const solrQuery = activeCategory.query.replace(/applicationMetaData\.inventionTitle/g, "patentTitle");
        fq.push(solrQuery);
      }

      if (statusFilter === "patented") {
        fq.push("appStatus:(*patented* OR *issued* OR *grant*)");
      } else if (statusFilter === "abandoned") {
        fq.push("appStatus:(*abandoned* OR *expired* OR *withdrawn* OR *terminated* OR *dismissed* OR *rejected*)");
      } else if (statusFilter === "pending") {
        fq.push("-appStatus:(*patented* OR *issued* OR *grant* OR *abandoned* OR *expired* OR *withdrawn* OR *terminated* OR *dismissed* OR *rejected*)");
      }

      let solrSort = "";
      if (sort === "recent-desc") {
        solrSort = "appFilingDate desc, patentIssueDate desc";
      } else if (sort === "recent-asc") {
        solrSort = "appFilingDate asc, patentIssueDate asc";
      } else {
        solrSort = "score desc, patentIssueDate desc";
      }

      const payload = {
        searchText: query.trim() ? `patentTitle:(${query})` : "*:*",
        fq: fq,
        fl: "applId,patentNumber,patentTitle,appAbstract,abstractText,appFilingDate,patentIssueDate,appStatus,appType,appCls,appSubCls,primaryInventor,rankAndInventorsList",
        mm: "100%",
        df: "patentTitle",
        qf: "patentTitle applId patentNumber primaryInventor rankAndInventorsList",
        facet: "false",
        sort: solrSort,
        start: String(offset),
        rows: String(limit)
      };

      return limiter.enqueue(async () => {
        try {
          const response = await fetchWithRetryAndTimeout(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
            body: JSON.stringify(payload),
          });

          const data = await response.json();
          const solrResponse = data.response || {};
          const docs = Array.isArray(solrResponse.docs) ? solrResponse.docs : [];
          const total = typeof solrResponse.numFound === "number" ? solrResponse.numFound : docs.length;

          return {
            docs: docs.map(mapSolrDoc),
            total: total,
          };
        } catch (error: any) {
          console.error("Legacy Solr API failed:", error);
          throw new Error(error.message || "Failed to communicate with Solr server.");
        }
      });
    }
  },

  /**
   * Fetch a single patent application by ID
   */
  async getByApplId(applId: string): Promise<PatentDocument> {
    let endpoint = db.getApiEndpoint();
    const isOdp = endpoint.includes("api.uspto.gov");

    // Rewrite endpoint to bypass CORS when running in a web browser
    if (db.shouldBypassCors() && endpoint.startsWith("https://api.uspto.gov")) {
      endpoint = endpoint.replace("https://api.uspto.gov", "/uspto-api");
    }

    if (isOdp) {
      const apiKey = db.getApiKey();
      if (!apiKey) {
        throw new Error("USPTO API Key missing. Please configure it in the Settings tab.");
      }

      const url = `${endpoint}?q=applicationNumberText:${applId}&offset=0&limit=1`;

      return limiter.enqueue(async () => {
        try {
          const response = await fetchWithRetryAndTimeout(url, {
            method: "GET",
            headers: {
              "X-API-KEY": apiKey,
              "Accept": "application/json",
            },
          });

          const data = await response.json();
          const results = data.patentFileWrapperDataBag || [];

          if (results.length === 0) {
            throw new Error(`Patent application ID ${applId} not found in USPTO records.`);
          }

          return mapOdpDoc(results[0]);
        } catch (error: any) {
          console.error(`Failed to fetch patent ${applId}:`, error);
          throw new Error(error.message || `Could not fetch patent ID ${applId}.`);
        }
      });
    } else {
      const payload = {
        searchText: `applId:${applId}`,
        fl: "applId,patentNumber,patentTitle,appAbstract,abstractText,appFilingDate,patentIssueDate,appStatus,appType,appCls,appSubCls,primaryInventor,rankAndInventorsList",
        start: "0",
        rows: "1"
      };

      return limiter.enqueue(async () => {
        try {
          const response = await fetchWithRetryAndTimeout(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
            body: JSON.stringify(payload),
          });

          const data = await response.json();
          const docs = data.response?.docs || [];

          if (docs.length === 0) {
            throw new Error(`Patent application ID ${applId} not found in USPTO records.`);
          }

          return mapSolrDoc(docs[0]);
        } catch (error: any) {
          console.error(`Failed to fetch patent ${applId}:`, error);
          throw new Error(error.message || `Could not fetch patent ID ${applId}.`);
        }
      });
    }
  },

  /**
   * Fetch associated documents for a patent application
   */
  async getDocuments(applId: string): Promise<{ name: string; url: string; pages?: number }[]> {
    let endpoint = db.getApiEndpoint();
    const isOdp = endpoint.includes("api.uspto.gov");
    if (!isOdp) return [];

    let url = `https://api.uspto.gov/api/v1/patent/applications/${applId}/documents`;
    if (db.shouldBypassCors()) {
      url = url.replace("https://api.uspto.gov", "/uspto-api");
    }

    const apiKey = db.getApiKey();
    if (!apiKey) return [];

    try {
      const response = await fetchWithRetryAndTimeout(url, {
        method: "GET",
        headers: {
          "X-API-KEY": apiKey,
          "Accept": "application/json",
        },
      });

      if (!response.ok) return [];
      const data = await response.json();
      const docs = Array.isArray(data) ? data : (Array.isArray(data.documentBag) ? data.documentBag : []);

      return docs.map((d: any) => {
        const download = d.downloadOptionBag?.[0] || {};
        let downloadUrl = download.downloadUrl || "";
        if (db.shouldBypassCors() && downloadUrl.startsWith("https://api.uspto.gov")) {
          downloadUrl = downloadUrl.replace("https://api.uspto.gov", "/uspto-api");
        }
        return {
          name: d.documentCodeDescriptionText || d.documentCode || "Official Document",
          url: downloadUrl,
          pages: download.pageTotalQuantity,
        };
      }).filter((d: any) => d.url);
    } catch (e) {
      console.error(`Failed to fetch documents for ${applId}:`, e);
      return [];
    }
  },

  /**
   * Fetch trademark case status from TSDR API
   */
  async getTrademarkStatus(caseId: string): Promise<TrademarkDocument> {
    // Clean caseId to digits only if it starts with sn or rn
    const cleanId = caseId.toLowerCase().replace(/^(sn|rn)/, "");
    const prefix = caseId.toLowerCase().startsWith("rn") ? "rn" : "sn";
    const lookupId = `${prefix}${cleanId}`;
    
    let url = `https://tsdrapi.uspto.gov/ts/cd/casestatus/${lookupId}/info.json`;
    if (db.shouldBypassCors()) {
      url = url.replace("https://tsdrapi.uspto.gov", "/tsdr-api");
    }

    const apiKey = db.getTsdrApiKey();
    if (!apiKey) {
      throw new Error("AUTH_EXPIRED");
    }

    try {
      const response = await fetchWithRetryAndTimeout(url, {
        method: "GET",
        headers: {
          "USPTO-API-KEY": apiKey,
          "Accept": "application/json",
        },
      });

      const data = await response.json();
      const mark = data.trademarks?.[0];
      if (!mark) {
        throw new Error(`Trademark case ${lookupId} not found.`);
      }

      const statusObj = mark.status || {};
      
      // Extract owner name
      let ownerName = "Unknown Owner";
      const groups = mark.parties?.ownerGroups || {};
      const ownerGroup = groups["30"] || groups["40"] || groups["10"] || groups["20"] || Object.values(groups)[0];
      if (Array.isArray(ownerGroup) && ownerGroup.length > 0) {
        ownerName = ownerGroup[0].name || "Unknown Owner";
      }

      // Map goods/services
      const goodsServices = (mark.gsList || []).map((gs: any) => ({
        class: gs.primeClassCode || gs.internationalClasses?.[0]?.code || "N/A",
        description: gs.description || "N/A",
      }));

      return {
        serialNumber: String(statusObj.serialNumber || cleanId),
        registrationNumber: statusObj.usRegistrationNumber || undefined,
        registrationDate: statusObj.usRegistrationDate || undefined,
        filingDate: statusObj.filingDate || undefined,
        markElement: statusObj.markElement || undefined,
        ownerName,
        statusCategory: statusObj.tm5StatusDesc || "Unknown",
        statusDescription: statusObj.extStatusDesc || "No status description available.",
        markDrawingDescription: statusObj.markDrawDesc || undefined,
        goodsServices,
        lastSynced: Date.now(),
      };
    } catch (e: any) {
      const errMsg = (e.message || "").toLowerCase();
      if (errMsg.includes("authentication failed") || errMsg.includes("401") || errMsg.includes("403") || errMsg.includes("auth_expired")) {
        throw new Error("AUTH_EXPIRED");
      }
      console.error(`Failed to fetch trademark status for ${caseId}:`, e);
      throw new Error(e.message || `Could not fetch trademark status for ${caseId}.`);
    }
  }
};
