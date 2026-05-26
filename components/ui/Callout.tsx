import React from 'react';
import styles from './Callout.module.css';

type CalloutProps = {
  message: string;
  type: 'success' | 'error';
};

export function Callout({ message, type }: CalloutProps) {
  const isError = type === 'error';
  return (
    <div
      className={`${styles.callout} ${isError ? styles.error : styles.success}`}
      role={isError ? 'alert' : 'status'}
    >
      <div className={styles.iconWrapper}>
        {isError ? (
          // Error Icon (X-Circle)
          <svg
            className={styles.icon}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ) : (
          // Success Icon (Check-Circle)
          <svg
            className={styles.icon}
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
        )}
      </div>
      <div className={styles.content}>
        <p className={styles.message}>{message}</p>
      </div>
    </div>
  );
}
