# damasolara.com — v2 (Lightship reframe)

Static site — plain HTML/CSS/JS, multi-file. Built for GitHub → Cloudflare Pages.
Design language derived from lightshiprv.com; colors from Damaso's custom
palette ("color pallette.jpg" in the project folder): off-white paper (#F4F4F4),
blush (#EEDBCD), navy ink (#192231), antique gold accent (#C0B283), deep olive
(#404A42). Pill buttons, oversized grotesque display type (Schibsted Grotesk ≈
F37 Bolton), rounded full-bleed media, scroll reveals.

## Structure
```
index.html      — single page, EN/ES via data-en/data-es attributes
css/style.css   — design tokens + layout
js/main.js      — announcement bar, menu, language toggle, reveals,
                  manifesto word-paint, drag strips, reel autoplay
images/         — optimized real photography (879 + 903 Linda Flora, portrait)
video/903-sold.mp4 — compressed vertical "Sold" reel (muted, autoplays in view)
```

## Deploy (Cloudflare Pages)
1. Push this folder to GitHub.
2. Cloudflare Pages → Create project → Connect to Git → select repo.
3. Build command: (blank) · Output directory: `/`
4. Add `damasolara.com` as custom domain once DNS is on Cloudflare.

## Before going live — placeholders to swap
- **Formspree** — search `YOUR_FORM_ID` in index.html and replace with the real
  Formspree form ID.
- **Substack** — search `SUBSTACK-HANDLE` and replace with the real subdomain.
- **DRE#** — footer shows `[PENDING — confirm]`. Public record shows 02003626;
  confirm with Damaso before publishing.

## Notes
- All photography is real: 879 Linda Flora (Selects/FINAL FINAL + Shoot 1) and
  903 Linda Flora (Hi Res - House + Lifestyle). Portrait is Damaso's headshot
  carried over from v1.
- The hero videos on file are all vertical 9:16 reels, so the hero uses the
  twilight facade photo; the reel plays inside the 903 card instead.
- EN/ES persists in localStorage; announcement dismissal persists per session.
- Fonts load from Google Fonts (Schibsted Grotesk). To self-host later, download
  the woff2 files and swap the `<link>` for `@font-face` rules.
