import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { URL } from 'node:url';
import { createRequire } from 'node:module';
import { chromium } from '@playwright/test';

const stage = process.argv[2] || 'after';
const baseUrl = process.env.UI_AUDIT_URL || 'http://127.0.0.1:3000';
const output = new URL('../docs/redesign/screenshots/', import.meta.url);
const webRequire = createRequire(new URL('../apps/web/package.json', import.meta.url));
const axePath = webRequire.resolve('axe-core', { paths: [webRequire.resolve('vitest-axe')] });
const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
const request = {
  id: '00000000-0000-4000-8000-000000000001',
  bloodGroup: 'O+',
  units: 2,
  urgency: 'URGENT',
  hospitalName: 'Example Care Center',
  city: 'Sample City',
  latitude: null,
  longitude: null,
  expiresAt: future,
  status: 'OPEN',
  createdAt: new Date().toISOString(),
};
const user = {
  id: 'sample-user',
  fullName: 'Sample Person',
  email: 'sample@example.test',
  role: 'USER',
};
const admin = { ...user, role: 'ADMIN' };

function response(path, adminMode) {
  if (path.endsWith('/auth/me')) return adminMode ? admin : user;
  if (path.endsWith('/donors/me'))
    return {
      id: 'sample-donor',
      status: 'APPROVED',
      bloodGroup: 'O+',
      birthDate: '1990-01-01',
      weightKg: '70',
      lastDonationAt: null,
      city: 'Sample City',
      latitude: null,
      longitude: null,
      consentToMatch: true,
    };
  if (path.endsWith('/me/details'))
    return {
      fullName: user.fullName,
      email: user.email,
      phoneNumber: null,
      declaredBloodGroup: null,
      postalAddress: null,
      city: 'Sample City',
      stateRegion: null,
    };
  if (path.endsWith('/admin/donors'))
    return [
      {
        id: 'sample-donor',
        bloodGroup: 'A+',
        birthDate: '1990-01-01',
        weightKg: '70',
        lastDonationAt: null,
        city: 'Sample City',
        consentToMatch: true,
        createdAt: new Date().toISOString(),
        user: { fullName: 'Sample Donor', email: 'donor@example.test' },
      },
    ];
  if (path.endsWith('/admin/audit')) return [];
  if (path.endsWith('/donors/me/matches')) return [{ ...request, distanceKm: 4, responded: false }];
  if (path.endsWith('/requests')) return [request];
  if (path.includes('/requests/') && path.endsWith('/matches')) return [];
  if (path.includes('/requests/') && path.endsWith('/interests')) return [];
  if (path.includes('/requests/')) return request;
  return [];
}

const cases = [
  { path: '/', name: 'home' },
  { path: '/sign-up', name: 'signup' },
  { path: '/sign-in', name: 'signin' },
  { path: '/dashboard', name: 'dashboard' },
  { path: '/donor/profile', name: 'donor' },
  { path: '/donor/matches', name: 'matches' },
  { path: '/donor/matches', name: 'matches-empty', empty: true },
  { path: '/requests/new', name: 'request-new' },
  { path: '/requests', name: 'requests' },
  { path: '/requests', name: 'requests-empty', empty: true },
  { path: `/requests/${request.id}`, name: 'request-detail' },
  { path: '/admin', name: 'admin', admin: true },
  { path: '/account', name: 'account' },
  { path: '/about', name: 'about' },
  { path: '/faq', name: 'faq' },
  { path: '/contact', name: 'contact' },
  { path: '/privacy', name: 'privacy' },
  { path: '/terms', name: 'terms' },
];
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox'],
});
await mkdir(output, { recursive: true });
const failures = [];
for (const width of [320, 375, 768, 1024, 1440]) {
  for (const item of cases) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
    await page.route('**/api/v1/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          item.empty &&
            (new URL(route.request().url()).pathname.endsWith('/requests') ||
              new URL(route.request().url()).pathname.endsWith('/donors/me/matches'))
            ? []
            : response(new URL(route.request().url()).pathname, item.admin),
        ),
      }),
    );
    try {
      const result = await page.goto(`${baseUrl}${item.path}`, { waitUntil: 'domcontentloaded' });
      assert.equal(result?.status(), 200, `${item.name} returned ${result?.status()}`);
      await page.locator('h1').first().waitFor({ timeout: 15000 });
      await page.waitForTimeout(180);
      const metrics = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > globalThis.innerWidth + 1,
        workspaceClipped: (() => {
          const workspace = document.querySelector('.workspace');
          return workspace ? workspace.scrollWidth > workspace.clientWidth + 1 : false;
        })(),
        h1Count: document.querySelectorAll('h1').length,
        unlabeledInputs: [...document.querySelectorAll('input, select, textarea')].filter(
          (control) => !control.labels?.length && !control.getAttribute('aria-label'),
        ).length,
      }));
      assert.equal(metrics.overflow, false, 'horizontal overflow');
      assert.equal(metrics.workspaceClipped, false, 'workspace content clipped');
      assert.equal(metrics.h1Count, 1, `expected one h1, got ${metrics.h1Count}`);
      assert.equal(metrics.unlabeledInputs, 0, `${metrics.unlabeledInputs} unlabeled controls`);
      if (
        [375, 1440].includes(width) &&
        ['home', 'signup', 'dashboard', 'request-new', 'admin', 'account'].includes(item.name)
      ) {
        await page.addScriptTag({ path: axePath });
        const violations = await page.evaluate(async () => {
          const results = await globalThis.axe.run(globalThis.document, {
            runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
          });
          return results.violations.map(
            (violation) =>
              `${violation.id}: ${violation.nodes.map((node) => node.target.join(',')).join(';')}`,
          );
        });
        assert.deepEqual(violations, [], `axe: ${violations.join(' | ')}`);
      }
      if (
        (width === 375 && ['home', 'signup', 'request-new'].includes(item.name)) ||
        (width === 1440 && ['home', 'dashboard', 'admin'].includes(item.name))
      ) {
        await page.screenshot({
          path: new URL(`${stage}-${item.name}-${width}.jpg`, output).pathname,
          type: 'jpeg',
          quality: 80,
          fullPage: true,
        });
      }
      console.log(`PASS ${width} ${item.name}`);
    } catch (error) {
      failures.push(`${width} ${item.name}: ${error.message}`);
      console.error(`FAIL ${width} ${item.name}: ${error.message}`);
    } finally {
      await page.close();
    }
  }
}
{
  const page = await browser.newPage({ viewport: { width: 375, height: 800 } });
  try {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.locator('.nav-signin').waitFor({ state: 'attached' });
    await page.keyboard.press('Tab');
    assert.match(
      await page.evaluate(() => document.activeElement?.textContent || ''),
      /Skip to content/,
    );
    const menu = page.getByRole('button', { name: /Menu/ });
    await menu.click();
    await page.waitForFunction(
      () => document.querySelector('.menu-toggle')?.getAttribute('aria-expanded') === 'true',
    );
    await page.getByRole('button', { name: /Close/ }).click();
    await page.waitForFunction(
      () => document.querySelector('.menu-toggle')?.getAttribute('aria-expanded') === 'false',
    );
    await page.goto(`${baseUrl}/sign-up`, { waitUntil: 'domcontentloaded' });
    const field = page.locator('input[name="firstName"]');
    await field.focus();
    assert.equal(
      await field.evaluate((input) => globalThis.getComputedStyle(input).outlineStyle),
      'solid',
    );
    console.log('PASS keyboard navigation and form focus');
  } catch (error) {
    failures.push(`keyboard: ${error.message}`);
  } finally {
    await page.close();
  }
}
{
  const page = await browser.newPage();
  await page.route('**/api/v1/**', (route) =>
    route.fulfill({ status: 401, contentType: 'application/json', body: '{}' }),
  );
  try {
    await page.goto(`${baseUrl}/requests/new`, { waitUntil: 'domcontentloaded' });
    await page.waitForURL('**/sign-in?next=*', { timeout: 15000 });
    assert.equal(new URL(page.url()).searchParams.get('next'), '/requests/new');
    console.log('PASS protected-route sign-in return path');
  } catch (error) {
    failures.push(`auth return path: ${error.message}`);
  } finally {
    await page.close();
  }
}
await browser.close();
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
}
