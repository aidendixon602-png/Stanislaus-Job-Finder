# Stanislaus Job Finder — now California Job Finder (58-County Edition)

A standalone, one-page job-search website that started in **Modesto, CA 95355 (Stanislaus County)** and now works for **anyone in California**: pick any of the **58 counties**, your city and ZIP, and every live search, county resource, and transit link rebuilds for your location.

**No account, no sign-up, no backend, no database server.** Everything is saved privately in your browser's `localStorage`, per profile, on your device.

> Its **own separate project/repo** (`Stanislaus-Job-Finder`) — not part of any Discord bot or other project.

## Quick start

- **Easiest:** double-click **`index.html`** — works offline; internet is only needed when you click out to a job site.
- **Optional server:** `npm start` (`node serve.mjs`, zero dependencies) → <http://localhost:4173>

## New in the 58-County Edition

- **🌎 All 58 California counties** — county picker (with county seat + known transit agency, e.g. LA Metro, VTA, SacRT, San Joaquin RTD, StanRTA…), city + ZIP fields that re-center *every* search (Indeed `l={zip}`, ZipRecruiter, LinkedIn, CalJOBS, etc.). Stanislaus / Modesto 95355 remains the default, and v1 data on this browser **auto-imports** into the first profile.
- **👥 Multiple profiles** — profile switcher in the header; each profile (person, client, family member) gets its own settings, tracker, saved searches, readiness checklist, and weekly plan on the same computer. Add / rename / delete profiles in ⚙ My Setup.
- **🏛️ My County Resources** — per-county cards: official county-jobs search, government jobs near you, county workforce / America's Job Center (AJCC) finder, transit trip checker (StanRTA special-cased for Stanislaus), and EdJoin school jobs. Help section re-targets to your county too.
- **⭐ Smarter searching** — favorite sites (☆ on any card + favorites-only filter), **saved searches**, a dynamic “Start here” six (remote searches surface remote boards automatically), and a job-ready checklist (resume, documents, voicemail, transport plan…) with progress.
- **🗂️ Pro tracker** — List **and Board (kanban-by-status)** views, sorting (newest / follow-up / priority / distance), weekly application **goal meter**, funnel insights (applied → interview rate, due-in-7-days), duplicate-a-job, CSV export with profile/county columns.
- **🇪🇸 + ♿ EN/ES + accessibility** — Spanish toggle for the main interface (headings, controls, stats, checklist), **A+ large-text** and **◐ high-contrast** toggles, all saved as display preferences.
- **🔐 Encrypted Admin** — see below.

## Who it's for

Any California job seeker — especially without a car. Set transport once (🚫🚗 No car = 5 mi + remote · 🚶 Walk/bike = 3 mi · 🚌 Transit = 10 mi · 🚗 Car = 25 mi) and the recommendation order stays: 🏠 remote first → 🚶 your ZIP/neighborhood → 🚌 transit-friendly → 🚗 far jobs auto-flagged “Usually needs a car” (distance-based everywhere; the classic Stanislaus far-city list — Turlock, Riverbank, Oakdale, Salida, Stockton — is kept when Stanislaus is selected). Entry-level chips cover retail/cashier, grocery, food service, warehouse, janitor, caregiver, call center, security, general labor, remote customer service/data entry, and delivery driving (with its 🚗 warning).

## 🔐 Admin (Encrypted)

Scroll to **🔐 Admin (Encrypted)** at the bottom (or the Admin button in the header).

- **Real encryption, not a fake lock:** first visit creates a vault — your password derives an **AES-256-GCM** key via **PBKDF2-SHA256 (310,000 iterations)** with a random salt (Web Crypto API). localStorage stores only `{salt, iv, ciphertext}`. The password and the key are **never stored**; the key lives only in memory while unlocked and is wiped on lock / after **10 minutes** auto-lock. A wrong password cannot decrypt (GCM authentication fails).
- **While unlocked, admin can:** set a top **announcement banner** for everyone; keep **private encrypted notes** (only ever saved as ciphertext); **add custom job sites** with `{keyword} {city} {zip} {county} {radius}` URL placeholders; **show/hide built-in sites**; pin a **per-county note** into My County Resources; **change the password** (re-encrypts); view **diagnostics** (profiles, storage use); make an **encrypted full backup** (password-protected file) and restore it; and use the danger zone (erase profile / erase everything / delete vault).
- **Forgot the password?** There is no reset by design — delete the vault in Admin and create a new one.
- **Honest limits:** encryption protects the vault/private notes *at rest on this device* and stops casual snooping. With no server, it can't stop someone with full developer access from editing the public page on that device. Locking the whole organization behind real accounts requires a backend deployment — don't oversell this to compliance.

## How searching works (no fake listings)

Nothing is scraped and **no listings are invented** — a copied list goes stale. Every Search button builds a **live URL** for *your keyword + your city/ZIP* (Indeed, LinkedIn, ZipRecruiter, Glassdoor, Monster, CareerBuilder, USAJobs, GovernmentJobs, CalJOBS, Google Jobs `"{keyword} jobs near {city}, CA {zip}"`, and 50+ more below, plus any admin-added sites).

## Job sources

Directory built from the Stanislaus County Workforce Development guide, [“Job Search Website Resources” (PDF)](https://stanworkforce.com/media/zonmxzhn/job-search-website-resources.pdf), expanded statewide:

1. **Big job boards** — Indeed, Monster, CareerBuilder, ZipRecruiter, Google Jobs, LinkedIn, Glassdoor, SimplyHired, Snagajob, Getwork, iHire, Nexxt, The Muse
2. **California, county & government** — CalJOBS, CalCareers, USAJobs, GovernmentJobs.com, county government jobs, EdJoin, CareerOneStop/AJCC finder, CA EDD
3. **Direct employers** (they post on their own sites first — it's free) — Sutter Health, Kaiser Permanente, Walmart, Target, Amazon, Save Mart, Robert Half
4. **Remote & freelance** — FlexJobs, We Work Remotely, Remote.co, Upwork, Fiverr
5. **Specialty/niche** — Dice, Idealist, HigherEdJobs, ConstructionJobs, JobsInLogistics, Call Center Jobs, Poached, SalesGravy, Mediabistro, Behance
6. **Veterans** — Hire Heroes USA, RecruitMilitary, VetJobs, GI Jobs
7. **Retirees / 50+** — AARP Jobs, RetirementJobs, Workforce50, WAHVE
8. **Added by Admin** — custom sites your local admin adds

## Tracker recap

＋ Track on any card (or the Add-a-job form): title, company, location, distance, pay, transport (🏠/🚶/🚌/🚗), posting URL, status **Saved → Applied → Interview → Offer** (+ Rejected / Archived), priority, dates, contact, notes. Hero stats count totals/applied/interviews/offers, with **overdue follow-ups in red**; filters by text/status/transport; **Export CSV**, **Backup all (JSON)** / restore, and the Mon–Sun **printable Weekly Plan**.

## Files

| File | What it is |
|---|---|
| `index.html` | The one-page site (hero/stats, setup+profiles, find, tracker, county resources, directory, weekly, help, encrypted admin) |
| `styles.css` | Plain CSS — system fonts, no external assets; responsive, large-text/high-contrast modes, print styles |
| `app.js` | Vanilla JS — 58-county engine, profiles, live URL builders, tracker, i18n, Web Crypto admin vault |
| `serve.mjs` | Optional zero-dependency Node server, port **4173**, `0.0.0.0` |
| `package.json` | `"start": "node serve.mjs"` |
| `Stanislaus-Job-Finder.zip` | Downloadable copy of these root files |

## Privacy & data keys

`localStorage`: `sjf.v2.meta` (profiles), `sjf.v2.<profileId>.{settings,apps,week}`, `sjf.v2.public` (banner/custom sites/visibility/county notes — set only through the unlocked admin UI), `sjf.v2.prefs` (language/display), `sjf.v2.adminVault` (ciphertext only). v1 keys (`sjf.settings.v1` etc.) are read once for migration and left untouched. The encrypted backup excludes nothing public, but regular backups never contain your admin password or decrypted notes. Nothing is sent anywhere.

## Tech

Plain HTML + CSS + vanilla JavaScript, Web Crypto API, `localStorage`. No build step, no frameworks, no npm dependencies (optional server = Node built-ins only). Admin encryption needs a current browser with Web Crypto (all modern browsers on HTTPS pages and local files).
