// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { axe } from 'vitest-axe';
import SignIn from '../app/sign-in/page';
import SignUp from '../app/sign-up/page';
import { RequestForm } from '../components/RequestForm';
import { api, apiJson } from '../lib/api';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('../lib/api', () => ({ api: vi.fn(), apiJson: vi.fn() }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('forms', () => {
  it('toggles password visibility on sign in and sign up without submitting', () => {
    for (const Page of [SignIn, SignUp]) {
      const view = render(<Page />);
      const password = screen.getByLabelText('Password');
      expect(password).toHaveAttribute('type', 'password');
      fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
      expect(password).toHaveAttribute('type', 'text');
      fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));
      expect(password).toHaveAttribute('type', 'password');
      view.unmount();
    }
  }, 15_000);

  it('shows the rate limit response on sign in and permits another attempt', async () => {
    vi.mocked(api).mockResolvedValue({ ok: false, status: 429 } as Response);
    render(<SignIn />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'tester@example.test' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'example-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many attempts. Please wait 15 minutes and try again.',
    );
    expect(screen.getByRole('button', { name: 'Sign in' })).not.toBeDisabled();
  });

  it('guides an unverified account to verification without treating its password as wrong', async () => {
    vi.mocked(api).mockResolvedValue(
      new Response(JSON.stringify({ message: 'Verify your email before signing in' }), {
        status: 401,
      }),
    );
    render(<SignIn />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'tester@example.test' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'example-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Verify your email before signing in.',
    );
    expect(screen.getByRole('link', { name: 'Send a verification link' })).toHaveAttribute(
      'href',
      '/verify-email',
    );
  });

  it('keeps entered request values visible when saving fails', async () => {
    vi.mocked(apiJson).mockRejectedValue(new Error('Service temporarily unavailable'));
    const { container } = render(<RequestForm onSaved={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Hospital or care center'), {
      target: { value: 'Synthetic Hospital' },
    });
    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Kolkata' } });
    fireEvent.change(screen.getByLabelText('Expires at'), {
      target: { value: new Date(Date.now() + 172_800_000).toISOString().slice(0, 16) },
    });
    const form = container.querySelector('form');
    if (!form) throw new Error('Request form missing');
    fireEvent.submit(form);

    expect(await screen.findByRole('alert')).toHaveTextContent('Service temporarily unavailable');
    expect(screen.getByLabelText('Hospital or care center')).toHaveValue('Synthetic Hospital');
    expect(screen.getByRole('button', { name: 'Create request' })).not.toBeDisabled();
  });

  it('has no detectable accessibility violations in auth and request forms', async () => {
    const signIn = render(<SignIn />);
    expect((await axe(signIn.container)).violations).toEqual([]);
    signIn.unmount();

    const signUp = render(<SignUp />);
    expect((await axe(signUp.container)).violations).toEqual([]);
    signUp.unmount();

    const request = render(<RequestForm onSaved={vi.fn()} />);
    expect((await axe(request.container)).violations).toEqual([]);
  }, 15_000);
});
