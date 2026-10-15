# Chaudhary Nutrition — 2026 redesign

A complete front-end redesign of [chaudharynutrition.com](https://chaudharynutrition.com), inspired by
Typology's editorial, ingredient-first layout and built on the client's **ski** palette:

| Honeydew | Midnight | Rose | Claret |
|---|---|---|---|
| `#F8FFF4` | `#0E103D` | `#EBA6A9` | `#990D35` |

Static HTML/CSS/JS, no build step. The live catalogue (218 products), prices, descriptions and photos
come from the current Shopify store, and **checkout hands off to the store's real Shopify checkout**
(cart permalinks), so every existing payment option keeps working. Orders can also go via WhatsApp.

## Run it

```
powershell -ExecutionPolicy Bypass -File serve.ps1
```
then open http://localhost:4371/ (or use the `chaudhary-nutrition` entry in `D:\E-BOOK\.claude\launch.json`).

## Pages

| Page | What it does |
|---|---|
| `index.html` | Hero, concern tiles, signature edit, Baby Care offer, Wellness Finder band, new arrivals, kits, ingredient library, founder, philosophy, trust seals |
| `shop.html` | Filter by category (`?c=skin`), search (`?q=`), kits / on-sale toggles, sorting, load-more |
| `product.html?p=<id>` | Gallery, buy box (bag, buy-now, WhatsApp), description accordions, ingredient "lab label", related |
| `finder.html` | 3-step Wellness Finder → personal shortlist → pre-filled WhatsApp consult |
| `about.html` | The founding story, timeline, Annu Chaudhary, before/after journey slider |
| `salon.html` | Annu Chaudhary Luxury Salon (WhatsApp booking) |
| `certificates.html` | ISO 45001 and GMP certificates with lightbox |
| `contact.html` | Contact cards, map, WhatsApp message form |

Header, footer, drawers and search are rendered by `assets/js/site.js` on every page — edit nav once there.
Store details (phone, address, curated home products, ingredients, badges) live in `assets/js/config.js`.

## Updating products and photos

All tooling is in `tools/` (Windows PowerShell + the C# in `imgfx.cs`; no Python/Node needed):

```
powershell -ExecutionPolicy Bypass -File tools\build-data.ps1          # pull products from the Shopify store
powershell -ExecutionPolicy Bypass -File tools\process-images.ps1      # download + re-edit every product photo
powershell -ExecutionPolicy Bypass -File tools\build-data.ps1 -NoFetch # merge photo metadata into catalog.js
powershell -ExecutionPolicy Bypass -File tools\brand-images.ps1        # logo, portraits, certificates
powershell -ExecutionPolicy Bypass -File tools\build-sitemap.ps1       # sitemap.xml only (build-data runs it too; offline)
```

**SEO:** every page's `<head>` carries its canonical, Open Graph tags and JSON-LD; `product.js` sets title, description,
canonical, OG tags and Product JSON-LD per product, and `shop.js` adds the catalogue ItemList. The canonical base is
`siteUrl` in `config.js` — if the site moves to its own domain, update it, the static `<head>` URLs and `robots.txt`,
then run `build-sitemap.ps1 -BaseUrl https://new-domain/`.

Photo editing (`imgfx.cs`): studio shots are detected automatically, their backdrop is relit onto the
site's blush tile (`#F7EDEB → #F1E2DF`) with white packaging protected, every product is reframed to the
same scale, edges are feathered and the image lightly sharpened. Lifestyle shots get a gentle palette grade.

**Founder portrait:** drop the photo (jpg/png/webp) into `tools\source\` and re-run `brand-images.ps1`;
it becomes `assets/img/brand/annu-salon.jpg` (home + about) and `annu-salon-tall.jpg` (salon page).

After changing images, bump `imgVersion` in `config.js` (and `?v=` on hard-coded image URLs) —
`serve.ps1` caches `/assets/img` for a week.

## Phone preview file

```
powershell -ExecutionPolicy Bypass -File tools\build-bundle.ps1
```
writes `dist\chaudhary-nutrition-demo.html` (~7.5 MB): the whole site in one self-contained file — every
page, product, description and image embedded — that opens on a phone (Android: open with Chrome).
Pages switch inside the file via `#/shop?c=skin`-style links. Re-run it after any change to the site.

## Before going live

- Confirm with the client: the "USFDA Approved" badge (carried over from the current site), the Luxury
  Salon copy (the current salon page has no content), and that the store address/hours also apply to the salon.
- `tools/.cache` (~600 MB of raw downloads) is git-ignored.
