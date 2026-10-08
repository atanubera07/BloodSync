import { chromium } from '@playwright/test';
import { randomBytes } from 'node:crypto';
const email = `browser-${randomBytes(4).toString('hex')}@example.test`;
const password = 'browser-passphrase-2026';
const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium',
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
  console.log('PASS: browser signup, verification, sign-in, dashboard and cookies');
} finally {
  await browser.close();
}
