import React from 'react';
import { AuthCard } from '@/components/ui/AuthCard';
import { VerifyEmailForm } from '@/components/forms/VerifyEmailForm';

export const metadata = {
  title: 'Verify Email — SecureGate',
  description: 'Confirm and verify your account email address securely.',
};

type VerifyEmailPageProps = {
  searchParams: Promise<{ token?: string; email?: string }> | { token?: string; email?: string };
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const resolvedSearchParams = await searchParams;
  const token = resolvedSearchParams.token;
  const email = resolvedSearchParams.email || '';

  return (
    <AuthCard
      title={token ? 'Confirming Verification' : 'Email Verification'}
      subtitle={token ? 'Validating your verification link...' : 'Complete your registration to get access'}
    >
      <VerifyEmailForm token={token} defaultEmail={email} />
    </AuthCard>
  );
}
