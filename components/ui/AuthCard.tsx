import React from 'react';
import styles from './AuthCard.module.css';

type AuthCardProps = {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
};

export function AuthCard({ children, title, subtitle }: AuthCardProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logoWrapper}>
            {/* SVG Logo: SecureGate Premium Shield */}
            <svg
              className={styles.logo}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
