'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { TextInput } from '../ui/TextInput';
import { SubmitButton } from '../ui/SubmitButton';
import { Callout } from '../ui/Callout';
import { PasswordStrengthIndicator } from '../ui/PasswordStrengthIndicator';
import { resetPassword } from '@/actions/password';
import styles from './ResetPasswordForm.module.css';

type ResetPasswordFormProps = {
  token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

    const newErrors: Record<string, string> = {};
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    startTransition(async () => {
      const result = await resetPassword({
        token,
        password: formData.password,
      });

      if (result.success) {
        setIsSuccess(true);
        // Force redirect to Sign In screen per AGENTS.md post-reset rule
        setTimeout(() => {
          router.push('/sign-in');
        }, 3000);
      } else {
        setErrorMsg(result.error);
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
        <h2 className={styles.successTitle}>Password Reset!</h2>
        <p className={styles.successText}>
          Your password has been successfully reset. You will be redirected to the sign-in screen in a few seconds...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      {errorMsg && <Callout type="error" message={errorMsg} />}

      <div className={styles.passwordFieldWrapper}>
        <TextInput
          label="New Password"
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

      <TextInput
        label="Confirm New Password"
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        placeholder="••••••••"
        required
        value={formData.confirmPassword}
        onChange={handleChange}
        error={errors.confirmPassword}
        disabled={isPending}
      />

      <div className={styles.submitWrapper}>
        <SubmitButton label="Reset Password" isPending={isPending} />
      </div>
    </form>
  );
}
