# Skill: Component Builder

## What This Skill Is For

Use this skill any time you need to create a new UI component for SecureGate. It covers both primitive components (inputs, buttons, spinners) and composed form components (SignUpForm, LoginForm, etc.).

Read this skill before writing any component file.

---

## Step 1 — Decide the Component Type

Before writing anything, answer these questions:

| Question | Answer → Action |
|---|---|
| Does it need browser APIs, event handlers, or React state? | Yes → Client Component (`"use client"`) |
| Is it purely presentational or data-fetching? | Yes → Server Component (no directive needed) |
| Is it a form? | Yes → Client Component |
| Is it a layout wrapper or static content block? | Yes → Server Component |

Default to Server Component. Only add `"use client"` when required.

---

## Step 2 — Determine the File Location

| Component type | Location |
|---|---|
| Primitive (input, button, badge, spinner) | `components/ui/<name>.tsx` |
| Form composition | `components/forms/<FeatureName>Form.tsx` |
| Page-specific layout element | Co-locate in `app/<route>/` only if it won't be reused |

Use `PascalCase` for file names that export a React component.

---

## Step 3 — Define the Props Interface

- Always define an explicit TypeScript `type` for props.
- No implicit `any`. No optional props without a clear reason.
- Extend HTML element props where appropriate using `React.ComponentPropsWithoutRef`.

```ts
type TextInputProps = React.ComponentPropsWithoutRef<"input"> & {
  label: string;
  error?: string;
  hint?: string;
};
```

---

## Step 4 — Write the Component

Follow these requirements:

### Accessibility (mandatory)
- Every `<input>` must have a `<label>` linked with `htmlFor` / `id`.
- Error messages must use `role="alert"` and `aria-describedby` on the input.
- Invalid inputs must have `aria-invalid="true"`.
- Loading buttons must have `aria-busy="true"`.
- Never remove focus outlines without providing a visible replacement (`ring`).

### Styling
- Tailwind utility classes only — no inline `style` props.
- Follow the colour palette and typography scale from `.agents/rules/design-system.md`.
- Use `cn()` (clsx/tailwind-merge) for conditional class composition.

### Loading states
- Forms must disable the submit button and all inputs while pending.
- The submit button must show a spinner and updated label while pending.

### Error display
- Show field-level errors adjacent to the relevant input.
- Show form-level errors in an alert callout above the submit button.
- Use the standard error/success callout pattern from the design system.

---

## Step 5 — Example: Primitive Input Component

```tsx
// components/ui/text-input.tsx
"use client";

import { cn } from "@/lib/utils";

type TextInputProps = React.ComponentPropsWithoutRef<"input"> & {
  label: string;
  error?: string;
  hint?: string;
};

export function TextInput({ label, error, hint, id, required, className, ...props }: TextInputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>

      <input
        id={inputId}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={cn(
          "w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900",
          "placeholder:text-slate-400",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
          "disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed",
          error ? "border-red-400 bg-red-50" : "border-slate-200 bg-white",
          className
        )}
        {...props}
      />

      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-xs text-slate-500">{hint}</p>
      )}
      {error && (
        <p id={`${inputId}-error`} role="alert" className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
```

---

## Step 6 — Example: Form Composition

```tsx
// components/forms/LoginForm.tsx
"use client";

import { useTransition } from "react";
import { signInUser } from "@/actions/auth";
import { TextInput } from "@/components/ui/text-input";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormError } from "@/components/ui/form-error";

export function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await signInUser({
        email: formData.get("email") as string,
        password: formData.get("password") as string,
      });
      if (!result.success) setError(result.error);
    });
  }

  return (
    <form action={handleSubmit} className="space-y-5" noValidate>
      <TextInput
        label="Email address"
        name="email"
        type="email"
        autoComplete="email"
        required
        disabled={isPending}
      />
      <TextInput
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        disabled={isPending}
      />

      {error && <FormError message={error} />}

      <SubmitButton label="Sign in" loadingLabel="Signing in..." isPending={isPending} />
    </form>
  );
}
```

---

## Step 7 — Checklist Before Committing

- [ ] Component has an explicit TypeScript prop type
- [ ] Every input has a matching `<label>` with `htmlFor`
- [ ] Error messages use `role="alert"` and `aria-describedby`
- [ ] Invalid inputs have `aria-invalid="true"`
- [ ] Loading state disables the submit button and inputs
- [ ] All styling uses Tailwind utility classes (no inline styles)
- [ ] Colours follow the design system palette
- [ ] `"use client"` is present only if the component actually needs it
- [ ] No raw server error messages are displayed to the user
S