# Skill: DB Migration Runner

## What This Skill Is For

Use this skill any time you need to change the database schema — adding a model, adding a field, changing a field type, or adding an index. It covers editing `prisma/schema.prisma` and running the migration safely.

Read this skill before touching the schema file.

---

## SecureGate Schema Overview

The production schema has exactly three models. Do not add others without a clear, documented reason grounded in the PRD.

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  password      String
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
}

model VerificationToken {
  identifier String   // user email
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model PasswordResetToken {
  email   String
  token   String   @unique
  expires DateTime

  @@unique([email, token])
}
```

---

## Step 1 — Understand the Change

Before editing the schema, answer these questions:

1. **What field or model is changing, and why?**
2. **Is this change required by the PRD, or is it scope creep?** If the latter, stop and flag it.
3. **Will this change break existing data?** (e.g. adding a non-nullable field to a table with rows)
4. **Does this change affect a security-sensitive field?** (password, token, emailVerified — extra care required)

---

## Step 2 — Edit `prisma/schema.prisma`

Rules for editing the schema:

- All fields must have explicit types — no implicit defaults without understanding them.
- Token fields must always have a matching `expires DateTime` field.
- Tokens must always have a `@unique` constraint.
- Never store plain-text passwords, tokens before hashing, or sensitive data in plain fields.
- Index fields that will be queried frequently (e.g. `email` on User is already `@unique` which creates an index).
- Add a comment above any non-obvious field explaining its purpose.

### Adding a field to an existing model

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  password      String
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
  // Example: adding a field
  updatedAt     DateTime  @updatedAt   // auto-updated by Prisma
}
```

If the new field is **non-nullable** and the table already has rows, you must either:
- Provide a `@default(value)` in the schema, or
- Write a migration that backfills existing rows before adding the constraint.

---

## Step 3 — Create the Migration

### Development

```bash
# Create and apply the migration in one step
npx prisma migrate dev --name <descriptive-name>
```

Naming convention for `--name`:

| Change | Name example |
|---|---|
| Add a field | `add-updated-at-to-user` |
| Add a model | `add-session-model` |
| Remove a field | `remove-legacy-field-from-user` |
| Add an index | `add-index-email-verified` |

Use `kebab-case`. Be specific — `update-schema` is not an acceptable name.

### What `migrate dev` does
1. Diffs your schema against the current database state.
2. Generates a SQL migration file in `prisma/migrations/`.
3. Applies the migration to your development database.
4. Regenerates the Prisma Client.

---

## Step 4 — Review the Generated SQL

**Always read the generated SQL before treating the migration as complete.**

```bash
# Find the latest migration file
ls -lt prisma/migrations/
cat prisma/migrations/<timestamp>_<name>/migration.sql
```

Check for:
- `DROP COLUMN` or `DROP TABLE` — confirm these are intentional
- `ALTER COLUMN ... SET NOT NULL` — confirm existing data handles this
- Missing indexes on fields you intend to query
- Any SQL you did not expect

If the SQL looks wrong, do not proceed. Roll back with `prisma migrate reset` (dev only) and fix the schema.

---

## Step 5 — Regenerate the Prisma Client

`migrate dev` does this automatically. If you ever edit the schema without running a migration (e.g. for a dry run), regenerate manually:

```bash
npx prisma generate
```

The Prisma Client must always match the current schema. Never deploy with a stale client.

---

## Step 6 — Production Migrations

**Never run `migrate dev` in production.** Use:

```bash
npx prisma migrate deploy
```

`migrate deploy` applies only pending migrations from `prisma/migrations/`. It does not diff, does not generate new migrations, and does not prompt. It is safe to run in CI/CD.

Add this to the Vercel build command or a post-deploy hook:

```bash
npx prisma migrate deploy && npx prisma generate
```

---

## Step 7 — Resetting (Development Only)

If you need to start fresh in development:

```bash
npx prisma migrate reset
```

This drops the database, recreates it, and reruns all migrations from scratch. **Never run this in production or staging.**

---

## Step 8 — Checklist Before Committing

- [ ] Schema change is justified by the PRD — not scope creep
- [ ] All new fields have explicit types and sensible defaults or nullability
- [ ] Token fields have an `expires DateTime` and a `@unique` constraint
- [ ] Generated SQL has been reviewed and looks correct
- [ ] No unexpected `DROP` statements in the migration
- [ ] `npx prisma generate` has been run (or was run automatically by `migrate dev`)
- [ ] The migration file is committed alongside the schema change
- [ ] Production deploy uses `migrate deploy`, not `migrate dev`

---

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| `P3006` — migration failed | SQL error in migration | Read the SQL, fix the schema, delete the broken migration, re-run `migrate dev` |
| `P1001` — can't reach database | `DATABASE_URL` not set or wrong | Check `.env.local` |
| `P2002` — unique constraint failed | Duplicate value in a `@unique` field | Clean up data before re-running |
| `Environment variable not found` | `DATABASE_URL` missing | Add it to `.env.local` |
| Prisma Client out of sync | Schema changed without `generate` | Run `npx prisma generate` |
