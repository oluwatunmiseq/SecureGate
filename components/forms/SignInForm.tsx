'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TextInput } from '../ui/TextInput';
import { SubmitButton } from '../ui/SubmitButton';
import { Callout } from '../ui/Callout';
import { signInUser } from '@/actions/auth';
import styles from './SignInForm.module.css';

export function SignInForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isUnverified, setIsUnverified] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (errorMsg) {
      setErrorMsg('');
      setIsUnverified(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsUnverified(false);
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!formData.email.trim()) newErrors.email = 'Email address is required';
    if (!formData.password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    startTransition(async () => {
      const result = await signInUser(formData);
      if (result.success) {
        // Force fully reload/redirect to dashboard so middleware session is correctly synchronized
        router.push('/dashboard');
        router.refresh();
      } else {
        setErrorMsg(result.error);
        if (result.error.toLowerCase().includes('verify your email')) {
          setIsUnverified(true);
        }
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      {errorMsg && <Callout type="error" message={errorMsg} />}

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

      <div className={styles.passwordWrapper}>
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
        <div className={styles.forgotPasswordLinkWrapper}>
          <Link href="/forgot-password" className={styles.forgotPasswordLink}>
            Forgot password?
          </Link>
        </div>
      </div>

      {isUnverified && (
        <div className={styles.resendWrapper}>
          <p className={styles.resendText}>
            Didn&apos;t receive the email or link expired?
          </p>
          <Link
            href={`/verify-email?email=${encodeURIComponent(formData.email)}`}
            className={styles.resendLink}
          >
            Resend Verification Email
          </Link>
        </div>
      )}

      <div className={styles.submitWrapper}>
        <SubmitButton label="Sign In" isPending={isPending} />
      </div>

      <p className={styles.footerText}>
        Don&apos;t have an account?{' '}
        <Link href="/sign-up" className={styles.link}>
          Sign Up
        </Link>
      </p>
    </form>
  );
}
