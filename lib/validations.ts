import { z } from 'zod';

export const signUpSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  email: z.string().email('Enter a valid email address').toLowerCase().trim(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: z.string().email('Enter a valid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address').toLowerCase().trim(),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const resendVerificationSchema = z.object({
  email: z.string().email('Enter a valid email address').toLowerCase().trim(),
});

export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
