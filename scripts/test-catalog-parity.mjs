// Catalog parity: live EasyOrders response vs rendered catalog.
// Compares the checked-in fallback (server fallback source) plus a production
// page scrape for name/price/stock/CTA parity. Run against prod server via BASE_URL.

import { registerHooks } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const rel = specifier.slice(2);
      const resolvedPath = path.resolve("src", rel);
      return nextResolve(pathToFileURL(resolvedPath).href + ".ts", context);
    }
    return nextResolve(specifier, context);
  },
});

const { getCatalog } = await import("../src/lib/catalog.ts");
const { fallbackCatalog } = await import("../src/data/products.ts");

const ORIGIN = "https://miskova.myeasyorders.com";
const API = "https://api.easy-orders.net/api/v1";
const ALL_ID = "8e037e3f-f03a-46cd-8f17-f8c9d350e359";
const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3111";

const norm = (s) => s.replace(/\s+/g, " ").trim();
const failures = [];
const check = (label, cond) => {
  console.log(`${cond ? "PASS" : "FAIL"} ${label}`);
  if (!cond) failures.push(label);
};

async function liveProducts() {
  const res = await fetch(
    `${API}/products?category_id=${ALL_ID}&limit=50&sort=position,desc&join=categories,variants,variations`,
    { headers: { Origin: ORIGIN, Accept: "application/json" } },
  );
  if (!res.ok) throw new Error(`live status ${res.status}`);
  const json = await res.json();
  const rows = Array.isArray(json) ? json : json.data;
  return rows.map((p) => ({
    slug: p.slug,
    name: norm(p.name),
    price: Number(p.price),
    salePrice: p.sale_price ? Number(p.sale_price) || null : null,
    avail: !p.track_stock || Number(p.quantity) > 0,
    cats: (p.categories || []).map((c) => c.slug),
  }));
}

const live = await liveProducts();
console.log(`live products: ${live.length}`);
check("live 16 products", live.length === 16);

// Scrape rendered homepage for product names + canonical CTAs
const html = await (await fetch(`${BASE_URL}/`)).text();
for (const l of live) {
  check(`rendered product: ${l.slug}`, html.includes(l.slug) || html.includes(l.name.split(" ")[0]));
  check(
    `canonical CTA: ${l.slug}`,
    html.includes(`https://miskova.myeasyorders.com/products/${l.slug}`),
  );
}
check("bag controls present", html.includes("data-add") && html.includes("data-cart-open"));
check(
  "announcement present",
  html.includes("FREE SHIPPING FOR ANY ORDER ABOVE 1200EGP") || (html.includes("SHIPPING") && html.includes("1200")),
);
// Category membership counts from live response
const inCat = (slug) => live.filter((p) => p.cats.includes(slug)).length;
console.log(
  `Summer=${inCat("Summer-fragrances")} Best=${inCat("best-fragrances")} Him=${inCat("men-fragrances")} Her=${inCat("women-fragrances")}`,
);
check("Summer 6", inCat("Summer-fragrances") === 6);
check("Best 6", inCat("best-fragrances") === 6);
check("Him 15", inCat("men-fragrances") === 15);
check("Her 6", inCat("women-fragrances") === 6);

// Fallback catalog structure and parity checks
check("fallback 16 products", fallbackCatalog.products.length === 16);
check("fallback 3 categories", fallbackCatalog.categories.length === 3);
const fallbackInCat = (slug) =>
  fallbackCatalog.products.filter((p) => p.categorySlugs.includes(slug)).length;
check("fallback Summer 6", fallbackInCat("Summer-fragrances") === 6);
check("fallback Best 6", fallbackInCat("best-fragrances") === 6);
check("fallback Him 15", fallbackInCat("men-fragrances") === 15);
check("fallback Her 6", fallbackInCat("women-fragrances") === 6);

// Verify every fallback product matches live data
for (const fp of fallbackCatalog.products) {
  const lp = live.find((p) => p.slug === fp.slug);
  check(`fallback parity slug: ${fp.slug}`, !!lp);
  if (lp) {
    check(`fallback price parity: ${fp.slug}`, fp.price === lp.price);
    check(`fallback salePrice parity: ${fp.slug}`, fp.salePrice === lp.salePrice);
    check(`fallback avail parity: ${fp.slug}`, fp.isAvailable === lp.avail);
  }
}

// Simulated-outage fallback check:
// When upstream fails, getCatalog() must emit exactly one console.warn
// and return the complete fallback catalog with no partial grid.
const originalFetch = globalThis.fetch;
const originalWarn = console.warn;
const warns = [];
console.warn = (...args) => warns.push(args.join(" "));
globalThis.fetch = async () => {
  throw new Error("Simulated upstream network outage");
};

let outageCatalog = null;
try {
  outageCatalog = await getCatalog();
} finally {
  globalThis.fetch = originalFetch;
  console.warn = originalWarn;
}

check(
  "outage emits single console.warn",
  warns.length === 1 && warns[0].includes("catalog: live fetch failed, serving fallback catalog"),
);
check("outage returns fallbackCatalog", outageCatalog === fallbackCatalog);
check("outage complete 16 products", outageCatalog?.products?.length === 16);
check("outage complete 3 categories", outageCatalog?.categories?.length === 3);
check(
  "outage no partial grid",
  outageCatalog?.products?.every(
    (p) => p.id && p.name && p.slug && p.price && p.image && p.canonicalUrl,
  ) === true,
);

if (failures.length > 0) {
  console.error(`\n${failures.length} FAILURES`);
  process.exit(1);
}
console.log("\ncatalog parity OK");
