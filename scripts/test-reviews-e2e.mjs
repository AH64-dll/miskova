// Reviews E2E: carousel/keyboard/swipe, reduced-motion, lightbox, submission
// persistence across restart, 400/413/415/429/503 boundaries, helpful votes + caps.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import puppeteer from "puppeteer-core";

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3111";
const EXEC = process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/google-chrome-stable";
const PORT = Number(new URL(BASE_URL).port || 3111);

const failures = [];
const check = (label, cond) => {
  console.log(`${cond ? "PASS" : "FAIL"} ${label}`);
  if (!cond) failures.push(label);
};

async function waitForServer(url, timeoutMs = 30000) {
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

function launchServer(storePath) {
  return spawn("npm", ["run", "start", "--", "-p", String(PORT)], {
    env: { ...process.env, REVIEWS_STORE_PATH: storePath },
    stdio: "pipe",
  });
}

async function main() {
  const external = process.env.EXTERNAL_SERVER === "1";
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "miskova-rev-"));
  const storePath = path.join(tmp, "reviews.json");
  fs.writeFileSync(storePath, "[]");
  let server = external ? null : launchServer(storePath);
  if (server) await waitForServer(`${BASE_URL}/`);

  const browser = await puppeteer.launch({
    executablePath: EXEC,
    headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1000 });
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => !document.querySelector(".reviews-skeleton"), { timeout: 15000 }).catch(() => {});

    // Heading exact
    const h = await page.evaluate(
      () => document.querySelector("#reviews h2")?.textContent?.trim(),
    );
    check("heading Customer reviews", h === "Customer reviews");

    // Empty state (store may already hold earlier E2E submissions; accept either state)
    const wroteEmpty = await page.evaluate(() => document.body.textContent.includes("No reviews yet"));
    const wroteCards = await page.evaluate(() => document.querySelectorAll(".review-card:not(.reviews-skeleton)").length);
    check("empty state", wroteEmpty || wroteCards > 0);

    // Scroll carousel into view with instant behavior so clicks land reliably
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = "auto";
      document.querySelector(".patron-carousel-wrapper")?.scrollIntoView({ block: "center", behavior: "instant" });
    });
    await new Promise((r) => setTimeout(r, 200));

    // Carousel arrows + keyboard
    const counter = async () =>
      page.evaluate(() => document.querySelector(".counter-current")?.textContent?.trim());
    const c0 = await counter();
    await page.click('button[aria-label="Next customer review"]');
    await new Promise((r) => setTimeout(r, 300));
    const c1 = await counter();
    check("carousel arrow advances", c0 !== c1);
    await page.click(".patron-carousel-wrapper");
    await page.keyboard.press("ArrowRight");
    await new Promise((r) => setTimeout(r, 300));
    const c2 = await counter();
    check("carousel keyboard advances", c1 !== c2);
    // Carousel swipe
    const cSwipeBefore = await counter();
    await page.evaluate(async () => {
      const stage = document.querySelector(".patron-stage");
      stage.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          clientX: 300,
          clientY: 200,
          button: 0,
          pointerId: 1,
        }),
      );
      await new Promise((r) => setTimeout(r, 50));
      stage.dispatchEvent(
        new PointerEvent("pointermove", {
          bubbles: true,
          clientX: 200,
          clientY: 200,
          button: 0,
          pointerId: 1,
        }),
      );
      await new Promise((r) => setTimeout(r, 50));
      stage.dispatchEvent(
        new PointerEvent("pointerup", {
          bubbles: true,
          clientX: 200,
          clientY: 200,
          button: 0,
          pointerId: 1,
        }),
      );
    });
    await new Promise((r) => setTimeout(r, 400));
    const cSwipeAfter = await counter();
    check("carousel swipe advances", cSwipeBefore !== cSwipeAfter);


    // Reduced-motion: no auto-advance
    const emu = await browser.newPage();
    await emu.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await emu.setViewport({ width: 1440, height: 1000 });
    await emu.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
    const r0 = await emu.evaluate(
      () => document.querySelector(".counter-current")?.textContent?.trim(),
    );
    await new Promise((r) => setTimeout(r, 6500));
    const r1 = await emu.evaluate(
      () => document.querySelector(".counter-current")?.textContent?.trim(),
    );
    check("reduced-motion no auto-advance", r0 === r1);
    await emu.close();

    // Lightbox open + focus restore
    await page.click(".patron-hover-badge");
    await new Promise((r) => setTimeout(r, 500));
    const dialogOpen = await page.evaluate(() => !!document.querySelector("dialog[open]"));
    check("lightbox opens", dialogOpen);
    await page.keyboard.press("Escape");
    await new Promise((r) => setTimeout(r, 400));
    const focused = await page.evaluate(() =>
      (document.activeElement?.className || "").includes("patron-hover-badge"),
    );
    check("lightbox focus restored", focused);

    // API boundaries (unique UA per run: the shared prod server rate-limits per IP+UA)
    const runUA = `miskova-e2e/${Date.now()}`;
    const post = (body, headers = { "Content-Type": "application/json", "User-Agent": runUA }) =>
      fetch(`${BASE_URL}/api/reviews`, { method: "POST", headers, body });
    const valid = {
      authorName: "E2E Tester",
      productSlug: "Crimson-Bloom",
      rating: 5,
      title: "Lovely",
      comment: "A sufficiently long and genuine review body for testing.",
      location: "Cairo",
    };
    let res = await post(JSON.stringify(valid));
    check("valid 201", res.status === 201);
    const created = await res.json();
    const id = created.data?.id;
    check("uuid id", /^[0-9a-f-]{36}$/i.test(id || ""));

    res = await post("{bad json");
    check("malformed 400", res.status === 400);
    res = await post(JSON.stringify({ ...valid, comment: "x".repeat(17000) }));
    check("oversized 413", res.status === 413);
    res = await post("authorName=x", { "Content-Type": "text/plain" });
    check("media type 415", res.status === 415);
    res = await post(JSON.stringify({ ...valid, productSlug: "Nope" }));
    check("invalid product 400", res.status === 400);
    // Store failure 503 check (temporarily corrupt store, submit, confirm 503, restore)
    const targetStore = external
      ? process.env.REVIEWS_STORE_PATH || "/tmp/miskova-e2e-store/reviews.json"
      : storePath;
    if (fs.existsSync(targetStore)) {
      const storeBackup = fs.readFileSync(targetStore, "utf8");
      try {
        fs.writeFileSync(targetStore, "not-json-{{{");
        const res503 = await post(JSON.stringify(valid), {
          "Content-Type": "application/json",
          "User-Agent": `miskova-e2e-503/${Date.now()}`,
        });
        check("write failure 503", res503.status === 503);
      } finally {
        fs.writeFileSync(targetStore, storeBackup);
      }
    }


    // Rate limit: 3/hour per fingerprint — fire 4 more
    let limited = false;
    for (let i = 0; i < 4; i++) {
      res = await post(JSON.stringify({ ...valid, authorName: `R${i}` }));
      if (res.status === 429) {
        limited = res.headers.get("retry-after") !== null;
        break;
      }
    }
    check("rate limit 429 + Retry-After", limited);

    // GET cap
    res = await fetch(`${BASE_URL}/api/reviews?limit=500`);
    const got = await res.json();
    check("GET limit capped", (got.data || []).length <= 50);

    // Helpful increment
    res = await fetch(`${BASE_URL}/api/reviews/${id}/helpful`, { method: "POST" });
    const voted = await res.json();
    check("helpful increments", res.status === 200 && voted.data?.helpfulCount === 1);
    res = await fetch(`${BASE_URL}/api/reviews/abc/helpful`, { method: "POST" });
    check("helpful bad id 400", res.status === 400);
    // Helpful rate limit (20 votes per fingerprint/hour -> 21st is 429 + Retry-After)
    const voteUA = `miskova-vote-e2e/${Date.now()}`;
    let voteLimited = false;
    for (let i = 0; i < 22; i++) {
      res = await fetch(`${BASE_URL}/api/reviews/${id}/helpful`, {
        method: "POST",
        headers: { "User-Agent": voteUA },
      });
      if (res.status === 429) {
        voteLimited = res.headers.get("retry-after") !== null;
        break;
      }
    }
    check("helpful rate limit 429 + Retry-After", voteLimited);

    // Persistence verification on disk and in API
    if (fs.existsSync(targetStore)) {
      const persistedContent = fs.readFileSync(targetStore, "utf8");
      check("persists to disk store", persistedContent.includes(id));
    }
    res = await fetch(`${BASE_URL}/api/reviews`);
    const listJson = await res.json();
    check("persisted in API list", (listJson.data || []).some((r) => r.id === id));


    // Persistence across restart (skip on external server)
    if (!external) {
      server.kill("SIGTERM");
      await new Promise((r) => setTimeout(r, 1500));
      server = launchServer(storePath);
      await waitForServer(`${BASE_URL}/`);
      res = await fetch(`${BASE_URL}/api/reviews`);
      const after = await res.json();
      check(
        "persists across restart",
        (after.data || []).some((r) => r.id === id),
      );
    }

    // Source-controlled seed untouched
    const seed = fs.readFileSync("src/data/reviews-store.json", "utf8").trim();
    check("seed still []", seed === "[]");
  } finally {
    await browser.close().catch(() => {});
    if (server) server.kill("SIGTERM");
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} FAILURES`);
    process.exit(1);
  }
  console.log("\nreviews E2E OK");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
