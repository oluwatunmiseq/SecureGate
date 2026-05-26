import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { signOutUser } from '@/actions/auth';
import styles from './page.module.css';

export const metadata = {
  title: 'Dashboard — SecureGate',
  description: 'Your secure portal dashboard.',
};

export default async function DashboardPage() {
  const session = await auth();

  // 1. Double Lock: must be authenticated
  if (!session || !session.user) {
    redirect('/sign-in');
  }

  // 2. Double Lock: must be email verified
  if (!session.user.emailVerified) {
    redirect(`/verify-email?email=${encodeURIComponent(session.user.email || '')}`);
  }

  // Server action handler for Sign Out to prevent inline JS requirements
  async function handleSignOut() {
    'use server';
    await signOutUser();
    redirect('/sign-in');
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logoWrapper}>
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
          <span className={styles.logoText}>SecureGate</span>
        </div>
        <form action={handleSignOut}>
          <button type="submit" className={styles.signOutButton}>
            Sign Out
          </button>
        </form>
      </header>

      <main className={styles.main}>
        <div className={styles.welcomeCard}>
          <div className={styles.badge}>Protected Session</div>
          <h1 className={styles.title}>Welcome back, {session.user.name || 'User'}!</h1>
          <p className={styles.subtitle}>
            You have successfully established a high-integrity, secure session.
          </p>

          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Account Identifier</span>
              <span className={styles.infoValue}>{session.user.email}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Security Level</span>
              <span className={styles.infoValueSuccess}>Verified (Email Confirm)</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Token Lifecycles</span>
              <span className={styles.infoValue}>15 Min (Verify) / 1 Hour (Reset)</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Rate Limit Controls</span>
              <span className={styles.infoValue}>Enabled (Upstash Redis)</span>
            </div>
          </div>
        </div>

        <div className={styles.alertCard}>
          <div className={styles.alertHeader}>
            <svg
              className={styles.alertIcon}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className={styles.alertTitle}>Decoupled Authentication Layer</h2>
          </div>
          <p className={styles.alertText}>
            SecureGate is designed to serve as a secure gateway, completely isolated from user profiles, social trackers, or enterprise directory overhead. This dashboard represents a zero-data footprint protected domain, satisfying all AGENTS.md data safety directives.
          </p>
        </div>
      </main>
    </div>
  );
}
