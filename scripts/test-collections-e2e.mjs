import puppeteer from "puppeteer-core";

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3111";
const CHROME_PATH = process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/google-chrome-stable";

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
    // 1. Categories Directory (/collections)
    console.log("Testing Categories Directory (/collections)...");
    await page.goto(`${BASE_URL}/collections`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".mk-categories-grid", { timeout: 10000 });
    const cats = await page.$$eval(".mk-category-name", (els) => els.map((e) => e.textContent?.trim()));
    console.log("✓ Categories found:", cats);
    if (!cats.includes("Summer Collection") || !cats.includes("For Him") || !cats.includes("For Her")) {
      throw new Error(`Expected Summer Collection, For Him, For Her, got ${cats.join(", ")}`);
    }

    // 2. Summer Collection (/collections/summer)
    console.log("Testing Summer Collection (/collections/summer)...");
    await page.goto(`${BASE_URL}/collections/summer`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".mk-product-grid", { timeout: 10000 });
    const summerTitle = await page.$eval("h1.collection-title", (e) => e.textContent?.trim());
    console.log(`✓ Summer collection title: "${summerTitle}"`);
    if (summerTitle !== "Summer Collection") throw new Error(`Expected Summer Collection, got ${summerTitle}`);

    const summerCards = await page.$$eval(".mk-product-grid .mk-card", (els) => els.length);
    console.log(`✓ Summer products count: ${summerCards}`);
    if (summerCards !== 6) throw new Error(`Expected 6 summer products, got ${summerCards}`);

    // Test Add to cart on Pacific Sol
    console.log("Testing Add to cart on Pacific Sol...");
    const addBtn = await page.$("button[data-add='Pacific-Sol']");
    if (!addBtn) throw new Error("Add to cart button not found for Pacific-Sol");
    await addBtn.click();

    // Verify Cart Drawer opens
    await page.waitForSelector(".mk-drawer.is-open", { timeout: 8000 });
    console.log("✓ Cart drawer opened successfully");
    const cartItemName = await page.$eval(".mk-cart-line h3", (e) => e.textContent?.trim());
    console.log(`✓ Cart item name: "${cartItemName}"`);
    if (!cartItemName.includes("Pacific Sol")) throw new Error(`Cart does not contain Pacific Sol: ${cartItemName}`);

    // Close Cart Drawer via evaluate
    await page.evaluate(() => {
      const btn = document.querySelector(".mk-drawer.is-open [data-mk-close]");
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // 3. For Him Collection (/collections/for-him)
    console.log("Testing For Him Collection (/collections/for-him)...");
    await page.goto(`${BASE_URL}/collections/for-him`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".mk-product-grid", { timeout: 10000 });
    const himTitle = await page.$eval("h1.collection-title", (e) => e.textContent?.trim());
    console.log(`✓ For Him title: "${himTitle}"`);
    if (himTitle !== "For Him") throw new Error(`Expected For Him, got ${himTitle}`);
    const himCards = await page.$$eval(".mk-product-grid .mk-card", (els) => els.length);
    console.log(`✓ For Him products count: ${himCards}`);
    if (himCards !== 15) throw new Error(`Expected 15 products for him, got ${himCards}`);

    // 4. For Her Collection (/collections/for-her)
    console.log("Testing For Her Collection (/collections/for-her)...");
    await page.goto(`${BASE_URL}/collections/for-her`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".mk-product-grid", { timeout: 10000 });
    const herTitle = await page.$eval("h1.collection-title", (e) => e.textContent?.trim());
    console.log(`✓ For Her title: "${herTitle}"`);
    if (herTitle !== "For Her") throw new Error(`Expected For Her, got ${herTitle}`);
    const herCards = await page.$$eval(".mk-product-grid .mk-card", (els) => els.length);
    console.log(`✓ For Her products count: ${herCards}`);
    if (herCards !== 6) throw new Error(`Expected 6 products for her, got ${herCards}`);

    // 5. All Products Archive (/collections/all)
    console.log("Testing All Products Archive (/collections/all)...");
    await page.goto(`${BASE_URL}/collections/all`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".mk-product-grid", { timeout: 10000 });
    const allTitle = await page.$eval("h1.collection-title", (e) => e.textContent?.trim());
    console.log(`✓ All Products title: "${allTitle}"`);
    if (allTitle !== "All Products") throw new Error(`Expected All Products, got ${allTitle}`);
    const allCards = await page.$$eval(".mk-product-grid .mk-card", (els) => els.length);
    console.log(`✓ All products count: ${allCards}`);
    if (allCards !== 16) throw new Error(`Expected 16 products, got ${allCards}`);

    // 6. Best Sellers (/collections/best-sellers)
    console.log("Testing Best Sellers (/collections/best-sellers)...");
    await page.goto(`${BASE_URL}/collections/best-sellers`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".mk-product-grid", { timeout: 10000 });
    const bestTitle = await page.$eval("h1.collection-title", (e) => e.textContent?.trim());
    console.log(`✓ Best sellers title: "${bestTitle}"`);
    if (bestTitle !== "Best Sellers !") throw new Error(`Expected Best Sellers !, got ${bestTitle}`);
    const bestCards = await page.$$eval(".mk-product-grid .mk-card", (els) => els.length);
    console.log(`✓ Best sellers count: ${bestCards}`);
    if (bestCards !== 6) throw new Error(`Expected 6 best sellers, got ${bestCards}`);

    console.log("ALL COLLECTION PAGES AND COMMERCE TESTS PASSED!");
  } finally {
    await browser.close().catch(() => {});
  }
}

main().catch((err) => {
  console.error("Collections E2E test failed:", err);
  process.exit(1);
});
