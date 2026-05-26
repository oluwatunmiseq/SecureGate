# Skill: API Route Scaffolder

## What This Skill Is For

Use this skill whenever you need to create a new API route (`app/api/`) or a Server Action (`actions/`) in SecureGate.

Both handle server-side logic. Choose between them using the decision below.

Read this skill before writing any route or action file.

---

## Step 1 — API Route or Server Action?

| Situation | Use |
|---|---|
| Triggered by a form submission from a React component | Server Action |
| Called programmatically from a client component (e.g. on input change) | Server Action |
| Needs to be called from an external service (e.g. a webhook) | API Route |
| Needs to return a non-JSON response (e.g. a redirect, a file) | API Route |
| NextAuth handler | API Route (required by NextAuth) |
| Everything else in SecureGate | Server Action |

SecureGate uses Server Actions as the default. API Routes are only for NextAuth and any future webhook needs.

---

## Step 2 — File Location

### Server Actions
```
actions/
├── auth.ts          # signUpUser, signInUser, signOutUser
├── verification.ts  # verifyEmail, resendVerification
└── password.ts      # forgotPassword, resetPassword
```

Add new actions to the appropriate domain file. Create a new file only if it belongs to a genuinely new domain.

### API Routes
```
app/api/
└── auth/
    └── [...nextauth]/
        └── route.ts   # NextAuth handler only
```

---

## Step 3 — Server Action Structure

Every Server Action follows this exact pattern:

```ts
"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { ratelimit } from "@/lib/rate-limit";
import { mySchema } from "@/lib/validations";
import { headers } from "next/headers";

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

export async function myAction(input: unknown): Promise<ActionResult> {
  // 1. Validate input
  const parsed = mySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }
  const data = parsed.data;

  // 2. Rate limit (sensitive endpoints only)
  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  const { success: allowed } = await ratelimit.limit(ip);
  if (!allowed) {
    return { success: false, error: "Too many attempts. Please wait a few minutes and try again." };
  }

  // 3. Business logic
  try {
    // ... database operations, token handling, email sending
    return { success: true };
  } catch (error) {
    console.error("[myAction]", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
```

Rules:
- `"use server"` directive at the top of every actions file.
- Step order is always: **validate → rate limit → business logic**.
- Always return `ActionResult` — never throw from a Server Action.
- Never return raw error messages from caught exceptions.
- Rate limit only on: sign-in, forgot-password. Other actions do not need it.

---

## Step 4 — Zod Schema

Before writing the action, define (or locate) the Zod schema in `lib/validations.ts`.

```ts
// lib/validations.ts — add to the existing file
export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address").toLowerCase().trim(),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
```

Import from `@/lib/validations` in the action — never define schemas inline.

---

## Step 5 — Security Checklist for This Action

Before writing the business logic, answer these:

| Question | Requirement |
|---|---|
| Does it accept a password? | Hash with bcryptjs (12 rounds) before storing |
| Does it generate or consume a token? | Follow token rules in `.agents/rules/security.md` |
| Is it a sign-in or forgot-password action? | Add rate limiting |
| Does it return user-facing errors? | Use only the approved error messages from `security.md` |
| Does it handle a token from the user? | Check existence, check expiry, delete after use |

---

## Step 6 — API Route Structure (when needed)

```ts
// app/api/example/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  // define expected body shape
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 422 });
  }

  try {
    // business logic
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/example]", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
```

---

## Step 7 — Full Example: Forgot Password Action

```ts
// actions/password.ts
"use server";

import { db } from "@/lib/db";
import { ratelimit } from "@/lib/rate-limit";
import { generateToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/mail";
import { forgotPasswordSchema } from "@/lib/validations";
import { headers } from "next/headers";

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export async function forgotPassword(input: unknown) {
  // 1. Validate
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }
  const { email } = parsed.data;

  // 2. Rate limit
  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  const { success: allowed } = await ratelimit.limit(`forgot:${ip}`);
  if (!allowed) {
    return { success: false, error: "Too many attempts. Please wait a few minutes and try again." };
  }

  // 3. Business logic
  try {
    const user = await db.user.findUnique({ where: { email } });

    // Always return the same response — do not reveal if account exists
    if (!user) {
      return { success: true };
    }

    // Delete any existing reset tokens for this email
    await db.passwordResetToken.deleteMany({ where: { email } });

    // Create new token
    const token = generateToken();
    const expires = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

    await db.passwordResetToken.create({
      data: { email, token, expires },
    });

    await sendPasswordResetEmail({ to: email, token });

    return { success: true };
  } catch (error) {
    console.error("[forgotPassword]", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
```

---

## Step 8 — Checklist Before Committing

- [ ] `"use server"` at the top of the file
- [ ] Input validated with Zod using `.safeParse()` before any other logic
- [ ] Rate limiting applied if this is sign-in or forgot-password
- [ ] Returns `{ success: true }` or `{ success: false, error: string }` — never throws
- [ ] Error messages match approved messages in `security.md`
- [ ] No raw Prisma or system errors returned to the caller
- [ ] Tokens are deleted after use (if consuming a token)
- [ ] Passwords are hashed before storage (if handling a password)
- [ ] Schema is defined in `lib/validations.ts`, not inline
