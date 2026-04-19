# Echo

Privacy visualisation browser extension.

## Repository contents
Source-code and commit-history evidence.

**Extension** — React 18, TypeScript, Tailwind, Vite, Chrome Manifest V3

- `src/background/` MV3 service worker: `declarativeNetRequest` rule registration, tracker deduplication, per-site allowlist, 60-minute blocklist refresh via Chrome alarms (Section 3.3.1)
- `src/shared/` cross-context types and services, including the local ProfileEngine in `services/profileUtils.ts` (Sections 3.3.2, 3.3.3)
- `src/content/` content scripts: `cookiebanner.ts` for detection and consent handling, plus `adblocker-main.ts` and `adblocker-isolated.ts` running in separate execution contexts to bypass anti-adblock detection (Section 3.3.4)
- `src/popup/`, `src/components/`, `src/App.tsx` popup and dashboard UI (Section 3.3.5)
- `popup.html`, `dashboard.html`, `onboarding.html` Vite entry points
- `vite.config.ts` build configuration; `minify` and `treeshake` disabled to preserve content-script scope isolation

**Backend** (`echo-backend/`) — Node.js, Express, Mongoose, MongoDB Atlas. Distributes the curated DuckDuckGo Tracker Data Set blocklist. No user data crosses this boundary.

**Build tooling**
- `scripts/generate-adblock-rules.js` and `scripts/generate-cosmetic-rules.js` compile EasyList, EasyPrivacy, and annoyance filters into `declarativeNetRequest` JSON and cosmetic-hiding CSS
- `public/rules/` compiled blocklist outputs bundled with the extension (`easylist_rules.json`, `easyprivacy_rules.json`, `adblock_rules.json`, `annoyances_rules.json`, `exception_rules.json`, `cosmetic-generic.css`, `cosmetic-domains.json`)


