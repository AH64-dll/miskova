
import puppeteer from 'puppeteer';

async function check(url, width) {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome-stable' });
  const page = await browser.newPage();
  await page.setViewport({ width, height: 800 });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 6000)); // 6s settle

  // 1. No horizontal overflow
  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1;
  });

  // 2. Skip-link opacity
  const skipLinkOpacity = await page.evaluate(() => {
    const el = document.querySelector('a[href="#main-content"]');
    if (!el) return null;
    return getComputedStyle(el).opacity;
  });

  // 3. .mk-card-badge inside .mk-card-media
  const badgeInside = await page.evaluate(() => {
    const cards = document.querySelectorAll('.mk-card');
    for (const card of cards) {
        const badge = card.querySelector('.mk-card-badge');
        const media = card.querySelector('.mk-card-media');
        if (badge && media) {
            const bRect = badge.getBoundingClientRect();
            const mRect = media.getBoundingClientRect();
            if (bRect.top < mRect.top || bRect.bottom > mRect.bottom || bRect.left < mRect.left || bRect.right > mRect.right) return false;
        }
    }
    return true;
  });

  // 4. .bar-row-btn grid
  const barRowBtn = await page.evaluate(() => {
      const el = document.querySelector('.bar-row-btn');
      return !!el;
  });

  await browser.close();
  return { overflow, skipLinkOpacity, badgeInside, barRowBtn };
}

(async () => {
  const url = 'http://127.0.0.1:3111';
  console.log('1440:', await check(url, 1440));
  console.log('390:', await check(url, 390));
})();
