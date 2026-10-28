# Stanislaus Job Finder

A standalone, one-page job-search website for **Modesto, CA 95355 (Stanislaus County)** — built for job seekers **without a car**. Open it, click live searches, track every application in one private place.

**No account, no sign-up, no backend, no database server.** Everything you save lives only in your browser's `localStorage`, on your device.

> This is its **own separate project/repo** (`Stanislaus-Job-Finder`). It is not part of any Discord bot or other project.

## Quick start

- **Easiest:** double-click **`index.html`** — it works offline, straight from the folder. No internet is needed for the page itself (you'll need internet only when you click out to a job site).
- **Optional local server:** `npm start` (runs `node serve.mjs`, no dependencies to install) → <http://localhost:4173>

## Who it's for

A Modesto 95355 job seeker with **no car**, looking for **any entry-level work**: retail, cashier, grocery stocker, food service / fast food, warehouse associate, general labor, janitor/cleaner, caregiver, security guard, call center, and remote customer service / data entry.

Search priority is built in:

1. 🏠 **Remote / work-from-home first**
2. 🚶 **95355 / east Modesto** (walk/bike distance)
3. 🚌 **Bus-friendly Modesto & Ceres** — Stanislaus Regional Transit (**StanRTA**, [stanrta.org](https://www.stanrta.org/)) info plus a **“Check bus route”** button (Google Maps transit directions) on the page and on tracked jobs
4. 🚗 **Turlock, Riverbank, Oakdale, Salida, or Stockton** are automatically tagged **“🚗 Usually needs a car”** in the tracker so you don't waste time on them

## How searching works (no fake listings)

Nothing is scraped and **no job listings are invented or copied** — a copied list goes stale. Instead, every site button builds a **live search URL** pre-filled with *your keyword + Modesto, CA 95355* (e.g. Indeed: `https://www.indeed.com/jobs?q={keyword}&l=95355&radius={radius}&sort=date`, plus LinkedIn, ZipRecruiter, Glassdoor, Monster, CareerBuilder, USAJobs, GovernmentJobs, and a Google Jobs search for `"{keyword} jobs near Modesto, CA 95355"`).

The radius follows your transport choice:

| Transport choice | Search radius |
|---|---|
| 🚫🚗 No car (default) | 5 miles **+ remote** |
| 🚶 Walk / bike only | 3 miles |
| 🚌 Bus (StanRTA) | 10 miles |
| 🚗 Have a car | 25 miles |

Type a job (or tap a chip — Any entry-level, Remote Customer Service, Remote Data Entry, Retail/Cashier, Grocery Stocker, Food Service, Warehouse, Janitor, Caregiver, Call Center, Security Guard, General Labor, Delivery Driver 🚗) and **every button on the page updates instantly**. A filter box narrows the site directory.

## Job sources

Sites come from the Stanislaus County Workforce Development guide, [“Job Search Website Resources” (PDF)](https://stanworkforce.com/media/zonmxzhn/job-search-website-resources.pdf), organized in the on-page directory:

1. **Big job boards** — Indeed, Monster, CareerBuilder, ZipRecruiter, Google Jobs, LinkedIn, Glassdoor, SimplyHired, Snagajob (hourly work), Getwork, iHire, Nexxt, The Muse
2. **Local & government** — [CalJOBS](https://www.caljobs.ca.gov/), CalCareers, USAJobs, GovernmentJobs.com, Stanislaus County jobs, City of Modesto jobs, [Stanislaus Workforce](https://www.stanworkforce.com/), EdJoin (school jobs)
3. **Direct employers** (employers post on their *own* sites first because it's free — Workforce guide) — Sutter Health, Kaiser Permanente, Walmart, Target, Amazon, Save Mart, Robert Half
4. **Remote & freelance** — FlexJobs, We Work Remotely, Remote.co, Upwork, Fiverr
5. **Specialty/niche** (from the PDF) — Dice (tech), Idealist (nonprofits), HigherEdJobs, ConstructionJobs, JobsInLogistics, and more
6. **Veterans** (from the PDF) — Hire Heroes USA, RecruitMilitary, VetJobs, GI Jobs
7. **Retirees / 50+** (from the PDF) — AARP Jobs, RetirementJobs, Workforce50, WAHVE

## Features

- **Setup that drives everything** — transport dropdown (default *No car*), work type (full-time / part-time / remote / any), a job field + clickable chips
- **＋ Track on every site card** + a manual **Add a job** form: title, company, location, distance (miles), pay, how you'd get there (🏠/🚶/🚌/🚗), posting URL, status, priority (Low/Normal/High), date applied, follow-up date, contact, notes
- **Application tracker** — statuses **Saved → Applied → Interview → Offer**, plus Rejected and Archived; change status from a dropdown on each card, edit, delete, and search/filter by text, status, and transport
- **Stats bar** — total tracked, applied, interviews, offers, and **follow-ups overdue** (highlighted red in the hero and on the card)
- **Export CSV**, **Backup/Restore (JSON)** for everything, and a **printable Weekly Plan** (Mon–Sun checklist whose checkboxes save automatically; Print styles show just the plan on paper)
- **Free local help + safety** — Stanislaus Workforce Development and CalJOBS, plus a scam warning: real employers never ask you to pay, buy gift cards, or cash checks to get hired

## Files

| File | What it is |
|---|---|
| `index.html` | The whole one-page site (hero + stats, no-car advice, Find Jobs, Tracker, Directory, Weekly Plan, help) |
| `styles.css` | Plain CSS — system fonts only, no external fonts/images/CDNs; mobile-friendly + print styles |
| `app.js` | Vanilla JavaScript — live search-URL builders, localStorage tracker, stats, CSV/JSON, weekly plan |
| `serve.mjs` | Optional tiny Node static server (no dependencies), port **4173**, bound to `0.0.0.0` |
| `package.json` | `"start": "node serve.mjs"` |
| `Stanislaus-Job-Finder.zip` | Downloadable copy of these root files, ready to upload to your own GitHub repo |

## Privacy & data

- Data keys: `sjf.settings.v1`, `sjf.apps.v1`, `sjf.utils.v1` in this browser's `localStorage` for this file/site origin.
- Nothing is sent anywhere. Clearing browser data (or using a different browser/computer) will not show your tracker — **use Backup (JSON) regularly** and keep the file somewhere safe.

## Tech

Plain HTML + CSS + vanilla JavaScript only. No build step, no frameworks, no npm dependencies (the optional server uses only Node's built-in modules). Works by double-clicking `index.html`.
