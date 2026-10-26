import { chromium } from '@playwright/test';
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
const email = `browser-${randomBytes(4).toString('hex')}@example.test`;
const password = 'browser-passphrase-2026';
const browser = await chromium.launch({
  ...(existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium' } : {}),
  headless: true,
  args: ['--no-sandbox'],
});
async function ready(page, authenticated = false) {
  await page.locator('#main-content h1').first().waitFor();
  await page.locator(authenticated ? '.nav-account' : '.nav-signin').waitFor({ state: 'attached' });
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
}
async function openPage(page, path, authenticated = false) {
  const response = await page.goto(`http://localhost:3003${path}`, {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });
  if (response?.status() !== 200)
    throw new Error(`${path.split('?')[0]} returned ${response?.status()}`);
  await ready(page, authenticated);
}
try {
  const page = await browser.newPage({ viewport: { width: 375, height: 900 } });
  await openPage(page, '/sign-up');
  await page.getByLabel('First name').fill('Browser');
  await page.getByLabel('Last name').fill('Tester');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('checkbox', { name: /I agree to the Terms and Privacy policy/ }).check();
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.waitForURL('**/verify-email');
  await ready(page);
  let token;
  for (let attempt = 0; attempt < 20 && !token; attempt++) {
    const listing = await (await fetch('http://localhost:8025/api/v1/messages')).json();
    const item = listing.messages?.find((entry) => entry.To?.[0]?.Address === email);
    if (item) {
      const message = await (await fetch(`http://localhost:8025/api/v1/message/${item.ID}`)).json();
      token = /token=([A-Za-z0-9_-]{43})/.exec(message.Text)?.[1];
    }
    if (!token) await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!token) throw new Error('Verification email not found');
  await openPage(page, `/verify-email?token=${token}`);
  await page.getByRole('button', { name: 'Verify email' }).click();
  await page.getByText('Your email is verified.').waitFor();
  await openPage(page, '/sign-in');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL('**/dashboard');
  await ready(page, true);
  await page.getByRole('heading', { name: 'Welcome, Browser.' }).waitFor();
  const cookies = await page.context().cookies();
  if (!cookies.some((cookie) => cookie.name === 'bs_access' && cookie.httpOnly))
    throw new Error('HttpOnly access cookie missing');
  if (!cookies.some((cookie) => cookie.name === 'bs_csrf' && !cookie.httpOnly))
    throw new Error('CSRF cookie missing');
  await page.route('**/api/v1/requests/*/matches', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: '{"message":"Unavailable"}',
    }),
  );
  await openPage(page, '/requests/new', true);
  await page.getByLabel('Blood group needed').selectOption('A+');
  await page.getByLabel('Units needed').fill('2');
  await page
    .getByLabel('Expires at')
    .fill(new Date(Date.now() + 172_800_000).toISOString().slice(0, 16));
  await page.getByLabel('Hospital or care center').fill('Synthetic Hospital');
  await page.getByLabel('City').fill('Kolkata');
  await page.getByRole('button', { name: 'Create request' }).click();
  await page.waitForURL((url) => /^\/requests\/[0-9a-f-]{36}$/.test(url.pathname));
  await ready(page, true);
  await page.getByRole('heading', { name: 'Synthetic Hospital' }).waitFor();
  await page.getByText('Unable to load matches.').waitFor();
  await page.getByRole('button', { name: 'Close request' }).waitFor();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Close request' }).click();
  await page.locator('#main-content').getByText('Request closed.', { exact: true }).waitFor();
  console.log(
    'PASS: browser signup, verification, request form, secondary error, close and cookies',
  );
} finally {
  await browser.close();
}
