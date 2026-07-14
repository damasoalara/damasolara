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
- Work also has a portfolio grid ("Also on the record"): 8 addresses with a
  lead photo from the Google Drive archive + 3 typographic cards for
  addresses without photography yet (642 Perugia, 936 Chantilly,
  10917 Savona). Property statuses on map/grid are provisional: confirm
  Sold vs Represented per address with Damaso.
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
