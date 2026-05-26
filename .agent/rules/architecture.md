---
trigger: always_on
---

# Rule: Architecture

## Folder Structure

```
/
├── app/                          # Next.js App Router pages and layouts
│   ├── (auth)/                   # Route group — unauthenticated pages
│   │   ├── sign-up/
│   │   │   └── page.tsx
│   │   ├── sign-in/
│   │   │   └── page.tsx
│   │   ├── verify-email/
│   │   │   └── page.tsx
│   │   ├── forgot-password/
│   │   │   └── page.tsx
│   │   └── reset-password/
│   │       └── page.tsx
│   ├── (protected)/              # Route group — requires auth + verified
│   │   └── dashboard/
│   │       └── page.tsx
│   ├── api/                      # API routes (server-side only)
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts
│   ├── layout.tsx
│   └── page.tsx
│
├── components/                   # Shared UI components
│   ├── ui/                       # Primitive components (inputs, buttons, etc.)
│   └── forms/                    # Form compositions (SignUpForm, LoginForm, etc.)
│
├── lib/                          # Shared utilities and core logic
│   ├── auth.ts                   # NextAuth configuration
│   ├── db.ts                     # Prisma client singleton
│   ├── tokens.ts                 # Token generation and validation
│   ├── mail.ts                   # Resend email helpers
│   ├── rate-limit.ts             # Upstash Redis rate limiter
│   └── validations.ts            # Zod schemas
│
├── actions/                      # Next.js Server Actions
│   ├── auth.ts                   # sign-up, sign-in, sign-out
│   ├── verification.ts           # verify-email, resend-verification
│   └── password.ts               # forgot-password, reset-password
│
├── middleware.ts                 # Route protection middleware
├── prisma/
│   └── schema.prisma
└── .env.local                    # Never committed
```

---

## Module Boundaries

### Pages (`app/`)
- Render UI only
- Call Server Actions or fetch from API routes
- Never contain business logic or database queries directly
- Never import from `lib/` directly — go through `actions/`

### Server Actions (`actions/`)
- One file per feature domain
- Validate all inputs with Zod before doing anything else
- Return typed result objects: `{ success: true, ... }` or `{ error: string }`
- Never throw — catch and return errors
- Apply rate limiting before any database operation on sensitive endpoints

### Library (`lib/`)
- Pure utilities — no side effects in module scope
- `db.ts` exports a single Prisma client instance
- `tokens.ts` handles generation, hashing, storage, and expiry logic
- `mail.ts` wraps Resend — accepts typed parameters, returns success/error
- `auth.ts` is the single source of truth for NextAuth config
- `validations.ts` exports all Zod schemas — import from here, never define inline

### Components (`components/`)
- Client components use `"use client"` directive
- Server components are the default — only add `"use client"` when necessary
- Forms are compositions of `components/ui/` primitives
- No direct database calls or secrets in any component

---

## Data Flow

```
User interaction
      ↓
  Page (RSC or client component)
      ↓
  Server Action (actions/)
      ↓
  Zod validation  →  error response if invalid
      ↓
  Rate limit check  →  error response if exceeded
      ↓
  lib/ utility (token, mail, db)
      ↓
  Prisma (database)
      ↓
  Response returned to page
```

---

## Route Protection

Route protection happens in two places:

### 1. Middleware (`middleware.ts`)
- Runs on every request to `/(protected)/` routes
- Checks session existence using NextAuth `getToken`
- Redirects to `/sign-in` if no session
- Fast — does not hit the database

### 2. Page-level verification check
- Each protected page also checks `emailVerified` server-side
- Redirects to `/verify-email` if account is not verified
- This is a second line of defence — do not skip it

Never rely on client-side checks for route protection. Both checks must be server-side.

---

## Environment Variables

All secrets live in `.env.local` (development) and Vercel project settings (production). They are consumed only in server-side code.

Required variables:

```
DATABASE_URL
NEXTAUTH_SECRET
NEXTAUTH_URL
RESEND_API_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

Validate at startup that all required variables are present. Fail fast with a clear error rather than silently misbehaving at runtime.

Never import environment variables in client components. Never pass them as props.

---

## Database

- One Prisma client instance, exported from `lib/db.ts`
- Migrations are the only way to change the schema — no raw SQL in application code
- Queries live in `actions/` or `lib/` — never in components or pages
- Always handle Prisma errors explicitly — do not let them surface to the client