---
trigger: always_on
---

# Rule: Design System

## Token Files Are the Source of Truth

The project has one design token file. The agent must never modify them:

- tokens/tokens.css — all color values, all font sizes, weights, line heights, and font families

The token file export CSS custom properties (CSS variables) that are available globally.

## Mandatory: Use CSS Variables, Never Raw Values

The agent must never write hardcoded color values or typography values anywhere in this codebase.

*Wrong:*
css
color: #1a1a1a;
font-size: 16px;
font-family: 'Inter', sans-serif;
background: #f5f5f5;


*Correct:*
css
color: var(--color-text-primary);
font-size: var(--font-size-base);
font-family: var(--font-family-base);
background: var(--color-surface);


Before writing any style value, check the token files. If a variable exists for what you need, use it. If it does not exist, ask before inventing a new value.

## Spacing Scale

Use multiples of 4px for all spacing (margin, padding, gap). Do not use arbitrary values.

Allowed: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px

## Border Radius

The product has a consistent border radius. Use these values only:

- Small elements (badges, tags): 4px
- Buttons and inputs: 8px
- Cards and modals: 12px

## Styling Method

- All component styles use CSS Modules (.module.css files).
- No inline style={{}} props except for truly dynamic values that cannot be expressed in CSS (e.g., a progress bar width driven by a number).
- No Tailwind. No styled-components. CSS Modules only.

## Principles

SecureGate's UI follows five design principles from the PRD:

| Principle | What it means in practice |
|---|---|
| **Clear** | Plain language. No jargon. Labels on every input. |
| **Helpful** | Every error explains what happened and what to do next. |
| **Fast** | Loading indicators on every form submission. Never freeze silently. |
| **Accessible** | Keyboard navigable. Screen reader compatible. WCAG 2.1 AA target. |
| **Mobile-first** | Design for small screens. Scale up with responsive utilities. |

---

## Styling Rules

- **Tailwind CSS utility classes only.** No inline `style` props. No external CSS files unless absolutely necessary (e.g. a third-party reset).
- Use Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`) — always design mobile-first.
- Avoid arbitrary values (`w-[347px]`) — use the design token scale.
- No hardcoded colours — use the palette defined below.

---

## Colour Palette

Use these semantic colour roles throughout the UI. Map them to Tailwind classes.

| Role | Tailwind class | Use |
|---|---|---|
| Brand | `blue-600` | Primary buttons, active states, focus rings |
| Brand hover | `blue-700` | Hover state for primary buttons |
| Surface | `white` | Card and form backgrounds |
| Page background | `slate-50` | Page background |
| Border | `slate-200` | Input borders, dividers |
| Text primary | `slate-900` | Headings, body copy |
| Text secondary | `slate-500` | Labels, helper text, placeholders |
| Error | `red-600` | Error messages, invalid input borders |
| Error background | `red-50` | Error callout backgrounds |
| Success | `green-600` | Success messages |
| Success background | `green-50` | Success callout backgrounds |
| Warning | `amber-600` | Warning messages, Fair password strength |
| Disabled | `slate-300` | Disabled inputs and buttons |

---

## Typography Scale

| Element | Classes |
|---|---|
| Page heading (h1) | `text-2xl font-semibold text-slate-900` |
| Section heading (h2) | `text-lg font-medium text-slate-900` |
| Body text | `text-sm text-slate-700` |
| Label | `text-sm font-medium text-slate-700` |
| Helper / hint text | `text-xs text-slate-500` |
| Error message | `text-xs text-red-600` |
| Link | `text-sm text-blue-600 hover:text-blue-700 underline-offset-2 hover:underline` |

---

## Spacing & Layout

- Auth pages use a centred card layout on all screen sizes.
- Card max width: `max-w-md` (28rem / 448px)
- Card padding: `p-8` on desktop, `p-6` on mobile
- Form field gap: `space-y-5`
- Button width: `w-full` on all auth forms
- Page vertical padding: `py-12 sm:py-16`

```tsx
// Standard auth page shell
<div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
  <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-slate-200 p-8">
    {/* content */}
  </div>
</div>
```

---

## Form Components

### Text Input

```tsx
<div className="space-y-1.5">
  <label htmlFor={id} className="block text-sm font-medium text-slate-700">
    {label}
    {required && <span className="text-red-500 ml-0.5">*</span>}
  </label>
  <input
    id={id}
    type={type}
    className={cn(
      "w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900",
      "placeholder:text-slate-400",
      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
      "disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed",
      error
        ? "border-red-400 bg-red-50"
        : "border-slate-200 bg-white"
    )}
    aria-describedby={error ? `${id}-error` : undefined}
    aria-invalid={!!error}
    {...props}
  />
  {error && (
    <p id={`${id}-error`} className="text-xs text-red-600" role="alert">
      {error}
    </p>
  )}
</div>
```

### Primary Button

```tsx
<button
  type="submit"
  disabled={isPending}
  className={cn(
    "w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white",
    "hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "transition-colors duration-150"
  )}
>
  {isPending ? (
    <span className="flex items-center justify-center gap-2">
      <LoadingSpinner className="h-4 w-4" />
      {loadingLabel ?? label}
    </span>
  ) : label}
</button>
```

### Error / Success Callout

```tsx
// Error
<div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
  {message}
</div>

// Success
<div role="status" className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
  {message}
</div>
```

---

## Password Strength Indicator

Displayed on sign-up and password reset forms. Updates in real time as the user types.

```
Strength:  [████░░░░░░]  Fair
```

| Level | Criteria | Bar colour | Label colour |
|---|---|---|---|
| Weak | < 8 chars or single character class | `bg-red-500` | `text-red-600` |
| Fair | 8+ chars, 2 character classes | `bg-amber-400` | `text-amber-600` |
| Strong | 10+ chars, 3+ character classes | `bg-green-500` | `text-green-600` |

Character classes: lowercase letters, uppercase letters, numbers, special characters.

```tsx
// Strength bar implementation pattern
<div className="space-y-1">
  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
    <div
      className={cn("h-full rounded-full transition-all duration-300", barColour)}
      style={{ width: `${strengthPercent}%` }}
    />
  </div>
  <p className={cn("text-xs font-medium", labelColour)}>{strengthLabel}</p>
</div>
```

---

## Accessibility Requirements

- Every `<input>` must have a matching `<label>` with `htmlFor`.
- Error messages must use `role="alert"` and be linked to their input via `aria-describedby`.
- Invalid inputs must have `aria-invalid="true"`.
- Loading buttons must have `aria-busy="true"` and `aria-label` that reflects the loading state.
- Focus order must be logical and match visual order.
- Interactive elements must have a minimum touch target of 44×44px.
- Colour alone must never be the only indicator of state — pair with text or icons.
- All focus states must be clearly visible — never `outline-none` without a replacement `ring`.

---

## Loading States

Every form submission must show a loading indicator. Never allow double submission.

- Disable the submit button while pending (`disabled={isPending}`)
- Show a spinner and updated label inside the button
- Disable all other form inputs while pending
- Use `useTransition` from React or `useFormStatus` from `react-dom`

---

## What Not to Do

- Do not use inline `style` props
- Do not use arbitrary Tailwind values without a documented reason
- Do not use colour for state without a paired text or icon indicator
- Do not omit `<label>` elements — not even on icon-only inputs
- Do not freeze the UI after submission without visual feedback
- Do not show raw error messages from the server — always map to user-friendly copy
