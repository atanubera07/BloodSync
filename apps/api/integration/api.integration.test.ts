import { describe, expect, it } from 'vitest';
import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { PRIVACY_VERSION } from '@bloodsync/shared';

const api = 'http://localhost:4000/v1';
const mailpit = 'http://localhost:8025/api/v1';
const origin = 'http://localhost:3000';
const password = 'synthetic-integration-passphrase-2026';
const suffix = randomBytes(5).toString('hex');
const uuid = '550e8400-e29b-41d4-a716-446655440000';

class Client {
  readonly cookies = new Map<string, string>();
  async call(method: string, path: string, body?: unknown, requestOrigin: string | null = origin) {
    const headers: Record<string, string> = {};
    if (requestOrigin !== null) headers.Origin = requestOrigin;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const csrf = this.cookies.get('bs_csrf');
    if (csrf && !['GET', 'HEAD'].includes(method)) headers['X-CSRF-Token'] = csrf;
    if (this.cookies.size)
      headers.Cookie = [...this.cookies].map(([key, value]) => `${key}=${value}`).join('; ');
    const response = await fetch(api + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    for (const setCookie of response.headers.getSetCookie()) {
      const [name, value] = setCookie.split(';', 1)[0].split('=');
      if (value) this.cookies.set(name, value);
      else this.cookies.delete(name);
    }
    return { status: response.status, body: await response.json().catch(() => ({})) };
  }
}

async function check(client: Client, method: string, path: string, status: number, body?: unknown) {
  const response = await client.call(method, path, body);
  expect(response.status, `${method} ${path}: ${JSON.stringify(response.body)}`).toBe(status);
  return response.body as Record<string, unknown> & unknown[];
}

async function tokenFor(email: string, subject: string) {
  for (let attempt = 0; attempt < 40; attempt++) {
    const listing = (await (await fetch(`${mailpit}/messages`)).json()) as {
      messages?: { ID: string; Subject: string; To: { Address: string }[] }[];
    };
    const found = listing.messages?.find(
      (item) => item.Subject === subject && item.To.some((to) => to.Address === email),
    );
    if (found) {
      const message = (await (await fetch(`${mailpit}/message/${found.ID}`)).json()) as {
        Text: string;
      };
      const token = /token=([A-Za-z0-9_-]{43})/.exec(message.Text)?.[1];
      if (token) return token;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Synthetic email was not received: ${subject}`);
}

async function account(label: string) {
  const client = new Client();
  const email = `integration-${label}-${suffix}@example.test`;
  await check(client, 'POST', '/auth/register', 201, {
    email,
    password,
    fullName: `${label} Tester`,
  });
  const token = await tokenFor(email, 'Verify your BloodSync email');
  await check(client, 'POST', '/auth/verify-email', 200, { token });
  await check(client, 'POST', '/auth/login', 200, { email, password });
  return { client, email };
}

describe('PostGIS, Redis and Mailpit integration', () => {
  it('checks account sessions, cookie CSRF, reset and lockout', async () => {
    const client = new Client();
    const email = `integration-auth-${suffix}@example.test`;
    await check(client, 'POST', '/auth/register', 201, {
      email,
      password,
      fullName: 'Auth Tester',
    });
    await check(client, 'POST', '/auth/register', 400, {
      email,
      password,
      fullName: 'Auth Tester',
    });
    await check(client, 'POST', '/auth/login', 401, { email, password });
    const verify = await tokenFor(email, 'Verify your BloodSync email');
    await check(client, 'POST', '/auth/verify-email', 200, { token: verify });
    await check(client, 'POST', '/auth/verify-email', 400, { token: verify });
    await check(client, 'POST', '/auth/login', 200, { email, password });
    const oldRefresh = client.cookies.get('bs_refresh');
    const oldCsrf = client.cookies.get('bs_csrf');
    await check(client, 'POST', '/auth/refresh', 200, {});
    expect(client.cookies.get('bs_refresh')).not.toBe(oldRefresh);
    const reused = await fetch(`${api}/auth/refresh`, {
      method: 'POST',
      headers: {
        Origin: origin,
        'Content-Type': 'application/json',
        'X-CSRF-Token': oldCsrf ?? '',
        Cookie: `bs_refresh=${oldRefresh}; bs_csrf=${oldCsrf}`,
      },
      body: '{}',
    });
    expect(reused.status).toBe(401);
    await check(client, 'POST', '/auth/password/forgot', 200, { email });
    await check(client, 'POST', '/auth/password/forgot', 200, {
      email: `missing-${suffix}@example.test`,
    });
    const reset = await tokenFor(email, 'Reset your BloodSync password');
    await check(client, 'POST', '/auth/password/reset', 200, {
      token: reset,
      password: 'new-synthetic-passphrase-2026',
    });
    await check(client, 'POST', '/auth/password/reset', 400, {
      token: reset,
      password: 'new-synthetic-passphrase-2026',
    });
    await check(client, 'POST', '/auth/login', 200, {
      email,
      password: 'new-synthetic-passphrase-2026',
    });
    expect((await client.call('PATCH', '/requests/' + uuid, { units: 5 }, null)).status).toBe(400);
    expect(
      (await client.call('PATCH', '/requests/' + uuid, { units: 5 }, 'https://attacker.example'))
        .status,
    ).toBe(400);
    await check(client, 'POST', '/auth/logout', 200, {});
    await check(client, 'GET', '/auth/me', 401);
    for (let n = 0; n < 5; n++)
      await check(client, 'POST', '/auth/login', 401, { email, password: 'incorrect-password' });
    await check(client, 'POST', '/auth/login', 401, {
      email,
      password: 'new-synthetic-passphrase-2026',
    });
  }, 120_000);

  it('checks ownership, roles, donor approval, matching and privacy', async () => {
    const { client: admin, email: adminEmail } = await account('admin');
    execFileSync('node', ['dist/apps/api/src/provision-admin.js', adminEmail], { stdio: 'ignore' });
    const { client: patient, email: patientEmail } = await account('patient');
    const { client: otherPatient } = await account('otherpatient');
    const { client: donor, email: donorEmail } = await account('donor');
    const { client: otherDonor } = await account('otherdonor');
    const anonymous = new Client();
    const profile = {
      bloodGroup: 'O-',
      birthDate: '1998-03-01',
      weightKg: 55,
      lastDonationAt: null,
      city: 'Kolkata',
      latitude: 22.5726,
      longitude: 88.3639,
      consentToMatch: true,
    };
    const request = {
      bloodGroup: 'A+',
      units: 2,
      urgency: 'URGENT',
      hospitalName: 'City Hospital',
      city: 'Kolkata',
      latitude: 22.573,
      longitude: 88.364,
      expiresAt: new Date(Date.now() + 172_800_000).toISOString(),
    };
    const protectedRoutes: [string, string, unknown?][] = [
      ['GET', '/donors/me'],
      ['PUT', '/donors/me', profile],
      ['GET', '/donors/me/matches'],
      ['POST', `/donors/me/interests/${uuid}`],
      ['GET', '/requests'],
      ['POST', '/requests', request],
      ['GET', `/requests/${uuid}`],
      ['PATCH', `/requests/${uuid}`, { city: 'Delhi' }],
      ['DELETE', `/requests/${uuid}`],
      ['GET', `/requests/${uuid}/matches`],
      ['GET', `/requests/${uuid}/interests`],
      ['GET', '/me/consent'],
      [
        'POST',
        '/me/consent',
        { privacyVersion: PRIVACY_VERSION, healthProcessing: true, contactSharing: true },
      ],
      ['DELETE', '/me/consent'],
      ['GET', '/me/export'],
      ['DELETE', '/me', { password }],
      ['GET', '/admin/donors'],
      ['POST', `/admin/donors/${uuid}/approve`],
      ['POST', `/admin/donors/${uuid}/reject`],
      ['GET', '/admin/audit'],
    ];
    for (const [method, path, body] of protectedRoutes)
      await check(anonymous, method, path, 401, body);
    for (const path of ['/admin/donors', '/admin/audit']) await check(patient, 'GET', path, 403);
    for (const path of [`/admin/donors/${uuid}/approve`, `/admin/donors/${uuid}/reject`])
      await check(patient, 'POST', path, 403);
    for (const [method, path, body] of protectedRoutes.slice(0, 11))
      await check(admin, method, path, 403, body);
    const consent = {
      privacyVersion: PRIVACY_VERSION,
      healthProcessing: true,
      contactSharing: true,
    };
    await check(donor, 'POST', '/me/consent', 200, consent);
    await check(otherDonor, 'POST', '/me/consent', 200, consent);
    await check(donor, 'PUT', '/donors/me', 400, { ...profile, userId: patientEmail });
    const donorProfile = await check(donor, 'PUT', '/donors/me', 200, profile);
    await check(donor, 'GET', '/donors/me', 200);
    await check(donor, 'GET', '/donors/me/matches', 403);
    const secondProfile = await check(otherDonor, 'PUT', '/donors/me', 200, {
      ...profile,
      bloodGroup: 'B+',
    });
    const queue = await check(admin, 'GET', '/admin/donors', 200);
    expect(queue.map((item: { id: string }) => item.id)).toEqual(
      expect.arrayContaining([donorProfile.id, secondProfile.id]),
    );
    await check(admin, 'POST', `/admin/donors/${donorProfile.id}/approve`, 200);
    await check(admin, 'POST', `/admin/donors/${secondProfile.id}/reject`, 200);
    await check(admin, 'GET', '/admin/audit', 200);
    await check(otherDonor, 'GET', '/donors/me/matches', 403);
    await check(admin, 'POST', `/admin/donors/${donorProfile.id}/approve`, 409);
    await check(patient, 'POST', '/requests', 400, { ...request, ownerId: uuid });
    const created = await check(patient, 'POST', '/requests', 201, request);
    const id = created.id as string;
    expect(
      (await check(patient, 'GET', '/requests', 200)).map((item: { id: string }) => item.id),
    ).toEqual([id]);
    expect(await check(otherPatient, 'GET', '/requests', 200)).toEqual([]);
    for (const [method, tail, body] of [
      ['GET', '', undefined],
      ['PATCH', '', { city: 'Delhi' }],
      ['DELETE', '', undefined],
      ['GET', '/matches', undefined],
      ['GET', '/interests', undefined],
    ] as [string, string, unknown?][])
      await check(otherPatient, method, `/requests/${id}${tail}`, 404, body);
    await check(patient, 'GET', `/requests/${id}`, 200);
    expect(await check(patient, 'GET', `/requests/${id}/interests`, 200)).toEqual([]);
    const matched = await check(patient, 'GET', `/requests/${id}/matches`, 200);
    expect(matched.some((item: { id: string }) => item.id === donorProfile.id)).toBe(true);
    expect(matched.every((item: object) => !('email' in item) && !('user' in item))).toBe(true);
    expect(
      (await check(donor, 'GET', '/donors/me/matches', 200)).some(
        (item: { id: string }) => item.id === id,
      ),
    ).toBe(true);
    await check(otherDonor, 'POST', `/donors/me/interests/${id}`, 403);
    await check(donor, 'POST', `/donors/me/interests/${id}`, 200);
    const interests = await check(patient, 'GET', `/requests/${id}/interests`, 200);
    expect(interests[0].donor.user.email).toBe(donorEmail);
    await check(patient, 'PATCH', `/requests/${id}`, 200, { units: 3 });
    expect(await check(patient, 'GET', `/requests/${id}/interests`, 200)).toEqual([]);
    await check(donor, 'POST', `/donors/me/interests/${id}`, 200);
    await check(patient, 'DELETE', `/requests/${id}`, 200);
    expect(await check(donor, 'GET', '/donors/me/matches', 200)).toEqual([]);
    await check(patient, 'PATCH', `/requests/${id}`, 409, { units: 4 });
    await check(donor, 'POST', `/donors/me/interests/${id}`, 404);
    await check(donor, 'PUT', '/donors/me', 200, { ...profile, city: 'Howrah' });
    await check(donor, 'GET', '/donors/me/matches', 403);
    const exported = await check(patient, 'GET', '/me/export', 200);
    expect(exported.user.email).toBe(patientEmail);
    expect(exported.requests).toHaveLength(1);
    expect(JSON.stringify(exported)).not.toMatch(/passwordHash|tokenHash/);
    expect((await check(otherPatient, 'GET', '/me/export', 200)).requests).toEqual([]);
    await check(otherPatient, 'DELETE', '/me', 403, { password: 'wrong' });
    await check(otherPatient, 'DELETE', '/me', 200, { password });
    await check(otherPatient, 'GET', '/auth/me', 401);
    await check(donor, 'DELETE', '/me/consent', 200);
    expect((await check(donor, 'GET', '/donors/me', 200)).consentToMatch).toBe(false);
  }, 120_000);
});
