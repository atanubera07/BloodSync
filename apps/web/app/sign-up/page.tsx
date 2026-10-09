'use client';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { bloodGroups } from '@bloodsync/shared';
import { api } from '../../lib/api';
import { AuthFrame } from '../../components/AuthFrame';

const optional = (data: FormData, name: string) => {
  const value = String(data.get(name) || '').trim();
  return value || undefined;
};

export default function SignUp() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setPending(true);
    const data = new FormData(event.currentTarget);
    try {
      const response = await api('/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fullName:
            `${String(data.get('firstName') || '').trim()} ${String(data.get('lastName') || '').trim()}`.trim(),
          email: data.get('email'),
          password: data.get('password'),
          phoneNumber: optional(data, 'phoneNumber'),
          declaredBloodGroup: optional(data, 'declaredBloodGroup'),
          postalAddress: optional(data, 'postalAddress'),
          city: optional(data, 'city'),
          stateRegion: optional(data, 'stateRegion'),
          acceptTerms: data.get('acceptTerms') === 'on',
        }),
      });
      if (!response.ok) throw new Error();
      router.push('/verify-email');
    } catch {
      setError('We could not create your account. Review the details or try another email.');
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="signup-shell">
      <div className="signup-heading">
        <span className="eyebrow">Join BloodSync</span>
        <h1>Be part of a better connection.</h1>
        <p>Create an account to request help or apply to become a donor.</p>
      </div>
      <AuthFrame>
        <section className="form-page signup-form">
          <span className="eyebrow">01 / Your details</span>
          <h2>Create your account</h2>
          <p>Only synthetic information should be entered in this prototype.</p>
          <form onSubmit={submit}>
            <div className="signup-grid">
              <label>
                First name
                <input
                  name="firstName"
                  autoComplete="given-name"
                  minLength={1}
                  maxLength={50}
                  required
                />
              </label>
              <label>
                Last name
                <input
                  name="lastName"
                  autoComplete="family-name"
                  minLength={1}
                  maxLength={50}
                  required
                />
              </label>
            </div>
            <label>
              Email address
              <input name="email" type="email" autoComplete="email" maxLength={254} required />
            </label>
            <label>
              Password
              <span className="password-field">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  minLength={12}
                  maxLength={128}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </span>
              <small>Use at least 12 characters.</small>
            </label>
            <div className="signup-divider">
              <span>Optional account details</span>
            </div>
            <div className="signup-grid">
              <label>
                Contact number
                <input
                  name="phoneNumber"
                  type="tel"
                  autoComplete="tel"
                  maxLength={24}
                  placeholder="+1 555 010 0000"
                />
              </label>
              <label>
                Blood group <span className="field-note">Self-reported</span>
                <select name="declaredBloodGroup" defaultValue="">
                  <option value="">Select a group</option>
                  {bloodGroups.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="signup-hint">
              A blood group here does not create or approve a donor profile. Donor screening is a
              separate step.
            </p>
            <label>
              Address
              <textarea
                name="postalAddress"
                autoComplete="street-address"
                maxLength={250}
                rows={2}
              />
            </label>
            <div className="signup-grid">
              <label>
                City
                <input name="city" autoComplete="address-level2" maxLength={100} />
              </label>
              <label>
                State or region
                <input name="stateRegion" autoComplete="address-level1" maxLength={100} />
              </label>
            </div>
            <label className="signup-consent">
              <input name="acceptTerms" type="checkbox" required />
              <span>
                I agree to the <Link href="/terms">Terms</Link> and{' '}
                <Link href="/privacy">Privacy policy</Link> for this synthetic-data prototype.
              </span>
            </label>
            <button disabled={pending}>{pending ? 'Creating account…' : 'Create account'}</button>
            {error && <p role="alert">{error}</p>}
          </form>
          <p>
            Already have an account? <Link href="/sign-in">Sign in</Link>
          </p>
        </section>
      </AuthFrame>
    </div>
  );
}
