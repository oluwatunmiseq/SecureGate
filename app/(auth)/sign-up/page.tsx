import React from 'react';
import { AuthCard } from '@/components/ui/AuthCard';
import { SignUpForm } from '@/components/forms/SignUpForm';

export const metadata = {
  title: 'Create Account — SecureGate',
  description: 'Register for a new secure account on SecureGate.',
};

export default function SignUpPage() {
  return (
    <AuthCard
      title="Create Account"
      subtitle="Enter your details below to create a secure account"
    >
      <SignUpForm />
    </AuthCard>
  );
}
