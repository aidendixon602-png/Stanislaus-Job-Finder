/* California Job Finder (Stanislaus Job Finder) — vanilla JS, no frameworks.
   Multi-profile, all 58 California counties, live search URLs (no scraping,
   no invented listings), and an AES-256 encrypted admin vault (Web Crypto).
   Data lives only in this browser's localStorage. */
'use strict';

/* ---------------- Helpers ---------------- */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const E = (s) => encodeURIComponent(s == null ? '' : String(s));
const slug = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'jobs';
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
function todayISO(d) { const x = d || new Date(); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); }
function safeUrl(u) { try { const x = new URL(String(u || '').trim()); return (x.protocol === 'http:' || x.protocol === 'https:') ? x.href : ''; } catch (e) { return ''; } }
function titleCase(s) { return String(s || '').replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1)); }
function store(k, f) { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : f; } catch (e) { return f; } }
function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
function busRouteUrl(origin, destination) { return 'https://www.google.com/maps/dir/?api=1&origin=' + E(origin || 'California') + '&destination=' + E(destination || 'California') + '&travelmode=transit'; }
function download(filename, text, type) { const b = new Blob([text], { type: type || 'text/plain;charset=utf-8' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 800); }

/* ---------------- i18n (main interface) ---------------- */
const I18N = {
  en: { profile:'Profile', newProfile:'New profile', largeText:'Large text', contrast:'Contrast', admin:'Admin', heroTitle:'California Job Finder', heroLede:'Built in Stanislaus County, now for anyone in California. Pick your county, city and ZIP — remote first, then walk/bike, then transit-friendly. Track every application privately on this device. No account, no sign-up.', totalTracked:'Total tracked', applied:'Applied', interviews:'Interviews', offers:'Offers', overdue:'Follow-ups overdue', navSetup:'My Setup', navFind:'Find Jobs', navTracker:'My Tracker', navCounty:'My County', navDirectory:'Job Sites', navWeekly:'Weekly Plan', navHelp:'Free Help', heroNote:"Private by design: profiles, applications and settings are saved only in this browser. Use Backup regularly — clearing browser data erases this device's copy.", rec1t:'Remote / work-from-home first.', rec1:'Zero commute — try the Remote Customer Service and Remote Data Entry chips below.', rec2:'Jobs within about 3 miles you can walk or bike to. Check the distance on every listing.', rec4t:'Farther cities & long distances.', rec4:'The tracker flags long-distance jobs automatically so you can skip them unless you have a ride.', checkBus:'Check bus route', setupTitle:'My Setup — works for anyone in California', setupIntro:'Set your county, city and ZIP once. Every search button, county resource and transit link on this page rebuilds for your location. Stanislaus / Modesto 95355 is the starting example — change it to yours.', activeProfile:'Active profile:', profileHint:'(each profile has its own tracker, settings and weekly plan — great for families & job centers)', rename:'Rename', deleteProfile:'Delete profile', county:'County (all 58 in California)', city:'City', useSeat:'Use county seat', zipHint:'Your 5-digit ZIP centers every radius search.', transport:'How I’ll get to work', workType:'Work type', workTypeHint:'Added as a filter on the big boards that support it.', experience:'Experience level', expHint:'Used for your recommendations and weekly plan focus.', jobLooking:'Job I’m looking for', keywordHint:'Typing updates every search button instantly.', quickPicks:'Quick picks — tap one:', deliveryWarnT:'Heads up:', deliveryWarn:'Delivery Driver jobs almost always require your own car, a valid license, and insurance. Double-check the listing says “no car needed” before spending time on it.', saveSearch:'Save this search', readyTitle:'Job-ready checklist', readyIntro:'Check these off once — progress saves per profile and makes applying much faster.', findTitle:'Find Jobs', findIntro:'Nothing here is a copied list and nothing is scraped — every button builds a live search for your job + your city/ZIP on that site’s real results.', filterSites:'Filter the job sites', favOnly:'Favorite sites only', favOnlyHint:'Show only sites you starred', favHint:'Tap ☆ on any site card to favorite it.', startHere:'Start here — best first searches for you', trackerTitle:'My Tracker', trackerIntro:'Move each job along: Saved → Applied → Interview → Offer (plus Rejected and Archived). Change status right on each card. Saved only in this browser, per profile.', goal:'Weekly application goal', view:'View', sort:'Sort', backupAll:'Backup all (JSON)', restore:'Restore backup', weeklyTitle:'Weekly Plan', weeklyIntro:'A simple Mon–Sun routine. Checkboxes save automatically per profile. Print it and stick it on the fridge.', print:'Print weekly plan', resetWeek:'Reset week', helpTitle:'Free Help Anywhere in California', safetyTitle:'Stay safe: spot a scam', safetyStrong:'Real employers NEVER ask you to pay to get hired, buy gift cards, or cash a check and send money back.', safetyBody:'If a “job” asks for that — or your bank login, or payment for “equipment” up front — it is a scam. Stop and ask your local workforce center to look at the posting with you. That help is free.', adminTitle:'Admin (Encrypted)', adminIntro:'For whoever runs this tool (workforce center, library, nonprofit, family). The admin vault is encrypted in this browser with AES-256 — your password is never stored. Unlocking lets you edit the announcement, job sites, county notes, private admin notes, and data tools.', dirTitle:'Job Sites Directory', footerLine:'born as Stanislaus Job Finder in Modesto, CA. No account, no tracking server: your data lives only in this browser.' },
  es: { profile:'Perfil', newProfile:'Perfil nuevo', largeText:'Texto grande', contrast:'Contraste', admin:'Admin', heroTitle:'Buscador de Empleo de California', heroLede:'Creado en el condado de Stanislaus, ahora para cualquier persona en California. Elige tu condado, ciudad y código ZIP — primero remoto, luego a pie/bici, luego transporte público. Guarda cada solicitud en privado en este dispositivo. Sin cuenta, sin registro.', totalTracked:'Total guardados', applied:'Solicitudes', interviews:'Entrevistas', offers:'Ofertas', overdue:'Seguimientos vencidos', navSetup:'Mi configuración', navFind:'Buscar empleo', navTracker:'Mis solicitudes', navCounty:'Mi condado', navDirectory:'Sitios de empleo', navWeekly:'Plan semanal', navHelp:'Ayuda gratis', heroNote:'Privado por diseño: los perfiles, solicitudes y ajustes se guardan solo en este navegador. Haz copias de seguridad — borrar los datos del navegador borra la copia de este dispositivo.', rec1t:'Primero remoto / desde casa.', rec1:'Sin viaje — prueba las opciones de Servicio al Cliente Remoto y Datos Remotos abajo.', rec2:'Empleos a unas 3 millas para ir a pie o en bici. Revisa la distancia en cada anuncio.', rec4t:'Ciudades lejanas y distancias largas.', rec4:'El rastreador marca los empleos lejanos para que puedas saltarlos si no tienes transporte.', checkBus:'Ver ruta de autobús', setupTitle:'Mi configuración — para cualquier persona en California', setupIntro:'Configura tu condado, ciudad y ZIP una vez. Cada botón de búsqueda y recurso se reconstruye para tu ubicación. Stanislaus / Modesto 95355 es el ejemplo inicial — cámbialo por el tuyo.', activeProfile:'Perfil activo:', profileHint:'(cada perfil tiene su propio rastreador, ajustes y plan semanal — ideal para familias y centros de empleo)', rename:'Renombrar', deleteProfile:'Borrar perfil', county:'Condado (los 58 de California)', city:'Ciudad', useSeat:'Usar la sede del condado', zipHint:'Tu ZIP de 5 dígitos centra cada búsqueda.', transport:'Cómo llegaré al trabajo', workType:'Tipo de trabajo', workTypeHint:'Se agrega como filtro en los sitios grandes que lo permiten.', experience:'Nivel de experiencia', expHint:'Se usa para tus recomendaciones y tu plan semanal.', jobLooking:'Empleo que busco', keywordHint:'Al escribir, cada botón de búsqueda se actualiza al instante.', quickPicks:'Opciones rápidas — toca una:', deliveryWarnT:'Ojo:', deliveryWarn:'Los empleos de repartidor casi siempre requieren tu propio auto, licencia válida y seguro. Verifica que el anuncio diga “no se necesita auto”.', saveSearch:'Guardar esta búsqueda', readyTitle:'Lista de preparación', readyIntro:'Marca esto una vez — el progreso se guarda por perfil y aplicar será mucho más rápido.', findTitle:'Buscar Empleo', findIntro:'Nada aquí es una lista copiada ni raspada — cada botón crea una búsqueda en vivo con tu empleo + tu ciudad/ZIP en los resultados reales de ese sitio.', filterSites:'Filtrar los sitios de empleo', favOnly:'Solo sitios favoritos', favOnlyHint:'Mostrar solo los sitios con estrella', favHint:'Toca ☆ en una tarjeta para marcarla favorita.', startHere:'Empieza aquí — las mejores búsquedas para ti', trackerTitle:'Mis Solicitudes', trackerIntro:'Mueve cada empleo: Guardado → Solicitado → Entrevista → Oferta (más Rechazado y Archivado). Cambia el estado en cada tarjeta. Solo en este navegador, por perfil.', goal:'Meta semanal de solicitudes', view:'Vista', sort:'Ordenar', backupAll:'Copia total (JSON)', restore:'Restaurar copia', weeklyTitle:'Plan Semanal', weeklyIntro:'Una rutina simple de lunes a domingo. Las casillas se guardan solas por perfil. Imprímelo y pégalo en el refrigerador.', print:'Imprimir plan semanal', resetWeek:'Reiniciar semana', helpTitle:'Ayuda Gratis en Todo California', safetyTitle:'Cuídate: detecta una estafa', safetyStrong:'Un empleador real NUNCA te pide pagar para ser contratado, comprar tarjetas de regalo, o cobrar un cheque y devolver dinero.', safetyBody:'Si un “empleo” pide eso — o tu clave del banco, o pagar “equipo” por adelantado — es una estafa. Detente y pide a tu centro local de empleo que revise el anuncio contigo. Esa ayuda es gratis.', adminTitle:'Admin (Cifrado)', adminIntro:'Para quien administra esta herramienta (centro de empleo, biblioteca, organización, familia). La bóveda admin está cifrada en este navegador con AES-256 — tu contraseña nunca se guarda. Al desbloquear puedes editar el anuncio, los sitios, las notas del condado, las notas privadas y las herramientas de datos.', dirTitle:'Directorio de Sitios de Empleo', footerLine:'nació como Stanislaus Job Finder en Modesto, CA. Sin cuenta, sin servidor: tus datos viven solo en este navegador.' }
};
function t(k) { return (I18N[prefs.lang] && I18N[prefs.lang][k]) || I18N.en[k] || k; }

/* ---------------- 58 California counties ---------------- */
/* seat = county seat. transit = well-known agency for major counties (others use an official-transit search). */
const COUNTIES = [
  ['Alameda','Oakland','AC Transit'],['Alpine','Markleeville',null],['Amador','Jackson',null],['Butte','Oroville','Butte Regional Transit (B-Line)'],['Calaveras','San Andreas',null],['Colusa','Colusa',null],['Contra Costa','Martinez','County Connection'],['Del Norte','Crescent City',null],['El Dorado','Placerville','El Dorado Transit'],['Fresno','Fresno','Fresno Area Express (FAX)'],['Glenn','Willows',null],['Humboldt','Eureka','Humboldt Transit Authority'],['Imperial','El Centro','Imperial Valley Transit'],['Inyo','Independence',null],['Kern','Bakersfield','Golden Empire Transit (GET)'],['Kings','Hanford','Kings Area Rural Transit'],['Lake','Lakeport',null],['Lassen','Susanville',null],['Los Angeles','Los Angeles','LA Metro'],['Madera','Madera','Madera County Connection'],['Marin','San Rafael','Marin Transit / Golden Gate Transit'],['Mariposa','Mariposa',null],['Mendocino','Ukiah','Mendocino Transit Authority'],['Merced','Merced','Merced County Transit (The Bus)'],['Modoc','Alturas',null],['Mono','Bridgeport',null],['Monterey','Salinas','Monterey-Salinas Transit (MST)'],['Napa','Napa','Vine Transit'],['Nevada','Nevada City',null],['Orange','Santa Ana','OCTA'],['Placer','Auburn','Placer County Transit'],['Plumas','Quincy',null],['Riverside','Riverside','Riverside Transit Agency (RTA)'],['Sacramento','Sacramento','SacRT'],['San Benito','Hollister',null],['San Bernardino','San Bernardino','Omnitrans'],['San Diego','San Diego','San Diego MTS'],['San Francisco','San Francisco','SFMTA Muni'],['San Joaquin','Stockton','San Joaquin RTD'],['San Luis Obispo','San Luis Obispo','SLO Transit / RTA'],['San Mateo','Redwood City','SamTrans'],['Santa Barbara','Santa Barbara','Santa Barbara MTD'],['Santa Clara','San Jose','VTA'],['Santa Cruz','Santa Cruz','Santa Cruz Metro'],['Shasta','Redding','RABA'],['Sierra','Downieville',null],['Siskiyou','Yreka',null],['Solano','Fairfield','SolTrans / FAST'],['Sonoma','Santa Rosa','Sonoma County Transit / SMART'],['Stanislaus','Modesto','StanRTA'],['Sutter','Yuba City','Yuba-Sutter Transit'],['Tehama','Red Bluff',null],['Trinity','Weaverville',null],['Tulare','Visalia','Tulare County Transit / Visalia Transit'],['Tuolumne','Sonora',null],['Ventura','Ventura','Gold Coast Transit / VCTC'],['Yolo','Woodland','Yolobus'],['Yuba','Marysville','Yuba-Sutter Transit']
].map(([name, seat, transit]) => ({ name, seat, transit }));
function countyObj(name) { return COUNTIES.find((c) => c.name === name) || COUNTIES.find((c) => c.name === 'Stanislaus'); }

/* ---------------- Transports / statuses ---------------- */
const TRANSPORTS = {
  nocar:    { label:'No car — remote + nearby', radius:5,  hint:'Search radius: <strong>5 miles</strong> + remote jobs.', rec:'⭐ Recommended for you: no car' },
  walkbike: { label:'Walk / bike only', radius:3,  hint:'Search radius: <strong>3 miles</strong> — walk/bike distance from home.', rec:'⭐ Recommended for you: walk / bike only' },
  bus:      { label:'Bus / transit', radius:10, hint:'Search radius: <strong>10 miles</strong> — transit range. Always check the trip before applying.', rec:'⭐ Recommended for you: bus / transit' },
  car:      { label:'Have a car', radius:25, hint:'Search radius: <strong>25 miles</strong>.', rec:'⭐ Recommended for you: have a car' }
};
const WORK_TYPES = { any:'Any', fulltime:'Full-time', parttime:'Part-time', remote:'Remote' };
const STATUSES = ['Saved','Applied','Interview','Offer','Rejected','Archived'];
const TRANSPORT_TAGS = { remote:{tag:'🏠 Remote',cls:'tag-remote'}, walk:{tag:'🚶 Walk/bike',cls:'tag-walk'}, bus:{tag:'🚌 Bus-friendly',cls:'tag-bus'}, car:{tag:'🚗 Needs a car',cls:'tag-car'} };
const KNOWN_FAR_CITIES = ['turlock','riverbank','oakdale','Salida','Stockton','Patterson','manteca','Tracy'];
function isFarJob(a) {
  const loc = String(a.location || '').toLowerCase();
  if (KNOWN_FAR_CITIES.some((c) => loc.includes(c)) && settings.county === 'Stanislaus') return true;
  const d = parseFloat(a.distance);
  return !isNaN(d) && d > 10 && a.transport !== 'car';
}
function isOverdue(a) { return !!(a.followUp && !['Offer','Rejected','Archived'].includes(a.status) && a.followUp < todayISO()); }

/* ---------------- Site directory ---------------- */
const CATEGORIES = [
  { id:'big', title:'1. Big Job Boards', note:'Widest reach. Sort by date where offered so the newest postings come first.' },
  { id:'local', title:'2. California, County & Government', note:'CalJOBS, state/federal/county jobs and free workforce help — local employers list here.' },
  { id:'employers', title:'3. Direct Employers', note:'Employers post on their OWN websites first because it’s free for them — check these early.' },
  { id:'remote', title:'4. Remote & Freelance', note:'Work from home — customer service, data entry, support and freelance gigs. Best with no car.' },
  { id:'specialty', title:'5. Specialty / Niche Boards', note:'Less competition, more relevant postings for a specific kind of work.' },
  { id:'veterans', title:'6. Veterans', note:'Boards and help built for veterans and military families.' },
  { id:'retiree', title:'7. Retirees / 50+', note:'Boards for experienced and 50+ workers, including work-at-home options.' },
  { id:'custom', title:'8. Added by Admin', note:'Custom sites added by the admin of this device.' }
];
const CAT_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.title.replace(/^\d+\.\s*/, '')]));
const SITES = [
  { id:'indeed', cat:'big', name:'Indeed', desc:'The biggest board. Sorted by date so new postings near you come first.', url:(c)=>'https://www.indeed.com/jobs?q='+E(c.kw)+'&l='+E(c.zip || c.city)+ '&radius='+c.radius+'&sort=date'+(c.wt==='fulltime'?'&jt=fulltime':c.wt==='parttime'?'&jt=parttime':'') },
  { id:'google', cat:'big', name:'Google Jobs', desc:'Google’s job results for your keyword + city/ZIP — pulls from many sites at once.', url:(c)=>'https://www.google.com/search?q='+E(c.kw+' jobs near '+c.loc)+'&ibp=htl;jobs' },
  { id:'ziprecruiter', cat:'big', name:'ZipRecruiter', desc:'Strong for hourly and entry-level work.', url:(c)=>'https://www.ziprecruiter.com/jobs-search?search='+E(c.kw)+'&location='+E(c.city+', CA')+'&radius='+c.radius },
  { id:'linkedin', cat:'big', name:'LinkedIn Jobs', desc:'Professional board — also good for remote customer service and support roles.', url:(c)=>'https://www.linkedin.com/jobs/search/?keywords='+E(c.kw)+'&location='+E(c.city+', California, United States')+'&distance='+c.radius+'&sortBy=DD'+(c.wt==='fulltime'?'&f_JT=F':c.wt==='parttime'?'&f_JT=P':c.wt==='remote'?'&f_WT=2':'') },
  { id:'glassdoor', cat:'big', name:'Glassdoor', desc:'Jobs plus pay and company reviews — check ratings before you apply.', url:(c)=>'https://www.glassdoor.com/Job/jobs.htm?sc.keyword='+E(c.kw)+'&locKeyword='+E(c.city+', CA') },
  { id:'monster', cat:'big', name:'Monster', desc:'Long-running big board with lots of entry-level listings.', url:(c)=>'https://www.monster.com/jobs/search?q='+E(c.kw)+'&where='+E(c.loc)+'&page=1&so=m.h.s' },
  { id:'careerbuilder', cat:'big', name:'CareerBuilder', desc:'Big national board; set email alerts for your ZIP.', url:(c)=>'https://www.careerbuilder.com/jobs?keywords='+E(c.kw)+'&location='+E(c.loc)+'&radius='+c.radius },
  { id:'simplyhired', cat:'big', name:'SimplyHired', desc:'Aggregates listings from many sites into one search.', url:(c)=>'https://www.simplyhired.com/search?q='+E(c.kw)+'&l='+E(c.loc) },
  { id:'snagajob', cat:'big', name:'Snagajob', desc:'Hourly-work specialist — retail, food service, grocery. Great for entry-level.', url:(c)=>'https://www.snagajob.com/jobs/q-'+slug(c.kw)+'/w-'+E(c.zip || '') },
  { id:'getwork', cat:'big', name:'Getwork', desc:'Daily listings pulled from employer sites (formerly LinkUp).', url:(c)=>'https://getwork.com/search?q='+E(c.kw)+'&l='+E(c.city+', CA') },
  { id:'ihire', cat:'big', name:'iHire', desc:'Industry-focused boards under one search.', url:(c)=>'https://www.ihire.com/search?k='+E(c.kw)+'&l='+E(c.loc) },
  { id:'nexxt', cat:'big', name:'Nexxt', desc:'National board with local listings.', url:(c)=>'https://www.nexxt.com/jobs/search?q='+E(c.kw)+'&l='+E(c.city+', CA') },
  { id:'themuse', cat:'big', name:'The Muse', desc:'Jobs with company profiles — useful for remote-friendly employers.', url:(c)=>'https://www.themuse.com/search?keyword='+E(c.kw)+'&location='+E(c.city+', CA') },
  { id:'caljobs', cat:'local', name:'CalJOBS', desc:'California’s FREE state job board (EDD). A top resource anywhere in CA.', url:(c)=>'https://www.caljobs.ca.gov/vosnet/jobbanks/joblist.aspx?keyword='+E(c.kw)+'&zip='+E(c.zip || '')+'&radius='+c.radius },
  { id:'calcareers', cat:'local', name:'CalCareers (State of CA)', desc:'State of California jobs — filter to your county after searching.', url:(c)=>'https://calcareers.ca.gov/CalHRPublic/Search/JobSearchResults.aspx#kw='+E(c.kw) },
  { id:'usajobs', cat:'local', name:'USAJobs (Federal)', desc:'Federal jobs — VA, USDA and other agencies across California.', url:(c)=>'https://www.usajobs.gov/Search/Results?k='+E(c.kw)+'&l='+E(c.city+', California')+'&r='+c.radius+'&p=1&s=startdate' },
  { id:'governmentjobs', cat:'local', name:'GovernmentJobs.com', desc:'City, county and public-agency jobs in one search.', url:(c)=>'https://www.governmentjobs.com/jobs?keywords='+E(c.kw)+'&location='+E(c.city+', CA') },
  { id:'countyjobs', cat:'local', name:'County Government Jobs', desc:'Government jobs centered on your city/ZIP — see “My County Resources” below for your county’s official links.', url:(c)=>'https://www.governmentjobs.com/jobs?keywords='+E(c.kw)+'&location='+E((c.zip || c.city)+'') },
  { id:'edjoin', cat:'local', name:'EdJoin (School Jobs)', desc:'School district jobs statewide — aides, custodial, food service, office.', url:(c)=>'https://www.edjoin.org/Home/SearchKeywords?searchKeyword='+E(c.kw) },
  { id:'careeronestop', cat:'local', name:'CareerOneStop / AJCC Finder', desc:'Find your nearest America’s Job Center for free in-person help, computers and workshops.', url:(c)=>'https://www.careeronestop.org/LocalHelp/AmericanJobCenters/american-job-centers.aspx?location='+E(c.zip || c.city+', CA') },
  { id:'edd', cat:'local', name:'California EDD', desc:'CA Employment Development Department — jobs, training and unemployment services.', url:()=>'https://edd.ca.gov/en/jobs_and_training/' },
  { id:'sutter', cat:'employers', name:'Sutter Health', desc:'Hospitals/clinics across CA — support, food service and environmental-services roles.', url:(c)=>'https://www.sutterhealth.org/careers/search-jobs?keywords='+E(c.kw) },
  { id:'Kaiser', cat:'employers', name:'Kaiser Permanente', desc:'Kaiser medical centers statewide — filter Location to your city.', url:(c)=>'https://www.kaiserpermanentejobs.org/search-jobs?k='+E(c.kw) },
  { id:'walmart', cat:'employers', name:'Walmart Careers', desc:'Cashiers, stockers and associates — posted here first.', url:(c)=>'https://careers.walmart.com/results?q='+E(c.kw)+'&jobCity='+E(c.city)+'&jobState=CA&page=1&sort=rank' },
  { id:'target', cat:'employers', name:'Target Jobs', desc:'Retail, guest advocate and fulfillment roles.', url:(c)=>'https://jobs.target.com/search-jobs?k='+E(c.kw) },
  { id:'amazon', cat:'employers', name:'Amazon Jobs', desc:'Warehouse and support roles — check the exact facility location before applying.', url:(c)=>'https://www.amazon.jobs/en/search?base_query='+E(c.kw)+'&loc_query='+E(c.city+', CA, United States') },
  { id:'savemart', cat:'employers', name:'Save Mart Careers', desc:'Save Mart / FoodMaxx grocery jobs (Central Valley). Search your city on their careers page.', url:()=>'https://www.savemart.com/careers' },
  { id:'roberthalf', cat:'employers', name:'Robert Half', desc:'Staffing agency — office, admin, data entry and customer service, including remote.', url:(c)=>'https://www.roberthalf.com/us/en/search?keywords='+E(c.kw)+'&location='+E(c.city+', CA') },
  { id:'flexjobs', cat:'remote', name:'FlexJobs', desc:'Vetted remote/flexible jobs (some features paid).', url:(c)=>'https://www.flexjobs.com/search/?search='+E(c.kw)+'&location=Remote' },
  { id:'weworkremotely', cat:'remote', name:'We Work Remotely', desc:'Remote-only board — customer support, admin and more.', url:(c)=>'https://weworkremotely.com/remote-jobs/search?term='+E(c.kw) },
  { id:'remoteco', cat:'remote', name:'Remote.co', desc:'Remote listings and work-from-home advice.', url:(c)=>'https://remote.co/remote-jobs/search/?search_keywords='+E(c.kw) },
  { id:'upwork', cat:'remote', name:'Upwork', desc:'Freelance gigs — data entry, virtual assistant, customer support.', url:(c)=>'https://www.upwork.com/nx/search/jobs/?q='+E(c.kw) },
  { id:'fiverr', cat:'remote', name:'Fiverr', desc:'Sell small services as a freelancer.', url:(c)=>'https://www.fiverr.com/search/gigs?query='+E(c.kw) },
  { id:'dice', cat:'specialty', name:'Dice (Tech)', desc:'Tech and IT jobs — help desk and IT support included.', url:(c)=>'https://www.dice.com/jobs?q='+E(c.kw)+'&location='+E(c.loc)+'&radius='+c.radius+'&radiusUnit=mi&page=1&pageSize=20' },
  { id:'idealist', cat:'specialty', name:'Idealist (Nonprofits)', desc:'Nonprofit and community-service jobs and volunteering.', url:(c)=>'https://www.idealist.org/en/jobs?q='+E(c.kw) },
  { id:'higheredjobs', cat:'specialty', name:'HigherEdJobs (Colleges)', desc:'College/university jobs across California.', url:(c)=>'https://www.higheredjobs.com/search/advanced_action.cfm?Keyword='+E(c.kw) },
  { id:'constructionjobs', cat:'specialty', name:'ConstructionJobs', desc:'Construction and general-labor trades.', url:(c)=>'https://www.constructionjobs.com/search/results?q='+E(c.kw)+'&l='+E(c.city+', CA') },
  { id:'jobsinlogistics', cat:'specialty', name:'JobsInLogistics', desc:'Warehouse, logistics and supply-chain jobs.', url:(c)=>'https://www.jobsinlogistics.com/search/results?Keywords='+E(c.kw)+'&LocationCity='+E(c.city)+'&LocationState=CA' },
  { id:'callcenterjobs', cat:'specialty', name:'Call Center Jobs', desc:'Call-center and customer-service roles, including remote.', url:(c)=>'https://www.callcenterjobs.com/jobs?q='+E(c.kw)+'&location='+E(c.city+', CA') },
  { id:'poached', cat:'specialty', name:'Poached (Restaurants)', desc:'Restaurant and food-service jobs.', url:(c)=>'https://poachedjobs.com/search?q='+E(c.kw)+'&location='+E(c.city+', CA') },
  { id:'salesgravy', cat:'specialty', name:'SalesGravy (Sales)', desc:'Sales jobs board.', url:(c)=>'https://www.salesgravy.com/jobs/search?q='+E(c.kw) },
  { id:'mediabistro', cat:'specialty', name:'Mediabistro (Media)', desc:'Media, writing and communications jobs.', url:(c)=>'https://www.mediabistro.com/jobs/search?q='+E(c.kw) },
  { id:'behance', cat:'specialty', name:'Behance Jobs (Creative)', desc:'Design and creative jobs/freelance.', url:(c)=>'https://www.behance.net/joblist?search='+E(c.kw) },
  { id:'hireheroes', cat:'veterans', name:'Hire Heroes USA', desc:'Free career help and job board for veterans and spouses.', url:(c)=>'https://www.hireheroesusa.org/job-board/?_job_title='+E(c.kw) },
  { id:'recruitmilitary', cat:'veterans', name:'RecruitMilitary', desc:'Veteran job board and hiring events.', url:(c)=>'https://recruitmilitary.com/job-seekers/job-search?query='+E(c.kw)+'&location='+E(c.city+', CA') },
  { id:'vetjobs', cat:'veterans', name:'VetJobs', desc:'Jobs for veterans, military and family members.', url:(c)=>'https://www.vetjobs.org/jobs?keywords='+E(c.kw)+'&location='+E(c.city+', CA') },
  { id:'gijobs', cat:'veterans', name:'GI Jobs', desc:'Veteran-friendly employers and job search.', url:(c)=>'https://www.gijobs.com/jobs/?keywords='+E(c.kw) },
  { id:'aarp', cat:'retiree', name:'AARP Jobs', desc:'Jobs for experienced workers from AARP.', url:(c)=>'https://jobs.aarp.org/jobs/?keywords='+E(c.kw)+'&location='+E(c.city+', CA') },
  { id:'retirementjobs', cat:'retiree', name:'RetirementJobs', desc:'Jobs for 50+ workers — full-time, part-time and flexible.', url:(c)=>'https://www.retirementjobs.com/job-search?keywords='+E(c.kw)+'&location='+E(c.city+', CA') },
  { id:'workforce50', cat:'retiree', name:'Workforce50', desc:'Job search built for workers 50 and older.', url:(c)=>'https://www.workforce50.com/job_search?keywords='+E(c.kw) },
  { id:'wahve', cat:'retiree', name:'WAHVE (Work At Home Vintage Experts)', desc:'Remote work matched to experienced workers.', url:()=>'https://wahve.com/job-seekers/' }
];

/* ---------------- Readiness & weekly ---------------- */
const READINESS = [
  { id:'resume', en:'Resume ready (even a simple one-page one)', es:'Currículum listo (aunque sea simple, de una página)' },
  { id:'docs', en:'ID & work documents gathered (ID, Social Security card, etc.)', es:'Documentos listos (identificación, tarjeta del Seguro Social, etc.)' },
  { id:'email', en:'Professional email address + password saved somewhere safe', es:'Correo profesional + contraseña guardada en un lugar seguro' },
  { id:'voicemail', en:'Phone voicemail set up with a professional greeting', es:'Buzón de voz del teléfono configurado con un saludo profesional' },
  { id:'transport', en:'Transport plan: bus pass / bike / ride options figured out', es:'Plan de transporte: pase de autobús / bici / opciones de viaje' },
  { id:'outfit', en:'Interview outfit picked out', es:'Ropa para entrevistas lista' },
  { id:'references', en:'3 references listed (name, phone, how they know you)', es:'3 referencias anotadas (nombre, teléfono, cómo te conocen)' },
  { id:'story', en:'Practiced: “Tell me about yourself” + why you want the job', es:'Practicado: “Háblame de ti” + por qué quieres el empleo' }
];
const WEEK_EN = [
  ['Monday',['Search Remote Customer Service + Remote Data Entry (Indeed, FlexJobs, We Work Remotely)','Search entry-level jobs in your ZIP on Google Jobs + ZipRecruiter','Save at least 5 good jobs to My Tracker with ＋ Track']],
  ['Tuesday',['Apply to 3 Saved jobs — remote first, then closest to home','For any in-person job, tap “Check bus route” and confirm transit times both ways','Write the date applied + a follow-up date (about 1 week out) on each card']],
  ['Wednesday',['Search CalJOBS + your city/county government jobs','Search direct employers: Walmart, Target, Save Mart, Sutter Health','Apply to 2–3 jobs and update statuses in the tracker']],
  ['Thursday',['Search Snagajob + SimplyHired for hourly work near home','Visit one walk/bike-distance employer in person if you can (bring ID)','Follow up on last week’s applications and log the contact']],
  ['Friday',['Follow up on anything marked overdue in the stats bar','Apply to 2 more jobs; move interviews/offers forward','Backup (JSON) your tracker so you never lose it']],
  ['Saturday',['Practice answers out loud: “Tell me about yourself”, strengths, availability, transport plan','Lay out interview clothes + documents','Check the transit route + travel time for any interview next week']],
  ['Sunday',['Review the tracker: archive dead ends, mark next week’s top 3 as High priority','Print next week’s plan and set daily goals','Rest and recharge — job searching is work too']]
];
const WEEK_ES_DAYS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const WEEK = WEEK_EN.map(([day, tasks], i) => ({ day, dayEs: WEEK_ES_DAYS[i], tasks, tasksEs: tasks }));

/* ---------------- Storage: profiles / public / prefs ---------------- */
const LS_META = 'sjf.v2.meta', LS_PUBLIC = 'sjf.v2.public', LS_PREFS = 'sjf.v2.prefs', LS_ADMIN = 'sjf.v2.adminVault';
const pkey = (id, kind) => 'sjf.v2.' + id + '.' + kind;
const DEFAULT_SETTINGS = { county:'Stanislaus', city:'Modesto', zip:'95355', transport:'nocar', workType:'any', experience:'entry', keyword:'entry level', siteFilter:'', favoriteSiteIds:[], savedSearches:[], readiness:{}, weeklyGoal:5, trackerView:'list', sort:'newest', favOnly:false };

let prefs = Object.assign({ lang:'en', large:false, contrast:false }, store(LS_PREFS, {}));
let publicConfig = Object.assign({ bannerEnabled:false, bannerText:'', customSites:[], hiddenSiteIds:[], countyNotes:{} }, store(LS_PUBLIC, {}));
let meta = store(LS_META, null);
let settings, apps, weekState;

function saveCurrent() { if (!meta) return; save(pkey(meta.activeId, 'settings'), settings); save(pkey(meta.activeId, 'apps'), apps); save(pkey(meta.activeId, 'week'), weekState); }
function loadProfileData(id) {
  settings = Object.assign({}, DEFAULT_SETTINGS, store(pkey(id, 'settings'), {}));
  if (!TRANSPORTS[settings.transport]) settings.transport = 'nocar';
  apps = store(pkey(id, 'apps'), []); if (!Array.isArray(apps)) apps = [];
  apps = apps.filter((a) => a && typeof a === 'object').map(sanitizeApp);
  weekState = store(pkey(id, 'week'), {}); if (!weekState || typeof weekState !== 'object') weekState = {};
}
function initProfiles() {
  if (!meta || !Array.isArray(meta.profiles) || !meta.profiles.length) {
    const id = 'p' + Date.now().toString(36);
    const legacySettings = store('sjf.settings.v1', null);
    const legacyApps = store('sjf.apps.v1', null);
    const legacyWeek = store('sjf.utils.v1', null);
    meta = { activeId: id, profiles: [{ id, name: Array.isArray(legacyApps) && legacyApps.length ? 'Modesto search (imported)' : 'My job search', createdAt: Date.now() }] };
    save(LS_META, meta);
    save(pkey(id, 'settings'), Object.assign({}, DEFAULT_SETTINGS, legacySettings && typeof legacySettings === 'object' ? legacySettings : {}));
    save(pkey(id, 'apps'), Array.isArray(legacyApps) ? legacyApps : []);
    save(pkey(id, 'week'), legacyWeek && typeof legacyWeek === 'object' ? legacyWeek : {});
  }
  if (!meta.profiles.some((p) => p.id === meta.activeId)) meta.activeId = meta.profiles[0].id;
  loadProfileData(meta.activeId);
}
function activeProfile() { return meta.profiles.find((p) => p.id === meta.activeId); }
function sanitizeApp(a) {
  const clean = (v, max) => String(v == null ? '' : v).slice(0, max || 300);
  const dateOk = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) ? String(v) : '';
  const dist = parseFloat(a.distance);
  return {
    id: clean(a.id, 80) || (String(Date.now()) + '-' + Math.random().toString(36).slice(2, 7)),
    title: clean(a.title, 200), company: clean(a.company, 200), location: clean(a.location, 200),
    distance: isNaN(dist) || dist < 0 ? '' : Math.min(dist, 100000),
    pay: clean(a.pay, 120), transport: TRANSPORT_TAGS[a.transport] ? a.transport : 'bus',
    url: safeUrl(a.url), status: STATUSES.includes(a.status) ? a.status : 'Saved',
    priority: ['Low', 'Normal', 'High'].includes(a.priority) ? a.priority : 'Normal',
    dateApplied: dateOk(a.dateApplied), followUp: dateOk(a.followUp),
    contact: clean(a.contact, 200), notes: clean(a.notes, 5000),
    createdAt: Number.isFinite(Number(a.createdAt)) ? Number(a.createdAt) : Date.now()
  };
}
function savePublic() { save(LS_PUBLIC, publicConfig); }
function savePrefs() { save(LS_PREFS, prefs); }

function ctx() {
  const kw = (settings.keyword || '').trim() || 'entry level';
  const city = (settings.city || '').trim() || countyObj(settings.county).seat;
  const zip = (settings.zip || '').trim();
  return { kw, radius: TRANSPORTS[settings.transport].radius, wt: settings.workType, city, zip, county: settings.county, loc: city + ', CA' + (zip ? ' ' + zip : '') };
}
function allSites() {
  const customs = (publicConfig.customSites || []).map((cs) => ({ id: cs.id, cat:'custom', name: cs.name, desc: cs.desc || 'Added by admin.', url: (c) => String(cs.template || '').replaceAll('{keyword}', E(c.kw)).replaceAll('{city}', E(c.city)).replaceAll('{zip}', E(c.zip)).replaceAll('{county}', E(c.county)).replaceAll('{radius}', c.radius) }));
  return SITES.filter((s) => !(publicConfig.hiddenSiteIds || []).includes(s.id)).concat(customs);
}

/* ---------------- Rendering: prefs / i18n / banner ---------------- */
function applyPrefs() {
  document.documentElement.classList.toggle('large-text', !!prefs.large);
  document.documentElement.classList.toggle('high-contrast', !!prefs.contrast);
  document.documentElement.lang = prefs.lang === 'es' ? 'es' : 'en';
  $('#fontToggle').setAttribute('aria-pressed', String(!!prefs.large));
  $('#contrastToggle').setAttribute('aria-pressed', String(!!prefs.contrast));
  $('#langToggle').textContent = prefs.lang === 'es' ? '🇬🇧 EN' : '🇪🇸 ES';
}
function applyI18n() { $$('[data-i18n]').forEach((el) => { const v = t(el.dataset.i18n); if (v) el.textContent = v; }); }
function renderBanner() { const b = $('#adminBanner'); const on = publicConfig.bannerEnabled && (publicConfig.bannerText || '').trim(); b.hidden = !on; b.textContent = on ? '📢 ' + publicConfig.bannerText : ''; }

/* ---------------- Rendering: location / recommendation ---------------- */
function renderLocation() {
  const c = ctx(); const co = countyObj(settings.county);
  $('#heroLocation').textContent = settings.county + ' County • ' + c.loc;
  $('#radiusHint').innerHTML = TRANSPORTS[settings.transport].hint;
  $('#recTitle').textContent = TRANSPORTS[settings.transport].rec;
  $('#recLocalTitle').textContent = c.loc + ' next.';
  const agency = co.transit;
  $('#recTransitTitle').textContent = 'Transit-friendly jobs in ' + c.city + ' & ' + settings.county + ' County.';
  $('#recTransitText').textContent = agency ? ('Local transit: ' + agency + '. Plan the trip before you apply — and again before any interview.') : 'Plan the transit trip before you apply — and again before any interview. Use the route checker on the right.';
  $('#transitBoxTitle').textContent = agency ? ('🚌 ' + agency + (settings.county === 'Stanislaus' ? ' (Stanislaus Regional Transit)' : '')) : ('🚌 Public transit near ' + c.city);
  $('#transitBoxText').innerHTML = settings.county === 'Stanislaus'
    ? 'Modesto city buses + county routes (Modesto ⇄ Ceres and more). Check schedules and fares at <a href="https://www.stanrta.org/" target="_blank" rel="noopener noreferrer">stanrta.org</a>.'
    : 'Check routes, schedules and fares for ' + esc(c.city) + (agency ? ' with <strong>' + esc(agency) + '</strong>' : '') + ' before you apply. Always check the trip home at your shift time too.';
  $('#busRouteBtn').href = busRouteUrl(c.loc, c.city + ', CA');
  $('#countyHint').textContent = 'County seat: ' + co.seat + (agency ? ' • Transit: ' + agency : ' • Transit: search “' + co.seat + ' CA public transit”');
  $('#recIntro').textContent = settings.transport === 'car' ? 'You have a car, so distance is flexible — still start with the closest, best-fit jobs:' : 'Search in this order so you don’t waste time on jobs you can’t get to:';
}

/* ---------------- Rendering: sites ---------------- */
function siteMatches(site, filter) { if (!filter) return true; const hay = (site.name + ' ' + site.desc + ' ' + (CAT_LABEL[site.cat] || '')).toLowerCase(); return filter.toLowerCase().split(/\s+/).filter(Boolean).every((w) => hay.includes(w)); }
function siteCard(site, c) {
  const href = safeUrl(site.url(c)) || '#';
  const fav = (settings.favoriteSiteIds || []).includes(site.id);
  const searchLabel = prefs.lang === 'es' ? 'Buscar' : 'Search';
  return '<article class="site-card"><div class="site-head"><span class="site-cat">' + esc(CAT_LABEL[site.cat] || site.cat) + (site.cat === 'custom' ? ' • Admin' : '') + '</span>' +
    '<button type="button" class="fav-btn' + (fav ? ' is-fav' : '') + '" data-fav="' + esc(site.id) + '" aria-label="Favorite ' + esc(site.name) + '" title="Favorite">' + (fav ? '★' : '☆') + '</button></div>' +
    '<h4>' + esc(site.name) + '</h4><p>' + esc(site.desc) + '</p><div class="site-actions">' +
    '<a class="btn btn-primary btn-sm" href="' + esc(href) + '" target="_blank" rel="noopener noreferrer">🔎 ' + searchLabel + ' “' + esc(c.kw) + '” ↗</a>' +
    '<button type="button" class="btn btn-track btn-sm" data-track="' + esc(site.id) + '">＋ Track</button></div></article>';
}
let countyTrackSites = [];
function renderSites() {
  const c = ctx(); const filter = settings.siteFilter || ''; const sites = allSites();
  const favFilter = (s) => !settings.favOnly || (settings.favoriteSiteIds || []).includes(s.id);
  const visible = sites.filter((s) => siteMatches(s, filter) && favFilter(s));
  const remoteMode = settings.workType === 'remote' || /^remote\b/i.test(c.kw);
  const featuredIds = remoteMode ? ['indeed','linkedin','flexjobs','weworkremotely','remoteco','upwork'] : ['indeed','google','ziprecruiter','snagajob','caljobs','linkedin'];
  $('#featuredGrid').innerHTML = featuredIds.map((id) => visible.find((s) => s.id === id)).filter(Boolean).map((s) => siteCard(s, c)).join('') || '<p class="muted">No featured sites match — clear the filter / favorites-only.</p>';
  $('#directoryGroups').innerHTML = CATEGORIES.map((cat) => {
    const inCat = visible.filter((s) => s.cat === cat.id); if (!inCat.length) return '';
    return '<div class="dir-group"><h3>' + esc(cat.title) + '</h3><p class="dir-note">' + esc(cat.note) + '</p><div class="site-grid">' + inCat.map((s) => siteCard(s, c)).join('') + '</div></div>';
  }).join('');
  $('#directoryEmpty').hidden = visible.length > 0;
  $('#siteCount').textContent = 'Showing ' + visible.length + ' of ' + sites.length + ' sites for “' + c.kw + '” near ' + c.loc + ' (' + c.radius + '-mile radius' + (settings.transport === 'nocar' ? ' + remote' : '') + ').';
  $('#searchSummary').innerHTML = (prefs.lang === 'es' ? 'Buscando ' : 'Now searching for ') + '<strong>“' + esc(c.kw) + '”</strong> near <strong>' + esc(c.loc) + '</strong> (' + esc(settings.county) + ' County) • Radius: <strong>' + c.radius + ' miles</strong>' + (settings.transport === 'nocar' ? ' + <strong>🏠 remote first</strong>' : '') + ' • <strong>' + esc(WORK_TYPES[settings.workType] || 'Any') + '</strong>';
}
function renderCounty() {
  const c = ctx(); const co = countyObj(settings.county); const isStan = settings.county === 'Stanislaus';
  $('#countyTitle').textContent = '🏛️ ' + settings.county + ' County Resources';
  $('#countyIntro').textContent = 'Official county jobs, workforce help, schools and transit for ' + settings.county + ' County — centered on ' + c.loc + ' (county seat: ' + co.seat + ').';
  const note = (publicConfig.countyNotes || {})[settings.county];
  $('#adminCountyNoteBox').hidden = !note; $('#adminCountyNoteText').textContent = note || '';
  countyTrackSites = [
    { name: settings.county + ' County Jobs (official search)', desc: 'Web search for the official ' + settings.county + ' County careers page.', url: 'https://www.google.com/search?q=' + E(settings.county + ' County California official jobs careers') },
    { name: 'Government Jobs near ' + c.city, desc: 'GovernmentJobs.com results around ' + c.loc + '.', url: 'https://www.governmentjobs.com/jobs?keywords=' + E(c.kw) + '&location=' + E(c.loc) },
    { name: isStan ? 'Stanislaus Workforce Development' : settings.county + ' Workforce / AJCC', desc: isStan ? 'Free local help, workshops and the America’s Job Center in Modesto.' : 'Free workforce help near ' + c.zip + ' — resume help, workshops, computers.', url: isStan ? 'https://www.stanworkforce.com/' : 'https://www.careeronestop.org/LocalHelp/AmericanJobCenters/american-job-centers.aspx?location=' + E(c.zip || c.city + ', CA') },
    { name: co.transit ? co.transit + ' — transit trip check' : 'Transit near ' + c.city, desc: 'Google Maps transit directions from home (' + c.loc + ') — check both directions at shift times.', url: busRouteUrl(c.loc, c.city + ', CA') },
    { name: 'EdJoin — School Jobs', desc: 'School district jobs in ' + settings.county + ' County: aides, custodial, food service, office.', url: 'https://www.edjoin.org/Home/SearchKeywords?searchKeyword=' + E(c.kw) }
  ];
  $('#countyResources').innerHTML = countyTrackSites.map((s, i) => '<article class="site-card"><span class="site-cat">' + esc(settings.county) + ' County</span><h4>' + esc(s.name) + '</h4><p>' + esc(s.desc) + '</p><div class="site-actions"><a class="btn btn-primary btn-sm" href="' + esc(safeUrl(s.url) || '#') + '" target="_blank" rel="noopener noreferrer">Open ↗</a></div></article>').join('');
  $('#helpWorkforceText').textContent = isStan ? 'Free job-search help, workshops, resume help and computer access. Stanislaus: Stanislaus Workforce Development (stanworkforce.com).' : ('Free help in ' + settings.county + ' County: your local America’s Job Center (AJCC) — resume help, workshops, computers. Find yours by ZIP (' + (c.zip || c.city) + ').');
  $('#helpWorkforceBtn').href = isStan ? 'https://www.stanworkforce.com/' : 'https://www.careeronestop.org/LocalHelp/AmericanJobCenters/american-job-centers.aspx?location=' + E(c.zip || c.city + ', CA');
  $('#helpWorkforceBtn').textContent = isStan ? 'stanworkforce.com ↗' : 'Find your AJCC ↗';
  $('#helpTransitBtn').href = busRouteUrl(c.loc, c.city + ', CA');
}

/* ---------------- Tracker ---------------- */
function renderStats() {
  $('#statTotal').textContent = apps.length;
  $('#statApplied').textContent = apps.filter((a) => a.status === 'Applied').length;
  $('#statInterviews').textContent = apps.filter((a) => a.status === 'Interview').length;
  $('#statOffers').textContent = apps.filter((a) => a.status === 'Offer').length;
  const od = apps.filter(isOverdue).length;
  $('#statOverdue').textContent = od; $('#statOverdueBox').classList.toggle('has-overdue', od > 0);
}
function filteredApps() {
  const q = ($('#trackSearch').value || '').toLowerCase(); const sf = $('#statusFilter').value; const tf = $('#transportFilter').value;
  const list = apps.filter((a) => {
    if (sf && a.status !== sf) return false; if (tf && a.transport !== tf) return false;
    if (q && ![a.title, a.company, a.location, a.pay, a.contact, a.notes, a.status].join(' ').toLowerCase().includes(q)) return false;
    return true;
  });
  const pri = { High: 0, Normal: 1, Low: 2 };
  return list.sort((a, b) => {
    const od = (isOverdue(b) ? 1 : 0) - (isOverdue(a) ? 1 : 0); if (od) return od;
    if (settings.sort === 'followup') return String(a.followUp || '9999').localeCompare(String(b.followUp || '9999'));
    if (settings.sort === 'priority') return (pri[a.priority] ?? 1) - (pri[b.priority] ?? 1);
    if (settings.sort === 'distance') return (parseFloat(a.distance) || 9999) - (parseFloat(b.distance) || 9999);
    return (b.createdAt || 0) - (a.createdAt || 0);
  });
}
function appCard(a, compact) {
  const overdue = isOverdue(a); const url = safeUrl(a.url); const tt = TRANSPORT_TAGS[a.transport] || TRANSPORT_TAGS.bus;
  const dest = [a.company, a.location].filter(Boolean).join(' ');
  const opts = STATUSES.map((s) => '<option ' + (s === a.status ? 'selected' : '') + '>' + s + '</option>').join('');
  if (compact) {
    return '<div class="board-card' + (overdue ? ' is-overdue' : '') + '"><h5>' + esc(a.title || 'Untitled') + '</h5><div>' + esc(a.company || '') + (a.location ? ' • ' + esc(a.location) : '') + '</div>' +
      '<div class="app-tags"><span class="tag ' + tt.cls + '">' + tt.tag + '</span>' + (overdue ? '<span class="tag tag-overdue">⚠ Overdue</span>' : '') + '</div>' +
      '<select data-status="' + esc(a.id) + '" aria-label="Status">' + opts + '</select> <button type="button" class="btn btn-ghost btn-sm" data-edit="' + esc(a.id) + '">✏ Edit</button></div>';
  }
  return '<article class="app-card status-' + esc(a.status) + (overdue ? ' is-overdue' : '') + '">' +
    '<div class="app-head"><div><h4>' + esc(a.title || 'Untitled job') + (a.company ? ' <span class="muted">@ ' + esc(a.company) + '</span>' : '') + '</h4><p class="app-meta">' + esc(a.location || 'Location not set') + (a.distance !== '' && a.distance != null ? ' • ' + esc(a.distance) + ' mi' : '') + (a.pay ? ' • ' + esc(a.pay) : '') + '</p></div><span class="tag tag-priority-' + esc(a.priority || 'Normal') + '">' + esc(a.priority || 'Normal') + ' priority</span></div>' +
    '<div class="app-tags"><span class="tag ' + tt.cls + '">' + tt.tag + '</span>' + (isFarJob(a) ? '<span class="tag tag-car">🚗 Usually needs a car</span>' : '') + (overdue ? '<span class="tag tag-overdue">⚠ Follow-up overdue (' + esc(a.followUp) + ')</span>' : '') + '</div>' +
    '<dl class="app-details">' + (a.dateApplied ? '<div><dt>Date applied</dt><dd>' + esc(a.dateApplied) + '</dd></div>' : '') + (a.followUp ? '<div><dt>Follow up by</dt><dd>' + esc(a.followUp) + '</dd></div>' : '') + (a.contact ? '<div><dt>Contact</dt><dd>' + esc(a.contact) + '</dd></div>' : '') + '</dl>' +
    (a.notes ? '<p class="app-notes">' + esc(a.notes) + '</p>' : '') +
    '<div class="app-actions"><label class="small" style="font-weight:700">Status: <select data-status="' + esc(a.id) + '">' + opts + '</select></label>' +
    (url ? '<a class="btn btn-secondary btn-sm" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">↗ View posting</a>' : '') +
    ((a.transport === 'bus' || a.transport === 'walk') ? '<a class="btn btn-bus btn-sm" href="' + esc(busRouteUrl(ctx().loc, dest || ctx().city + ', CA')) + '" target="_blank" rel="noopener noreferrer">🗺️ Check bus route</a>' : '') +
    '<button type="button" class="btn btn-ghost btn-sm" data-edit="' + esc(a.id) + '">✏ Edit</button><button type="button" class="btn btn-ghost btn-sm" data-dup="' + esc(a.id) + '">⧉ Copy</button><button type="button" class="btn btn-danger btn-sm" data-del="' + esc(a.id) + '">🗑 Delete</button></div></article>';
}
function renderApps() {
  renderStats();
  const list = filteredApps(); const board = settings.trackerView === 'board';
  $('#appsList').hidden = board; $('#boardView').hidden = !board;
  $('#appsList').innerHTML = board ? '' : list.map((a) => appCard(a, false)).join('');
  $('#boardView').innerHTML = board ? STATUSES.map((s) => { const inCol = list.filter((a) => a.status === s); return '<div class="board-col"><h4>' + s + ' (' + inCol.length + ')</h4>' + inCol.map((a) => appCard(a, true)).join('') + '</div>'; }).join('') : '';
  $('#emptyState').style.display = apps.length ? 'none' : 'block';
  const od = apps.filter(isOverdue).length;
  const dueSoon = apps.filter((a) => a.followUp && !isOverdue(a) && !['Offer','Rejected','Archived'].includes(a.status) && a.followUp <= todayISO(new Date(Date.now() + 7 * 864e5))).length;
  const appliedPool = apps.filter((a) => ['Applied','Interview','Offer'].includes(a.status)).length;
  const ivPool = apps.filter((a) => ['Interview','Offer'].includes(a.status)).length;
  const rate = appliedPool ? Math.round((ivPool / appliedPool) * 100) : 0;
  $('#trackerInsights').textContent = apps.length ? ('📊 ' + apps.length + ' tracked • ' + appliedPool + ' applied-or-further • Interview rate ' + rate + '% • ' + dueSoon + ' follow-up(s) due in 7 days' + (od ? ' • ⚠ ' + od + ' overdue' : '')) : '📊 Add your first job to see insights here.';
  $('#trackerCount').textContent = apps.length ? ('Showing ' + list.length + ' of ' + apps.length + ' tracked job(s).') : '';
  const goal = Math.max(1, Number(settings.weeklyGoal) || 5);
  const weekAgo = todayISO(new Date(Date.now() - 6 * 864e5));
  const done = apps.filter((a) => a.dateApplied && a.dateApplied >= weekAgo && a.status !== 'Saved').length;
  $('#goalFill').style.width = Math.min(100, Math.round((done / goal) * 100)) + '%';
  $('#goalText').textContent = done + ' / ' + goal + ' applications in the last 7 days' + (done >= goal ? ' — goal reached! 🎉' : '');
  renderFocus(done, goal);
}
function persistApps() { save(pkey(meta.activeId, 'apps'), apps); showSaved(); }

/* ---------------- Automations: Today's Focus, auto-save, smart paste ---------------- */
function addDaysISO(iso, n) { const d = new Date((iso || todayISO()) + 'T12:00:00'); d.setDate(d.getDate() + n); return todayISO(d); }
function showSaved() { const el = $('#autosavePill'); if (!el) return; const now = new Date(); el.textContent = '✓ Auto-saved on this device at ' + now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
function markBackup() { settings.lastBackupAt = Date.now(); persistSettings(); }
function renderFocus(doneCount, goalCount) {
  const el = $('#focusContent'); if (!el) return;
  const overdue = apps.filter(isOverdue).slice().sort((a, b) => String(a.followUp).localeCompare(String(b.followUp)));
  const in7 = addDaysISO(todayISO(), 7);
  const dueSoon = apps.filter((a) => a.followUp && !isOverdue(a) && !['Offer','Rejected','Archived'].includes(a.status) && a.followUp <= in7);
  const savedOnly = apps.filter((a) => a.status === 'Saved');
  const staleCut = Date.now() - 14 * 864e5;
  const stale = savedOnly.filter((a) => (a.createdAt || Date.now()) < staleCut);
  const lastBackup = Number(settings.lastBackupAt) || 0;
  const backupDue = apps.length >= 3 && (!lastBackup || Date.now() - lastBackup > 14 * 864e5);
  const c = ctx(); const sites = allSites();
  const quick = ['indeed', 'google', 'ziprecruiter'].map((id) => sites.find((s) => s.id === id)).filter(Boolean)
    .map((s) => '<a class="btn btn-secondary btn-sm" href="' + esc(safeUrl(s.url(c)) || '#') + '" target="_blank" rel="noopener noreferrer">' + esc(s.name) + ': “' + esc(c.kw) + '” ↗</a>').join(' ');
  const next = overdue.length
    ? { text: 'Follow up on <strong>' + esc(overdue[0].title || 'your overdue job') + '</strong>' + (overdue[0].company ? ' @ ' + esc(overdue[0].company) : '') + ' — it was due ' + esc(overdue[0].followUp) + '.', href: '#tracker', label: 'Go to tracker →' }
    : savedOnly.length
      ? { text: 'Apply to <strong>' + esc(savedOnly[0].title || 'a saved job') + '</strong>' + (savedOnly[0].company ? ' @ ' + esc(savedOnly[0].company) : '') + ' — saved jobs don’t count until you apply.', href: '#tracker', label: 'Apply next →' }
      : { text: 'Search <strong>“' + esc(c.kw) + '”</strong> near ' + esc(c.loc) + ' and track 3 good postings.', href: '#find', label: 'Find jobs →' };
  el.innerHTML =
    '<div class="focus-grid">' +
      '<div class="focus-tile ' + (overdue.length ? 'danger' : 'ok') + '"><h3>⚠ Follow-ups overdue</h3><p class="big">' + overdue.length + '</p><p>' + (overdue.length ? esc(overdue.slice(0, 3).map((a) => (a.title || 'Job') + (a.company ? ' @ ' + a.company : '')).join(' • ')) : 'Nothing overdue. Nice and clean.') + '</p></div>' +
      '<div class="focus-tile ' + (dueSoon.length ? 'warn' : 'ok') + '"><h3>📅 Due in next 7 days</h3><p class="big">' + dueSoon.length + '</p><p>' + (dueSoon.length ? esc(dueSoon.slice(0, 3).map((a) => (a.title || 'Job') + ' (' + a.followUp + ')').join(' • ')) : 'No follow-ups coming up this week.') + '</p></div>' +
      '<div class="focus-tile ' + (savedOnly.length ? 'warn' : 'ok') + '"><h3>📌 Saved, not applied</h3><p class="big">' + savedOnly.length + '</p><p>' + (stale.length ? stale.length + ' saved 14+ days ago — apply or archive them.' : savedOnly.length ? 'Pick the best one and apply today.' : 'Save postings with ＋ Track as you search.') + '</p></div>' +
      '<div class="focus-tile ' + (backupDue ? 'warn' : 'ok') + '"><h3>🎯 Weekly goal & backup</h3><p class="big">' + (doneCount || 0) + ' / ' + (goalCount || 5) + '</p><p>' + (backupDue ? '⚠ No recent backup — use Backup (JSON) in My Tracker today.' : 'Applications in the last 7 days. Backups are up to date.') + '</p></div>' +
    '</div>' +
    '<div class="focus-next"><span>⚡ <strong>Next best action:</strong> ' + next.text + '</span><a class="btn btn-primary btn-sm" href="' + next.href + '">' + next.label + '</a>' + (quick ? '<span style="display:flex;gap:6px;flex-wrap:wrap">' + quick + '</span>' : '') + '</div>';
  maybeNotify(overdue);
}
function maybeNotify(overdue) {
  try {
    if (!overdue.length || !('Notification' in window) || Notification.permission !== 'granted') return;
    const key = 'sjf.v2.lastNotify';
    if (localStorage.getItem(key) === todayISO()) return;
    localStorage.setItem(key, todayISO());
    new Notification('California Job Finder', { body: overdue.length + ' follow-up(s) overdue — open Today’s Focus to catch up.' });
  } catch (e) { /* notifications are optional */ }
}
function parsePaste(text) {
  const raw = String(text || ''); const out = {};
  const urlMatch = raw.match(/https?:\/\/[^\s)]+/i); if (urlMatch) out.url = urlMatch[0].replace(/[.,;]+$/, '');
  const lines = raw.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  const labeled = (names) => { for (const line of lines) { const m = line.match(new RegExp('^(' + names + ')\\s*[:\\-]\\s*(.+)$', 'i')); if (m) return m[2].trim(); } return ''; };
  out.title = labeled('job title|title|position|role');
  out.company = labeled('company|employer|organization|organisation');
  out.location = labeled('location|city');
  out.pay = labeled('pay|salary|compensation|wage|rate');
  if (!out.pay) { const pm = raw.match(/\$\s?\d[\d,]*(?:\.\d{1,2})?(?:\s*[-–]\s*\$\s?\d[\d,]*(?:\.\d{1,2})?)?\s*(?:\/\s?hr|\/\s?hour|per hour|an hour|hourly|\/\s?yr|per year|annually)?/i); if (pm) out.pay = pm[0].replace(/\s+/g, ' ').trim(); }
  if (!out.location) { const lm = raw.match(/([A-Za-z][A-Za-z .'-]+,\s*CA\s*\d{5})/); if (lm) out.location = lm[1]; }
  if (!out.location && /\b(remote|work from home|work-from-home|wfh)\b/i.test(raw)) out.location = 'Remote';
  const dm = raw.match(/(\d+(?:\.\d+)?)\s*(?:mi|miles?)\b/i); if (dm) out.distance = dm[1];
  if (!out.company) { const cm = raw.match(/\b(?:at|@|—|–|-)\s+([A-Z][A-Za-z0-9&.' ]{2,40}?)(?:\s+(?:in|near)\s+|\s*[,•|]|$)/); if (cm && !out.title) { /* company only if not swallowing title */ } else if (cm) out.company = cm[1].trim(); }
  if (!out.title) {
    const dash = raw.match(/^(.{3,70}?)\s+(?:—|–|\||@)\s+/m);
    const candidate = (dash && dash[1]) || lines.find((l) => l.length >= 3 && l.length <= 80 && !/^https?:/i.test(l) && !/apply|easy apply|job type|full[- ]time|part[- ]time/i.test(l));
    if (candidate) out.title = candidate.trim();
    if (out.title && out.url && /^https?:/i.test(out.title)) out.title = '';
  }
  if (!out.title && out.url) { try { const seg = new URL(out.url).pathname.split('/').filter(Boolean).pop() || ''; const human = decodeURIComponent(seg).replace(/\.(html?|aspx)$/i, '').replace(/[-_]+/g, ' ').replace(/\b\d+\b/g, '').trim(); if (human.length >= 3) out.title = titleCase(human).slice(0, 80); } catch (e) {} }
  out.remote = /\b(remote|work from home|work-from-home|wfh)\b/i.test(raw);
  return out;
}

/* ---------------- Form ---------------- */
function resetForm() { $('#jobForm').reset(); $('#editId').value = ''; $('#fTransport').value = 'bus'; $('#fStatus').value = 'Saved'; $('#fPriority').value = 'Normal'; $('#formTitle').textContent = '＋ Add a job'; $('#submitBtn').textContent = '＋ Add job'; $('#cancelEditBtn').hidden = true; $('#jobForm').classList.remove('editing'); $('#formCarWarning').hidden = true; }
function fillForm(a) { $('#editId').value = a.id; $('#fTitle').value = a.title || ''; $('#fCompany').value = a.company || ''; $('#fLocation').value = a.location || ''; $('#fDistance').value = a.distance == null ? '' : a.distance; $('#fPay').value = a.pay || ''; $('#fTransport').value = a.transport || 'bus'; $('#fUrl').value = a.url || ''; $('#fStatus').value = a.status || 'Saved'; $('#fPriority').value = a.priority || 'Normal'; $('#fApplied').value = a.dateApplied || ''; $('#fFollow').value = a.followUp || ''; $('#fContact').value = a.contact || ''; $('#fNotes').value = a.notes || ''; $('#formTitle').textContent = '✏ Edit job'; $('#submitBtn').textContent = '💾 Save changes'; $('#cancelEditBtn').hidden = false; $('#jobForm').classList.add('editing'); updateFormWarning(); }
function updateFormWarning() { const d = parseFloat($('#fDistance').value); $('#formCarWarning').hidden = !(isFarJob({ location: $('#fLocation').value, distance: isNaN(d) ? '' : d, transport: $('#fTransport').value })); }
function prefillFromSite(site) { const c = ctx(); resetForm(); $('#fTitle').value = titleCase(c.kw); $('#fUrl').value = safeUrl(site.url(c)); $('#fNotes').value = 'Found via ' + site.name + ' — open Search, pick a real posting, then update title/company here.'; $('#fTransport').value = site.cat === 'remote' || c.kw.toLowerCase().includes('remote') ? 'remote' : settings.transport === 'walkbike' ? 'walk' : settings.transport === 'car' ? 'car' : 'bus'; $('#formTitle').textContent = '＋ Track a job from ' + site.name; document.getElementById('tracker').scrollIntoView({ behavior:'smooth' }); setTimeout(() => $('#fTitle').focus(), 350); }

/* ---------------- Weekly / readiness / saved searches ---------------- */
function renderWeek() { $('#weekGrid').innerHTML = WEEK.map((d, di) => '<div class="day-card"><h3>' + esc(prefs.lang === 'es' ? d.dayEs : d.day) + '</h3>' + d.tasks.map((task, ti) => { const key = di + '-' + ti; const on = !!weekState[key]; return '<label class="' + (on ? 'done' : '') + '"><input type="checkbox" data-week="' + key + '" ' + (on ? 'checked' : '') + '><span>' + esc(task) + '</span></label>'; }).join('') + '</div>').join(''); }
function renderReadiness() {
  $('#readinessList').innerHTML = READINESS.map((r) => { const on = !!(settings.readiness || {})[r.id]; return '<label class="' + (on ? 'done' : '') + '"><input type="checkbox" data-ready="' + r.id + '" ' + (on ? 'checked' : '') + '><span>' + esc(prefs.lang === 'es' ? r.es : r.en) + '</span></label>'; }).join('');
  const done = READINESS.filter((r) => (settings.readiness || {})[r.id]).length;
  $('#readinessFill').style.width = Math.round((done / READINESS.length) * 100) + '%';
  $('#readinessText').textContent = done + ' / ' + READINESS.length + (prefs.lang === 'es' ? ' listos' : ' ready') + (done === READINESS.length ? ' 🎉' : '');
}
function renderSavedSearches() {
  $('#savedSearches').innerHTML = (settings.savedSearches || []).map((s) => '<span class="saved-chip"><button type="button" class="apply" data-saved="' + esc(s.id) + '">⭐ ' + esc(s.label) + '</button><button type="button" class="del" data-saved-del="' + esc(s.id) + '" aria-label="Delete saved search">×</button></span>').join('');
}
function renderProfiles() {
  $('#profileSelect').innerHTML = meta.profiles.map((p) => '<option value="' + esc(p.id) + '" ' + (p.id === meta.activeId ? 'selected' : '') + '>' + esc(p.name) + '</option>').join('');
  $('#activeProfileName').textContent = activeProfile() ? activeProfile().name : '';
}
function syncControls() {
  renderProfiles();
  $('#countySelect').value = settings.county; $('#cityInput').value = settings.city; $('#zipInput').value = settings.zip;
  $('#transportSelect').value = settings.transport; $('#workTypeSelect').value = settings.workType; $('#experienceSelect').value = settings.experience || 'entry';
  $('#keywordInput').value = settings.keyword; $('#siteFilter').value = settings.siteFilter || ''; $('#favOnly').checked = !!settings.favOnly;
  $('#goalInput').value = settings.weeklyGoal || 5; $('#trackerView').value = settings.trackerView || 'list'; $('#sortSelect').value = settings.sort || 'newest';
  $$('#chips .chip').forEach((ch) => ch.classList.toggle('is-active', ch.dataset.keyword === (settings.keyword || '').trim().toLowerCase()));
  $('#chipWarning').hidden = !/delivery driver/i.test(settings.keyword || '');
}
function persistSettings() { save(pkey(meta.activeId, 'settings'), settings); }
function applySettings() { persistSettings(); renderLocation(); renderSites(); renderCounty(); }
function renderAll() { syncControls(); applyI18n(); renderBanner(); renderLocation(); renderSites(); renderCounty(); renderApps(); renderWeek(); renderReadiness(); renderSavedSearches(); renderAdmin(); }

/* ---------------- Backup / restore ---------------- */
function gatherAll() { saveCurrent(); const profilesData = {}; meta.profiles.forEach((p) => { profilesData[p.id] = { settings: store(pkey(p.id, 'settings'), {}), apps: store(pkey(p.id, 'apps'), []), week: store(pkey(p.id, 'week'), {}) }; }); return { format:'sjf-backup', app:'Stanislaus Job Finder / California Job Finder', version:2, exportedAt:new Date().toISOString(), meta, profilesData, publicConfig, prefs }; }
function restoreData(data) {
  if (data && data.format === 'sjf-backup' && data.meta && data.profilesData) {
    meta = data.meta; Object.keys(data.profilesData).forEach((id) => { save(pkey(id, 'settings'), data.profilesData[id].settings || {}); save(pkey(id, 'apps'), data.profilesData[id].apps || []); save(pkey(id, 'week'), data.profilesData[id].week || {}); });
    save(LS_META, meta); if (data.publicConfig) { publicConfig = data.publicConfig; savePublic(); } if (data.prefs) { prefs = Object.assign(prefs, data.prefs); savePrefs(); applyPrefs(); }
    loadProfileData(meta.activeId); renderAll(); return true;
  }
  const incoming = Array.isArray(data) ? data : data && data.apps;
  if (Array.isArray(incoming)) {
    apps = incoming.filter((a) => a && typeof a === 'object').map((a) => sanitizeApp(a));
    if (!Array.isArray(data) && data.settings) settings = Object.assign({}, DEFAULT_SETTINGS, data.settings);
    if (!Array.isArray(data) && data.week) weekState = data.week;
    saveCurrent(); renderAll(); return true;
  }
  return false;
}
function csvCell(v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }

/* ---------------- Admin: AES-256-GCM vault (Web Crypto) ---------------- */
const ADMIN_ITER = 600000; const LEGACY_ITER = 310000;
let adminSession = null, adminVaultData = null, adminLockTimer = null;
const cryptoOK = !!(window.crypto && crypto.subtle && crypto.getRandomValues);
const te = typeof TextEncoder !== 'undefined' ? new TextEncoder() : { encode: (s) => Uint8Array.from(unescape(encodeURIComponent(s)), (ch) => ch.charCodeAt(0)) };
const td = typeof TextDecoder !== 'undefined' ? new TextDecoder() : { decode: (buf) => decodeURIComponent(escape(String.fromCharCode(...new Uint8Array(buf)))) };
function b64(buf) { const bytes = new Uint8Array(buf); let s = ''; bytes.forEach((b) => { s += String.fromCharCode(b); }); return btoa(s); }
function unb64(s) { const bin = atob(s); const bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i); return bytes; }
async function deriveKey(password, saltBytes, iterations) { const base = await crypto.subtle.importKey('raw', te.encode(password), 'PBKDF2', false, ['deriveKey']); return crypto.subtle.deriveKey({ name:'PBKDF2', salt: saltBytes, iterations: iterations || ADMIN_ITER, hash:'SHA-256' }, base, { name:'AES-GCM', length:256 }, false, ['encrypt','decrypt']); }
function adminThrottleGet() { try { return JSON.parse(sessionStorage.getItem('sjf.v2.adminThrottle') || '{}'); } catch (e) { return {}; } }
function adminThrottleSet(v) { try { if (v) sessionStorage.setItem('sjf.v2.adminThrottle', JSON.stringify(v)); else sessionStorage.removeItem('sjf.v2.adminThrottle'); } catch (e) {} }
async function encryptJSON(key, obj) { const iv = crypto.getRandomValues(new Uint8Array(12)); const ct = await crypto.subtle.encrypt({ name:'AES-GCM', iv }, key, te.encode(JSON.stringify(obj))); return { iv: b64(iv), data: b64(ct) }; }
async function decryptJSON(key, ivB64, dataB64) { const pt = await crypto.subtle.decrypt({ name:'AES-GCM', iv: unb64(ivB64) }, key, unb64(dataB64)); return JSON.parse(td.decode(pt)); }
function getVault() { return store(LS_ADMIN, null); }
async function writeVault() { const vault = getVault(); const enc = await encryptJSON(adminSession.key, adminVaultData); save(LS_ADMIN, { v:1, salt: adminSession.salt, iv: enc.iv, data: enc.data, iterations: adminSession.iterations || ADMIN_ITER, updatedAt: new Date().toISOString() }); }
function lockAdmin(silent) { adminSession = null; adminVaultData = null; if (adminLockTimer) clearTimeout(adminLockTimer); const n = $('#adminNotes'); if (n) n.value = ''; const p = $('#adminPassword'); if (p) p.value = ''; renderAdmin(); if (!silent) { /* status rendered */ } }
function armAutoLock() { if (adminLockTimer) clearTimeout(adminLockTimer); adminLockTimer = setTimeout(() => { lockAdmin(true); alert('Admin auto-locked after 10 minutes.'); }, 10 * 60 * 1000); }
function renderAdmin() {
  const vault = getVault();
  $('#adminSetup').hidden = !(cryptoOK && !vault);
  $('#adminUnlock').hidden = !(cryptoOK && vault && !adminSession);
  $('#adminPanel').hidden = !(cryptoOK && vault && adminSession);
  $('#adminLockState').textContent = !cryptoOK ? '⚠ This browser does not offer Web Crypto here, so the encrypted admin vault is unavailable (try a current browser over HTTPS or a local file).' : !vault ? '🔐 No admin vault yet — create one below.' : adminSession ? '🔓 Admin is UNLOCKED. Lock it when you’re done.' : '🔒 Admin is locked.';
  if (adminSession && adminVaultData) {
    $('#bannerEnabled').checked = !!publicConfig.bannerEnabled; $('#bannerText').value = publicConfig.bannerText || '';
    $('#adminNotes').value = adminVaultData.privateNotes || '';
    $('#adminCountySelect').value = settings.county; $('#adminCountyNote').value = (publicConfig.countyNotes || {})[$('#adminCountySelect').value] || '';
    renderAdminLists();
  }
}
function renderAdminLists() {
  $('#customSitesList').innerHTML = (publicConfig.customSites || []).map((cs) => '<div class="custom-row"><span><strong>' + esc(cs.name) + '</strong> — ' + esc(cs.desc || '') + '<br><span class="small muted">' + esc(cs.template) + '</span></span><button type="button" class="btn btn-danger btn-sm" data-custom-del="' + esc(cs.id) + '">Delete</button></div>').join('') || '<p class="muted small">No custom sites yet.</p>';
  $('#siteVisibilityList').innerHTML = SITES.map((s) => { const hiddenSite = (publicConfig.hiddenSiteIds || []).includes(s.id); return '<label><input type="checkbox" data-site-vis="' + esc(s.id) + '" ' + (!hiddenSite ? 'checked' : '') + '> ' + esc(s.name) + '</label>'; }).join('');
  let bytes = 0; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); bytes += (localStorage.getItem(k) || '').length + (k || '').length; }
  const perProfile = meta.profiles.map((p) => p.name + ': ' + store(pkey(p.id, 'apps'), []).length + ' job(s)').join(' • ');
  $('#adminDiag').textContent = 'Profiles: ' + perProfile + ' | Visible built-in sites: ' + allSites().length + ' (incl. custom) | localStorage used: ~' + Math.round(bytes / 1024) + ' KB | Vault created/updated: ' + (adminVaultData.createdAt || '—') + ' / ' + (adminVaultData.updatedAt || '—') + ' | County: ' + settings.county + ' | Profile: ' + (activeProfile() || {}).name;
}

/* ---------------- Init / events ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  initProfiles();
  const countyOptions = COUNTIES.map((c) => '<option value="' + esc(c.name) + '">' + esc(c.name) + ' County</option>').join('');
  $('#countySelect').innerHTML = countyOptions; $('#adminCountySelect').innerHTML = countyOptions;
  applyPrefs(); renderAll();

  /* display prefs */
  $('#langToggle').addEventListener('click', () => { prefs.lang = prefs.lang === 'es' ? 'en' : 'es'; savePrefs(); applyPrefs(); renderAll(); });
  $('#fontToggle').addEventListener('click', () => { prefs.large = !prefs.large; savePrefs(); applyPrefs(); });
  $('#contrastToggle').addEventListener('click', () => { prefs.contrast = !prefs.contrast; savePrefs(); applyPrefs(); });

  /* profiles */
  $('#profileSelect').addEventListener('change', (e) => { saveCurrent(); meta.activeId = e.target.value; save(LS_META, meta); loadProfileData(meta.activeId); renderAll(); resetForm(); });
  $('#newProfileBtn').addEventListener('click', () => {
    const name = (prompt(prefs.lang === 'es' ? 'Nombre del perfil nuevo:' : 'Name for the new profile:', '') || '').trim(); if (!name) return;
    const id = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    saveCurrent(); meta.profiles.push({ id, name, createdAt: Date.now() }); meta.activeId = id;
    save(pkey(id, 'settings'), Object.assign({}, settings, { favoriteSiteIds: [], savedSearches: [], readiness: {}, keyword: 'entry level' }));
    save(pkey(id, 'apps'), []); save(pkey(id, 'week'), {}); save(LS_META, meta); loadProfileData(id); renderAll(); resetForm();
  });
  $('#renameProfileBtn').addEventListener('click', () => { const p = activeProfile(); const name = (prompt('Rename profile:', p.name) || '').trim(); if (name) { p.name = name; save(LS_META, meta); renderProfiles(); renderAdminListsSafe(); } });
  $('#deleteProfileBtn').addEventListener('click', () => {
    if (meta.profiles.length <= 1) { if (confirm('Erase this only profile’s tracker, settings and weekly plan?')) { localStorage.removeItem(pkey(meta.activeId, 'settings')); localStorage.removeItem(pkey(meta.activeId, 'apps')); localStorage.removeItem(pkey(meta.activeId, 'week')); loadProfileData(meta.activeId); renderAll(); resetForm(); } return; }
    if (!confirm('Delete profile “' + activeProfile().name + '” and all its tracked jobs? This cannot be undone.')) return;
    const id = meta.activeId; localStorage.removeItem(pkey(id, 'settings')); localStorage.removeItem(pkey(id, 'apps')); localStorage.removeItem(pkey(id, 'week'));
    meta.profiles = meta.profiles.filter((p) => p.id !== id); meta.activeId = meta.profiles[0].id; save(LS_META, meta); loadProfileData(meta.activeId); renderAll(); resetForm();
  });
  function renderAdminListsSafe() { if (adminSession) renderAdminLists(); }

  /* setup */
  $('#countySelect').addEventListener('change', (e) => { const oldSeat = countyObj(settings.county).seat; settings.county = e.target.value; const co = countyObj(settings.county); if (!settings.city || settings.city === oldSeat) { settings.city = co.seat; $('#cityInput').value = settings.city; } applySettings(); });
  $('#cityInput').addEventListener('input', (e) => { settings.city = e.target.value; applySettings(); });
  $('#zipInput').addEventListener('input', (e) => { settings.zip = e.target.value.replace(/\D/g, '').slice(0, 5); e.target.value = settings.zip; applySettings(); });
  $('#useSeatBtn').addEventListener('click', () => { settings.city = countyObj(settings.county).seat; $('#cityInput').value = settings.city; applySettings(); $('#zipInput').focus(); });
  $('#transportSelect').addEventListener('change', (e) => { settings.transport = e.target.value; applySettings(); });
  $('#workTypeSelect').addEventListener('change', (e) => { settings.workType = e.target.value; applySettings(); });
  $('#experienceSelect').addEventListener('change', (e) => { settings.experience = e.target.value; persistSettings(); });
  $('#keywordInput').addEventListener('input', (e) => { settings.keyword = e.target.value; $$('#chips .chip').forEach((ch) => ch.classList.toggle('is-active', ch.dataset.keyword === settings.keyword.trim().toLowerCase())); $('#chipWarning').hidden = !/delivery driver/i.test(settings.keyword); applySettings(); });
  $('#siteFilter').addEventListener('input', (e) => { settings.siteFilter = e.target.value; persistSettings(); renderSites(); });
  $('#favOnly').addEventListener('change', (e) => { settings.favOnly = e.target.checked; persistSettings(); renderSites(); });
  $('#chips').addEventListener('click', (e) => { const chip = e.target.closest('.chip'); if (!chip) return; settings.keyword = chip.dataset.keyword; $('#keywordInput').value = settings.keyword; $$('#chips .chip').forEach((ch) => ch.classList.toggle('is-active', ch === chip)); $('#chipWarning').hidden = chip.dataset.warn !== 'true'; applySettings(); });
  $('#saveSearchBtn').addEventListener('click', () => { const c = ctx(); const label = (prompt('Name this saved search:', c.kw + ' • ' + c.city) || '').trim(); if (!label) return; settings.savedSearches = settings.savedSearches || []; settings.savedSearches.push({ id: 's' + Date.now().toString(36), label, keyword: c.kw, county: settings.county, city: settings.city, zip: settings.zip, transport: settings.transport, workType: settings.workType }); persistSettings(); renderSavedSearches(); });
  $('#savedSearches').addEventListener('click', (e) => {
    const apply = e.target.closest('[data-saved]'); const del = e.target.closest('[data-saved-del]');
    if (apply) { const s = (settings.savedSearches || []).find((x) => x.id === apply.dataset.saved); if (s) { Object.assign(settings, { keyword: s.keyword, county: s.county, city: s.city, zip: s.zip, transport: s.transport, workType: s.workType }); applySettings(); syncControls(); } }
    if (del) { settings.savedSearches = (settings.savedSearches || []).filter((x) => x.id !== del.dataset.savedDel); persistSettings(); renderSavedSearches(); }
  });
  $('#readinessList').addEventListener('change', (e) => { const box = e.target.closest('[data-ready]'); if (!box) return; settings.readiness = settings.readiness || {}; settings.readiness[box.dataset.ready] = box.checked; persistSettings(); renderReadiness(); });

  /* site track + favorite + county open */
  document.addEventListener('click', (e) => {
    const tr = e.target.closest('[data-track]'); if (tr) { const site = allSites().find((s) => s.id === tr.dataset.track); if (site) prefillFromSite(site); return; }
    const fv = e.target.closest('[data-fav]'); if (fv) { const id = fv.dataset.fav; settings.favoriteSiteIds = settings.favoriteSiteIds || []; settings.favoriteSiteIds = settings.favoriteSiteIds.includes(id) ? settings.favoriteSiteIds.filter((x) => x !== id) : settings.favoriteSiteIds.concat(id); persistSettings(); renderSites(); }
  });

  /* tracker tools */
  $('#goalInput').addEventListener('input', (e) => { settings.weeklyGoal = Number(e.target.value) || 5; persistSettings(); renderApps(); });
  $('#trackerView').addEventListener('change', (e) => { settings.trackerView = e.target.value; persistSettings(); renderApps(); });
  $('#sortSelect').addEventListener('change', (e) => { settings.sort = e.target.value; persistSettings(); renderApps(); });
  ['trackSearch','statusFilter','transportFilter'].forEach((id) => { $('#' + id).addEventListener('input', renderApps); $('#' + id).addEventListener('change', renderApps); });

  $('#jobForm').addEventListener('submit', (e) => {
    e.preventDefault(); const title = $('#fTitle').value.trim(); if (!title) { alert('Please add a job title first.'); $('#fTitle').focus(); return; }
    const data = { title, company: $('#fCompany').value.trim(), location: $('#fLocation').value.trim(), distance: $('#fDistance').value === '' ? '' : Number($('#fDistance').value), pay: $('#fPay').value.trim(), transport: $('#fTransport').value, url: $('#fUrl').value.trim(), status: $('#fStatus').value, priority: $('#fPriority').value, dateApplied: $('#fApplied').value, followUp: $('#fFollow').value, contact: $('#fContact').value.trim(), notes: $('#fNotes').value.trim() };
    /* Automations: auto follow-up (+7 days), auto status, duplicate warning */
    if (data.dateApplied && !data.followUp) data.followUp = addDaysISO(data.dateApplied, 7);
    if (data.dateApplied && data.status === 'Saved') data.status = 'Applied';
    const editId = $('#editId').value;
    const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const dupe = apps.find((a) => String(a.id) !== String(editId) && norm(a.title) === norm(data.title) && norm(a.company) === norm(data.company) && norm(a.company) !== '');
    if (dupe && !confirm('This looks like a duplicate of “' + dupe.title + '”' + (dupe.company ? ' @ ' + dupe.company : '') + ' already in your tracker. Save it anyway?')) return;
    if (editId) { const i = apps.findIndex((a) => String(a.id) === String(editId)); if (i >= 0) apps[i] = Object.assign({}, apps[i], data); }
    else apps.unshift(Object.assign({ id: String(Date.now()) + '-' + Math.random().toString(36).slice(2, 7), createdAt: Date.now() }, data));
    persistApps(); renderApps(); resetForm();
  });
  $('#cancelEditBtn').addEventListener('click', resetForm);
  ['fLocation','fDistance','fTransport'].forEach((id) => { $('#' + id).addEventListener('input', updateFormWarning); $('#' + id).addEventListener('change', updateFormWarning); });
  /* Automation: picking a Date Applied auto-suggests a follow-up 7 days later */
  $('#fApplied').addEventListener('change', (e) => { if (e.target.value && !$('#fFollow').value) $('#fFollow').value = addDaysISO(e.target.value, 7); });
  /* Automation: Smart Paste auto-fill */
  $('#autofillBtn').addEventListener('click', () => {
    const parsed = parsePaste($('#pasteText').value);
    if (!Object.keys(parsed).length || (!parsed.title && !parsed.url)) { alert('Could not detect a job in that paste. Try pasting the posting text (title, company, location, pay) or its link.'); return; }
    if (parsed.title) $('#fTitle').value = parsed.title;
    if (parsed.company) $('#fCompany').value = parsed.company;
    if (parsed.location) $('#fLocation').value = parsed.location;
    if (parsed.distance) $('#fDistance').value = parsed.distance;
    if (parsed.pay) $('#fPay').value = parsed.pay;
    if (parsed.url) $('#fUrl').value = parsed.url;
    if (parsed.remote) { $('#fTransport').value = 'remote'; if (!parsed.location) $('#fLocation').value = 'Remote'; }
    updateFormWarning();
    $('#fTitle').focus();
  });
  /* Automation: due-date browser reminders (only while this page can ask/show them) */
  $('#notifyBtn').addEventListener('click', async () => {
    if (!('Notification' in window)) { alert('This browser does not support notifications. The red overdue counters still work without them.'); return; }
    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') { localStorage.removeItem('sjf.v2.lastNotify'); renderApps(); alert('Reminders on: while this page is open, you’ll get a daily nudge when follow-ups are overdue.'); }
      else alert('Notifications were not allowed. You can enable them later in your browser’s site settings.');
    } catch (e) { alert('Could not enable notifications in this browser.'); }
  });

  $('#trackerResults').addEventListener('change', (e) => { const sel = e.target.closest('[data-status]'); if (!sel) return; const a = apps.find((x) => String(x.id) === String(sel.dataset.status)); if (a) { a.status = sel.value; persistApps(); renderApps(); } });
  $('#trackerResults').addEventListener('click', (e) => {
    const ed = e.target.closest('[data-edit]'); const del = e.target.closest('[data-del]'); const dup = e.target.closest('[data-dup]');
    if (ed) { const a = apps.find((x) => String(x.id) === String(ed.dataset.edit)); if (a) { fillForm(a); $('#jobForm').scrollIntoView({ behavior:'smooth' }); } }
    if (dup) { const a = apps.find((x) => String(x.id) === String(dup.dataset.dup)); if (a) { apps.unshift(Object.assign({}, a, { id: String(Date.now()) + '-' + Math.random().toString(36).slice(2, 7), createdAt: Date.now(), status:'Saved' })); persistApps(); renderApps(); } }
    if (del) { const a = apps.find((x) => String(x.id) === String(del.dataset.del)); if (a && confirm('Delete “' + (a.title || 'this job') + '”?')) { apps = apps.filter((x) => String(x.id) !== String(del.dataset.del)); persistApps(); renderApps(); if ($('#editId').value === String(del.dataset.del)) resetForm(); } }
  });

  /* exports / restore */
  $('#exportCsvBtn').addEventListener('click', () => { if (!apps.length) { alert('No tracked jobs yet.'); return; } const head = ['Job Title','Company','Location','Distance (miles)','Pay','How I’d get there','Job Posting URL','Status','Priority','Date Applied','Follow-up Date','Contact','Notes','Profile','County','City','ZIP']; const rows = apps.map((a) => [a.title,a.company,a.location,a.distance,a.pay,(TRANSPORT_TAGS[a.transport]||{}).tag || a.transport,a.url,a.status,a.priority,a.dateApplied,a.followUp,a.contact,a.notes,(activeProfile()||{}).name,settings.county,settings.city,settings.zip].map(csvCell).join(',')); download('california-job-applications.csv', [head.map(csvCell).join(',')].concat(rows).join('\r\n'), 'text/csv;charset=utf-8'); });
  $('#backupBtn').addEventListener('click', () => { download('california-job-finder-backup-' + todayISO() + '.json', JSON.stringify(gatherAll(), null, 2), 'application/json'); markBackup(); renderApps(); });
  $('#restoreInput').addEventListener('change', (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { try { const data = JSON.parse(String(r.result || '')); if (!confirm('Restore this backup? It replaces the data described in the file.')) return; if (!restoreData(data)) throw new Error('Unrecognized backup file.'); alert('Backup restored.'); } catch (err) { alert('Could not restore: ' + err.message); } }; r.readAsText(f); e.target.value = ''; });

  /* weekly */
  $('#weekGrid').addEventListener('change', (e) => { const box = e.target.closest('[data-week]'); if (!box) return; weekState[box.dataset.week] = box.checked; save(pkey(meta.activeId, 'week'), weekState); renderWeek(); });
  $('#printBtn').addEventListener('click', () => window.print());
  $('#resetWeekBtn').addEventListener('click', () => { if (confirm('Uncheck every day?')) { weekState = {}; save(pkey(meta.activeId, 'week'), weekState); renderWeek(); } });

  /* ---------------- Admin events ---------------- */
  $('#createVaultBtn').addEventListener('click', async () => {
    if (!cryptoOK) { alert('Web Crypto is not available in this browser/context.'); return; }
    const p1 = $('#adminNewPassword').value, p2 = $('#adminNewPassword2').value;
    if (p1.length < 10) { alert('Use at least 10 characters — longer is better.'); return; } if (p1 !== p2) { alert('Passwords do not match.'); return; }
    const salt = crypto.getRandomValues(new Uint8Array(16)); const key = await deriveKey(p1, salt);
    adminSession = { key, salt: b64(salt), iterations: ADMIN_ITER }; adminVaultData = { privateNotes:'', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await writeVault(); $('#adminNewPassword').value = ''; $('#adminNewPassword2').value = ''; armAutoLock(); renderAdmin(); alert('Encrypted admin vault created and unlocked.');
  });
  $('#unlockVaultBtn').addEventListener('click', async () => {
    const vault = getVault(); if (!vault) return;
    const th = adminThrottleGet();
    if (th.until && th.until > Date.now()) { alert('Too many wrong tries. Wait ' + Math.ceil((th.until - Date.now()) / 1000) + ' seconds and try again.'); return; }
    try { const iter = Number(vault.iterations) || LEGACY_ITER; const key = await deriveKey($('#adminPassword').value, unb64(vault.salt), iter); adminVaultData = await decryptJSON(key, vault.iv, vault.data); adminSession = { key, salt: vault.salt, iterations: iter }; adminThrottleSet(null); armAutoLock(); renderAdmin(); }
    catch (e) { adminSession = null; adminVaultData = null; const fails = (th.fails || 0) + 1; const waitMs = Math.min(30000, 1000 * Math.pow(2, fails)); adminThrottleSet({ fails, until: Date.now() + waitMs }); alert('Wrong password — vault stayed locked. Next try allowed in ' + Math.round(waitMs / 1000) + 's.'); renderAdmin(); }
  });
  $('#lockVaultBtn').addEventListener('click', () => lockAdmin(false));
  $('#saveVaultBtn').addEventListener('click', async () => { if (!adminSession) return; adminVaultData.privateNotes = $('#adminNotes').value; adminVaultData.updatedAt = new Date().toISOString(); await writeVault(); armAutoLock(); renderAdminLists(); alert('Private notes saved — encrypted.'); });
  $('#changePasswordBtn').addEventListener('click', async () => {
    if (!adminSession) return; const n1 = $('#adminChangeNew').value, n2 = $('#adminChangeNew2').value;
    if (n1.length < 10) { alert('Use at least 10 characters — longer is better.'); return; } if (n1 !== n2) { alert('New passwords do not match.'); return; }
    const salt = crypto.getRandomValues(new Uint8Array(16)); adminSession = { key: await deriveKey(n1, salt, ADMIN_ITER), salt: b64(salt), iterations: ADMIN_ITER }; adminVaultData.updatedAt = new Date().toISOString(); await writeVault(); $('#adminChangeNew').value = ''; $('#adminChangeNew2').value = ''; armAutoLock(); alert('Password changed — vault re-encrypted.');
  });
  $('#saveBannerBtn').addEventListener('click', () => { if (!adminSession) return; publicConfig.bannerEnabled = $('#bannerEnabled').checked; publicConfig.bannerText = $('#bannerText').value.trim(); savePublic(); renderBanner(); alert('Banner saved.'); });
  $('#addCustomSiteBtn').addEventListener('click', () => {
    if (!adminSession) return; const name = $('#csName').value.trim(); const template = $('#csUrl').value.trim();
    const test = template.replaceAll('{keyword}', 'test').replaceAll('{city}', 'Modesto').replaceAll('{zip}', '95355').replaceAll('{county}', 'Stanislaus').replaceAll('{radius}', '5');
    if (!name || !safeUrl(test)) { alert('Add a site name and a valid https:// URL template.'); return; }
    publicConfig.customSites = publicConfig.customSites || []; publicConfig.customSites.push({ id:'custom-' + Date.now().toString(36), name, template, desc: $('#csDesc').value.trim() });
    savePublic(); $('#csName').value = ''; $('#csUrl').value = ''; $('#csDesc').value = ''; renderSites(); renderAdminLists();
  });
  $('#customSitesList').addEventListener('click', (e) => { const del = e.target.closest('[data-custom-del]'); if (!del || !adminSession) return; publicConfig.customSites = (publicConfig.customSites || []).filter((cs) => cs.id !== del.dataset.customDel); savePublic(); renderSites(); renderAdminLists(); });
  $('#siteVisibilityList').addEventListener('change', (e) => { const box = e.target.closest('[data-site-vis]'); if (!box || !adminSession) return; publicConfig.hiddenSiteIds = publicConfig.hiddenSiteIds || []; if (box.checked) publicConfig.hiddenSiteIds = publicConfig.hiddenSiteIds.filter((id) => id !== box.dataset.siteVis); else if (!publicConfig.hiddenSiteIds.includes(box.dataset.siteVis)) publicConfig.hiddenSiteIds.push(box.dataset.siteVis); savePublic(); renderSites(); renderAdminLists(); });
  $('#adminCountySelect').addEventListener('change', (e) => { $('#adminCountyNote').value = (publicConfig.countyNotes || {})[e.target.value] || ''; });
  $('#saveCountyNoteBtn').addEventListener('click', () => { if (!adminSession) return; publicConfig.countyNotes = publicConfig.countyNotes || {}; publicConfig.countyNotes[$('#adminCountySelect').value] = $('#adminCountyNote').value.trim(); savePublic(); renderCounty(); alert('County note saved.'); });
  $('#encBackupBtn').addEventListener('click', async () => {
    if (!cryptoOK) { alert('Web Crypto unavailable.'); return; } const pw = prompt('Password for this encrypted backup (10+ characters):', ''); if (!pw || pw.length < 10) { alert('Backup cancelled — password needs 10+ characters.'); return; }
    const salt = crypto.getRandomValues(new Uint8Array(16)); const key = await deriveKey(pw, salt); const enc = await encryptJSON(key, gatherAll());
    download('california-job-finder-ENCRYPTED-backup-' + todayISO() + '.json', JSON.stringify({ format:'sjf-encrypted-backup', version:1, salt:b64(salt), iv:enc.iv, data:enc.data, iterations: ADMIN_ITER }, null, 2), 'application/json');
  });
  $('#encRestoreInput').addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return; const r = new FileReader();
    r.onload = async () => { try { const file = JSON.parse(String(r.result || '')); if (file.format !== 'sjf-encrypted-backup') throw new Error('Not an encrypted backup file.'); const pw = prompt('Password for this encrypted backup:', ''); if (!pw) return; const key = await deriveKey(pw, unb64(file.salt), Number(file.iterations) || LEGACY_ITER); const data = await decryptJSON(key, file.iv, file.data); if (!confirm('Restore this encrypted backup?')) return; if (!restoreData(data)) throw new Error('Decrypted, but the contents were not recognized.'); alert('Encrypted backup restored.'); } catch (err) { alert('Could not restore encrypted backup (wrong password or bad file).'); } };
    r.readAsText(f); e.target.value = '';
  });
  $('#wipeProfileBtn').addEventListener('click', () => $('#deleteProfileBtn').click());
  $('#wipeAllBtn').addEventListener('click', () => { if (!adminSession) return; if (!confirm('Erase ALL Stanislaus/California Job Finder data on this device (all profiles, settings, admin vault)?')) return; if (!confirm('Are you absolutely sure? This cannot be undone.')) return; Object.keys(localStorage).filter((k) => k.startsWith('sjf.')).forEach((k) => localStorage.removeItem(k)); location.reload(); });
  $('#deleteVaultBtn').addEventListener('click', () => { if (!adminSession) return; if (!confirm('Delete the admin vault and its encrypted private notes? Public banner/custom sites stay.')) return; localStorage.removeItem(LS_ADMIN); lockAdmin(true); renderAdmin(); });
});
