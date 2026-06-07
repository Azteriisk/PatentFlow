# PatentFlow 🌌

PatentFlow is a premium, privacy-respecting cross-platform patent and trademark discovery application. Built with a dark, immersive glassmorphic design and tailorable HSL aesthetics, it enables inventors, business creators, trademark attorneys, and researchers to scan and query the official USPTO patent and trademark databases directly from their browser, desktop, or mobile device without any telemetry or third-party tracking.

```
┌─────────────────────────────────────────────────────────┐
│                    PATENTFLOW LENS                      │
├─────────────────────────────────────────────────────────┤
│ [Search Keywords or Serial...]            [Status Filter] │
│ 🔲 AI & Software   🛰️ Space & Aerospace  ⚡ Green Energy │
├─────────────────────────────────────────────────────────┤
│ ⬤ Scanning USPTO... (Rate-limited, direct connection)  │
│ 🛡️ TSDR Lens Active: Live Registry Sync Enabled        │
└─────────────────────────────────────────────────────────┘
```

---

## Key Features 🚀

- **Direct USPTO Patent & TSDR Integration**: Direct connection to the official USPTO Open Data Portal (ODP) REST API and the USPTO TSDR API endpoint. Supports both modern ODP REST APIs, legacy Solr/PEDS endpoints, and TSDR case files.
- **Trademark TSDR Lens & Preloaded Registry**: Import brand details by U.S. Serial or Registration Number. Displays active status (LIVE/DEAD), mark element drawing representations, multi-class Goods & Services, and case document download bundles (PDF wrapper, Images ZIP). Features 11 pre-loaded famous brand shortcuts and 2 simulated deadline practice marks that run fully offline.
- **Attorney Portfolio Monitor (Watchlist Sync)**: Batch status synchronizer that sequentially sweeps bookmarked trademarks at rate-limited intervals. Features inline key renewal prompts to update active portfolios smoothly when daily USPTO credentials expire.
- **Filing Deadlines & Stepper Timeline Tracker**: Computes critical response windows (e.g. 3 months for Office Actions, 6 months for Notice of Allowance Statements of Use) and renders visual lifecycle stage steppers.
- **Client-Side PDF Summary Generator**: Composes and exports high-quality, print-ready PDF summary documents for patent specifications and trademark case briefs on the fly using `@react-pdf/renderer` without external server dependencies.
- **Storage-Conscious Cache Manager**: Download prosecution documents and specification sheets for offline viewing in isolated cache storage, complete with diagnostic size metrics and manual cache clearing in Settings to prevent device storage bloat.
- **Multi-Patent Comparison Matrix**: Checkboxes in saved portfolios load side-by-side matrices comparing inventors, filers, categories, innovation scores, and summaries.
- **Server-Side Filtering & Sorting**: Paginated, server-side query routing that enables sorting chronologically (Most/Least Recent) to load documents dating back to 2001, and filtering by case status (Pending, Patented, Abandoned).
- **Infinite Scroll Sentinel**: Integrated intersection observer-based infinite scroll for fluid scanning.
- **Official PDF File Wrapper Attachments**: Discovers and fetches list of official prosecution documents (Specifications, Claims, Drawings, Office Actions) and routes download URLs via a CORS proxy for local access.
- **Dynamic Abstract Summarizer & Title Simplifier**: Automatically parses complex, legalistic, all-caps patent titles into clean Title Case and generates informative descriptors for empty abstract files.
- **Custom Category CRUD**: Define, test, and save custom category chips using Lucene/Solr query syntax in the Settings tab.
- **Sandboxed Local Database**: Privacy-first. Your search history, bookmarks, cached trademark files, API endpoints, themes, and keys are stored 100% locally on your device's `localStorage` sandbox. Includes data import/export backups.
- **API Key Visibility Controls**: Mask/unmask key characters using a security eye toggle.

---

## Technology Stack 🛠️

1. **Frontend**: React, TypeScript, Vite, TailwindCSS (for config), Vanilla CSS (for layout details).
2. **Icons**: Lucide React.
3. **Cross-Platform Wrappers**:
   - **Desktop**: Electron (standalone desktop shell).
   - **Mobile**: Capacitor (targeting Android packages).
4. **PDF Engine**: Client-side document assembly using `@react-pdf/renderer`.
5. **Data Sync**: Direct REST with a built-in rate limiter (500ms cooldown) to adhere to USPTO API limit restrictions (max 2 requests/second).

---

## Getting Started 💻

### Prerequisites
To use the application fully, you need a free USPTO developer account.
1. Sign up at [developer.uspto.gov](https://developer.uspto.gov/) (requires ID.me verification).
2. Go to your API Dashboard and generate an ODP API Key.
3. Paste the key inside the **Settings** view of the PatentFlow app.
4. For live trademark status sync, generate a TSDR API key from the USPTO API Manager and add it under the **Settings** or saved trademarks renewer tab.

### Installation
Clone the repository and install the dependencies:
```bash
npm install
```

### Running Locally (Web Dev Server)
To launch the hot-reloading development preview in the browser:
```bash
npm run dev
```

### Running Desktop Wrapper (Electron)
To launch the Electron shell connected to the hot-reloading dev server:
```bash
npm run electron:dev
```
To compile the static React bundle and launch Electron in standalone mode:
```bash
npm run electron:start
```

### Running Mobile Wrapper (Capacitor Android)
Ensure you have Android Studio installed and configured:
1. Build the production React web bundle:
   ```bash
   npm run build
   ```
2. Sync the compiled bundle to the Android Capacitor project:
   ```bash
   npx cap sync
   ```
3. Open the project in Android Studio:
   ```bash
   npx cap open android
   ```
4. Build, sign, and test your Android APK on a device or emulator.

### Hosting on the Web (Vercel & PWA)
PatentFlow is fully configured as a Progressive Web App (PWA) and Single Page Application (SPA), meaning you can host it online and users can install it directly to their devices without an App Store.

1. **Deploy via Vercel CLI**:
   Run `npx vercel` in the project root to instantly deploy to Vercel's edge network.
2. **Deploy via GitHub**:
   Push the repository to GitHub, go to the [Vercel Dashboard](https://vercel.com/new), import the repository, and Vercel will automatically detect the Vite framework and configure the build settings.
3. **PWA Installation**:
   Once hosted (e.g., at `patentflow.azterisk.net`), iOS users can tap **Share > Add to Home Screen**, and Android/Windows users can use the native browser prompt to install it as an independent app.

---

## Directory Structure 📂

```
PatentFlow/
├── android/               # Capacitor Android native configuration
├── electron/              # Electron main & preload scripts
├── public/                # Static assets and local CORS routing configurations
└── src/
    ├── components/        # UI components (Feed, Settings, Card, Detail, PdfGenerator, TrademarkSearch)
    ├── services/          # Local Database wrapper & USPTO Solr/TSDR REST clients
    ├── App.tsx            # Main tab controller & layout manager
    ├── index.css          # Design system variables & aesthetic effects
    └── main.tsx           # React entry point
```

---

## Privacy & Security Policy 🔒

PatentFlow is built with complete user autonomy in mind:
- **Zero Analytics**: No remote tracking, telemetry, telemetry APIs, or cookie tracking.
- **Private Key Storage**: Your API credentials remain locally stored on your machine.
- **Local Portability**: Your bookmarks can be exported as a `.json` backup file and cleared with a single button.
