---
trigger: always_on
---

# Rule: Security

These rules are non-negotiable. Every agent task that touches authentication, tokens, passwords, sessions, or user data must follow them exactly.

---

## Passwords

**Rule: Never store, log, or transmit a plain-text password after the point of hashing.**

- Hash with `bcryptjs` using a minimum of 12 salt rounds.
- Hash immediately on receipt in the Server Action — before any other operation.
- The hashed value is the only thing that may be written to the database.
- Never log the raw password input, even for debugging.
- Never return or expose the stored hash to the client.

```ts
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;
const hashedPassword = await bcrypt.hash(rawPassword, SALT_ROUNDS);
```

---

## Tokens (Verification & Reset)

Tokens are single-use, time-limited, and must be treated as secrets.

### Generation

```ts
import { randomBytes } from "crypto";

// Generates a cryptographically random URL-safe token
export function generateToken(): string {
  return randomBytes(32).toString("hex");
}
```

Never use `Math.random()` or UUIDs for security tokens.

### Expiry

| Token type | Lifetime |
|---|---|
| Email verification | 15 minutes |
| Password reset | 1 hour |

Always store the expiry timestamp alongside the token. Always check it before accepting a token.

### Single use

Delete the token from the database **immediately** after it is successfully used. Do not wait. Do not reuse.

```ts
// Correct pattern: validate, use, delete — all in one transaction where possible
const token = await db.verificationToken.findUnique({ where: { token: rawToken } });

if (!token) return { success: false, error: "This link is invalid or has already been used." };
if (token.expires < new Date()) {
  await db.verificationToken.delete({ where: { token: rawToken } });
  return { success: false, error: "This link has expired. Please request a new one." };
}

// Use the token, then delete it
await db.$transaction([
  db.user.update({ where: { email: token.identifier }, data: { emailVerified: new Date() } }),
  db.verificationToken.delete({ where: { token: rawToken } }),
]);
```

---

## Error Messages

**Rule: Error messages must never reveal whether an email address is registered, what specifically failed, or any internal system detail.**

| Situation | Message to return |
|---|---|
| Wrong email or password | "We couldn't sign you in. Please check your details and try again." |
| Forgot password (any case) | "If an account exists for that email, a reset link has been sent." |
| Expired verification link | "This link has expired. You can request a new one below." |
| Expired or invalid reset link | "This link is invalid or has expired. Please request a new one." |
| Too many attempts | "Too many attempts. Please wait a few minutes and try again." |
| Unexpected server error | "Something went wrong. Please try again shortly." |

Return the same message and the same HTTP status for "account not found" and "wrong password" — do not differentiate them. This prevents user enumeration.

Never:
- Return raw Prisma error messages
- Return stack traces
- Return error codes that reveal internal structure
- Confirm or deny account existence in the forgot-password flow

---

## Rate Limiting

Protect these endpoints using Upstash Redis:

| Endpoint | Limit | Window |
|---|---|---|
| POST sign-in | 5 attempts | 10 minutes per IP |
| POST forgot-password | 3 attempts | 15 minutes per IP |

Rate limiting must happen **before** any database query on these routes.

```ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "10 m"),
  analytics: false, // do not enable analytics
});

const { success } = await ratelimit.limit(ip);
if (!success) {
  return { success: false, error: "Too many attempts. Please wait a few minutes and try again." };
}
```

Return a `429` status when rate limiting from an API route. From a Server Action, return the standard error object.

---

## Sessions

- Sessions are managed by NextAuth — do not implement custom session logic.
- Use NextAuth's built-in JWT or database session strategy — do not mix them.
- Sessions must be fully invalidated on sign-out — call `signOut()` with `{ redirect: false }` and handle server-side.
- Never store sensitive user data (password hash, token values) in the session payload.
- Session payload may include: `id`, `email`, `name`, `emailVerified`.

---

## HTTP Security Headers

Set the following headers in `middleware.ts` or `next.config.js` for every response:

```ts
const securityHeaders = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",  // tighten after audit
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
  ].join("; "),
};
```

---

## Environment Variables

| Variable | Where it is used |
|---|---|
| `DATABASE_URL` | Prisma — server only |
| `NEXTAUTH_SECRET` | NextAuth JWT signing — server only |
| `NEXTAUTH_URL` | NextAuth redirect base URL — server only |
| `RESEND_API_KEY` | Resend email client — server only |
| `UPSTASH_REDIS_REST_URL` | Rate limiter — server only |
| `UPSTASH_REDIS_REST_TOKEN` | Rate limiter — server only |

Rules:
- Never access `process.env` in a Client Component or in any file that can be imported client-side.
- Never pass environment variable values as props from server to client.
- Validate all required variables at application startup. Fail loudly if any are missing.
- `.env.local` is in `.gitignore` and must never be committed.
- Use `.env.example` with blank values as the committed reference file.

---

## Input Validation

- Every Server Action must validate its input with a Zod schema before doing anything else.
- Validation happens server-side. Client-side validation is UX only — never trusted.
- Trim and normalise string inputs (lowercase email, trim whitespace) as part of the schema.
- Reject requests with unexpected or extra fields.

---

## What Never to Do

- Never store passwords in plain text — not even temporarily
- Never reuse tokens after they have been consumed
- Never skip expiry checks on tokens
- Never confirm account existence in error messages
- Never expose environment variables to the client
- Never commit `.env.local` or any file containing real secrets
- Never skip rate limiting on the sign-in or forgot-password endpoints
- Never return stack traces, Prisma errors, or internal messages to the user
- Never implement custom crypto — use `crypto.randomBytes` for tokens, `bcryptjs` for passwords