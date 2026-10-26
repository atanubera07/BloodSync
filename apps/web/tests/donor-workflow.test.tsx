// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type { ReactNode } from 'react';
import DonorProfilePage from '../app/donor/profile/page';
import DonorMatchesPage from '../app/donor/matches/page';
import { api, apiJson, ApiError } from '../lib/api';

vi.mock('../components/AccountGate', () => ({
  AccountGate: ({ children }: { children: () => ReactNode }) => children(),
}));
vi.mock('../components/WorkspaceFrame', () => ({
  WorkspaceFrame: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/api')>();
  return { ...actual, api: vi.fn(), apiJson: vi.fn() };
});

const profile = {
  id: 'synthetic-donor',
  bloodGroup: 'O+',
  birthDate: '1990-01-01T00:00:00.000Z',
  weightKg: '70',
  lastDonationAt: null,
  city: 'Sample City',
  latitude: null,
  longitude: null,
  consentToMatch: true,
  status: 'APPROVED',
};

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe('donor consent workflow', () => {
  it('clears consent choices on withdrawal and does not opt back into matching on the next save', async () => {
    vi.mocked(api).mockResolvedValue(new Response(JSON.stringify(profile)));
    vi.mocked(apiJson).mockImplementation(async (path) =>
      path === '/me/consent' ? ({ ok: true } as never) : ({ ...profile, consentToMatch: false } as never),
    );
    const view = render(<DonorProfilePage />);
    const matching = await screen.findByLabelText('I agree to appear in anonymized donor matches.');
    await waitFor(() => expect(matching).toBeChecked());
    fireEvent.click(screen.getByRole('button', { name: 'Withdraw donor consent' }));

    expect(await screen.findByText('Consent withdrawn. Matching and contact sharing stopped.')).toBeInTheDocument();
    expect(matching).not.toBeChecked();
    const health = screen.getByLabelText(/I consent to processing my screening details/);
    const contact = screen.getByLabelText(/I consent to sharing my account name and email/);
    expect(health).not.toBeChecked();
    expect(contact).not.toBeChecked();
    fireEvent.click(health);
    fireEvent.click(contact);
    const form = view.container.querySelector('form');
    if (!form) throw new Error('Donor form missing');
    fireEvent.submit(form);

    expect(await screen.findByText(/Profile saved/)).toBeInTheDocument();
    expect(apiJson).toHaveBeenLastCalledWith(
      '/donors/me',
      expect.objectContaining({
        method: 'PUT',
        body: expect.stringContaining('"consentToMatch":false'),
      }),
    );
  });

  it('blocks withdrawal while a profile save is pending', async () => {
    vi.mocked(api).mockResolvedValue(new Response(JSON.stringify(profile)));
    let complete: ((value: unknown) => void) | undefined;
    const result = new Promise((resolve) => {
      complete = resolve;
    });
    vi.mocked(apiJson).mockReturnValue(result as never);
    const view = render(<DonorProfilePage />);
    await screen.findByLabelText('I agree to appear in anonymized donor matches.');
    const form = view.container.querySelector('form');
    if (!form) throw new Error('Donor form missing');
    fireEvent.submit(form);

    expect(screen.getByRole('button', { name: 'Withdraw donor consent' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
    complete?.(profile);
    expect(await screen.findByText(/Profile saved/)).toBeInTheDocument();
  });

  it.each([403, 404])('offers a donor-profile action when matching returns %s', async (status) => {
    vi.mocked(apiJson).mockRejectedValue(new ApiError('Matching is unavailable', status));
    render(<DonorMatchesPage />);

    expect(await screen.findByRole('link', { name: 'Open donor profile' })).toHaveAttribute(
      'href',
      '/donor/profile',
    );
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
  });
});
