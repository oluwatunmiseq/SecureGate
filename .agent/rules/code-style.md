---
trigger: always_on
---

# Rule: Code Style

## TypeScript

- **Strict mode is on.** No `any`. No `@ts-ignore` without a comment explaining why.
- Prefer `type` over `interface` for object shapes unless you need declaration merging.
- Use explicit return types on all exported functions.
- Use `unknown` instead of `any` when the type is genuinely unknown — then narrow it.
- Avoid non-null assertions (`!`) — handle the null case explicitly.

```ts
// ✅ Good
export async function getUser(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

// ✗ Bad
export async function getUser(id: any) {
  return prisma.user.findUnique({ where: { id } })!;
}
```

---

## Naming

| Thing | Convention | Example |
|---|---|---|
| Files | `kebab-case` | `reset-password.ts` |
| Components | `PascalCase` | `PasswordStrengthIndicator.tsx` |
| Functions | `camelCase` | `generateVerificationToken()` |
| Variables | `camelCase` | `hashedPassword` |
| Constants | `SCREAMING_SNAKE_CASE` | `TOKEN_EXPIRY_MINUTES` |
| Types / Interfaces | `PascalCase` | `SignUpFormData` |
| Zod schemas | `camelCase` + `Schema` suffix | `signUpSchema` |
| Server Actions | `camelCase`, verb-first | `signUpUser`, `resendVerification` |

---

## Server Actions

All Server Actions return a typed result object. Never throw — always catch and return.

```ts
type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

export async function signUpUser(
  input: SignUpInput
): Promise<ActionResult> {
  try {
    // validate → rate limit → business logic
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
```

Never return internal error messages, Prisma error codes, or stack traces to the caller.

---

## Zod Validation

Define all schemas in `lib/validations.ts`. Import from there — never define schemas inline.

```ts
// lib/validations.ts
export const signUpSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  email: z.string().email("Enter a valid email address").toLowerCase().trim(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
```

Always parse with `.safeParse()` in Server Actions — not `.parse()` — so you can return a typed error instead of throwing.

```ts
const result = signUpSchema.safeParse(input);
if (!result.success) {
  return { success: false, error: result.error.errors[0].message };
}
```

---

## Components

- Default to Server Components. Add `"use client"` only when you need browser APIs, event handlers, or React state.
- Props must be typed. No implicit `any` from untyped JSX props.
- Extract repeated JSX into named components — do not inline complex rendering logic.
- Loading states are required on all form submissions. Use `useTransition` or `useFormStatus`.

```tsx
// ✅ Good — explicit prop type, handles loading state
type SubmitButtonProps = {
  label: string;
  isPending: boolean;
};

export function SubmitButton({ label, isPending }: SubmitButtonProps) {
  return (
    <button type="submit" disabled={isPending} className="...">
      {isPending ? "Loading..." : label}
    </button>
  );
}
```

---

## Imports

Order imports in this sequence, separated by blank lines:

1. React / Next.js
2. Third-party libraries
3. Internal `lib/` utilities
4. Internal `actions/`
5. Internal `components/`
6. Types

```ts
import { redirect } from "next/navigation";

import { z } from "zod";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { signUpSchema } from "@/lib/validations";

import type { ActionResult } from "@/types";
```

Use `@/` path aliases. Never use relative paths that go up more than one level (`../../`).

---

## Formatting

- 2-space indentation
- Single quotes for strings
- Semicolons on
- Trailing commas in multi-line objects and arrays
- Max line length: 100 characters — break earlier if it improves readability
- Prettier is the formatter of record — do not fight it

---

## Comments

- Write comments that explain **why**, not **what**. The code explains what.
- Use `// TODO:` for known gaps. Never commit a TODO without a brief explanation.
- Do not comment out dead code — delete it. Git has history.

```ts
// ✅ Good — explains the reason for the decision
// Return a generic error regardless of whether the email exists,
// to prevent user enumeration through the forgot-password endpoint.
return { success: true };

// ✗ Bad — restates the code
// Return success
return { success: true };
```

---

## Error Handling

- All `try/catch` blocks must have typed error handling or an explicit `unknown` catch.
- Log errors server-side (console.error in development; a proper logger in production).
- Never surface the caught error message to the user — return a generic message.
- Prisma `P2002` (unique constraint) is the one exception where you can infer meaning from the error code — handle it specifically to return a more helpful message without leaking internals.

```ts
} catch (error) {
  // Log internally — do not send to client
  console.error("[signUpUser]", error);
  return { success: false, error: "Something went wrong. Please try again." };
}
```