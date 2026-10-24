# damasolara.com: v2 (Lightship reframe)

Static site: plain HTML/CSS/JS, multi-file. Built for GitHub → Cloudflare Pages.
Design language derived from lightshiprv.com; colors from Damaso's custom
palette ("color pallette.jpg" in the project folder): off-white paper (#F4F4F4),
blush (#EEDBCD), navy ink (#192231), antique gold accent (#C0B283), deep olive
(#404A42). Pill buttons, oversized grotesque display type (Schibsted Grotesk ≈
F37 Bolton), rounded full-bleed media, scroll reveals.

## Structure
```
index.html     : single page, EN/ES via data-en/data-es attributes
css/style.css  : design tokens + layout
js/main.js     : announcement bar, menu, language toggle, reveals,
                  manifesto word-paint, drag strips, reel autoplay
js/map.js      : "The Westside, mapped": interactive SVG map, no map
                  libraries. Roads/water/parks are REAL OpenStreetMap
                  geometry (js/mapdata.js), projected + styled Apple-Maps-
                  style in our palette. Category chips, side panel, bounded
                  pan/zoom, EN/ES.
js/mapdata.js  : generated: real OSM roads (6k segments, merged 1 path/
                  class), reservoirs, parks, and detailed golf courses
                  (footprint + fairways/greens/bunkers/water so Bel-Air CC
                  and the other clubs are recognizable), + 48 road labels.
                  Regenerate via Overpass (scratchpad/osm) if the area changes;
                  golf_course relations must be fetched with nwr + stitched.
images/        : optimized real photography (879 + 903 Linda Flora, portrait)
video/903-sold.mp4: compressed vertical "Sold" reel (muted, autoplays in view)
```

## Deploy (Cloudflare Pages)
1. Push this folder to GitHub.
2. Cloudflare Pages → Create project → Connect to Git → select repo.
3. Build command: (blank) · Output directory: `/`
4. Add `damasolara.com` as custom domain once DNS is on Cloudflare.

## Before going live: placeholders to swap
- **Formspree**: search `YOUR_FORM_ID` in index.html and replace with the real
  Formspree form ID.
- **Substack**: search `SUBSTACK-HANDLE` and replace with the real subdomain.
- **DRE#**: footer shows `[PENDING: confirm]`. Public record shows 02003626;
  confirm with Damaso before publishing.

## Notes
- All photography is real: 879 Linda Flora (Selects/FINAL FINAL + Shoot 1) and
  903 Linda Flora (Hi Res - House + Lifestyle). Portrait is Damaso's headshot
  carried over from v1.
- The hero videos on file are all vertical 9:16 reels, so the hero uses the
  twilight facade photo; the reel plays inside the 903 card instead.
- EN/ES persists in localStorage; announcement dismissal persists per session.
- Lightbox: every property photo opens a per-home gallery (arrows, keyboard,
  swipe, Esc/backdrop close; scroll position preserved). Galleries defined in
  GALLERIES in js/main.js; extra photos live in images/g/.
- Substack cards: three placeholders marked PLACEHOLDER-SUBSTACK in
  index.html: swap title + URL per card when Damaso publishes.
- Work also has a portfolio grid ("Also on the record"): **3x3, nine photo cards**, newest
  first (936 Chantilly, 10917 Savona, 248 N Glenroy added 2026-10-21 from the shared Drive
  folder "Ivan/Damaso - Marketing"). Below it, a native `<details>` "See all N addresses" list
  holds every address, including ones without a photo card (642 Perugia, 146 Groverton,
  6020 Lido). On phones the grid is 2 columns and card 9 is hidden so rows stay even; it is
  still in the list. To add a property: lead photo to images/, extras to images/g/, an entry in
  GALLERIES + LB_TITLES (js/main.js), a row in the list, and update the count in the summary.
  Statuses are provisional: confirm Sold vs Represented per address with Damaso.
- **Verify by looking:** serve locally (`python3 -m http.server`), open the grid at desktop and
  375px, open "See all", click a row and confirm its gallery opens. Toggle ES.
- Fonts load from Google Fonts (Schibsted Grotesk). To self-host later, download
  the woff2 files and swap the `<link>` for `@font-face` rules.

## Accessibility & security
- WCAG AA pass: darkened secondary text to clear 4.5:1 contrast, keyboard
  focus-visible rings, lightbox is a focus-managed `aria-modal` dialog
  (focus enters on open, Tab is trapped, returns to the opener on close),
  hero parallax + all motion disabled under prefers-reduced-motion.
- `_headers` sets edge security headers on Cloudflare Pages: CSP, HSTS,
  X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
  (gyroscope/accelerometer allowed to self for the hero tilt effect).
- Contact form has a hidden `_gotcha` honeypot (Formspree spam filter).
- `robots.txt` + `sitemap.xml` reference https://damasolara.com.

## Social sharing
- Open Graph + Twitter card meta in <head>; share title is prefixed
  "Damaso Lara | ". Preview image is images/og-cover.jpg (1200×630).
  All absolute URLs assume the production domain damasolara.com.


## /brandscript (private, added 2026-10-23)
Damaso's brandscript, behind a password. **The content is encrypted, not hidden.** `brandscript/index.html`
holds only ciphertext (AES-GCM, key from PBKDF2-SHA256, 600,000 rounds, random salt). The password is not
stored anywhere, not even as a hash: the only way to read the page is to decrypt it. `brandscript-a.js`
derives the key in the browser, decrypts, and runs the page. "Remember this device" keeps the derived key in
localStorage. Works under the site's strict CSP (no inline scripts; the payload is a non-executable JSON block).
- **Never commit the plaintext.** The repo root is the published site. The readable source and the encrypt
  script live outside the repo, in Ivan's `Damaso Lara/Substack/brandscript-build/`.
- **To update the text:** edit `body.html` there, run `BS_PASS='...' node encrypt.mjs`, and paste the new
  payload into `brandscript/index.html`. If the JS changes, rename it (`brandscript-b.js`) so caches don't
  serve the old one.
- **To change the password:** re-encrypt with the new one. The old password stops working right away, and
  anyone who chose "Remember this device" gets the password screen again.
- Kept out of search by `noindex` meta and `X-Robots-Tag` in `_headers`. It is deliberately **not** in
  robots.txt or the sitemap, and nothing links to it.
