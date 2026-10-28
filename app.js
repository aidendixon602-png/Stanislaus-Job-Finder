/* Stanislaus Job Finder — vanilla JS, no frameworks, no build step.
   Everything is saved privately in this browser via localStorage.
   No jobs are scraped and no listings are invented: every Search button
   builds a LIVE search URL (keyword + Modesto, CA 95355) for that site. */
'use strict';

/* ---------------- Helpers ---------------- */
const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
const E = (s) => encodeURIComponent(s == null ? '' : String(s));
const slug = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'jobs';
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function todayISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + m + '-' + day;
}
function safeUrl(u) {
  try {
    const url = new URL(String(u || '').trim());
    return (url.protocol === 'http:' || url.protocol === 'https:') ? url.href : '';
  } catch (e) { return ''; }
}
function titleCase(s) {
  return String(s || '').replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));
}
function busRouteUrl(destination) {
  return 'https://www.google.com/maps/dir/?api=1&origin=' + E('Modesto, CA 95355') +
    '&destination=' + E(destination || 'Modesto, CA') + '&travelmode=transit';
}
function store(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage full/blocked */ }
}

/* ---------------- Transport / radius ---------------- */
const TRANSPORTS = {
  nocar:    { label: 'No car — remote + nearby', radius: 5,  hint: 'Search radius: <strong>5 miles</strong> + remote jobs.', recTitle: '⭐ Recommended for you: no car' },
  walkbike: { label: 'Walk / bike only',         radius: 3,  hint: 'Search radius: <strong>3 miles</strong> — walk/bike distance from 95355.', recTitle: '⭐ Recommended for you: walk / bike only' },
  bus:      { label: 'Bus — StanRTA',            radius: 10, hint: 'Search radius: <strong>10 miles</strong> — Modesto &amp; Ceres bus range. Always check the StanRTA trip before applying.', recTitle: '⭐ Recommended for you: bus (StanRTA)' },
  car:      { label: 'Have a car',               radius: 25, hint: 'Search radius: <strong>25 miles</strong> — includes Turlock, Riverbank, Oakdale, Salida &amp; more.', recTitle: '⭐ Recommended for you: have a car' }
};
const WORK_TYPES = { any: 'Any', fulltime: 'Full-time', parttime: 'Part-time', remote: 'Remote' };
const CAR_CITIES = ['turlock', 'riverbank', 'oakdale', 'Salida', 'Stockton', 'Patterson', 'manteca', 'Tracy'];
function needsCarCity(location) {
  const loc = String(location || '').toLowerCase();
  return CAR_CITIES.some((c) => loc.includes(c));
}

/* ---------------- Site directory (from the Stanislaus Workforce PDF guide) ----------------
   Each url(ctx) builds a LIVE search. ctx = { kw, radius, wt } */
const CATEGORIES = [
  { id: 'big',       title: '1. Big Job Boards',              note: 'Start here for the widest reach. Use “sort by date” where offered so you see the newest postings first.' },
  { id: 'local',     title: '2. Local & Government',          note: 'CalJOBS, city/county/state/federal jobs and Stanislaus Workforce — many local employers list here, and the help is free.' },
  { id: 'employers', title: '3. Direct Employers',            note: 'Employers post on their OWN websites first because it’s free for them (Workforce guide) — check these before the big boards for Modesto openings.' },
  { id: 'remote',    title: '4. Remote & Freelance',          note: 'Best section if you have no car. 🏠 Work from home — customer service, data entry, support and freelance gigs.' },
  { id: 'specialty', title: '5. Specialty / Niche Boards',    note: 'From the guide’s niche list: less competition, more relevant postings. Great for a specific kind of work.' },
  { id: 'veterans',  title: '6. Veterans',                    note: 'Job boards and help built for veterans and transitioning service members, from the guide.' },
  { id: 'retiree',   title: '7. Retirees / 50+',              note: 'Boards for experienced and 50+ workers, including work-at-home options, from the guide.' }
];
const CAT_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.title.replace(/^\d+\.\s*/, '')]));

const SITES = [
  /* ---- 1. Big job boards ---- */
  { id: 'indeed', cat: 'big', name: 'Indeed', desc: 'The biggest board. Sorted by date so new Modesto-area postings come first.',
    url: (c) => 'https://www.indeed.com/jobs?q=' + E(c.kw) + '&l=95355&radius=' + c.radius + '&sort=date' + (c.wt === 'fulltime' ? '&jt=fulltime' : c.wt === 'parttime' ? '&jt=parttime' : '') },
  { id: 'google', cat: 'big', name: 'Google Jobs', desc: 'Google’s job results for “keyword jobs near Modesto, CA 95355” — pulls from many sites at once.',
    url: (c) => 'https://www.google.com/search?q=' + E(c.kw + ' jobs near Modesto, CA 95355') + '&ibp=htl;jobs' },
  { id: 'ziprecruiter', cat: 'big', name: 'ZipRecruiter', desc: 'Strong for hourly and entry-level work around Modesto and Ceres.',
    url: (c) => 'https://www.ziprecruiter.com/jobs-search?search=' + E(c.kw) + '&location=' + E('Modesto, CA') + '&radius=' + c.radius },
  { id: 'linkedin', cat: 'big', name: 'LinkedIn Jobs', desc: 'Professional board — also good for remote customer service and support roles.',
    url: (c) => 'https://www.linkedin.com/jobs/search/?keywords=' + E(c.kw) + '&location=' + E('Modesto, California, United States') + '&distance=' + c.radius + '&sortBy=DD' + (c.wt === 'fulltime' ? '&f_JT=F' : c.wt === 'parttime' ? '&f_JT=P' : c.wt === 'remote' ? '&f_WT=2' : '') },
  { id: 'glassdoor', cat: 'big', name: 'Glassdoor', desc: 'Jobs plus pay and company reviews — check ratings before you apply.',
    url: (c) => 'https://www.glassdoor.com/Job/jobs.htm?sc.keyword=' + E(c.kw) + '&locKeyword=' + E('Modesto, CA') },
  { id: 'monster', cat: 'big', name: 'Monster', desc: 'Long-running big board with lots of entry-level listings.',
    url: (c) => 'https://www.monster.com/jobs/search?q=' + E(c.kw) + '&where=' + E('Modesto, CA 95355') + '&page=1&so=m.h.s' },
  { id: 'careerbuilder', cat: 'big', name: 'CareerBuilder', desc: 'Big national board; set email alerts for 95355.',
    url: (c) => 'https://www.careerbuilder.com/jobs?keywords=' + E(c.kw) + '&location=' + E('Modesto, CA 95355') + '&radius=' + c.radius },
  { id: 'simplyhired', cat: 'big', name: 'SimplyHired', desc: 'Aggregates listings from many sites into one search.',
    url: (c) => 'https://www.simplyhired.com/search?q=' + E(c.kw) + '&l=' + E('Modesto, CA 95355') },
  { id: 'snagajob', cat: 'big', name: 'Snagajob', desc: 'Hourly-work specialist — retail, food service, grocery. Great fit for entry-level near 95355.',
    url: (c) => 'https://www.snagajob.com/jobs/q-' + slug(c.kw) + '/w-95355' },
  { id: 'getwork', cat: 'big', name: 'Getwork', desc: 'Verified daily listings (formerly LinkUp) pulled from employer sites.',
    url: (c) => 'https://getwork.com/search?q=' + E(c.kw) + '&l=' + E('Modesto, CA') },
  { id: 'ihire', cat: 'big', name: 'iHire', desc: 'Industry-focused boards under one search.',
    url: (c) => 'https://www.ihire.com/search?k=' + E(c.kw) + '&l=' + E('Modesto, CA 95355') },
  { id: 'nexxt', cat: 'big', name: 'Nexxt', desc: 'National board with local Modesto-area listings.',
    url: (c) => 'https://www.nexxt.com/jobs/search?q=' + E(c.kw) + '&l=' + E('Modesto, CA') },
  { id: 'themuse', cat: 'big', name: 'The Muse', desc: 'Jobs with company profiles — useful for remote-friendly employers.',
    url: (c) => 'https://www.themuse.com/search?keyword=' + E(c.kw) + '&location=' + E('Modesto, CA') },

  /* ---- 2. Local & government ---- */
  { id: 'caljobs', cat: 'local', name: 'CalJOBS', desc: 'California’s FREE state job board (EDD). A top local resource — Stanislaus Workforce can help you register.',
    url: (c) => 'https://www.caljobs.ca.gov/vosnet/jobbanks/joblist.aspx?keyword=' + E(c.kw) + '&zip=95355&radius=' + c.radius },
  { id: 'calcareers', cat: 'local', name: 'CalCareers (State of CA)', desc: 'State of California jobs — filter to Stanislaus County / Modesto after searching.',
    url: (c) => 'https://calcareers.ca.gov/CalHRPublic/Search/JobSearchResults.aspx#kw=' + E(c.kw) },
  { id: 'usajobs', cat: 'local', name: 'USAJobs (Federal)', desc: 'Federal government jobs — includes VA, USDA and other agencies with Central Valley openings.',
    url: (c) => 'https://www.usajobs.gov/Search/Results?k=' + E(c.kw) + '&l=' + E('Modesto, California') + '&r=' + c.radius + '&p=1&s=startdate' },
  { id: 'governmentjobs', cat: 'local', name: 'GovernmentJobs.com', desc: 'City, county and public-agency jobs across the region in one search.',
    url: (c) => 'https://www.governmentjobs.com/jobs?keywords=' + E(c.kw) + '&location=' + E('Modesto, CA') },
  { id: 'stancounty', cat: 'local', name: 'Stanislaus County Jobs', desc: 'Official Stanislaus County openings (via GovernmentJobs). Local, stable, often entry-level friendly.',
    url: (c) => 'https://www.governmentjobs.com/careers/stanislauscounty?keywords=' + E(c.kw) },
  { id: 'modesto', cat: 'local', name: 'City of Modesto Jobs', desc: 'Official City of Modesto openings (via GovernmentJobs) — closest government jobs to 95355.',
    url: (c) => 'https://www.governmentjobs.com/careers/modesto?keywords=' + E(c.kw) },
  { id: 'stanworkforce', cat: 'local', name: 'Stanislaus Workforce Development', desc: 'Free local help: workshops, resume help, America’s Job Center. Not just a board — people who help you get hired.',
    url: (c) => 'https://www.stanworkforce.com/?s=' + E(c.kw) },
  { id: 'edjoin', cat: 'local', name: 'EdJoin (School Jobs)', desc: 'School district jobs — aides, custodial, food service, office. Big Stanislaus County employer group.',
    url: (c) => 'https://www.edjoin.org/Home/SearchKeywords?searchKeyword=' + E(c.kw) },

  /* ---- 3. Direct employers ---- */
  { id: 'sutter', cat: 'employers', name: 'Sutter Health', desc: 'Hospitals/clinics in Modesto — entry roles include support, food service, environmental services.',
    url: (c) => 'https://www.sutterhealth.org/careers/search-jobs?keywords=' + E(c.kw) },
  { id: 'Kaiser', cat: 'employers', name: 'Kaiser Permanente', desc: 'Modesto medical center jobs — search, then filter Location to Modesto.',
    url: (c) => 'https://www.kaiserpermanentejobs.org/search-jobs?k=' + E(c.kw) },
  { id: 'walmart', cat: 'employers', name: 'Walmart Careers', desc: 'Modesto stores hire cashiers, stockers and associates — posted here first.',
    url: (c) => 'https://careers.walmart.com/results?q=' + E(c.kw) + '&jobCity=Modesto&jobState=CA&page=1&sort=rank' },
  { id: 'target', cat: 'employers', name: 'Target Jobs', desc: 'Modesto Target stores — retail, guest advocate, fulfillment roles.',
    url: (c) => 'https://jobs.target.com/search-jobs?k=' + E(c.kw) },
  { id: 'amazon', cat: 'employers', name: 'Amazon Jobs', desc: 'Warehouse and support roles — search pre-set to Modesto, CA. Check the exact facility location before applying.',
    url: (c) => 'https://www.amazon.jobs/en/search?base_query=' + E(c.kw) + '&loc_query=' + E('Modesto, CA, United States') },
  { id: 'savemart', cat: 'employers', name: 'Save Mart Careers', desc: 'Save Mart / Lucky / FoodMaxx grocery jobs — a major Stanislaus County grocery employer. Search “Modesto” on their careers page.',
    url: () => 'https://www.savemart.com/careers' },
  { id: 'roberthalf', cat: 'employers', name: 'Robert Half', desc: 'Staffing agency — office, admin, data entry and customer service placements, including remote.',
    url: (c) => 'https://www.roberthalf.com/us/en/search?keywords=' + E(c.kw) + '&location=' + E('Modesto, CA') },

  /* ---- 4. Remote & freelance ---- */
  { id: 'flexjobs', cat: 'remote', name: 'FlexJobs', desc: 'Vetted remote/flexible jobs (some features paid — the free search still shows real openings).',
    url: (c) => 'https://www.flexjobs.com/search/?search=' + E(c.kw) + '&location=Remote' },
  { id: 'weworkremotely', cat: 'remote', name: 'We Work Remotely', desc: 'Remote-only board — customer support, admin and more.',
    url: (c) => 'https://weworkremotely.com/remote-jobs/search?term=' + E(c.kw) },
  { id: 'remoteco', cat: 'remote', name: 'Remote.co', desc: 'Remote job listings and work-from-home advice.',
    url: (c) => 'https://remote.co/remote-jobs/search/?search_keywords=' + E(c.kw) },
  { id: 'upwork', cat: 'remote', name: 'Upwork', desc: 'Freelance gigs — data entry, virtual assistant, customer support. Build a free profile.',
    url: (c) => 'https://www.upwork.com/nx/search/jobs/?q=' + E(c.kw) },
  { id: 'fiverr', cat: 'remote', name: 'Fiverr', desc: 'Sell small services as a freelancer — data entry, writing, design and more.',
    url: (c) => 'https://www.fiverr.com/search/gigs?query=' + E(c.kw) },

  /* ---- 5. Specialty / niche ---- */
  { id: 'dice', cat: 'specialty', name: 'Dice (Tech)', desc: 'Tech and IT jobs — help desk and IT support included.',
    url: (c) => 'https://www.dice.com/jobs?q=' + E(c.kw) + '&location=' + E('Modesto, CA 95355') + '&radius=' + c.radius + '&radiusUnit=mi&page=1&pageSize=20' },
  { id: 'idealist', cat: 'specialty', name: 'Idealist (Nonprofits)', desc: 'Nonprofit and community-service jobs and volunteering.',
    url: (c) => 'https://www.idealist.org/en/jobs?q=' + E(c.kw) },
  { id: 'higheredjobs', cat: 'specialty', name: 'HigherEdJobs (Colleges)', desc: 'College/university jobs — including Modesto Junior College area postings.',
    url: (c) => 'https://www.higheredjobs.com/search/advanced_action.cfm?Keyword=' + E(c.kw) },
  { id: 'constructionjobs', cat: 'specialty', name: 'ConstructionJobs', desc: 'Construction and general-labor trades.',
    url: (c) => 'https://www.constructionjobs.com/search/results?q=' + E(c.kw) + '&l=' + E('Modesto, CA') },
  { id: 'jobsinlogistics', cat: 'specialty', name: 'JobsInLogistics', desc: 'Warehouse, logistics and supply-chain jobs — big in the Central Valley.',
    url: (c) => 'https://www.jobsinlogistics.com/search/results?Keywords=' + E(c.kw) + '&LocationCity=Modesto&LocationState=CA' },
  { id: 'callcenterjobs', cat: 'specialty', name: 'Call Center Jobs', desc: 'Call-center and customer-service roles, including remote.',
    url: (c) => 'https://www.callcenterjobs.com/jobs?q=' + E(c.kw) + '&location=' + E('Modesto, CA') },
  { id: 'poached', cat: 'specialty', name: 'Poached (Restaurants)', desc: 'Restaurant and food-service jobs.',
    url: (c) => 'https://poachedjobs.com/search?q=' + E(c.kw) + '&location=' + E('Modesto, CA') },
  { id: 'salesgravy', cat: 'specialty', name: 'SalesGravy (Sales)', desc: 'Sales jobs board from the guide.',
    url: (c) => 'https://www.salesgravy.com/jobs/search?q=' + E(c.kw) },
  { id: 'mediabistro', cat: 'specialty', name: 'Mediabistro (Media)', desc: 'Media, writing and communications jobs.',
    url: (c) => 'https://www.mediabistro.com/jobs/search?q=' + E(c.kw) },
  { id: 'behance', cat: 'specialty', name: 'Behance Jobs (Creative)', desc: 'Design and creative jobs/freelance.',
    url: (c) => 'https://www.behance.net/joblist?search=' + E(c.kw) },

  /* ---- 6. Veterans ---- */
  { id: 'hireheroes', cat: 'veterans', name: 'Hire Heroes USA', desc: 'Free career help and job board for veterans and spouses.',
    url: (c) => 'https://www.hireheroesusa.org/job-board/?_job_title=' + E(c.kw) },
  { id: 'recruitmilitary', cat: 'veterans', name: 'RecruitMilitary', desc: 'Veteran job board and hiring events.',
    url: (c) => 'https://recruitmilitary.com/job-seekers/job-search?query=' + E(c.kw) + '&location=' + E('Modesto, CA') },
  { id: 'vetjobs', cat: 'veterans', name: 'VetJobs', desc: 'Jobs for veterans, military and family members.',
    url: (c) => 'https://www.vetjobs.org/jobs?keywords=' + E(c.kw) + '&location=' + E('Modesto, CA') },
  { id: 'gijobs', cat: 'veterans', name: 'GI Jobs', desc: 'Veteran-friendly employers and job search.',
    url: (c) => 'https://www.gijobs.com/jobs/?keywords=' + E(c.kw) },

  /* ---- 7. Retirees / 50+ ---- */
  { id: 'aarp', cat: 'retiree', name: 'AARP Jobs', desc: 'Jobs for experienced workers from AARP’s job board.',
    url: (c) => 'https://jobs.aarp.org/jobs/?keywords=' + E(c.kw) + '&location=' + E('Modesto, CA') },
  { id: 'retirementjobs', cat: 'retiree', name: 'RetirementJobs', desc: 'Full-time, part-time and flexible jobs for 50+ workers.',
    url: (c) => 'https://www.retirementjobs.com/job-search?keywords=' + E(c.kw) + '&location=' + E('Modesto, CA') },
  { id: 'workforce50', cat: 'retiree', name: 'Workforce50', desc: 'Job search built for workers 50 and older.',
    url: (c) => 'https://www.workforce50.com/job_search?keywords=' + E(c.kw) },
  { id: 'wahve', cat: 'retiree', name: 'WAHVE (Work At Home Vintage Experts)', desc: 'Remote work matched to experienced (“vintage”) workers.',
    url: () => 'https://wahve.com/job-seekers/' }
];
const FEATURED_IDS = ['indeed', 'google', 'ziprecruiter', 'snagajob', 'caljobs', 'linkedin'];
const STATUSES = ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected', 'Archived'];
const TRANSPORT_TAGS = {
  remote: { tag: '🏠 Remote', cls: 'tag-remote' },
  walk:   { tag: '🚶 Walk/bike', cls: 'tag-walk' },
  bus:    { tag: '🚌 Bus-friendly', cls: 'tag-bus' },
  car:    { tag: '🚗 Needs a car', cls: 'tag-car' }
};

/* ---------------- Weekly plan ---------------- */
const WEEK = [
  { day: 'Monday', tasks: ['Search 🏠 Remote Customer Service + Remote Data Entry (Indeed, FlexJobs, We Work Remotely)', 'Search entry-level jobs in 95355 on Google Jobs + ZipRecruiter', 'Save at least 5 good jobs to My Tracker with ＋ Track'] },
  { day: 'Tuesday', tasks: ['Apply to 3 Saved jobs — remote first, then closest to 95355', 'For any in-person job, tap “Check bus route” and confirm StanRTA times both ways', 'Write the date applied + a follow-up date (about 1 week out) on each card'] },
  { day: 'Wednesday', tasks: ['Search CalJOBS + City of Modesto + Stanislaus County jobs', 'Search direct employers: Walmart, Target, Save Mart, Sutter Health', 'Apply to 2–3 jobs and update statuses in the tracker'] },
  { day: 'Thursday', tasks: ['Search Snagajob + SimplyHired for hourly work near 95355 (retail, grocery, food service)', 'Call or visit one employer in person if it’s walk/bike distance (bring ID + availability)', 'Follow up on applications from last week (phone or email) and log the contact'] },
  { day: 'Friday', tasks: ['Follow up on anything marked ⚠ overdue in the stats bar', 'Apply to 2 more jobs; move interviews/offers forward in the tracker', 'Export a CSV or Backup (JSON) of your tracker so you never lose it'] },
  { day: 'Saturday', tasks: ['Practice answers out loud: “Tell me about yourself”, strengths, availability, transportation plan', 'Lay out interview clothes + documents (ID, work authorization, resume copies)', 'Check bus route + travel time for any interview next week'] },
  { day: 'Sunday', tasks: ['Review the tracker: archive dead ends, star (High priority) next week’s top 3', 'Print next week’s plan and set Mon–Fri daily goals', 'Rest and recharge — job searching is work too 💪'] }
];

/* ---------------- State ---------------- */
const LS_SETTINGS = 'sjf.settings.v1';
const LS_APPS = 'sjf.apps.v1';
const LS_WEEK = 'sjf.utils.v1';
let settings = Object.assign({ transport: 'nocar', workType: 'any', keyword: 'entry level', siteFilter: '' }, store(LS_SETTINGS, {}));
if (!TRANSPORTS[settings.transport]) settings.transport = 'nocar';
if (!WORK_TYPES[settings.workType]) settings.workType = 'any';
let apps = store(LS_APPS, []);
if (!Array.isArray(apps)) apps = [];
let weekState = store(LS_WEEK, {});
if (!weekState || typeof weekState !== 'object') weekState = {};

function ctx() {
  return {
    kw: (settings.keyword || '').trim() || 'entry level',
    radius: TRANSPORTS[settings.transport].radius,
    wt: settings.workType
  };
}
function persistSettings() { save(LS_SETTINGS, settings); }
function persistApps() { save(LS_APPS, apps); }
function persistWeek() { save(LS_WEEK, weekState); }

/* ---------------- Site rendering ---------------- */
function siteCard(site, c) {
  const href = safeUrl(site.url(c)) || '#';
  return '<article class="site-card" data-site="' + esc(site.id) + '">' +
    '<span class="site-cat">' + esc(CAT_LABEL[site.cat] || site.cat) + '</span>' +
    '<h4>' + esc(site.name) + '</h4><p>' + esc(site.desc) + '</p>' +
    '<div class="site-actions">' +
      '<a class="btn btn-primary btn-sm" href="' + esc(href) + '" target="_blank" rel="noopener">🔎 Search “' + esc(c.kw) + '” ↗</a>' +
      '<button type="button" class="btn btn-track btn-sm" data-track="' + esc(site.id) + '">＋ Track</button>' +
    '</div></article>';
}
function siteMatches(site, filter) {
  if (!filter) return true;
  const hay = (site.name + ' ' + site.desc + ' ' + (CAT_LABEL[site.cat] || '')).toLowerCase();
  return filter.toLowerCase().split(/\s+/).filter(Boolean).every((w) => hay.includes(w));
}
function renderSites() {
  const c = ctx();
  const filter = settings.siteFilter || '';
  const visible = SITES.filter((s) => siteMatches(s, filter));

  $('#featuredGrid').innerHTML = FEATURED_IDS
    .map((id) => SITES.find((s) => s.id === id))
    .filter((s) => s && siteMatches(s, filter))
    .map((s) => siteCard(s, c)).join('') ||
    '<p class="muted">No featured sites match that filter — clear it to see the starter six.</p>';

  $('#directoryGroups').innerHTML = CATEGORIES.map((cat) => {
    const inCat = visible.filter((s) => s.cat === cat.id);
    if (!inCat.length) return '';
    return '<div class="dir-group"><h3>' + esc(cat.title) + '</h3><p class="dir-note">' + esc(cat.note) + '</p>' +
      '<div class="site-grid">' + inCat.map((s) => siteCard(s, c)).join('') + '</div></div>';
  }).join('');
  $('#directoryEmpty').hidden = visible.length > 0;
  $('#siteCount').textContent = 'Showing ' + visible.length + ' of ' + SITES.length + ' sites for “' + c.kw + '” near Modesto, CA 95355 (' + c.radius + '-mile radius' + (settings.transport === 'nocar' ? ' + remote' : '') + ').';

  const wtLabel = WORK_TYPES[settings.workType] || 'Any';
  $('#searchSummary').innerHTML = 'Now searching for <strong>“' + esc(c.kw) + '”</strong> near <strong>Modesto, CA 95355</strong> • Radius: <strong>' + c.radius + ' miles</strong>' +
    (settings.transport === 'nocar' ? ' + <strong>🏠 remote first</strong>' : '') + ' • Work type: <strong>' + esc(wtLabel) + '</strong> • Transport: <strong>' + esc(TRANSPORTS[settings.transport].label) + '</strong>';
  $('#radiusHint').innerHTML = TRANSPORTS[settings.transport].hint;
  $('#recTitle').textContent = TRANSPORTS[settings.transport].recTitle;
}

/* ---------------- Tracker ---------------- */
function isOverdue(app) {
  if (!app.followUp) return false;
  if (['Offer', 'Rejected', 'Archived'].includes(app.status)) return false;
  return app.followUp < todayISO();
}
function renderStats() {
  $('#statTotal').textContent = apps.length;
  $('#statApplied').textContent = apps.filter((a) => a.status === 'Applied').length;
  $('#statInterviews').textContent = apps.filter((a) => a.status === 'Interview').length;
  $('#statOffers').textContent = apps.filter((a) => a.status === 'Offer').length;
  const overdue = apps.filter(isOverdue).length;
  $('#statOverdue').textContent = overdue;
  $('#statOverdueBox').classList.toggle('has-overdue', overdue > 0);
}
function transportTag(app) {
  const t = TRANSPORT_TAGS[app.transport] || TRANSPORT_TAGS.bus;
  return '<span class="tag ' + t.cls + '">' + t.tag + '</span>';
}
function renderApps() {
  renderStats();
  const q = ($('#trackSearch').value || '').toLowerCase();
  const sf = $('#statusFilter').value;
  const tf = $('#transportFilter').value;
  const list = apps.filter((a) => {
    if (sf && a.status !== sf) return false;
    if (tf && a.transport !== tf) return false;
    if (q) {
      const hay = [a.title, a.company, a.location, a.pay, a.contact, a.notes, a.status].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }).slice().sort((a, b) => {
    const od = (isOverdue(b) ? 1 : 0) - (isOverdue(a) ? 1 : 0);
    if (od) return od;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  $('#trackerCount').textContent = apps.length
    ? 'Showing ' + list.length + ' of ' + apps.length + ' tracked job' + (apps.length === 1 ? '' : 's') + (apps.filter(isOverdue).length ? ' • ⚠ ' + apps.filter(isOverdue).length + ' follow-up(s) overdue' : '') + '.'
    : '';
  $('#emptyState').style.display = apps.length ? 'none' : 'block';

  $('#appsList').innerHTML = list.map((a) => {
    const overdue = isOverdue(a);
    const carCity = needsCarCity(a.location);
    const url = safeUrl(a.url);
    const dest = [a.company, a.location].filter(Boolean).join(' ');
    const statusOptions = STATUSES.map((s) => '<option ' + (s === a.status ? 'selected' : '') + '>' + s + '</option>').join('');
    return '<article class="app-card status-' + esc(a.status) + (overdue ? ' is-overdue' : '') + '" data-id="' + esc(a.id) + '">' +
      '<div class="app-head"><div><h4>' + esc(a.title || 'Untitled job') + (a.company ? ' <span class="muted">@ ' + esc(a.company) + '</span>' : '') + '</h4>' +
      '<p class="app-meta">' + esc(a.location || 'Location not set') + (a.distance !== '' && a.distance != null ? ' • ' + esc(a.distance) + ' mi' : '') + (a.pay ? ' • ' + esc(a.pay) : '') + '</p></div>' +
      '<span class="tag tag-priority-' + esc(a.priority || 'Normal') + '">' + esc(a.priority || 'Normal') + ' priority</span></div>' +
      '<div class="app-tags">' + transportTag(a) +
        (carCity ? '<span class="tag tag-car">🚗 Usually needs a car</span>' : '') +
        (overdue ? '<span class="tag tag-overdue">⚠ Follow-up overdue' + (a.followUp ? ' (' + esc(a.followUp) + ')' : '') + '</span>' : '') +
      '</div>' +
      '<dl class="app-details">' +
        (a.dateApplied ? '<div><dt>Date applied</dt><dd>' + esc(a.dateApplied) + '</dd></div>' : '') +
        (a.followUp ? '<div><dt>Follow up by</dt><dd>' + esc(a.followUp) + '</dd></div>' : '') +
        (a.contact ? '<div><dt>Contact</dt><dd>' + esc(a.contact) + '</dd></div>' : '') +
      '</dl>' +
      (a.notes ? '<p class="app-notes">' + esc(a.notes) + '</p>' : '') +
      '<div class="app-actions">' +
        '<label class="small" style="font-weight:700">Status: <select data-status="' + esc(a.id) + '" aria-label="Change status for ' + esc(a.title || 'job') + '">' + statusOptions + '</select></label>' +
        (url ? '<a class="btn btn-secondary btn-sm" href="' + esc(url) + '" target="_blank" rel="noopener">↗ View posting</a>' : '') +
        (a.transport === 'bus' || a.transport === 'walk' ? '<a class="btn btn-bus btn-sm" href="' + esc(busRouteUrl(dest || 'Modesto, CA')) + '" target="_blank" rel="noopener">🗺️ Check bus route</a>' : '') +
        '<button type="button" class="btn btn-ghost btn-sm" data-edit="' + esc(a.id) + '">✏ Edit</button>' +
        '<button type="button" class="btn btn-danger btn-sm" data-del="' + esc(a.id) + '">🗑 Delete</button>' +
      '</div></article>';
  }).join('');
}

/* ---------------- Form ---------------- */
function resetForm() {
  $('#jobForm').reset();
  $('#editId').value = '';
  $('#fTransport').value = 'bus';
  $('#fStatus').value = 'Saved';
  $('#fPriority').value = 'Normal';
  $('#formTitle').textContent = '＋ Add a job';
  $('#submitBtn').textContent = '＋ Add job';
  $('#cancelEditBtn').hidden = true;
  $('#jobForm').classList.remove('editing');
  $('#formCarWarning').hidden = true;
}
function fillForm(a) {
  $('#editId').value = a.id;
  $('#fTitle').value = a.title || ''; $('#fCompany').value = a.company || '';
  $('#fLocation').value = a.location || ''; $('#fDistance').value = a.distance == null ? '' : a.distance;
  $('#fPay').value = a.pay || ''; $('#fTransport').value = a.transport || 'bus';
  $('#fUrl').value = a.url || ''; $('#fStatus').value = a.status || 'Saved';
  $('#fPriority').value = a.priority || 'Normal'; $('#fApplied').value = a.dateApplied || '';
  $('#fFollow').value = a.followUp || ''; $('#fContact').value = a.contact || '';
  $('#fNotes').value = a.notes || '';
  $('#formTitle').textContent = '✏ Edit job';
  $('#submitBtn').textContent = '💾 Save changes';
  $('#cancelEditBtn').hidden = false;
  $('#jobForm').classList.add('editing');
  updateFormWarning();
}
function updateFormWarning() {
  const dist = parseFloat($('#fDistance').value);
  const far = !isNaN(dist) && dist > 10 && $('#fTransport').value !== 'car';
  $('#formCarWarning').hidden = !(needsCarCity($('#fLocation').value) || far);
}
function prefillFromSite(site) {
  const c = ctx();
  resetForm();
  $('#fTitle').value = titleCase(c.kw);
  $('#fUrl').value = safeUrl(site.url(c));
  $('#fNotes').value = 'Found via ' + site.name + ' — open Search, pick a real posting, then update the title/company here to match it.';
  $('#fTransport').value = site.cat === 'remote' || c.kw.toLowerCase().includes('remote') ? 'remote'
    : settings.transport === 'walkbike' ? 'walk' : settings.transport === 'car' ? 'car' : 'bus';
  $('#formTitle').textContent = '＋ Track a job from ' + site.name;
  document.getElementById('tracker').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => $('#fTitle').focus(), 350);
}

/* ---------------- Weekly plan ---------------- */
function renderWeek() {
  $('#weekGrid').innerHTML = WEEK.map((d, di) =>
    '<div class="day-card"><h3>' + esc(d.day) + '</h3>' + d.tasks.map((t, ti) => {
      const key = di + '-' + ti;
      const checked = !!weekState[key];
      return '<label class="' + (checked ? 'done' : '') + '"><input type="checkbox" data-week="' + key + '" ' + (checked ? 'checked' : '') + '><span>' + esc(t) + '</span></label>';
    }).join('') + '</div>'
  ).join('');
}

/* ---------------- Export / backup / restore ---------------- */
function download(filename, text, type) {
  const blob = new Blob([text], { type: type || 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 800);
}
function csvCell(v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }
function exportCsv() {
  const head = ['Job Title', 'Company', 'Location', 'Distance (miles)', 'Pay', 'How I’d get there', 'Job Posting URL', 'Status', 'Priority', 'Date Applied', 'Follow-up Date', 'Contact', 'Notes'];
  const rows = apps.map((a) => [a.title, a.company, a.location, a.distance, a.pay, (TRANSPORT_TAGS[a.transport] || {}).tag || a.transport, a.url, a.status, a.priority, a.dateApplied, a.followUp, a.contact, a.notes].map(csvCell).join(','));
  download('stanislaus-applications.csv', [head.map(csvCell).join(',')].concat(rows).join('\r\n'), 'text/csv;charset=utf-8');
}
function backupJson() {
  download('stanislaus-job-finder-backup-' + todayISO() + '.json',
    JSON.stringify({ app: 'Stanislaus Job Finder', version: 1, exportedAt: new Date().toISOString(), settings, apps, week: weekState }, null, 2),
    'application/json');
}
function restoreJson(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result || ''));
      const incomingApps = Array.isArray(data) ? data : data.apps;
      if (!Array.isArray(incomingApps)) throw new Error('No applications found in that file.');
      if (!confirm('Restore this backup? It will REPLACE your current tracker (' + apps.length + ' job(s)) with ' + incomingApps.length + ' job(s) from the file.')) return;
      apps = incomingApps.filter((a) => a && typeof a === 'object').map((a) => Object.assign({
        id: String(a.id || Date.now() + Math.random()), title: '', company: '', location: '', distance: '',
        pay: '', transport: 'bus', url: '', status: 'Saved', priority: 'Normal', dateApplied: '', followUp: '', contact: '', notes: '', createdAt: Date.now()
      }, a));
      if (!Array.isArray(data) && data.settings && typeof data.settings === 'object') {
        settings = Object.assign(settings, data.settings);
        syncControlsFromSettings();
      }
      if (!Array.isArray(data) && data.week && typeof data.week === 'object') weekState = data.week;
      persistApps(); persistSettings(); persistWeek();
      renderSites(); renderApps(); renderWeek(); resetForm();
      alert('Backup restored: ' + apps.length + ' job(s) loaded.');
    } catch (err) {
      alert('Could not restore that file. Make sure it’s a Stanislaus Job Finder backup (.json).\n\n' + err.message);
    }
  };
  reader.readAsText(file);
}

/* ---------------- Controls sync ---------------- */
function syncControlsFromSettings() {
  $('#transportSelect').value = settings.transport;
  $('#workTypeSelect').value = settings.workType;
  $('#keywordInput').value = settings.keyword;
  $('#siteFilter').value = settings.siteFilter || '';
  $$('#chips .chip').forEach((chip) => chip.classList.toggle('is-active', chip.dataset.keyword === settings.keyword));
  const activeChip = $('#chips .chip.is-active');
  $('#chipWarning').hidden = !(activeChip && activeChip.dataset.warn === 'true') && !/delivery driver/i.test(settings.keyword || '');
}
function applySettings() { persistSettings(); renderSites(); }

/* ---------------- Init / events ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  syncControlsFromSettings();
  renderSites(); renderApps(); renderWeek();

  $('#transportSelect').addEventListener('change', (e) => { settings.transport = e.target.value; applySettings(); });
  $('#workTypeSelect').addEventListener('change', (e) => { settings.workType = e.target.value; applySettings(); });
  $('#keywordInput').addEventListener('input', (e) => {
    settings.keyword = e.target.value;
    $$('#chips .chip').forEach((chip) => chip.classList.toggle('is-active', chip.dataset.keyword === settings.keyword.trim().toLowerCase()));
    $('#chipWarning').hidden = !/delivery driver/i.test(settings.keyword || '');
    applySettings();
  });
  $('#siteFilter').addEventListener('input', (e) => { settings.siteFilter = e.target.value; applySettings(); });

  $('#chips').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    settings.keyword = chip.dataset.keyword;
    $('#keywordInput').value = settings.keyword;
    $$('#chips .chip').forEach((ch) => ch.classList.toggle('is-active', ch === chip));
    $('#chipWarning').hidden = chip.dataset.warn !== 'true';
    applySettings();
    $('#keywordInput').focus();
  });

  /* ＋ Track (delegated — site cards re-render often) */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-track]');
    if (!btn) return;
    const site = SITES.find((s) => s.id === btn.dataset.track);
    if (site) prefillFromSite(site);
  });

  /* Tracker form */
  $('#jobForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = $('#fTitle').value.trim();
    if (!title) { alert('Please add a job title first.'); $('#fTitle').focus(); return; }
    const data = {
      title, company: $('#fCompany').value.trim(), location: $('#fLocation').value.trim(),
      distance: $('#fDistance').value === '' ? '' : Number($('#fDistance').value),
      pay: $('#fPay').value.trim(), transport: $('#fTransport').value, url: $('#fUrl').value.trim(),
      status: $('#fStatus').value, priority: $('#fPriority').value,
      dateApplied: $('#fApplied').value, followUp: $('#fFollow').value,
      contact: $('#fContact').value.trim(), notes: $('#fNotes').value.trim()
    };
    const editId = $('#editId').value;
    if (editId) {
      const idx = apps.findIndex((a) => String(a.id) === String(editId));
      if (idx >= 0) apps[idx] = Object.assign({}, apps[idx], data);
    } else {
      apps.unshift(Object.assign({ id: String(Date.now()) + '-' + Math.random().toString(36).slice(2, 7), createdAt: Date.now() }, data));
    }
    persistApps(); renderApps(); resetForm();
    document.getElementById('appsList').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
  $('#cancelEditBtn').addEventListener('click', resetForm);
  ['fLocation', 'fDistance', 'fTransport'].forEach((id) => $('#' + id).addEventListener('input', updateFormWarning));
  $('#fTransport').addEventListener('change', updateFormWarning);

  /* Tracker filters */
  ['trackSearch', 'statusFilter', 'transportFilter'].forEach((id) => $('#' + id).addEventListener('input', renderApps));
  $('#statusFilter').addEventListener('change', renderApps);
  $('#transportFilter').addEventListener('change', renderApps);

  /* Tracker card actions (delegated) */
  $('#appsList').addEventListener('change', (e) => {
    const sel = e.target.closest('[data-status]');
    if (!sel) return;
    const app = apps.find((a) => String(a.id) === String(sel.dataset.status));
    if (app) { app.status = sel.value; persistApps(); renderApps(); }
  });
  $('#appsList').addEventListener('click', (e) => {
    const editBtn = e.target.closest('[data-edit]');
    const delBtn = e.target.closest('[data-del]');
    if (editBtn) {
      const app = apps.find((a) => String(a.id) === String(editBtn.dataset.edit));
      if (app) { fillForm(app); document.getElementById('jobForm').scrollIntoView({ behavior: 'smooth' }); }
    }
    if (delBtn) {
      const app = apps.find((a) => String(a.id) === String(delBtn.dataset.del));
      if (app && confirm('Delete “' + (app.title || 'this job') + '” from your tracker? This cannot be undone.')) {
        apps = apps.filter((a) => String(a.id) !== String(delBtn.dataset.del));
        persistApps(); renderApps();
        if ($('#editId').value === String(delBtn.dataset.del)) resetForm();
      }
    }
  });

  /* Export / backup / restore */
  $('#exportCsvBtn').addEventListener('click', () => {
    if (!apps.length) { alert('No tracked jobs yet — add a job first, then export.'); return; }
    exportCsv();
  });
  $('#backupBtn').addEventListener('click', backupJson);
  $('#restoreInput').addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) restoreJson(e.target.files[0]);
    e.target.value = '';
  });

  /* Weekly plan */
  $('#weekGrid').addEventListener('change', (e) => {
    const box = e.target.closest('[data-week]');
    if (!box) return;
    weekState[box.dataset.week] = box.checked;
    persistWeek(); renderWeek();
  });
  $('#printBtn').addEventListener('click', () => window.print());
  $('#resetWeekBtn').addEventListener('click', () => {
    if (confirm('Uncheck every day in the weekly plan?')) { weekState = {}; persistWeek(); renderWeek(); }
  });
});
