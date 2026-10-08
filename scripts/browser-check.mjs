import { chromium } from '@playwright/test';
const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox'],
});
const base = process.env.WEB_CHECK_URL || 'http://localhost:3000';
try {
  for (const path of [
    '/',
    '/about',
    '/faq',
    '/contact',
    '/privacy',
    '/terms',
    '/sign-in',
    '/sign-up',
  ]) {
    for (const width of [320, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
      const dimensions = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }));
      if (dimensions.scroll > dimensions.client)
        throw new Error(`${path} ${width}px overflows: ${JSON.stringify(dimensions)}`);
      if (errors.length) throw new Error(`${path} ${width}px browser errors: ${errors.join('; ')}`);
      if (path === '/' && (width === 320 || width === 1440))
        await page.screenshot({
          path: `apps/web/public/screenshots/home-${width}.png`,
          fullPage: true,
        });
      await page.keyboard.press('Tab');
      const focus = await page.evaluate(() => document.activeElement?.tagName);
      if (focus !== 'A') throw new Error(`Keyboard focus on ${path} at ${width}px: ${focus}`);
      await page.close();
    }
    console.log(`PASS: ${path} at 320px and 1440px`);
  }
  const zoomed = await browser.newPage({ viewport: { width: 640, height: 900 } });
  await zoomed.goto(`${base}/`);
  await zoomed.evaluate(() => {
    document.documentElement.style.zoom = '200%';
  });
  const dimensions = await zoomed.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  if (dimensions.scroll > dimensions.client)
    throw new Error(`200% zoom overflows: ${JSON.stringify(dimensions)}`);
  console.log('PASS: home at 200% CSS zoom');
  await zoomed.close();
} finally {
  await browser.close();
}
