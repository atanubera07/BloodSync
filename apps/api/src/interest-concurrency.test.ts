import { describe, expect, it, vi } from 'vitest';
import { DonorService } from './donor.service';
import { MeService } from './me.service';
import { RequestService } from './request.service';
import type { PrismaService } from './prisma.service';
import type { MatchingService } from './matching.service';

const actor = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  role: 'USER' as const,
  email: 'synthetic@example.test',
  fullName: 'Synthetic Donor',
};
const requestId = '550e8400-e29b-41d4-a716-446655440001';
const profileInput = {
  bloodGroup: 'O-' as const,
  birthDate: '1998-03-01',
  weightKg: 55,
  lastDonationAt: null,
  city: 'Kolkata',
  consentToMatch: true,
};

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function fixture() {
  const locks = new Map<string, Promise<void>>();
  const state = {
    interest: false,
    activeConsent: true,
    contactSharing: true,
    donor: {
      ...profileInput,
      id: 'synthetic-donor',
      userId: actor.id,
      status: 'APPROVED',
      birthDate: new Date(profileInput.birthDate),
    },
    request: {
      id: requestId,
      ownerId: '550e8400-e29b-41d4-a716-446655440002',
      status: 'OPEN',
      expiresAt: new Date(Date.now() + 86_400_000),
      hospitalName: 'Original Hospital',
    },
  };
  const lock = async (key: string) => {
    const previous = locks.get(key) ?? Promise.resolve();
    const turn = deferred();
    locks.set(key, turn.promise);
    await previous;
    return () => {
      turn.resolve();
      if (locks.get(key) === turn.promise) locks.delete(key);
    };
  };
  const models = {
    donorProfile: {
      findUnique: vi.fn(async () => ({ ...state.donor })),
      updateMany: vi.fn(async ({ data }: { data: { consentToMatch: boolean } }) => {
        Object.assign(state.donor, data);
        return { count: 1 };
      }),
      upsert: vi.fn(async ({ update }: { update: Record<string, unknown> }) => {
        Object.assign(state.donor, update);
        return { ...state.donor };
      }),
    },
    consentRecord: {
      findFirst: vi.fn(async ({ where }: { where: { contactSharing?: boolean } }) =>
        state.activeConsent && (!where.contactSharing || state.contactSharing) ? {} : null,
      ),
      updateMany: vi.fn(async () => {
        state.activeConsent = false;
        return { count: 1 };
      }),
      create: vi.fn(async ({ data }: { data: { contactSharing: boolean } }) => {
        state.activeConsent = true;
        state.contactSharing = data.contactSharing;
        return {};
      }),
    },
    bloodRequest: {
      findFirst: vi.fn(async () => ({ ...state.request })),
      findUnique: vi.fn(async () => ({ ...state.request })),
      findUniqueOrThrow: vi.fn(async () => ({ ...state.request })),
    },
    requestInterest: {
      upsert: vi.fn(async () => {
        state.interest = true;
        return {};
      }),
      deleteMany: vi.fn(async () => {
        state.interest = false;
        return { count: 1 };
      }),
    },
  };
  const db = {
    ...models,
    $transaction: async (run: (tx: unknown) => Promise<unknown>) => {
      const releases: (() => void)[] = [];
      const acquire = async (key: string) => {
        releases.push(await lock(key));
      };
      const tx = {
        ...models,
        $queryRaw: async (sql: TemplateStringsArray, id: string) => {
          const table = sql.join('').includes('"BloodRequest"') ? 'request' : 'user';
          await acquire(`${table}:${id}`);
          return [{ id }];
        },
        bloodRequest: {
          ...models.bloodRequest,
          updateMany: async ({ data }: { data: Record<string, unknown> }) => {
            await acquire(`request:${requestId}`);
            Object.assign(state.request, data);
            return { count: 1 };
          },
        },
      };
      try {
        return await run(tx);
      } finally {
        releases.reverse().forEach((release) => release());
      }
    },
  } as unknown as PrismaService;
  return { db, state, lock };
}

describe('interest invalidation ordering', () => {
  it.each(['consent withdrawal', 'profile edit', 'request edit'])(
    'leaves no stale interest after a concurrent %s',
    async (change) => {
      const { db, state } = fixture();
      const enteredMatching = deferred();
      const resumeMatching = deferred();
      const matching = {
        isRequestNearDonor: vi.fn(async () => {
          enteredMatching.resolve();
          await resumeMatching.promise;
          return true;
        }),
      } as unknown as MatchingService;
      const donor = new DonorService(db, matching);
      const interest = donor.expressInterest(actor, requestId);
      await enteredMatching.promise;
      const changeResult =
        change === 'consent withdrawal'
          ? new MeService(db).withdrawConsent(actor)
          : change === 'profile edit'
            ? donor.saveOwn(actor, profileInput)
            : new RequestService(db, matching).updateOwn(
                { ...actor, id: state.request.ownerId },
                requestId,
                { hospitalName: 'Updated Hospital' },
              );
      await new Promise<void>((resolve) => setImmediate(resolve));
      resumeMatching.resolve();
      await Promise.all([interest, changeResult]);
      expect(state.interest).toBe(false);
    },
  );

  it('reloads consent after waiting for a concurrent user mutation', async () => {
    const { db, state, lock } = fixture();
    const release = await lock(`user:${actor.id}`);
    const matching = {
      isRequestNearDonor: vi.fn().mockResolvedValue(true),
    } as unknown as MatchingService;
    const interest = new DonorService(db, matching).expressInterest(actor, requestId);
    await new Promise<void>((resolve) => setImmediate(resolve));
    state.activeConsent = false;
    release();
    await expect(interest).rejects.toThrow('Approved matching consent required');
    expect(state.interest).toBe(false);
    expect(matching.isRequestNearDonor).not.toHaveBeenCalled();
  });
});
