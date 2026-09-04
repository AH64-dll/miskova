import os from "node:os";
import fs from "node:fs";
import { execSync, spawn } from "node:child_process";
import path from "node:path";
import puppeteer from "puppeteer-core";

// Collections + commerce E2E for the on-site bag storefront:
// sections on shared routes, Add-to-bag CTAs (zero EasyOrders product links),
// drawer open, full checkout happy path, POST /api/orders 201 + persistence.
const CHROME_PATH = process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/google-chrome-stable";
// Own-server run binds a DEDICATED port so a dev/prod server on the default
// port can never silently receive the suite's writes.
const OWN_PORT = 3272;
const OWN_BASE_URL = `http://127.0.0.1:${OWN_PORT}`;

const failures = [];
const check = (label, cond) => {
  console.log(`${cond ? "PASS" : "FAIL"} ${label}`);
  if (!cond) failures.push(label);
};

async function waitForServer(url, timeoutMs = 60000) {
  const start = Date.now();
  for (;;) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    if (Date.now() - start > timeoutMs) throw new Error("server not ready");
    await new Promise((r) => setTimeout(r, 500));
  }
}

function launchServer(ordersPath) {
  const logPath = path.join(os.tmpdir(), "miskova-suite-server.log");
  const logFd = fs.openSync(logPath, "w");
  // Test-env hygiene: OUR port must be free. A leaked server from an earlier run
  // would serve a stale build and poison every assertion — kill it synchronously.
  try {
    execSync(`fuser -k ${OWN_PORT}/tcp`, { stdio: "ignore" });
  } catch {
    /* port already free or fuser unavailable */
  }
  return spawn("npm", ["run", "start", "--", "-p", String(OWN_PORT)], {
    env: { ...process.env, ORDERS_STORE_PATH: ordersPath },
    stdio: ["ignore", logFd, logFd],
    detached: true, // own process group so the next-server grandchild dies with npm
  });
}

async function main() {
  const external = process.env.EXTERNAL_SERVER === "1";
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "miskova-ord-"));
  const ordersPath = path.join(tmp, "orders.json");
  fs.writeFileSync(ordersPath, "[]");
  let server = external ? null : launchServer(ordersPath);
  const BASE_URL = external ? process.env.BASE_URL || "http://127.0.0.1:3111" : OWN_BASE_URL;
  if (server) await waitForServer(`${BASE_URL}/`);

  console.log(`Launching Chrome for Collections E2E against ${BASE_URL}...`);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(String(e).slice(0, 200)));
  page.on("console", (m) => {
    if (m.type() === "error") pageErrors.push("console:" + m.text().slice(0, 200));
  });
  try {
    // 0. Homepage: design chrome + bag commerce contract
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

    const addCount = await page.$$eval("[data-add]", (els) => els.length);
    console.log(`✓ homepage data-add buttons: ${addCount}`);
    check("homepage has Add to bag buttons", addCount > 0);
    const addLabels = await page.$$eval("[data-add]", (els) => els.map((e) => e.textContent?.replace(/\s+/g, " ").trim()));
    check("Add to bag copy present", addLabels.some((t) => t.includes("Add to bag")));

    const storeLinks = await page.$$eval('a[href*="myeasyorders.com/products"]', (els) => els.length);
    check("zero myeasyorders product links on homepage", storeLinks === 0);
    const buyCopy = await page.evaluate(() => document.body.textContent || "");
    check(
      "no external store buy copy",
      !buyCopy.includes("Buy on the store") && !buyCopy.includes("View on store"),
    );

    check("header bag button", (await page.$("header [data-cart-open]")) !== null);
    check("footer wordmark", buyCopy.includes("MISKOVA"));

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

    // Helper: count unique Add-to-bag products on a collection page
    const countBagCtas = async (path, expected, label) => {
      await page.goto(`${BASE_URL}${path}`, { waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => document.querySelectorAll("[data-add]").length > 0, { timeout: 15000 });
      const unique = await page.$$eval("[data-add]", (els) => new Set(els.map((e) => e.getAttribute("data-add"))).size);
      console.log(`✓ ${label} bag CTA count: ${unique}`);
      check(`${label} count ${expected}`, unique === expected);
      const leaks = await page.$$eval('a[href*="myeasyorders.com/products"]', (els) => els.length);
      check(`${label} zero store links`, leaks === 0);
      return unique;
    };

    // 2. Summer (/collections/summer)
    console.log("Testing Summer Sol (/collections/summer)...");
    await countBagCtas("/collections/summer", 6, "summer");
    const summerH2 = await page.$eval("#summer h2", (e) => e.textContent?.replace(/\s+/g, ""));
    check("summer heading Summer Sol", summerH2 === "SummerSol");

    // 3. Best Sellers (/collections/best-sellers)
    console.log("Testing Best Sellers (/collections/best-sellers)...");
    await countBagCtas("/collections/best-sellers", 6, "best");
    const bestH2 = await page.$eval("#best h2", (e) => e.textContent?.replace(/\s+/g, ""));
    check("best heading Best Sellers", bestH2 === "BestSellers");

    // 4. For Him (/collections/for-him)
    console.log("Testing For Him (/collections/for-him)...");
    await countBagCtas("/collections/for-him", 15, "him");
    const himH2 = await page.$eval("#him h2", (e) => e.textContent?.replace(/\s+/g, ""));
    check("him heading For Him", himH2 === "ForHim");
    const himViewAll = await page.$$eval("#him a", (els) => els.some((e) => e.getAttribute("href") === "/collections/all"));
    check("him view-all links to /collections/all", himViewAll);

    // 5. For Her (/collections/for-her)
    console.log("Testing For Her (/collections/for-her)...");
    await countBagCtas("/collections/for-her", 6, "her");
    const herH2 = await page.$eval("#her h2", (e) => e.textContent?.replace(/\s+/g, ""));
    check("her heading For Her", herH2 === "ForHer");

    // 6. All Chapters (/collections/all) — filters + sorts + full archive
    console.log("Testing All Chapters (/collections/all)...");
    await page.goto(`${BASE_URL}/collections/all`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#archive", { timeout: 10000 });
    const allH2 = await page.$eval("#archive h2", (e) => e.textContent?.replace(/\s+/g, ""));
    check("all heading All Chapters", allH2 === "AllChapters");

    const allCount = await page.$$eval("[data-add]", (els) => new Set(els.map((e) => e.getAttribute("data-add"))).size);
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
    const bundlesCount = await page.$$eval("[data-add]", (els) => new Set(els.map((e) => e.getAttribute("data-add"))).size);
    check("bundles filter shows 2", bundlesCount === 2);

    // 7. Bag drawer opens on Add-to-bag click
    console.log("Testing bag drawer + checkout happy path...");
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => {
      const el = document.querySelector("[data-add]");
      return !!el && Object.keys(el).some((k) => k.startsWith("__reactFiber"));
    }, { timeout: 30000 });
    let opened = false;
    for (let attempt = 1; attempt <= 3 && !opened; attempt++) {
      await page.evaluate(() => document.querySelector("[data-add]")?.click());
      try {
        await page.waitForSelector('[role="dialog"][aria-label="Shopping bag"]', { timeout: 6000 });
        opened = true;
      } catch {
        console.log(`  drawer not open after click ${attempt}, retrying...`);
      }
    }
    try {
      await page.waitForSelector('[role="dialog"][aria-label="Shopping bag"]', { timeout: 3000 });
    } catch {
      await page.screenshot({ path: ".data/shots/e2e-bag-fail.png" });
      const state = await page.evaluate(() => ({
        dialog: !!document.querySelector("[role=dialog]"),
        addBtns: document.querySelectorAll("[data-add]").length,
        ls: localStorage.getItem("miskova.bag.v1"),
        overflow: document.documentElement.style.overflow,
      }));
      console.log("DRAWER-FAIL-STATE", JSON.stringify(state));
      console.log("PAGE-ERRORS", JSON.stringify(pageErrors.slice(-6)));
      throw new Error("bag drawer did not stay open");
    }
    const drawerText = await page.$eval('[role="dialog"]', (e) => e.textContent?.replace(/\s+/g, " "));
    check("drawer shows subtotal + checkout", drawerText.includes("Subtotal") && drawerText.includes("Proceed to checkout"));
    await page.screenshot({ path: ".data/shots/e2e-bag.png" });

    // 8. Checkout → success ref
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('[role="dialog"] button')).find((x) => x.textContent.includes("Proceed to checkout"));
      b?.click();
    });
    await page.waitForSelector("#bag-name", { timeout: 10000 });
    await page.type("#bag-name", "E2E Tester");
    await page.type("#bag-phone", "01012345678");
    await page.select("#bag-gov", "Cairo");
    await page.type("#bag-address", "12 Test Street, Nasr City, Cairo");
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('[role="dialog"] button')).find((x) => x.textContent.includes("Place order"));
      b?.click();
    });
    await page.waitForFunction(() => /MKV-[A-Z0-9]+/.test(document.body.textContent || ""), { timeout: 15000 });
    const ref = await page.evaluate(() => (document.body.textContent.match(/MKV-[A-Z0-9]+/) || [])[0]);
    console.log(`✓ order ref: ${ref}`);
    check("success ref displayed", !!ref);
    check("whatsapp confirm present", await page.evaluate(() => document.body.textContent.includes("WhatsApp")));
    await page.screenshot({ path: ".data/shots/e2e-success.png" });

    // 9. API-level: POST /api/orders → 201 + isolated store gains exactly one order
    const before = JSON.parse(fs.readFileSync(ordersPath, "utf8"));
    const apiRes = await fetch(`${BASE_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{ slug: "Heir", qty: 1 }],
        customer: { name: "API Check", phone: "01098765432", governorate: "Giza", address: "5 API Road, Giza", notes: "" },
      }),
    });
    const apiJson = await apiRes.json();
    check("POST /api/orders 201", apiRes.status === 201 && apiJson.ok === true && typeof apiJson.ref === "string");
    const after = JSON.parse(fs.readFileSync(ordersPath, "utf8"));
    check("isolated orders.json gains exactly one order", after.length === before.length + 1);

    // 10. Validation boundary: unknown slug → 400
    const badRes = await fetch(`${BASE_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{ slug: "Nope", qty: 1 }],
        customer: { name: "API Check", phone: "01098765432", governorate: "Giza", address: "5 API Road, Giza" },
      }),
    });
    check("unknown slug → 400", badRes.status === 400);

    console.log(failures.length === 0 ? "ALL COLLECTION PAGES AND COMMERCE TESTS PASSED!" : `${failures.length} FAILURES`);
    // Explicit exit: the detached server group + open log fd keep the event
    // loop alive after main() returns, so a green run would otherwise hang.
    process.exit(failures.length === 0 ? 0 : 1);
  } finally {
    if (server?.pid) {
      try { process.kill(-server.pid, "SIGTERM"); } catch {}
      await new Promise((r) => setTimeout(r, 1500));
      try { process.kill(-server.pid, "SIGKILL"); } catch {}
    }
    if (server) server.kill("SIGTERM");
    fs.rmSync(tmp, { recursive: true, force: true });
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
