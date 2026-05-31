# QA Test Case Studio

A modern, frontend-only **QA Test Case Management** application built with React. Create, manage, and track test cases, projects, and API requests — all stored locally in your browser using IndexedDB. Works offline and installable as a PWA.

## Features

- **Dashboard** — Overview with stats, charts, module breakdown, priority & severity insights
- **Projects** — Create and manage testing projects
- **Test Cases** — Full CRUD with search, filter, sort, pagination, bulk select/delete, Excel export/import
- **API Hub** — Postman-like API request builder (GET, POST, PUT, PATCH, DELETE) with response viewer, saved requests, collections, and history
- **Reports** — Visual charts for status, priority, and severity distribution
- **Import / Export** — Styled Excel (.xlsx) export with colored headers and status-based cell colors, plus import with validation
- **Settings** — Theme toggle, database stats, JSON backup/restore
- **PWA** — Installable as a standalone app, works offline
- **Dark/Light Theme** — Persisted in localStorage

## Tech Stack

| Tech | Usage |
|------|-------|
| React 19 | UI framework |
| Vite 8 | Build tool |
| React Router DOM 7 | Client-side routing |
| Tailwind CSS v4 | Styling |
| Dexie.js | IndexedDB wrapper |
| Framer Motion | Animations |
| Lucide React | Icons |
| xlsx-js-style + file-saver | Excel export |
| vite-plugin-pwa | PWA support |

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npx serve dist
```

## Project Structure

```
src/
├── components/
│   ├── forms/         # TestCaseForm
│   ├── layout/        # Sidebar, Topbar, TestCaseViewModal
│   └── ui/            # Modal, ConfirmDialog, LoadingScreen
├── contexts/          # ThemeContext, ToastContext
├── db/                # Dexie database schema
├── layouts/           # AppLayout with sidebar + topbar + footer
├── pages/             # Dashboard, Projects, TestCases, ApiHub, Reports, ImportExport, Settings
├── services/          # CRUD services for testCases, projects, apiRequests
└── utils/             # Excel export/import, backup/restore, helpers
```

## PWA Installation

The app can be installed as a standalone PWA on desktop and mobile:

- **Chrome/Edge**: Click the install icon in the address bar, or the install button in the topbar
- **Android**: Tap browser menu → "Install App" or "Add to Home Screen"
- **iOS Safari**: Tap share icon → "Add to Home Screen"

## Data Storage

All data is stored locally in your browser using IndexedDB. No backend, no cloud, no authentication required. You can export/import your data as JSON backup files from the Settings page.

---

## Developer

**Sunil Paudyal**

[![Facebook](https://img.shields.io/badge/Facebook-1877F2?style=flat&logo=facebook&logoColor=white)](https://www.facebook.com/18.sunilpaudyal)
[![Instagram](https://img.shields.io/badge/Instagram-E4405F?style=flat&logo=instagram&logoColor=white)](https://www.instagram.com/18.sunilpaudyal)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white)](https://github.com/sunilpaudyal18/)
[![TikTok](https://img.shields.io/badge/TikTok-000000?style=flat&logo=tiktok&logoColor=white)](https://www.tiktok.com/@18.sunilpaudyal)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=flat&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/18sunilpaudyal/)
[![Website](https://img.shields.io/badge/Website-6366f1?style=flat&logo=google-chrome&logoColor=white)](https://sunil.sajilodigital.com.np/)
