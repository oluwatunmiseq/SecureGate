'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { TextInput } from '../ui/TextInput';
import { SubmitButton } from '../ui/SubmitButton';
import { Callout } from '../ui/Callout';
import { verifyEmail, resendVerification } from '@/actions/verification';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import styles from './VerifyEmailForm.module.css';

type VerifyEmailFormProps = {
  token?: string;
  defaultEmail?: string;
};

export function VerifyEmailForm({ token, defaultEmail = '' }: VerifyEmailFormProps) {
  const [isPending, startTransition] = useTransition();
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [resendEmail, setResendEmail] = useState(defaultEmail);
  const [resendSuccess, setResendSuccess] = useState('');
  const [resendError, setResendError] = useState('');

  // Auto-verify if token is present on mount
  useEffect(() => {
    if (token) {
      startTransition(async () => {
        setVerificationStatus('loading');
        setErrorMsg('');
        const result = await verifyEmail({ token });
        if (result.success) {
          setVerificationStatus('success');
        } else {
          setVerificationStatus('error');
          setErrorMsg(result.error);
        }
      });
    }
  }, [token]);

  const handleResendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResendError('');
    setResendSuccess('');

    if (!resendEmail.trim()) {
      setResendError('Email address is required');
      return;
    }

    startTransition(async () => {
      const result = await resendVerification({ email: resendEmail });
      if (result.success) {
        setResendSuccess('If the email is unregistered or already verified, we did nothing. Otherwise, a new verification link has been sent!');
      } else {
        setResendError(result.error);
      }
    });
  };

  // Rendering Verification Flow (Token Mode)
  if (token) {
    if (verificationStatus === 'loading') {
      return (
        <div className={styles.statusWrapper}>
          <LoadingSpinner className={styles.largeSpinner} />
          <h2 className={styles.statusTitle}>Verifying your email...</h2>
          <p className={styles.statusText}>
            We are confirming your verification token. Please hold on.
          </p>
        </div>
      );
    }

    if (verificationStatus === 'success') {
      return (
        <div className={styles.statusWrapper}>
          <div className={styles.successIconWrapper}>
            <svg
              className={styles.successIcon}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className={styles.statusTitle}>Email Verified!</h2>
          <p className={styles.statusText}>
            Thank you! Your email address has been successfully verified.
          </p>
          <div className={styles.actionButtonWrapper}>
            <Link href="/sign-in" className={styles.primaryLinkButton}>
              Go to Sign In
            </Link>
          </div>
        </div>
      );
    }

    // Error State (e.g. expired link)
    return (
      <div className={styles.statusWrapper}>
        <div className={styles.errorIconWrapper}>
          <svg
            className={styles.errorIcon}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className={styles.statusTitle}>Verification Failed</h2>
        <p className={styles.statusText}>{errorMsg || 'The verification link is invalid or has expired.'}</p>
        
        {/* Render resend section as fallback per AGENTS.md rule */}
        <div className={styles.divider} />
        <form onSubmit={handleResendSubmit} className={styles.resendForm} noValidate>
          <h3 className={styles.resendTitle}>Request a new link</h3>
          {resendSuccess && <Callout type="success" message={resendSuccess} />}
          {resendError && <Callout type="error" message={resendError} />}
          
          <TextInput
            label="Email Address"
            id="resendEmail"
            name="resendEmail"
            type="email"
            placeholder="jane.doe@example.com"
            required
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
            error={resendError}
            disabled={isPending}
          />
          <div className={styles.submitWrapper}>
            <SubmitButton label="Resend Verification Email" isPending={isPending} />
          </div>
        </form>
        
        <div className={styles.footerLink}>
          <Link href="/sign-in" className={styles.link}>
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Rendering Resend Mode (No Token Mode - General Confirmation Screen)
  return (
    <div className={styles.statusWrapper}>
      <div className={styles.inboxIconWrapper}>
        <svg
          className={styles.inboxIcon}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 19v-8.93a2 2 0 01.89-1.664l8-4.666a2 2 0 012.22 0l8 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.25 0l-2.25 1.5"
          />
        </svg>
      </div>
      <h2 className={styles.statusTitle}>Verify your email</h2>
      <p className={styles.statusText}>
        We sent a verification link to your email address. Please open it to verify your account and get full access.
      </p>

      <div className={styles.divider} />

      <form onSubmit={handleResendSubmit} className={styles.resendForm} noValidate>
        <h3 className={styles.resendTitle}>Didn&apos;t get the email?</h3>
        {resendSuccess && <Callout type="success" message={resendSuccess} />}
        {resendError && <Callout type="error" message={resendError} />}

        <TextInput
          label="Email Address"
          id="resendEmail"
          name="resendEmail"
          type="email"
          placeholder="jane.doe@example.com"
          required
          value={resendEmail}
          onChange={(e) => setResendEmail(e.target.value)}
          error={resendError}
          disabled={isPending}
        />
        <div className={styles.submitWrapper}>
          <SubmitButton label="Resend Verification Email" isPending={isPending} />
        </div>
      </form>

      <div className={styles.footerLink}>
        <Link href="/sign-in" className={styles.link}>
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
