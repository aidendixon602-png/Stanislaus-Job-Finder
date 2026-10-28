# Security & Cloudflare DDoS protection

This site is a **static website** (HTML/CSS/JS in the visitor's browser; there is **no
server, no database, no user accounts, and no data is ever uploaded**). That shape
drives everything below: Cloudflare absorbs traffic attacks at its edge, and the
code ships with strict browser security headers.

## What Cloudflare already does for you (DDoS)

Because the site is deployed to **Cloudflare Workers**, every request lands on
Cloudflare's global network first:

- **Unmetered DDoS mitigation** (network + application layer) is automatic for
  Workers/Pages — traffic floods are absorbed at the edge, not by “your server”.
  There **is no origin server to knock offline** and no origin IP to hunt down.
- Keep it that way: don't point this at a home server or a random VPS later
  without putting Cloudflare in front (proxy/orange-cloud DNS or Cloudflare
  Tunnel), or you'll re-create an attack target.
- The committed **`.assetsignore`** keeps deploys tiny (only `index.html`,
  `app.js`, `styles.css` upload), so attacks can't abuse fat repo files either.

### Turn these on in the Cloudflare dashboard (5 minutes)

For your Worker/custom domain (dash.cloudflare.com → your account → the
`stanislaus-job-finder` / `california-job-finder` Worker):

1. **Use a custom domain and retire public test URLs.** Worker → *Settings →
   Domains & Routes*: add your domain, then **disable `workers.dev`** and
   **disable Preview URLs**. This also hides your account subdomain
   (`something.workers.dev`) from the public.
2. **Bot protection:** Security → Bots → **Bot Fight Mode: ON**. Security →
   Settings: **Browser Integrity Check: ON**, Security Level: **Medium**.
3. **“Under Attack” mode is your emergency button** (Overview / Security):
   leave it OFF normally; flip it ON only during an active attack — visitors
   get a quick browser check while the flood is filtered.
4. **WAF (if your plan shows it):** Security → WAF → enable the **Cloudflare
   Managed Ruleset**. This is a static GET-only site, so also add one
   **Rate-limiting rule** if available: e.g. *same IP > 100 requests / 10
   seconds → Block or Managed Challenge*.
5. **HTTPS:** SSL/TLS → **Always Use HTTPS: ON**, Minimum TLS **1.2**, TLS 1.3 ON.
   (Security headers incl. HSTS are already sent by the site itself — see
   `_headers` — so don't double-add conflicting ones in Cloudflare.)
6. **Protect the Cloudflare account itself** — this matters more than anything
   above: enable **two-factor / a passkey**, and anyone with dashboard access
   gets their own login. Build tokens (Workers Builds) are **API credentials**:
   never post one, never paste one into chat, and delete tokens you don't use
   (My Profile → API Tokens). Review Workers Builds tokens at project →
   Settings → Builds.
7. **Don't put Cloudflare Access in front of the public site** — that would
   force job seekers to log in. Access is great for a *staff-only* copy, not
   the public one. Note the site's Admin area is a per-device encrypted vault
   (below), so there's no central admin login for attackers to aim at anyway.

## What's hardened in the code

- **`_headers`** (served by Cloudflare on every response): strict
  Content-Security-Policy (`default-src 'self'`, no plugins/frames/connections),
  `X-Frame-Options: DENY` + `frame-ancestors 'none'` (anti-clickjacking),
  `nosniff`, strict referrer policy, locked-down Permissions-Policy (no
  camera/mic/location/payment), COOP/CORP isolation, and HSTS.
  The same headers are sent by the local `serve.mjs`, plus an HTML CSP
  `<meta>` fallback for double-click/`file://` use.
- **`serve.mjs`** (local/dev): GET/HEAD only, per-IP rate limiting, path
  traversal protection, and project internals (`serve.mjs`, `package.json`,
  ZIP, docs) are never served.
- **No XSS sinks for user data:** every tracked-job/profile field is rendered
  through output escaping, and imports are passed through a sanitizer that
  whitelists statuses/priorities/transports, validates dates and numbers, and
  drops non-`http(s)` posting URLs. External links use
  `rel="noopener noreferrer"`.
- **Admin vault:** AES-256-GCM encryption with **PBKDF2-SHA256 at 600,000
  iterations** (older 310k vaults/backups still unlock — the iteration count is
  stored with each ciphertext), random salt/IV per save, key only in memory,
  10-minute auto-lock, and **failed-unlock throttling** (exponential wait).
  Minimum admin/backup password is now **10 characters**.
- **Privacy by architecture:** profiles, tracker and settings live only in
  `localStorage` on the visitor's device. A breach of the web host would expose
  only the public code — there is no user data there to steal.

## Honest limits

- A browser-only admin vault stops snooping **at rest on that device**; it is
  not a substitute for real staff accounts in a multi-location deployment.
  If you later add accounts/sync/email alerts (a backend), re-do this review:
  that backend becomes the thing attackers target, and it must only accept
  traffic through Cloudflare (proxy/Tunnel + firewall), with secrets in
  Cloudflare **Secrets**, never in code.
- Keep the repo free of secrets. This project needs **none** — if anything
  named `TOKEN`, `KEY`, or `PASSWORD` ever appears in a commit, rotate it and
  purge it from Git history.

## Reporting

Found a problem with your deployment? Fix forward: update the code in GitHub,
merge to `main`, and Cloudflare redeploys. If a credential ever leaks (build
token, Cloudflare password), **revoke/rotate it first, investigate second.**
