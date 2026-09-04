// Accessibility gate: axe critical/serious = 0, one visible h1, heading order,
// keyboard paths, 44px targets, contrast spot-check, zero console errors.
import puppeteer from "puppeteer-core";
import { AxePuppeteer } from "@axe-core/puppeteer";

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3111";
const EXEC = process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/google-chrome-stable";

const ROUTES = ["/", "/collections", "/collections/summer", "/collections/for-him", "/collections/for-her", "/collections/best-sellers", "/collections/all"];
const failures = [];
const check = (label, cond) => {
  console.log(`${cond ? "PASS" : "FAIL"} ${label}`);
  if (!cond) failures.push(label);
};

const browser = await puppeteer.launch({
  executablePath: EXEC,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

try {
  for (const route of ROUTES) {
    for (const width of [1440, 390]) {
      const page = await browser.newPage();
      const errors = [];
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      page.on("pageerror", (e) => errors.push(String(e)));
      await page.setViewport({ width, height: width === 1440 ? 1000 : 844 });
      await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
      await new Promise((r) => setTimeout(r, 2500));

      await page.waitForFunction(() => document.readyState === "complete", { timeout: 30000 }).catch(() => {});
      const axe = new AxePuppeteer(page);
      let results;
      for (let attempt = 0; ; attempt++) {
        try {
          results = await axe.analyze();
          break;
        } catch (err) {
          if (attempt >= 2) throw err;
          await new Promise((r) => setTimeout(r, 1500));
        }
      }
      const bad = (results.violations || []).filter((v) =>
        ["critical", "serious"].includes(v.impact),
      );
      check(`${route}@${width} axe critical/serious=0 (${bad.length})`, bad.length === 0);
      if (bad.length > 0) {
        for (const v of bad.slice(0, 5)) console.log(`  - ${v.impact} ${v.id}: ${v.nodes.length} nodes`);
      }

      const contrastViolations = (results.violations || []).filter((v) => v.id === "color-contrast");
      check(`${route}@${width} text contrast >= 4.5:1 (violations=${contrastViolations.length})`, contrastViolations.length === 0);

      const h1s = await page.evaluate(() =>
        Array.from(document.querySelectorAll("h1"))
          .filter((el) => el.offsetParent !== null)
          .map((el) => el.textContent.trim()),
      );
      check(`${route}@${width} one visible h1 (${h1s.length})`, h1s.length === 1);

      const order = await page.evaluate(() => {
        const tags = Array.from(document.querySelectorAll("h1,h2,h3,h4"))
          .filter((el) => el.offsetParent !== null)
          .map((el) => Number(el.tagName[1]));
        return tags.every((t, i) => i === 0 || t - tags[i - 1] <= 1);
      });
      check(`${route}@${width} heading order`, order);

      const small = await page.evaluate(() =>
        Array.from(document.querySelectorAll("button,a")).filter((el) => {
          if (el.offsetParent === null) return false;
          const r = el.getBoundingClientRect();
          return (r.width < 44 || r.height < 44) && r.width > 0 && r.height > 0;
        }).length,
      );
      check(`${route}@${width} 44px targets (violations=${small})`, small === 0);

      // Interactive keyboard probes on route /
      if (route === "/") {
        if (width === 1440) {
          // 1. Search dialog keyboard path & focus containment/restoration
          const searchBtn = await page.$(`button[aria-label="Search fragrances"]`);
          if (searchBtn) {
            await searchBtn.focus();
            await page.keyboard.press("Enter");
            await new Promise((r) => setTimeout(r, 400));
            const searchOpen = await page.$eval(".mk-search-dialog", (el) => el.open).catch(() => false);
            const inputFocused = await page.evaluate(() => document.activeElement?.id === "mk-search-input");
            await page.keyboard.press("Tab");
            await page.keyboard.press("Tab");
            const focusContained = await page.evaluate(() => document.activeElement?.closest(".mk-search-dialog") !== null);
            await page.keyboard.press("Escape");
            await new Promise((r) => setTimeout(r, 400));
            const searchClosed = await page.$eval(".mk-search-dialog", (el) => !el.open).catch(() => true);
            const searchRestored = await page.evaluate(() => document.activeElement?.getAttribute("aria-label") === "Search fragrances");
            check(`${route}@${width} keyboard search dialog (open=${searchOpen}, focus=${inputFocused}, contained=${focusContained}, close=${searchClosed}, restored=${searchRestored})`, searchOpen && inputFocused && focusContained && searchClosed && searchRestored);
          }

          // 2. Carousel & Lightbox keyboard path
          const carousel = await page.$(".patron-carousel-wrapper");
          if (carousel) {
            await carousel.scrollIntoView();
            await carousel.focus();
            const countBefore = await page.$eval(".counter-current", (el) => el.textContent.trim());
            await page.keyboard.press("ArrowRight");
            await new Promise((r) => setTimeout(r, 400));
            const countAfter = await page.$eval(".counter-current", (el) => el.textContent.trim());
            const carouselNav = countBefore !== countAfter;

            const openBadge = await page.$(".patron-hover-badge");
            if (openBadge) {
              await openBadge.focus();
              await page.keyboard.press("Enter");
              await new Promise((r) => setTimeout(r, 400));
              const lbOpen = await page.$eval(".patron-lightbox-dialog", (el) => el.open).catch(() => false);
              await page.keyboard.press("Tab");
              const lbContained = await page.evaluate(() => document.activeElement?.closest(".patron-lightbox-dialog") !== null);
              await page.keyboard.press("Escape");
              await new Promise((r) => setTimeout(r, 400));
              const lbClosed = await page.$eval(".patron-lightbox-dialog", (el) => !el?.open).catch(() => true);
              const lbRestored = await page.evaluate(() => document.activeElement?.classList.contains("patron-hover-badge"));
              check(`${route}@${width} keyboard carousel/lightbox (nav=${carouselNav}, open=${lbOpen}, contained=${lbContained}, close=${lbClosed}, restored=${lbRestored})`, carouselNav && lbOpen && lbContained && lbClosed && lbRestored);
            }
          }

          // 3. Review dialog keyboard path
          const writeBtn = await page.$(".header-write-btn");
          if (writeBtn) {
            await writeBtn.scrollIntoView();
            await writeBtn.focus();
            await page.keyboard.press("Enter");
            await new Promise((r) => setTimeout(r, 400));
            const reviewOpen = await page.$eval(".review-dialog", (el) => el.open).catch(() => false);
            await page.keyboard.press("Tab");
            const reviewContained = await page.evaluate(() => document.activeElement?.closest(".review-dialog") !== null);
            await page.keyboard.press("Escape");
            await new Promise((r) => setTimeout(r, 400));
            const reviewClosed = await page.$eval(".review-dialog", (el) => !el.open).catch(() => true);
            const reviewRestored = await page.evaluate(() => document.activeElement?.classList.contains("header-write-btn"));
            check(`${route}@${width} keyboard review dialog (open=${reviewOpen}, contained=${reviewContained}, close=${reviewClosed}, restored=${reviewRestored})`, reviewOpen && reviewContained && reviewClosed && reviewRestored);
          }
        } else if (width === 390) {
          // Mobile menu keyboard path
          const menuBtn = await page.$(".mk-menu-trigger");
          if (menuBtn) {
            await menuBtn.focus();
            await page.keyboard.press("Enter");
            await new Promise((r) => setTimeout(r, 400));
            const menuOpen = await page.$eval("#mk-menu", (el) => el !== null).catch(() => false);
            const closeBtn = await page.$(`button[aria-label="Close menu"]`);
            if (closeBtn) {
              await closeBtn.focus();
              await page.keyboard.press("Enter");
              await new Promise((r) => setTimeout(r, 400));
            }
            const menuClosed = await page.evaluate(() => document.querySelector("#mk-menu") === null);
            check(`${route}@${width} keyboard mobile menu (open=${menuOpen}, close=${menuClosed})`, menuOpen && menuClosed);
          }
        }
      }

      check(`${route}@${width} zero console errors`, errors.length === 0);
      if (errors.length > 0) console.log(`  console: ${errors.slice(0, 3).join(" | ").slice(0, 300)}`);
      await page.close();
    }
  }
} finally {
  await browser.close();
}

if (failures.length > 0) {
  console.error(`\n${failures.length} FAILURES`);
  process.exit(1);
}
console.log("\na11y OK");
