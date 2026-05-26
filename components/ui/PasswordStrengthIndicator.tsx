'use client';

import React from 'react';
import styles from './PasswordStrengthIndicator.module.css';

type PasswordStrengthIndicatorProps = {
  password?: string;
};

type StrengthLevel = 'none' | 'weak' | 'fair' | 'strong';

export function PasswordStrengthIndicator({ password = '' }: PasswordStrengthIndicatorProps) {
  if (!password) {
    return null;
  }

  // Calculate character classes
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const classCount = [hasLowercase, hasUppercase, hasDigit, hasSpecial].filter(Boolean).length;
  const len = password.length;

  let level: StrengthLevel = 'none';
  let percentage = 0;
  let label = '';

  if (len === 0) {
    level = 'none';
    percentage = 0;
    label = '';
  } else if (len < 8 || classCount <= 1) {
    level = 'weak';
    percentage = 33;
    label = 'Weak';
  } else if (len >= 8 && len < 10 && classCount === 2) {
    level = 'fair';
    percentage = 66;
    label = 'Fair';
  } else if (len >= 10 && classCount >= 3) {
    level = 'strong';
    percentage = 100;
    label = 'Strong';
  } else {
    // If it is 8+ chars with 3+ character classes, it is strong.
    // Let's fallback gracefully.
    if (len >= 8 && classCount >= 2) {
      if (len >= 10 || classCount >= 3) {
        level = 'strong';
        percentage = 100;
        label = 'Strong';
      } else {
        level = 'fair';
        percentage = 66;
        label = 'Fair';
      }
    } else {
      level = 'weak';
      percentage = 33;
      label = 'Weak';
    }
  }

  const barColorClass =
    level === 'weak' ? styles.weakBar : level === 'fair' ? styles.fairBar : styles.strongBar;

  const labelColorClass =
    level === 'weak' ? styles.weakLabel : level === 'fair' ? styles.fairLabel : styles.strongLabel;

  return (
    <div className={styles.container}>
      <div className={styles.progressTrack}>
        <div
          className={`${styles.progressBar} ${barColorClass}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Password strength: ${label}`}
        />
      </div>
      <div className={styles.textWrapper}>
        <span className={styles.strengthText}>Strength: </span>
        <span className={`${styles.levelText} ${labelColorClass}`}>{label}</span>
      </div>
    </div>
  );
}
