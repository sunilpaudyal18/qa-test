# QA Test Case Studio

> **Developed by:** Sunil Paudyal  
> **Version:** 0.0.0  
> **Type:** Single Page Application (SPA) — 100% client-side, no backend, no server  
> **Data Storage:** Browser's IndexedDB (via Dexie.js) — **all data stays in your browser, nothing is sent anywhere**

---

## Important: All Data is Stored Locally

This application runs entirely in your browser. **No data is ever uploaded, transmitted, or stored on any external server.** Everything you create — projects, test cases, API requests, settings — is saved directly to your browser's IndexedDB database (`QAToolDB`).

- No account, login, or registration required
- No internet needed after initial load (works fully offline as a PWA)
- No data ever leaves your device
- Export a JSON backup anytime from Settings to save or transfer your data
- Full backup and restore functionality built in

---

## Theme System: Light & Dark Mode

The app features a complete light/dark theme system with persistent user preference.

### How It Works

| Aspect | Details |
|--------|---------|
| **Storage** | Theme preference saved in `localStorage` under key `qa-theme` |
| **Default** | Light mode on first visit |
| **Toggle mechanism** | Adds/removes `.dark` class on `<html>` element |
| **CSS strategy** | CSS custom properties (variables) that change based on `.dark` class |

### Where to Toggle

| Location | Component | Icon |
|----------|-----------|------|
| **Topbar (header)** | `Topbar.jsx` | Sun icon (in light mode, click to switch to dark) / Moon icon (in dark mode, click to switch to light) |
| **Settings page** | `Settings.jsx` | Slider toggle switch with "Light Mode" / "Dark Mode" label |

### Color Scheme

#### Light Mode (`:root` — default)

| CSS Variable | Value | Used For |
|-------------|-------|----------|
| `--color-bg` | `#F6F8FA` | Page background |
| `--color-surface` | `#FFFFFF` | Card, panel, header backgrounds |
| `--color-surface-alt` | `#F1F5F9` | Secondary surfaces, input backgrounds |
| `--color-sidebar` | `#FFFFFF` | Sidebar background |
| `--color-sidebar-item-hover` | `#F1F5F9` | Sidebar item hover state |
| `--color-sidebar-item-active` | `#EFF6FF` | Sidebar active item |
| `--color-text-primary` | `#0F172A` | Primary text (headings, body) |
| `--color-text-secondary` | `#475569` | Secondary text (descriptions) |
| `--color-text-muted` | `#94A3B8` | Muted text (labels, hints) |
| `--color-border` | `#E2E8F0` | Borders, dividers, scrollbar |
| `--color-border-strong` | `#CBD5E1` | Stronger borders |
| `--color-primary` | `#2563EB` | Primary accent (links, buttons, active states) |
| `--color-primary-hover` | `#1D4ED8` | Primary hover state |
| `--color-primary-subtle` | `#DBEAFE` | Subtle primary backgrounds |
| `--color-pass` | `#16A34A` | Pass status (green) |
| `--color-fail` | `#DC2626` | Fail status (red) |
| `--color-blocked` | `#D97706` | Blocked status (amber) |
| `--color-untested` | `#6B7280` | Untested status (gray) |
| `--color-critical` | `#DC2626` | Critical severity (red) |
| `--color-major` | `#EA580C` | Major severity (orange) |
| `--color-minor` | `#2563EB` | Minor severity (blue) |
| `--color-info` | `#0891B2` | Info accents (cyan) |
| `color-scheme` | `light` | Browser native UI theme |

#### Dark Mode (`.dark` class applied)

| CSS Variable | Value | Used For |
|-------------|-------|----------|
| `--color-bg` | `#0A0E17` | Page background (deep navy) |
| `--color-surface` | `#111B2E` | Card, panel, header backgrounds |
| `--color-surface-alt` | `#1A2236` | Secondary surfaces, input backgrounds |
| `--color-sidebar` | `#0F1629` | Sidebar background |
| `--color-sidebar-item-hover` | `#1A2236` | Sidebar item hover state |
| `--color-sidebar-item-active` | `#1E293B` | Sidebar active item |
| `--color-text-primary` | `#F1F5F9` | Primary text (near-white) |
| `--color-text-secondary` | `#94A3B8` | Secondary text |
| `--color-text-muted` | `#64748B` | Muted text |
| `--color-border` | `#1E293B` | Borders, dividers, scrollbar |
| `--color-border-strong` | `#334155` | Stronger borders |
| `--color-primary` | `#3B82F6` | Primary accent (brighter blue for dark bg) |
| `--color-primary-hover` | `#60A5FA` | Primary hover state |
| `--color-primary-subtle` | `#1E3A5F` | Subtle primary backgrounds |
| `--color-pass` | `#22C55E` | Pass status (brighter green) |
| `--color-fail` | `#EF4444` | Fail status (brighter red) |
| `--color-blocked` | `#F59E0B` | Blocked status (brighter amber) |
| `--color-untested` | `#9CA3AF` | Untested status |
| `--color-critical` | `#EF4444` | Critical severity |
| `--color-major` | `#F97316` | Major severity |
| `--color-minor` | `#60A5FA` | Minor severity |
| `--color-info` | `#22D3EE` | Info accents |
| `color-scheme` | `dark` | Browser native UI theme |

---

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | ^19.2.6 | UI framework — components, state, hooks |
| **Vite** | ^8.0.12 | Build tool — fast dev server, HMR, optimized builds |
| **React Router** | ^7.16.0 | Client-side routing (HashRouter — no 404 on refresh) |
| **Tailwind CSS** | ^4.3.0 | Utility-first CSS framework |
| **Dexie.js** | ^4.4.3 | IndexedDB wrapper — local data persistence |
| **Lucide React** | ^1.17.0 | UI icon library (sidebar, buttons, statuses) |
| **React Icons** | ^5.6.0 | Social media brand icons (footer) |
| **Framer Motion** | ^12.40.0 | Animations — page transitions, toasts, modals, loading states |
| **date-fns** | ^4.4.0 | Date formatting throughout the app |
| **xlsx-js-style** | ^1.2.0 | Excel file generation with styled cells |
| **file-saver** | ^2.0.5 | Trigger file downloads in browser |
| **vite-plugin-pwa** | ^1.3.0 | PWA — service worker, offline support, install prompt |

---

## Features (Detailed)

### Dashboard
- **Stats Cards:** Total Projects, Total Test Cases, Pass, Fail, Blocked, Untested, API Hub Requests — each with a lucide icon and animated count
- **Status Distribution:** Horizontal colored bars showing pass/fail/blocked/untested breakdown
- **Module Breakdown:** Lists all modules with their case counts per project
- **Priority & Severity Insights:** Cards showing distribution of priorities and severities
- **Recent Test Cases:** Table of the 5 most recently updated test cases

### Projects
- **CRUD:** Create, read, update, and delete projects
- **Duplicate:** One-click project duplication with "(Copy)" suffix
- **Stats:** Each project card shows total test cases, pass, fail, blocked, untested counts
- **Cascade Delete:** Deleting a project removes all its associated test cases (uses Dexie transaction)

### Test Cases
- **CRUD:** Full create, read, update, delete
- **Rich Form:** Test ID (auto-generated from module prefix), steps list, test data list, expected/actual results, bug link, execution date, screenshot upload (auto-resized to 1600px, JPEG 75%)
- **Search:** Search across all test case fields
- **Filter:** By status (All/Untested/Pass/Fail/Blocked) and priority
- **Sort:** Click column headers to sort ascending/descending
- **Pagination:** 25 test cases per page
- **Bulk Operations:** Select multiple, delete all selected
- **Excel Export:** Styled .xlsx with merged title row, color-coded status cells, column widths, frozen headers
- **Excel Import:** Upload .xlsx/.xls with validation and error reporting
- **View Modal:** Full detail view with collapsible sections (Overview, Steps, Test Data, Results Comparison, Evidence)

### API Hub
- **HTTP Methods:** GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
- **Request Builder:** URL input, query parameters (key/value with enable/disable toggle), headers, body editor (JSON, text/xml, form-data)
- **Response Viewer:** Status code, response time, response size, formatted body, copy button
- **Saved Requests:** Save requests to named collections, load them back
- **Request History:** Auto-saved history of executed requests

### Reports
- **Pass Rate:** Overall pass percentage with circular indicator
- **Status Distribution:** Pie chart showing pass/fail/blocked/untested breakdown
- **Priority Distribution:** Bar chart showing case counts by priority level
- **Severity Distribution:** Bar chart showing case counts by severity level
- **Execution Summary:** Animated horizontal bars per status with counts and percentages

### Import / Export
- **Export All:** Export all test cases to a single styled Excel workbook
- **Export Filtered:** Export only the currently filtered test cases
- **Export Single:** Export one test case as its own workbook
- **Import:** Drag-and-drop or click to upload .xlsx/.xls files with validation

### Settings
- **Appearance:** Light/Dark mode toggle with slider switch
- **Database Stats:** Live count of projects and test cases stored locally
- **Backup:** Download all data as a JSON file
- **Restore:** Upload a JSON backup file to restore all data (with confirmation warning)

---

## Project Structure

```
src/
├── main.jsx                          # Entry point: HashRouter, ThemeProvider, ToastProvider, Suspense
├── App.jsx                           # Route definitions with lazy-loaded pages
├── index.css                         # Tailwind, CSS custom properties (light/dark), scrollbar, fadeIn animation
├── App.css                           # Root min-height style
│
├── components/
│   ├── forms/
│   │   └── TestCaseForm.jsx          # Create/Edit test case form with auto-ID, steps, screenshot upload
│   ├── layout/
│   │   ├── Sidebar.jsx               # Collapsible left nav (7 links with lucide icons, active highlighting)
│   │   ├── Topbar.jsx                # Sticky header: search, theme toggle (sun/moon), PWA install, backup/restore
│   │   └── TestCaseViewModal.jsx     # Full test case detail modal with collapsible sections & image preview
│   └── ui/
│       ├── Modal.jsx                 # Reusable animated modal (5 sizes: sm/md/lg/xl/full) with backdrop blur
│       ├── ConfirmDialog.jsx         # Animated delete confirmation with alert icon
│       └── LoadingScreen.jsx         # Full-screen centered spinning loader (Suspense fallback)
│
├── contexts/
│   ├── ThemeContext.jsx              # Theme state (localStorage), toggle function, `.dark` class management
│   └── ToastContext.jsx              # Toast notifications: success/error/warning/info, auto-dismiss 3s, framer-motion
│
├── db/
│   └── db.js                        # Dexie database instance: QAToolDB v2 (projects, testCases, apiRequests)
│
├── layouts/
│   └── AppLayout.jsx                 # Main layout shell: Sidebar + (Topbar + Outlet + Footer with social links & copyright)
│
├── pages/
│   ├── Dashboard.jsx                 # Stats overview with cards, bars, module breakdown, recent cases
│   ├── Projects.jsx                  # Project CRUD with cards, stats, duplicate, delete
│   ├── TestCases.jsx                 # Full table with search, filter, sort, pagination, bulk, Excel, view modal
│   ├── ApiHub.jsx                    # HTTP request builder with method, URL, params, headers, body, response viewer
│   ├── ApiHub/store/useApiHubStore.js# Advanced API Hub state manager (auth, env, scripts, assertions — future use)
│   ├── Reports.jsx                   # Pie charts, bar charts, pass rate, execution summary
│   ├── ImportExport.jsx              # Excel export (all/filtered) and import with drag-and-drop
│   └── Settings.jsx                  # Theme toggle slider, DB stats, backup/restore buttons
│
├── services/
│   ├── projectService.js             # Projects: getAll, getById, getByName, create, update, duplicate, getStats, delete
│   ├── testCaseService.js            # Test cases: getAll, getById, create, update, delete, bulkDelete, bulkUpdateStatus
│   ├── apiRequestService.js          # API requests: getAll, getById, create, update, delete, getCollections
│   └── settingsService.js            # Settings: get, update (single record, ID 1)
│
└── utils/
    ├── excel.js                      # buildWorksheet, exportToExcel, exportSingleToExcel, importFromExcel
    ├── backup.js                     # createBackup (JSON download), restoreBackup (JSON upload)
    └── helpers.js                    # formatDate, formatDateTime, classNames, generateId
```

---

## Routes

| Path | Page | Lazy-loaded | Description |
|------|------|-------------|-------------|
| `/` | Dashboard | Yes | Overview stats, charts, module breakdown, recent cases |
| `/projects` | Projects | Yes | Manage projects with CRUD |
| `/testcases` | Test Cases | Yes | Full test case management table |
| `/apihub` | API Hub | Yes | HTTP request builder |
| `/reports` | Reports | Yes | Charts & analytics |
| `/import-export` | Import/Export | Yes | Excel import/export |
| `/settings` | Settings | Yes | Theme, backup, database stats |

Routing uses **HashRouter** (`#` in URL) so refreshing any page never causes a 404 error.

---

## Data Storage (IndexedDB via Dexie.js)

**Database Name:** `QAToolDB`

### Tables (Version 2)

| Table | Primary Key | Indexes | Key Fields |
|-------|-------------|---------|------------|
| **projects** | `++id` (auto-increment) | `&name` (unique) | name, description, createdAt |
| **testCases** | `++id` (auto-increment) | `projectName`, `testId`, `module`, `status`, `priority` | testId, module, title, steps[], testData[], expectedResult, actualResult, status, priority, severity, bugLink, date, screenshot (base64), projectName, createdAt, updatedAt |
| **apiRequests** | `++id` (auto-increment) | `name`, `method`, `collection`, `createdAt` | name, method, url, headers[], body, bodyType, auth, params[], collection, createdAt, updatedAt |

### Data Access Patterns
- **Direct DB access** — `Dashboard.jsx` and `Reports.jsx` import `db` directly for read-only queries
- **Service layer** — All CRUD via `projectService`, `testCaseService`, `apiRequestService`
- **Transactions** — Used for cascade delete (project + test cases) and backup restore
- **Backup/Export** — Full JSON export of all tables, restore with table clear + repopulate in transaction

---

## PWA (Progressive Web App)

| Feature | Details |
|---------|---------|
| **Installable** | Users can install as a standalone desktop/mobile app |
| **Offline** | Fully functional without internet after initial load |
| **Auto-update** | Service worker auto-updates when new version is deployed |
| **Install Prompt** | Listens for `beforeinstallprompt` event |
| **Install Modal** | Shows instructions for Chrome/Edge (desktop), Android, and iOS Safari |
| **Standalone Mode** | Topbar hides when in `display-mode: standalone` (cleaner app feel) |

### PWA Icons
- `public/favicon/convertico-favicon_16x16.png` through `256x256.png` (all standard sizes)
- `public/logo1/convertico-favicon_256x256.png` (maskable icon for Android)
- `public/favicon.svg` (SVG vector favicon with indigo gradient "Q")

---

## Animations (Framer Motion)

| Component | Animation |
|-----------|-----------|
| Page transitions | Fade in + slight slide up (opacity: 0→1, y: -10→0 or y: 20→0) |
| Toast notifications | Slide up from bottom + scale (opacity: 0→1, y: 20→0, scale: 0.95→1) |
| Modals | Scale + fade in/out with backdrop blur |
| Confirm dialogs | Scale + fade with alert icon bounce |
| Loading screen | Continuous spin animation |
| Dashboard cards | Staggered entrance with delay |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite development server with HMR |
| `npm run build` | Build for production (output to `dist/`) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint on all source files |
