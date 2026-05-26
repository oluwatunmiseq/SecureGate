'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { TextInput } from '../ui/TextInput';
import { SubmitButton } from '../ui/SubmitButton';
import { Callout } from '../ui/Callout';
import { PasswordStrengthIndicator } from '../ui/PasswordStrengthIndicator';
import { signUpUser } from '@/actions/auth';
import { resendVerification } from '@/actions/verification';
import styles from './SignUpForm.module.css';

export function SignUpForm() {
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Resend verification state
  const [isResending, startResendTransition] = useTransition();
  const [resendSuccess, setResendSuccess] = useState('');
  const [resendError, setResendError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear errors as user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (errorMsg) {
      setErrorMsg('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setErrors({});

    // Client-side validations (basic UX helper, not security)
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email address is required';
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    startTransition(async () => {
      const result = await signUpUser(formData);
      if (result.success) {
        setIsSuccess(true);
      } else {
        setErrorMsg(result.error);
      }
    });
  };

  const handleResend = () => {
    setResendSuccess('');
    setResendError('');

    startResendTransition(async () => {
      const result = await resendVerification({ email: formData.email });
      if (result.success) {
        setResendSuccess(
          'A new verification link has been sent. Please check your inbox.',
        );
      } else {
        setResendError(result.error);
      }
    });
  };

  if (isSuccess) {
    return (
      <div className={styles.successWrapper} role="status">
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
        <h2 className={styles.successTitle}>Account Created!</h2>
        <p className={styles.successText}>
          We have sent a verification link to <strong>{formData.email}</strong>.
        </p>
        <p className={styles.successNote}>
          Please click the link in the email to verify your account and complete
          registration. The link will expire in 15 minutes.
        </p>

        {/* Resend verification section */}
        <div className={styles.resendSection}>
          <div className={styles.divider} />
          <p className={styles.resendLabel}>Didn&apos;t get the email?</p>
          {resendSuccess && <Callout type="success" message={resendSuccess} />}
          {resendError && <Callout type="error" message={resendError} />}
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className={styles.resendButton}
            aria-busy={isResending}
            aria-label={
              isResending
                ? 'Resending verification email...'
                : 'Resend verification email'
            }
          >
            {isResending ? (
              <span className={styles.resendButtonInner}>
                <svg
                  className={styles.resendSpinner}
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray="31.4 31.4"
                    strokeLinecap="round"
                  />
                </svg>
                Sending...
              </span>
            ) : (
              'Resend Verification Email'
            )}
          </button>
        </div>

        <div className={styles.footerLink}>
          <Link href="/sign-in" className={styles.link}>
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      {errorMsg && <Callout type="error" message={errorMsg} />}

      <TextInput
        label="Full Name"
        id="name"
        name="name"
        type="text"
        placeholder="Jane Doe"
        required
        value={formData.name}
        onChange={handleChange}
        error={errors.name}
        disabled={isPending}
      />

      <TextInput
        label="Email Address"
        id="email"
        name="email"
        type="email"
        placeholder="jane.doe@example.com"
        required
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        disabled={isPending}
      />

      <div className={styles.passwordFieldWrapper}>
        <TextInput
          label="Password"
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          disabled={isPending}
        />
        <PasswordStrengthIndicator password={formData.password} />
      </div>

      <div className={styles.submitWrapper}>
        <SubmitButton label="Create Account" isPending={isPending} />
      </div>

      <p className={styles.footerText}>
        Already have an account?{' '}
        <Link href="/sign-in" className={styles.link}>
          Sign In
        </Link>
      </p>
    </form>
  );
}
