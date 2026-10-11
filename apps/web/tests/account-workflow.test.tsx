// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { axe } from 'vitest-axe';
import type { ReactNode } from 'react';
import AccountPage from '../app/account/page';
import Dashboard from '../app/dashboard/page';
import { api, apiJson } from '../lib/api';

const user = {
  id: 'synthetic-user',
  fullName: 'Synthetic User',
  email: 'user@example.test',
  role: 'USER' as const,
};
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock('../components/AccountGate', () => ({
  AccountGate: ({ children }: { children: (account: typeof user) => ReactNode }) => children(user),
}));
vi.mock('../components/WorkspaceFrame', () => ({
  WorkspaceFrame: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('../lib/api', () => ({ api: vi.fn(), apiJson: vi.fn() }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('account and dashboard workflow', () => {
  it('shows stored signup details and saves edits to the owned account route', async () => {
    vi.mocked(apiJson).mockImplementation(async (path, init) => {
      if (path === '/me/details' && !init?.method)
        return {
          fullName: user.fullName,
          email: user.email,
          phoneNumber: null,
          declaredBloodGroup: 'O+',
          postalAddress: null,
          city: 'Old City',
          stateRegion: null,
        } as never;
      if (path === '/me/details' && init?.method === 'PATCH')
        return {
          fullName: user.fullName,
          email: user.email,
          phoneNumber: null,
          declaredBloodGroup: 'O+',
          postalAddress: null,
          city: 'New City',
          stateRegion: null,
        } as never;
      throw new Error(`Unexpected API call: ${path}`);
    });
    const view = render(<AccountPage />);
    const city = await screen.findByLabelText('City');
    expect(city).toHaveValue('Old City');
    expect(screen.getByText('Verified account email:')).toBeInTheDocument();
    fireEvent.change(city, { target: { value: 'New City' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save account details' }));
    expect(await screen.findByText(/Account details updated/)).toBeInTheDocument();
    expect(vi.mocked(apiJson)).toHaveBeenCalledWith(
      '/me/details',
      expect.objectContaining({
        method: 'PATCH',
        body: expect.stringContaining('"city":"New City"'),
      }),
    );
    expect((await axe(view.container)).violations).toEqual([]);
  });

  it('guides an approved donor to matches using current API status', async () => {
    vi.mocked(api).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'APPROVED' }),
    } as Response);
    vi.mocked(apiJson).mockResolvedValue([] as never);
    render(<Dashboard />);
    expect(await screen.findByText('Approved for matching')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View matching requests/ })).toHaveAttribute(
      'href',
      '/donor/matches',
    );
  });
});
