import { randomBytes } from 'crypto';

import { db } from '@/lib/db';

const VERIFICATION_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
const PASSWORD_RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

/**
 * Generates a cryptographically random URL-safe token.
 * Never use Math.random() or UUIDs for security tokens.
 */
export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Creates a new email verification token.
 * Deletes any existing tokens for the same email first.
 */
export async function generateVerificationToken(
  email: string,
): Promise<{ token: string; expires: Date }> {
  // Remove any stale tokens for this email
  await db.verificationToken.deleteMany({
    where: { identifier: email },
  });

  const token = generateToken();
  const expires = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_MS);

  await db.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  return { token, expires };
}

/**
 * Creates a new password reset token.
 * Deletes any existing tokens for the same email first.
 */
export async function generatePasswordResetToken(
  email: string,
): Promise<{ token: string; expires: Date }> {
  // Remove any stale tokens for this email
  await db.passwordResetToken.deleteMany({
    where: { email },
  });

  const token = generateToken();
  const expires = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRY_MS);

  await db.passwordResetToken.create({
    data: {
      email,
      token,
      expires,
    },
  });

  return { token, expires };
}
