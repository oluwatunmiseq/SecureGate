'use server';

import bcrypt from 'bcryptjs';
import { headers } from 'next/headers';

import { db } from '@/lib/db';
import {
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/lib/validations';
import { generatePasswordResetToken } from '@/lib/tokens';
import { sendPasswordResetEmail } from '@/lib/mail';
import { forgotPasswordLimiter } from '@/lib/rate-limit';

import type { ActionResult } from '@/types';

const SALT_ROUNDS = 12;

export async function forgotPassword(input: unknown): Promise<ActionResult> {
  // 1. Validate
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const { email } = parsed.data;

  // 2. Rate limit — before any database query
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') ?? 'unknown';
    const { success: allowed } = await forgotPasswordLimiter.limit(ip);
    if (!allowed) {
      return {
        success: false,
        error: 'Too many attempts. Please wait a few minutes and try again.',
      };
    }
  } catch (error) {
    // Log rate limiter connection error and fail open to prevent blocking auth flows on outages or local dev
    console.error('[forgotPassword] Rate limiter connection failure:', error);
  }

  try {
    const user = await db.user.findUnique({ where: { email } });

    // Return a generic success regardless of whether the email exists,
    // to prevent user enumeration through the forgot-password endpoint.
    if (!user) {
      return { success: true };
    }

    // Delete any existing reset tokens for this email
    const { token } = await generatePasswordResetToken(email);
    await sendPasswordResetEmail({ to: email, token });

    return { success: true };
  } catch (error) {
    console.error('[forgotPassword]', error);
    return {
      success: false,
      error: 'Something went wrong. Please try again shortly.',
    };
  }
}

export async function resetPassword(input: unknown): Promise<ActionResult> {
  // 1. Validate
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const { token, password } = parsed.data;

  try {
    // 2. Find the token
    const existingToken = await db.passwordResetToken.findUnique({
      where: { token },
    });

    if (!existingToken) {
      return {
        success: false,
        error: 'This link is invalid or has expired. Please request a new one.',
      };
    }

    // 3. Check expiry
    if (existingToken.expires < new Date()) {
      await db.passwordResetToken.delete({ where: { token } });
      return {
        success: false,
        error: 'This link is invalid or has expired. Please request a new one.',
      };
    }

    // 4. Hash the new password immediately
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 5. Update password and delete token atomically
    await db.$transaction([
      db.user.update({
        where: { email: existingToken.email },
        data: { password: hashedPassword },
      }),
      db.passwordResetToken.delete({ where: { token } }),
    ]);

    return { success: true };
  } catch (error) {
    console.error('[resetPassword]', error);
    return {
      success: false,
      error: 'Something went wrong. Please try again shortly.',
    };
  }
}
