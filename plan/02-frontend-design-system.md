# 02-frontend-design-system.md
> Agent context file — read this before writing any UI component, page, or layout.
> Feed alongside `00-project-overview.md` and `01-database-schema.md` for every frontend task.

---

## Your Role

You are the frontend design agent for **NexusLend** — a mortgage origination SaaS platform built for community banks and credit unions. You build product interfaces using **Untitled UI** as the defined design system, implemented via **Tailwind CSS** inside a **Next.js 14 App Router** project.

Every UI decision must balance three priorities in this order:
1. **Trust** — mortgage is a high-stakes financial product. The UI must feel professional, stable, and reliable at all times.
2. **Clarity** — loan officers and borrowers deal with complex data. Ruthless information hierarchy is non-negotiable.
3. **Efficiency** — loan officers process dozens of applications daily. Every interaction must minimize clicks and cognitive load.

---

## Tech Stack Constraints

| Concern | Technology | Rules |
|---|---|---|
| Styling | Tailwind CSS | Use utility classes only. No custom CSS files except for global resets. |
| Components | Untitled UI + Headless UI | Use Untitled UI patterns first. Headless UI for accessible primitives (modals, dropdowns, comboboxes). |
| Icons | Lucide React | Only Lucide icons. Consistent `size={16}` for inline, `size={20}` for standalone. |
| Class merging | `cn()` (clsx + tailwind-merge) | Always use `cn()` for conditional classes — never string concatenation. |
| Animations | Tailwind transitions | Use Tailwind transition utilities. No external animation libraries. |
| Forms | React Hook Form + Zod | All form state via RHF. Never use `useState` for form fields. |
| Data display | TanStack Table v8 | All data tables via TanStack Table. Headless — style with Tailwind. |

---

## 1. Design Tokens — Untitled UI via Tailwind

### Color palette
Use only these semantic color names — never hardcode hex values:

```
Primary:   primary-25 / 50 / 100 / 200 / 300 / 400 / 500 / 600 / 700 / 800 / 900
Gray:      gray-25 / 50 / 100 / 200 / 300 / 400 / 500 / 600 / 700 / 800 / 900
Error:     error-25 through error-900
Warning:   warning-25 through warning-900
Success:   success-25 through success-900
```

Configure in `tailwind.config.ts`:
```ts
colors: {
  primary: {
    25:  '#F5F8FF', 50:  '#EFF4FF', 100: '#D1E0FF',
    200: '#B2CCFF', 300: '#84ADFF', 400: '#528BFF',
    500: '#2970FF', 600: '#155EEF', 700: '#004EEB',
    800: '#0040C1', 900: '#00359E',
  },
  // gray, error, warning, success follow same pattern
}
```

### Typography scale
Map Untitled UI type scale to Tailwind classes:

| Untitled UI token | Tailwind class | Usage |
|---|---|---|
| Display 2xl | `text-6xl font-semibold` | Page heroes (rare) |
| Display xl | `text-5xl font-semibold` | Landing headings |
| Heading xl | `text-xl font-semibold` | Page titles |
| Heading lg | `text-lg font-semibold` | Section titles |
| Heading md | `text-base font-semibold` | Card titles |
| Heading sm | `text-sm font-semibold` | Sub-section labels |
| Text md | `text-base font-normal` | Body copy |
| Text sm | `text-sm font-normal` | Secondary text |
| Text xs | `text-xs font-normal` | Captions, metadata |

**Rules:**
- Minimum font size: `text-xs` (12px). Never go below.
- Body content minimum: `text-sm` (14px).
- Never use `font-bold` (700) — use `font-semibold` (600) as the heaviest weight.
- Line height: always pair with `leading-tight` (headings) or `leading-normal` (body).

### Spacing — 4pt grid
All spacing must use Tailwind's default scale (which maps to 4pt):
- Micro gaps: `gap-1` (4px), `gap-2` (8px)
- Component padding: `p-3` (12px), `p-4` (16px), `p-6` (24px)
- Section spacing: `mt-6` (24px), `mt-8` (32px), `mt-12` (48px)
- Never use arbitrary values like `mt-[18px]` or `p-[7px]`.

### Border radius
| Token | Tailwind | Usage |
|---|---|---|
| `none` | `rounded-none` | Tables, full-bleed |
| `sm` | `rounded` | Badges, chips |
| `md` | `rounded-md` | Inputs, buttons |
| `lg` | `rounded-lg` | Cards |
| `xl` | `rounded-xl` | Modals, large cards |
| `full` | `rounded-full` | Avatars, pills |

### Shadows
```
shadow-xs  → subtle card border alternative
shadow-sm  → default card shadow
shadow-md  → dropdowns, popovers
shadow-lg  → modals
shadow-xl  → never use — too heavy for a financial product
```

---

## 2. Component Patterns

### Buttons
Follow Untitled UI button hierarchy strictly:

```tsx
// Primary — ONE per view, for the main CTA
<button className={cn(
  'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg',
  'bg-primary-600 text-white text-sm font-semibold',
  'hover:bg-primary-700 active:bg-primary-800',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  'transition-colors duration-150 ease-in-out'
)}>
  {loading ? <Loader2 size={16} className="animate-spin" /> : null}
  {children}
</button>

// Secondary — supporting actions
// bg-white border border-gray-300 text-gray-700 hover:bg-gray-50

// Tertiary — low-emphasis, no border
// bg-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900

// Destructive — irreversible actions (deny loan, delete)
// bg-error-600 hover:bg-error-700 text-white
// Always require a confirmation modal before executing

// Ghost / Link — inline text actions
// text-primary-600 hover:text-primary-700 underline-offset-4 hover:underline
```

**Button rules:**
- Every button must have all states: default, hover, focus, active, disabled, loading.
- Loading state replaces icon with `<Loader2 className="animate-spin" />` — never disable + show spinner separately.
- Destructive actions (deny loan, delete document) always open a confirmation modal first.
- Never use more than one Primary button per view.

---

### Badges / Status chips
Mortgage has many statuses. Use consistent color coding across the entire app:

```tsx
const STATUS_STYLES = {
  // Loan application status
  draft:          'bg-gray-100    text-gray-700',
  submitted:      'bg-primary-50  text-primary-700',
  processing:     'bg-warning-50  text-warning-700',
  underwriting:   'bg-warning-100 text-warning-800',
  approved:       'bg-success-50  text-success-700',
  clear_to_close: 'bg-success-100 text-success-800',
  funded:         'bg-success-500 text-white',
  denied:         'bg-error-50    text-error-700',
  withdrawn:      'bg-gray-100    text-gray-500',
  cancelled:      'bg-gray-100    text-gray-500',

  // Document status
  pending:        'bg-gray-100    text-gray-600',
  under_review:   'bg-warning-50  text-warning-700',
  accepted:       'bg-success-50  text-success-700',
  rejected:       'bg-error-50    text-error-700',
  expired:        'bg-error-100   text-error-800',
}

// Component
export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
      STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'
    )}>
      {formatStatus(status)}
    </span>
  )
}
```

---

### Cards
```tsx
// Standard card — default for all content panels
<div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">

// Metric card — summary numbers on dashboards
<div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
  <p className="text-sm font-medium text-gray-500">{label}</p>
  <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
  {trend && <TrendBadge value={trend} />}
</div>

// Alert card — compliance warnings, TRID deadlines
<div className={cn('rounded-lg border p-4', {
  'bg-warning-25 border-warning-300': severity === 'warning',
  'bg-error-25 border-error-300':     severity === 'error',
  'bg-primary-25 border-primary-300': severity === 'info',
  'bg-success-25 border-success-300': severity === 'success',
})}>
```

---

### Forms
All forms use React Hook Form + Zod. Every field must have:
- Visible `<label>` with `htmlFor` matching input `id`
- Helper text below the field (optional guidance)
- Inline error message below helper text (from RHF `errors`)
- Never show field errors on first render — only after blur or submit attempt

```tsx
// Field wrapper pattern
<div className="space-y-1.5">
  <label htmlFor={id} className="block text-sm font-medium text-gray-700">
    {label}
    {required && <span className="text-error-500 ml-0.5">*</span>}
  </label>
  <input
    id={id}
    className={cn(
      'block w-full rounded-lg border px-3.5 py-2.5 text-sm shadow-sm',
      'placeholder:text-gray-400 text-gray-900',
      'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
      'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
      'transition-colors duration-150',
      error
        ? 'border-error-300 focus:ring-error-500 focus:border-error-500'
        : 'border-gray-300 hover:border-gray-400'
    )}
    aria-describedby={error ? `${id}-error` : helperText ? `${id}-hint` : undefined}
    aria-invalid={error ? 'true' : undefined}
    {...props}
  />
  {helperText && !error && (
    <p id={`${id}-hint`} className="text-xs text-gray-500">{helperText}</p>
  )}
  {error && (
    <p id={`${id}-error`} role="alert" className="text-xs text-error-600 flex items-center gap-1">
      <AlertCircle size={12} /> {error}
    </p>
  )}
</div>
```

**Multi-step form rules (loan application):**
- Show `StepIndicator` at top: "Step 3 of 6 — Employment"
- Validate only the current step's fields on "Next" — don't validate the entire form
- "Back" never loses data — Zustand persists all step data
- Show a summary of calculated values where helpful (e.g. DTI preview on step 6)
- Progress bar fills proportionally — not just by step count but by data completeness

---

### Tables (TanStack Table)
```tsx
// Standard table layout
<div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
      <tr>
        {table.getHeaderGroups().map(hg => hg.headers.map(header => (
          <th
            key={header.id}
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide"
          >
            {flexRender(header.column.columnDef.header, header.getContext())}
          </th>
        )))}
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-100">
      {table.getRowModel().rows.map(row => (
        <tr key={row.id} className="hover:bg-gray-50 transition-colors duration-100 cursor-pointer">
          {row.getVisibleCells().map(cell => (
            <td key={cell.id} className="px-6 py-4 text-sm text-gray-700">
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

**Table rules:**
- Always show row count: "Showing 12 of 48 loans"
- Empty state must be a designed component — never an empty table body
- Sticky header for tables longer than the viewport
- Clickable rows navigate to detail view — use `cursor-pointer` + hover state
- Column sorting: chevron icons from Lucide, `ChevronUp` / `ChevronDown`

---

### Modals (Headless UI Dialog)
```tsx
// All modals use Headless UI Dialog for accessibility
import { Dialog, Transition } from '@headlessui/react'

// Sizes: sm (400px), md (560px), lg (720px), xl (900px)
// Destructive modals: always sm — confirm message + Cancel + Destructive button
// Form modals: md or lg depending on field count
// Document viewer: xl or fullscreen

// Transition: fade backdrop + slide-up panel
// Duration: 200ms ease-out open, 150ms ease-in close
```

---

### Skeleton Loaders
Use skeletons — never spinners — for content-heavy components:

```tsx
// Skeleton base
<div className="animate-pulse bg-gray-200 rounded" style={{ width, height }} />

// Loan card skeleton
<div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
  <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
  <div className="h-6 bg-gray-200 rounded animate-pulse w-1/4" />
</div>

// Table row skeleton: repeat 5 rows
// Form skeleton: repeat field shapes
```

Skeleton rules:
- Match the skeleton shape exactly to the real content — same dimensions
- Use `animate-pulse` only on the gray fill, not the wrapper
- Show minimum 3 skeleton items so the page looks populated

---

## 3. Page-Level Patterns

### Layout structure
```tsx
// Staff layout (LO / Processor / UW)
<div className="flex h-screen overflow-hidden bg-gray-50">
  <Sidebar />                              // fixed, 240px wide
  <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
    <TopBar />                             // 64px, sticky
    <main className="flex-1 overflow-y-auto p-6">
      {children}
    </main>
  </div>
</div>

// Borrower layout
<div className="min-h-screen bg-gray-50">
  <BorrowerNav />                          // sticky top nav, 64px
  <main className="max-w-3xl mx-auto px-4 py-8">
    {children}
  </main>
</div>

// Auth layout
<div className="min-h-screen flex items-center justify-center bg-gray-50">
  <div className="w-full max-w-md">
    {children}
  </div>
</div>
```

### Page header pattern
Every staff page must have a consistent header:
```tsx
<div className="flex items-center justify-between mb-6">
  <div>
    <nav className="flex items-center gap-2 text-sm text-gray-500 mb-1">
      <span>Pipeline</span>
      <ChevronRight size={14} />
      <span className="text-gray-900 font-medium">LN-2026-00042</span>
    </nav>
    <h1 className="text-xl font-semibold text-gray-900">{pageTitle}</h1>
    <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
  </div>
  <div className="flex items-center gap-3">
    {/* Primary action button */}
  </div>
</div>
```

---

## 4. NexusLend-Specific Component Patterns

### Loan amount display
Currency always formatted consistently — never raw numbers:
```tsx
// Always use: $425,000 — never 425000 or $425000
const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

// Large amounts: show abbreviated on cards → $1.2M
// Full precision on detail views → $1,245,000
```

### Ratio display (DTI, LTV)
```tsx
// Always show as percentage with color coding
<span className={cn('text-sm font-semibold tabular-nums', {
  'text-success-600': dti <= 0.36,
  'text-warning-600': dti > 0.36 && dti <= 0.43,
  'text-error-600':   dti > 0.43,
})}>
  {(dti * 100).toFixed(1)}%
</span>
```

### AI score display
```tsx
// Circular score ring — used on borrower status page and LO kanban card
// Score 0–100 with color: green 70+, amber 50–69, red <50
// Always with disclaimer text on borrower-facing views
<AIScoreBadge score={78} showLabel />
```

### Pipeline kanban card
```tsx
<div className={cn(
  'bg-white rounded-lg border shadow-xs p-3 cursor-grab active:cursor-grabbing',
  'hover:shadow-sm hover:border-gray-300',
  'transition-all duration-150 ease-in-out',
  isDragging && 'rotate-1 shadow-md opacity-90 scale-[1.02]'
)}>
  <div className="flex items-start justify-between mb-2">
    <span className="text-xs font-mono text-gray-400">{loanNumber}</span>
    <AIScoreBadge score={aiScore} />
  </div>
  <p className="text-sm font-semibold text-gray-900">{borrowerName}</p>
  <p className="text-sm text-gray-500">{formatCurrency(loanAmount)}</p>
  <div className="flex items-center justify-between mt-3">
    <LoanTypeBadge type={loanType} />
    <span className={cn('text-xs', daysInStage > sla ? 'text-error-600 font-medium' : 'text-gray-400')}>
      {daysInStage}d
    </span>
  </div>
</div>
```

### TRID deadline display
Compliance deadlines need prominent, color-coded treatment:
```tsx
<div className={cn('flex items-center gap-2 text-sm', {
  'text-error-600':   isOverdue,
  'text-warning-600': isDueSoon,     // within 1 business day
  'text-gray-600':    !isOverdue && !isDueSoon,
})}>
  {isOverdue && <AlertTriangle size={14} />}
  {isDueSoon && <Clock size={14} />}
  <span>{format(deadline, 'MMM d, yyyy')} {isOverdue ? '— OVERDUE' : isDueSoon ? '— Due soon' : ''}</span>
</div>
```

---

## 5. Animations & Transitions

Every interactive element must have transitions. No hard cuts.

```ts
// Standard durations
const DURATION = {
  instant:  'duration-100',  // hover states, focus rings
  fast:     'duration-150',  // buttons, badges, row highlights
  default:  'duration-200',  // dropdowns, tooltips
  moderate: 'duration-300',  // modals, slide panels, page transitions
}

// Standard easings — always add to transitions
// ease-in-out for most transitions
// ease-out for things entering the screen (modal open, dropdown appear)
// ease-in for things leaving (modal close, toast dismiss)
```

**Required animations by component:**
| Component | Animation |
|---|---|
| Button | `transition-colors duration-150` on bg, color |
| Table row | `transition-colors duration-100` on hover |
| Kanban card drag | `rotate-1 scale-[1.02] shadow-md` while dragging |
| Modal open | Backdrop `fade-in duration-200`, panel `slide-up duration-300 ease-out` |
| Toast | Slide in from right, auto-dismiss with fade-out |
| Dropdown | `fade-in + slide-down duration-200 ease-out` |
| Status badge update | Brief `scale-105 duration-200` pulse on change |
| Skeleton | `animate-pulse` — never `animate-spin` |
| Page transition | `fade-in duration-200` via Next.js layout transitions |

**Tailwind animation config:**
```ts
// tailwind.config.ts
keyframes: {
  'fade-in':    { from: { opacity: '0' }, to: { opacity: '1' } },
  'slide-up':   { from: { transform: 'translateY(8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
  'slide-down': { from: { transform: 'translateY(-4px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
  'slide-in-right': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
},
animation: {
  'fade-in':        'fade-in 0.2s ease-out',
  'slide-up':       'slide-up 0.3s ease-out',
  'slide-down':     'slide-down 0.2s ease-out',
  'slide-in-right': 'slide-in-right 0.3s ease-out',
}
```

---

## 6. Accessibility (WCAG 2.1 AA)

Non-negotiable for a financial product — compliance and audit risk is real.

| Requirement | Implementation |
|---|---|
| Color contrast | 4.5:1 body text, 3:1 UI components. Use `gray-700` on white minimum for body. |
| Focus rings | `focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2` on all interactive elements |
| Keyboard nav | Tab order must be logical. Test every form and modal without a mouse. |
| Screen readers | All icons used as actions must have `aria-label`. Decorative icons: `aria-hidden="true"`. |
| Semantic HTML | `<nav>`, `<main>`, `<section>`, `<article>`, `<button>`, `<a>`. Never `<div onClick>`. |
| Live regions | Toast notifications: `role="status" aria-live="polite"`. Errors: `role="alert" aria-live="assertive"`. |
| Form labels | Every input has `<label htmlFor={id}>`. Never placeholder-only labels. |
| Error messages | `aria-describedby` + `aria-invalid="true"` on errored inputs. |
| Modals | `aria-modal="true"`, focus trapped inside, return focus on close. Headless UI handles this. |
| Skip link | `<a href="#main-content" className="sr-only focus:not-sr-only">Skip to main content</a>` in root layout. |

---

## 7. Responsive Breakpoints

| Breakpoint | Width | Target |
|---|---|---|
| Mobile | 375px+ | Borrower portal primary target |
| Tablet | 768px+ | Borrower portal secondary |
| Desktop | 1280px+ | Staff dashboard + LO pipeline primary target |
| Wide | 1440px+ | Admin reports, secondary market tables |

**Rules:**
- Borrower portal: fully responsive down to 375px
- Staff dashboards: minimum usable at 1024px, optimized for 1280px+
- Kanban pipeline: horizontal scroll on tablet — do not collapse to list on small screens (it breaks the mental model)
- Tables: on mobile, show only 3 most critical columns + "View" button
- Never hide critical data on mobile — truncate with `...` and show full value in a detail view

---

## 8. Empty, Loading & Error States

Every data component must implement all three. No exceptions.

```tsx
// Empty state — always include an icon, a heading, and a CTA
<div className="flex flex-col items-center justify-center py-16 text-center">
  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
    <FileText size={20} className="text-gray-400" />
  </div>
  <h3 className="text-sm font-semibold text-gray-900 mb-1">No documents yet</h3>
  <p className="text-sm text-gray-500 mb-4 max-w-sm">
    Upload your first document to get started. Accepted formats: PDF, JPG, PNG.
  </p>
  <Button variant="secondary" size="sm">Upload document</Button>
</div>

// Error state
<div className="rounded-lg bg-error-25 border border-error-200 p-4 flex items-start gap-3">
  <AlertCircle size={16} className="text-error-500 mt-0.5 shrink-0" />
  <div>
    <p className="text-sm font-semibold text-error-800">{title}</p>
    <p className="text-sm text-error-700 mt-0.5">{message}</p>
    {onRetry && <button onClick={onRetry} className="text-sm text-error-600 underline mt-2">Try again</button>}
  </div>
</div>
```

---

## 9. Component Completeness Checklist

Before considering any component done, verify all states exist:

- [ ] Default
- [ ] Hover
- [ ] Focus (keyboard-navigable, visible ring)
- [ ] Active / pressed
- [ ] Disabled
- [ ] Loading (skeleton or spinner depending on context)
- [ ] Error
- [ ] Empty (for list/table components)
- [ ] Success (for form submissions, actions)
- [ ] Responsive (375px, 768px, 1280px)

---

## 10. General Rules

1. **Consistency over creativity** — follow Untitled UI patterns before inventing anything new.
2. **Trust over delight** — mortgage is not the place for playful micro-animations. Subtle and professional always wins.
3. **One primary action per view** — if you're adding a second Primary button, you're doing something wrong.
4. **Never ship placeholder states** — every empty state, loading state, and error state must be designed.
5. **No hardcoded values** — no hex colors, no arbitrary pixel values, no magic numbers in className strings.
6. **Financial data is sacred** — loan amounts, rates, DTI, LTV must always be formatted correctly and never truncated in ways that change meaning.
7. **When in doubt, reduce friction** — choose the approach that requires fewer clicks, fewer decisions, and less reading.

---

*Product: NexusLend — Community Lender Mortgage Origination Platform*
*Design System: Untitled UI + Tailwind CSS*
*Stack: Next.js 14 App Router · React Hook Form · TanStack Table · Headless UI · Lucide React*
