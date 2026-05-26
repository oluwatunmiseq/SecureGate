'use server';

import bcrypt from 'bcryptjs';
import { AuthError } from 'next-auth';

import { db } from '@/lib/db';
import { signIn, signOut } from '@/lib/auth';
import { signUpSchema, signInSchema } from '@/lib/validations';
import { generateVerificationToken } from '@/lib/tokens';
import { sendVerificationEmail } from '@/lib/mail';
import { signInLimiter } from '@/lib/rate-limit';
import { headers } from 'next/headers';

import type { ActionResult } from '@/types';

const SALT_ROUNDS = 12;

export async function signUpUser(input: unknown): Promise<ActionResult> {
  // 1. Validate
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const { name, email, password } = parsed.data;

  try {
    // 2. Hash password immediately — never store or log plain text
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 3. Create user
    await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // 4. Generate verification token and send email
    const { token } = await generateVerificationToken(email);
    const emailResult = await sendVerificationEmail({ to: email, token });

    if (!emailResult.success) {
      // Account was created, but email failed to send.
      // Log clearly so SMTP misconfiguration is obvious during development.
      console.error(
        `[signUpUser] Account created for ${email}, but verification email FAILED to send. ` +
        'Check your SMTP_HOST, SMTP_USER, and SMTP_PASSWORD in .env.',
      );
    }

    return { success: true };
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const code = (error as { code: string }).code;
      // Handle duplicate email
      if (code === 'P2002') {
        return {
          success: false,
          error: 'An account with this email already exists.',
        };
      }
      // Handle database connection failure
      if (code === 'P1001' || code === 'P1000') {
        console.error('[signUpUser] Database connection error:', error);
        return {
          success: false,
          error: 'Service temporarily unavailable. Please try again later.',
        };
      }
    }

    console.error('[signUpUser]', error);
    return {
      success: false,
      error: 'Something went wrong. Please try again shortly.',
    };
  }
}

export async function signInUser(input: unknown): Promise<ActionResult> {
  // 1. Validate
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const { email, password } = parsed.data;

  // 2. Rate limit — before any database query
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') ?? 'unknown';
    const { success: allowed } = await signInLimiter.limit(ip);
    if (!allowed) {
      return {
        success: false,
        error: 'Too many attempts. Please wait a few minutes and try again.',
      };
    }
  } catch (error) {
    // Log rate limiter connection error and fail open to prevent blocking auth flows on outages or local dev
    console.error('[signInUser] Rate limiter connection failure:', error);
  }

  try {
    // 3. Check if user exists and is verified before attempting sign-in
    const user = await db.user.findUnique({ where: { email } });

    // Return generic error whether user not found or password wrong
    if (!user) {
      return {
        success: false,
        error:
          "We couldn't sign you in. Please check your details and try again.",
      };
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return {
        success: false,
        error:
          'Please verify your email before signing in. Check your inbox for a verification link.',
      };
    }

    // 4. Attempt sign-in via NextAuth
    await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    return { success: true };
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return {
        success: false,
        error:
          "We couldn't sign you in. Please check your details and try again.",
      };
    }

    if (typeof error === 'object' && error !== null && 'code' in error) {
      const code = (error as { code: string }).code;
      if (code === 'P1001' || code === 'P1000') {
        console.error('[signInUser] Database connection error:', error);
        return {
          success: false,
          error: 'Service temporarily unavailable. Please try again later.',
        };
      }
    }

    console.error('[signInUser]', error);
    return {
      success: false,
      error: 'Something went wrong. Please try again shortly.',
    };
  }
}

export async function signOutUser(): Promise<ActionResult> {
  try {
    await signOut({ redirect: false });
    return { success: true };
  } catch (error) {
    console.error('[signOutUser]', error);
    return {
      success: false,
      error: 'Something went wrong. Please try again shortly.',
    };
  }
}
