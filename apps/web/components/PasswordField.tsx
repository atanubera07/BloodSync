'use client';

import { useState } from 'react';

type PasswordFieldProps = {
  id: string;
  autoComplete: 'current-password' | 'new-password';
  hint?: string;
  minLength?: number;
  maxLength?: number;
};

export function PasswordField({
  id,
  autoComplete,
  hint,
  minLength,
  maxLength,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-group">
      <label htmlFor={id}>Password</label>
      <span className="password-field">
        <input
          id={id}
          name="password"
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          aria-describedby={hint ? `${id}-hint` : undefined}
          minLength={minLength}
          maxLength={maxLength}
          required
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          aria-controls={id}
        >
          <svg
            aria-hidden="true"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
            {visible && <path d="M3 21 21 3" />}
          </svg>
        </button>
      </span>
      {hint && <small id={`${id}-hint`}>{hint}</small>}
    </div>
  );
}
