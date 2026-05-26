import React from 'react';
import { AuthCard } from '@/components/ui/AuthCard';
import { ForgotPasswordForm } from '@/components/forms/ForgotPasswordForm';

export const metadata = {
  title: 'Forgot Password — SecureGate',
  description: 'Recover your forgotten password securely on SecureGate.',
};

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Recover Password"
      subtitle="Enter your email below and we will send you a reset link"
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
