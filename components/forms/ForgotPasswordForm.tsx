'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { TextInput } from '../ui/TextInput';
import { SubmitButton } from '../ui/SubmitButton';
import { Callout } from '../ui/Callout';
import { forgotPassword } from '@/actions/password';
import styles from './ForgotPasswordForm.module.css';

export function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError('');
    if (successMsg) setSuccessMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim()) {
      setError('Email address is required');
      return;
    }

    startTransition(async () => {
      const result = await forgotPassword({ email });
      if (result.success) {
        // Privacy-first UI response (exact copy required by AGENTS.md rule)
        setSuccessMsg('If an account exists for that email, a reset link has been sent.');
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      {successMsg && <Callout type="success" message={successMsg} />}
      {error && <Callout type="error" message={error} />}

      {!successMsg && (
        <>
          <p className={styles.description}>
            Enter the email address associated with your account and we will send you a secure link to reset your password.
          </p>

          <TextInput
            label="Email Address"
            id="email"
            name="email"
            type="email"
            placeholder="jane.doe@example.com"
            required
            value={email}
            onChange={handleChange}
            error={error}
            disabled={isPending}
          />

          <div className={styles.submitWrapper}>
            <SubmitButton label="Send Reset Link" isPending={isPending} />
          </div>
        </>
      )}

      <p className={styles.footerText}>
        <Link href="/sign-in" className={styles.link}>
          Back to Sign In
        </Link>
      </p>
    </form>
  );
}
