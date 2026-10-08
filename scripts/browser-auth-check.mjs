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
try {
  const page = await browser.newPage({ viewport: { width: 375, height: 900 } });
  await page.goto('http://localhost:3003/sign-up');
  await page.getByLabel('Full name').fill('Browser Tester');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.waitForURL('**/verify-email');
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
  await page.goto(`http://localhost:3003/verify-email?token=${token}`);
  await page.getByRole('button', { name: 'Verify email' }).click();
  await page.getByText('Your email is verified.').waitFor();
  await page.goto('http://localhost:3003/sign-in');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL('**/dashboard');
  await page.getByText('Welcome, Browser Tester').waitFor();
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
  await page.goto('http://localhost:3003/requests/new');
  await page.getByLabel('Blood group needed').selectOption('A+');
  await page.getByLabel('Units needed').fill('2');
  await page
    .getByLabel('Expires at')
    .fill(new Date(Date.now() + 172_800_000).toISOString().slice(0, 16));
  await page.getByLabel('Hospital or care center').fill('Synthetic Hospital');
  await page.getByLabel('City').fill('Kolkata');
  await page.getByRole('button', { name: 'Create request' }).click();
  await page.waitForURL('**/requests/*');
  await page.getByRole('heading', { name: 'Synthetic Hospital' }).waitFor();
  await page.getByText('Unable to load matches.').waitFor();
  await page.getByRole('button', { name: 'Close request' }).waitFor();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Close request' }).click();
  await page.getByText('Request closed.').waitFor();
  console.log(
    'PASS: browser signup, verification, request form, secondary error, close and cookies',
  );
} finally {
  await browser.close();
}
