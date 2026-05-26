'use server';

import { db } from '@/lib/db';
import { verifyEmailSchema, resendVerificationSchema } from '@/lib/validations';
import { generateVerificationToken } from '@/lib/tokens';
import { sendVerificationEmail } from '@/lib/mail';

import type { ActionResult } from '@/types';

export async function verifyEmail(input: unknown): Promise<ActionResult> {
  // 1. Validate
  const parsed = verifyEmailSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const { token } = parsed.data;

  try {
    // 2. Find the token
    const existingToken = await db.verificationToken.findUnique({
      where: { token },
    });

    if (!existingToken) {
      return {
        success: false,
        error: 'This link is invalid or has already been used.',
      };
    }

    // 3. Check expiry
    if (existingToken.expires < new Date()) {
      // Clean up expired token
      await db.verificationToken.delete({ where: { token } });
      return {
        success: false,
        error: 'This link has expired. You can request a new one below.',
      };
    }

    // 4. Mark user as verified and delete token atomically
    await db.$transaction([
      db.user.update({
        where: { email: existingToken.identifier },
        data: { emailVerified: new Date() },
      }),
      db.verificationToken.delete({ where: { token } }),
    ]);

    return { success: true };
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const code = (error as { code: string }).code;
      if (code === 'P1001' || code === 'P1000') {
        console.error('[verifyEmail] Database connection error:', error);
        return {
          success: false,
          error: 'Service temporarily unavailable. Please try again later.',
        };
      }
    }
    console.error('[verifyEmail]', error);
    return {
      success: false,
      error: 'Something went wrong. Please try again shortly.',
    };
  }
}

export async function resendVerification(
  input: unknown,
): Promise<ActionResult> {
  // 1. Validate
  const parsed = resendVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const { email } = parsed.data;

  try {
    const user = await db.user.findUnique({ where: { email } });

    // Return success silently if user not found or already verified
    // to prevent user enumeration.
    if (!user || user.emailVerified) {
      return { success: true };
    }

    // Delete old tokens and generate a new one
    const { token } = await generateVerificationToken(email);
    await sendVerificationEmail({ to: email, token });

    return { success: true };
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const code = (error as { code: string }).code;
      if (code === 'P1001' || code === 'P1000') {
        console.error('[resendVerification] Database connection error:', error);
        return {
          success: false,
          error: 'Service temporarily unavailable. Please try again later.',
        };
      }
    }
    console.error('[resendVerification]', error);
    return {
      success: false,
      error: 'Something went wrong. Please try again shortly.',
    };
  }
}
