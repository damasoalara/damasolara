# damasolara.com

Static site — plain HTML/CSS/JS, single file. Built for GitHub → Cloudflare Pages.

## Deploy (Cloudflare Pages)
1. Push this repo to GitHub.
2. In Cloudflare Pages: Create a project → Connect to Git → select this repo.
3. Build settings: **none needed** — this is a static site.
   - Build command: (leave blank)
   - Build output directory: `/`
4. Deploy. Then add `damasolara.com` as a custom domain on the Pages project
   once DNS/nameservers are pointed at Cloudflare.

## Before going live — placeholders to swap
Everything still marked as a placeholder is tagged `data-placeholder="reference"`
and shows a small "Reference" mark in the corner of the image while
`SHOW_PLACEHOLDER_MARKERS = true` (near the bottom of index.html, in the
`<script>` block). Set it to `false` once real assets are in.

Search `index.html` for `REFERENCE IMAGE` comments to find each one:
- **Hero** — currently a mood/reference photo, swap for Damaso's real hero
  photography or film footage.
- **Three property cards** (879 Linda Flora / 248 N Glenroy / 1132 Chantilly)
  — currently mood/reference architecture photos, swap for real listing photography.

Also confirm/update before publishing:
- **DRE#** in the footer — currently `[PENDING — confirm]`. Public record
  shows 02003626; confirm with Damaso before publishing.
- **Formspree endpoint** — search `YOUR_FORM_ID` in the contact form's
  `action` attribute and replace with the real Formspree form ID.
- **Substack URL** — search `SUBSTACK-HANDLE` and replace with the real
  Substack subdomain for the newsletter subscribe button.

## Notes
- The portrait (profile section) is real — Damaso's own headshot — already
  embedded, no action needed there.
- EN/ES toggle, Compass compliance footer (Equal Housing + broker disclosure),
  and the Formspree contact form are all wired and functional.
- Images are embedded as base64 data URIs for now so the single file is
  fully portable. For production performance, consider extracting them to
  an `/images` folder and referencing them as normal file paths instead —
  happy to do that pass once real photography is in and the placeholder
  swaps are done.
