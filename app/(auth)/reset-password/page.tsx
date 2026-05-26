import React from 'react';
import { redirect } from 'next/navigation';
import { AuthCard } from '@/components/ui/AuthCard';
import { ResetPasswordForm } from '@/components/forms/ResetPasswordForm';

export const metadata = {
  title: 'Reset Password — SecureGate',
  description: 'Reset your password securely on SecureGate.',
};

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string }> | { token?: string };
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const resolvedSearchParams = await searchParams;
  const token = resolvedSearchParams.token;

  if (!token) {
    redirect('/forgot-password');
  }

  return (
    <AuthCard
      title="Reset Password"
      subtitle="Enter your new password below to update your account"
    >
      <ResetPasswordForm token={token} />
    </AuthCard>
  );
}
