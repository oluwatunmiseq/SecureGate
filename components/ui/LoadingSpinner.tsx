import React from 'react';
import styles from './LoadingSpinner.module.css';

type LoadingSpinnerProps = {
  className?: string;
};

export function LoadingSpinner({ className }: LoadingSpinnerProps) {
  return (
    <div
      className={`${styles.spinner} ${className || ''}`}
      role="status"
      aria-label="Loading"
    >
      <span className={styles.srOnly}>Loading...</span>
    </div>
  );
}
