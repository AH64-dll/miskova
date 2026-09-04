import puppeteer from "puppeteer-core";

// Collections E2E for the adopted premium design:
// shared sections on shared routes, canonical store CTAs (no bag), design NAV.

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3111";
const CHROME_PATH = process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/google-chrome-stable";
const STORE = "https://miskova.myeasyorders.com/products/";

const failures = [];
const check = (label, cond) => {
  console.log(`${cond ? "PASS" : "FAIL"} ${label}`);
  if (!cond) failures.push(label);
};

async function main() {
  console.log(`Launching Chrome for Collections E2E against ${BASE_URL}...`);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    // 0. Homepage: design chrome + commerce contract
    console.log("Testing homepage chrome...");
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#reviews h2", { timeout: 15000 });

    const reviewsH2 = await page.$eval("#reviews h2", (e) => e.textContent?.trim());
    check("reviews heading exact", reviewsH2 === "Customer reviews");

    for (const id of ["top", "collections", "summer", "best", "him", "her", "story", "reviews", "archive"]) {
      check(`homepage section #${id}`, (await page.$(`#${id}`)) !== null);
    }

    const navHrefs = await page.$$eval("header nav a", (els) => els.map((e) => e.getAttribute("href")));
    for (const href of [
      "/collections/summer",
      "/collections/best-sellers",
      "/collections/for-him",
      "/collections/for-her",
      "/collections/all",
      "/#story",
    ]) {
      check(`header nav ${href}`, navHrefs.includes(href));
    }

    const marquee = await page.evaluate(() => document.body.textContent?.toUpperCase() || "");
    check("shipping marquee text", marquee.includes("FREE SHIPPING") && marquee.includes("1200"));

    const bodyText = await page.evaluate(() => document.body.textContent || "");
    check("no bag anywhere on homepage", !bodyText.includes("Add to bag") && (await page.$("[data-add]")) === null && (await page.$("[data-cart-open]")) === null);

    const homeStoreCtas = await page.$$eval(`a[href^="${STORE}"]`, (els) => els.map((e) => e.getAttribute("href")));
    check("homepage has canonical store CTAs", homeStoreCtas.length > 0);
    check("store CTAs open new tab", await page.$$eval(`a[href^="${STORE}"]`, (els) => els.every((e) => e.target === "_blank")));

    check("footer wordmark", bodyText.includes("MISKOVA"));

    // 1. Categories Directory (/collections)
    console.log("Testing Collections Directory (/collections)...");
    await page.goto(`${BASE_URL}/collections`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#collections", { timeout: 10000 });
    const tilesTitle = await page.$eval("#collections h2", (e) => e.textContent?.replace(/\s+/g, " ").trim());
    check("collections tiles heading", tilesTitle === "Choose your chapter");
    const tileLinks = await page.$$eval("#collections a", (els) => els.map((e) => e.getAttribute("href")));
    for (const href of ["/collections/summer", "/collections/for-him", "/collections/for-her"]) {
      check(`tile link ${href}`, tileLinks.includes(href));
    }

    // Helper: count unique canonical store CTAs on a collection page
    const countStoreCtas = async (path, expected, label) => {
      await page.goto(`${BASE_URL}${path}`, { waitUntil: "domcontentloaded" });
      await page.waitForFunction(
        (sel) => document.querySelectorAll(sel).length > 0,
        { timeout: 15000 },
        `a[href^="${STORE}"]`,
      );
      const unique = await page.$$eval(`a[href^="${STORE}"]`, (els) => new Set(els.map((e) => e.getAttribute("href"))).size);
      console.log(`✓ ${label} store CTA count: ${unique}`);
      check(`${label} count ${expected}`, unique === expected);
      return unique;
    };

    // 2. Summer (/collections/summer)
    console.log("Testing Summer Sol (/collections/summer)...");
    await countStoreCtas("/collections/summer", 6, "summer");
    const summerH2 = await page.$eval("#summer h2", (e) => e.textContent?.replace(/\s+/g, ""));
    check("summer heading Summer Sol", summerH2 === "SummerSol");

    // 3. Best Sellers (/collections/best-sellers)
    console.log("Testing Best Sellers (/collections/best-sellers)...");
    await countStoreCtas("/collections/best-sellers", 6, "best");
    const bestH2 = await page.$eval("#best h2", (e) => e.textContent?.replace(/\s+/g, ""));
    check("best heading Best Sellers", bestH2 === "BestSellers");

    // 4. For Him (/collections/for-him)
    console.log("Testing For Him (/collections/for-him)...");
    await countStoreCtas("/collections/for-him", 15, "him");
    const himH2 = await page.$eval("#him h2", (e) => e.textContent?.replace(/\s+/g, ""));
    check("him heading For Him", himH2 === "ForHim");
    const himViewAll = await page.$$eval("#him a", (els) => els.some((e) => e.getAttribute("href") === "/collections/all"));
    check("him view-all links to /collections/all", himViewAll);

    // 5. For Her (/collections/for-her)
    console.log("Testing For Her (/collections/for-her)...");
    await countStoreCtas("/collections/for-her", 6, "her");
    const herH2 = await page.$eval("#her h2", (e) => e.textContent?.replace(/\s+/g, ""));
    check("her heading For Her", herH2 === "ForHer");

    // 6. All Chapters (/collections/all) — filters + sorts + full archive
    console.log("Testing All Chapters (/collections/all)...");
    await page.goto(`${BASE_URL}/collections/all`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#archive", { timeout: 10000 });
    const allH2 = await page.$eval("#archive h2", (e) => e.textContent?.replace(/\s+/g, ""));
    check("all heading All Chapters", allH2 === "AllChapters");

    const allCount = await page.$$eval(`a[href^="${STORE}"]`, (els) => new Set(els.map((e) => e.getAttribute("href"))).size);
    console.log(`✓ All products count: ${allCount}`);
    check("all count 16", allCount === 16);

    const sortOptions = await page.$$eval("#archive select option", (els) => els.map((e) => e.textContent?.trim()));
    check(
      "sort labels Chapter / Price ↑ / Price ↓",
      sortOptions.join("|") === "Chapter|Price ↑|Price ↓",
    );

    const filterLabels = await page.$$eval("#archive button", (els) => els.map((e) => e.textContent?.trim()));
    for (const f of ["All", "Summer", "Best sellers", "For him", "For her", "Bundles"]) {
      check(`filter button ${f}`, filterLabels.includes(f));
    }
    const bundlesClicked = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("#archive button")).find(
        (e) => e.textContent?.trim() === "Bundles",
      );
      if (!btn) return false;
      btn.click();
      return true;
    });
    check("bundles button clickable", bundlesClicked);
    await new Promise((r) => setTimeout(r, 800));
    const bundlesCount = await page.$$eval(`a[href^="${STORE}"]`, (els) => new Set(els.map((e) => e.getAttribute("href"))).size);
    check("bundles filter shows 2", bundlesCount === 2);

    const noBag = await page.evaluate(() => !document.body.textContent?.includes("Add to bag"));
    check("no bag on any collection page", noBag);

    console.log(failures.length === 0 ? "ALL COLLECTION PAGES AND COMMERCE TESTS PASSED!" : `${failures.length} FAILURES`);
  } finally {
    await browser.close().catch(() => {});
  }

  if (failures.length > 0) {
    console.error("Collections E2E failures:", failures);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Collections E2E test failed:", err);
  process.exit(1);
});
