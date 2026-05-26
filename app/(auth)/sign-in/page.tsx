import React from 'react';
import { AuthCard } from '@/components/ui/AuthCard';
import { SignInForm } from '@/components/forms/SignInForm';

export const metadata = {
  title: 'Sign In — SecureGate',
  description: 'Log in to your secure account on SecureGate.',
};

export default function SignInPage() {
  return (
    <AuthCard
      title="Welcome Back"
      subtitle="Sign in to access your secure dashboard"
    >
      <SignInForm />
    </AuthCard>
  );
}
