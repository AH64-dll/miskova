# Miskova Fragrances — Site Reference & Asset Manifest

Source: https://miskova.myeasyorders.com/ (EasyOrders platform, theme `sphinx`)
Captured: 2026-08-28 (desktop 1440px + mobile 390px, full-page screenshots in `reference/screenshots/`)

## Page organization (top to bottom, as rendered)

| # | Section | Type / API type | Content |
|---|---------|-----------------|---------|
| 0 | Announcement marquee | custom `header_code` | Gold-on-black scrolling strip: "FREE SHIPPING FOR ANY ORDER ABOVE 1200EGP" (CSS `miskova-scroll` animation, 30s loop) |
| 1 | Header (sticky) | `sphinx_header` | Logo, search input + button, cart button w/ badge. Note: header logo renders as empty `logo-text-shadow-outline` span (logo loaded via client JS) |
| 2 | Hero banner | `banner` (order 0) | Desktop `assets/banner/desktop-banner.webp` (4096×2438); `<source>` mobile `mobile-banner.webp` for ≤425px. Links to `/collections/best-fragrances`. USP badges (Free Delivery / COD / easy return) are baked into the banner artwork, not DOM |
| 3 | "Summer Collection" | `products-grid` (order 1) | Category `5923782f…` — 6 products, 2 rows × 3 (desktop), "View All" link |
| 4 | "Best Sellers !" | `products-list` (order 2) | Category `a099fcc6…` — 6 products in horizontal scroller (long strip section) |
| 5 | "All Products" | `products-grid` (order 3) | Category `8e037e3f…` — 8 products, 2 rows × 4 |
| 6 | "Categories" | `product-home-feature` (order 4, variant 11 `custom-categories`) | 3 circular category cards: Summer Collection (6), For Him (15), For Her (6) |
| 7 | Footer | `sphinx` footer | Contact: Address Cairo,Egypt · Phone 01036202634 · Email miskovafragrances@gmail.com; Categories col; Pages col (privacy-policy, refund-policy, shipping-policy, terms-and-conditions, About Us); social icons (Facebook, Instagram, TikTok); "Powered By Easyorders" |
| 8 | Mobile tab bar | fixed bottom `<section>` (mobile only) | Home + Categories tabs, white rounded pill w/ shadow |

## Routes referenced
- `/` home; `/collections/Summer-fragrances`; `/collections/best-fragrances` (banner CTA); `/collections` (mobile tab); `/search?q=`; `/pages/About-us`; `/pages/privacy-policy`; `/pages/refund-policy`; `/pages/shipping-policy`; `/pages/terms-and-conditions`

## Products (name / slug / price EGP / sale / image in assets/products/)
1. Spider bundle / Spider-bundle / 1000 → 800 / Spider-bundle.webp
2. Fruit Fusion / Fruit-Fusion / 550 → 450 / Fruit-Fusion.webp
3. Pacific Sol / Pacific-Sol / 690 → 620 / Pacific-Sol.webp
4. Crimson Bloom / Crimson-Bloom / 550 (no sale) / Crimson-Bloom.png
5. The Pequod / The-Pequod / 490 → 440 / The-Pequod.webp
6. Y code / Y-code / 450 (no sale) / Y-code.webp
7. Day and Night Bundle / Day-and-Night / 790 (no sale) / Day-and-Night.webp
8. Heir / Heir / 590 → 490 / Heir.png
9. Third Act / Third-Act / 650 → 550 / Third-Act.jpg
10. Vintage Lounge / Vintage-Lounge / 550 → 500 / Vintage-Lounge.png
11. Liquid Gold / Liquid-Gold / 450 (no sale) / Liquid-Gold.png

Section assignment: Summer Collection = 1–6; All Products = 1,2,3,7,8,9,10,4; Best Sellers = 7,1,3,4,11,6.

## Categories (assets/categories/)
- Summer Collection / `Summer-fragrances` / Summer-fragrances.jpg
- For Him / `men-fragrances` / men-fragrances.jpg
- For Her / `women-fragrances` / women-fragrances.jpg

## Brand & config (from `__NEXT_DATA__`)
- Store: `miskova` · id `57e81219-8dab-41bc-b677-f3ed276eb58e`
- Title: "Miskova Fragrances" · Font: Almarai (400–800) · Theme: sphinx · Lang: en
- Colors: primary `#2D2D2D`, secondary `#000000`, site background `#F9F7F2` (via header_code custom CSS), accent gold `#D4AF37` (marquee)
- Currency: EGP · max_order_items 12 · shipping_cost 0
- Pixels: Facebook `1199059562390331`, TikTok `D85J1JRC77U9RFGB7QO0`
- Socials: Facebook `profile.php?id=61585754406759` · Instagram `@miskova_fragrances` · TikTok `@miskova_fragrance`
- Custom CSS (`header_code`): cream background overrides (`#F9F7F2`), white header, transparent sections — see `reference/api/home.json` full source

## Folder layout

```
assets/
  brand/        logo.webp (og+header, 800×800), favicon.webp
  banner/       desktop-banner.webp, mobile-banner.webp   (hero, order 0)
  products/     11 product images named by slug           (sections 3–5)
  categories/   3 category cards named by slug            (section 6)

  css/          platform.css (EasyOrders compiled Tailwind bundle)
  platform/     51 Next.js chunks (_next/static/chunks) for behavior reference
reference/
  html/         rendered.html (hydrated DOM), ssr.html (raw SSR), next-data.json
  api/          home.json (section order!), categories.json, products-cat{1,2,3}.json,
                category-*.json, social-links.json, product-spider-full.json
  screenshots/  desktop-full.webp (1425×5545), mobile-full.webp (765×5275)
  dom-info.json, asset-inventory.json (every network request, labeled by section)
```
> (Same files also served from `easyorders.fra1.digitaloceanspaces.com` — API responses reference that origin.)
> NOTE: desktop-banner and mobile-banner are byte-identical (verified against the origin bucket) — the store uploaded the same artwork for both slots. Same applies to logo.webp and favicon.webp. Both files are still served under both slot names on `files.easy-orders.net` and preserved here as separate local files.

## URL → file mapping (original CDN names preserved in manifest)
| Original URL (files.easy-orders.net) | Local file |
|---|---|
| 1768753241289454895.webp | assets/brand/logo.webp |
| 1768753302272303217.webp | assets/brand/favicon.webp |
| 1775156879657655720.webp | assets/banner/desktop-banner.webp |
| 1775156884190588721.webp | assets/banner/mobile-banner.webp |
| 1777321554234603382.jpg | assets/categories/Summer-fragrances.jpg |
| 1770141266020349070.jpg | assets/categories/men-fragrances.jpg |
| 1769035742252405766.jpg | assets/categories/women-fragrances.jpg |
| 1785943252559306519.webp | assets/products/Spider-bundle.webp |
| 1777234183277505949.webp | assets/products/Fruit-Fusion.webp |
| 1777232990562784015.webp | assets/products/Pacific-Sol.webp |
| 1769036509252469097.png | assets/products/Crimson-Bloom.png |
| 1779036049052736423.webp | assets/products/The-Pequod.webp |
| 1779036088834063123.webp | assets/products/Y-code.webp |
| 1777070335477850995.webp | assets/products/Day-and-Night.webp |
| 1769019140971073051.png | assets/products/Heir.png |
| 1770391776787133929.jpg | assets/products/Third-Act.jpg |
| 1769037691031455416.png | assets/products/Vintage-Lounge.png |
| 1769015107611375507.png | assets/products/Liquid-Gold.png |

(Same files also served from `easyorders.fra1.digitaloceanspaces.com` — API responses use that origin.)

## Rebuild notes
- The storefront is API-driven: section order/types come from `reference/api/home.json`; products per category from `products-cat*.json`. Any rebuild should mirror that data shape.
- Theme "sphinx": dark-neutral (`#2D2D2D`) chrome, cream body, rounded-2xl cards, circular category cards, pill "Add to cart" buttons, horizontal scroller for Best Sellers.
- Self-hosted fonts: rewrite `assets/fonts/almarai.css` URLs to local woff2 files.
- Marquee, USP badges: marquee is real DOM+CSS; USP badges are part of banner artwork.
