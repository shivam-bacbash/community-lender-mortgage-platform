# M15 — AI Fraud Detection
> Phase 4 · ML-powered anomaly detection, document authenticity scoring, fraud alert workflow.

## Prerequisites
- M4, M5 complete
- DB tables: `fraud_flags`, `ai_analyses`, `documents`

---

## Goal
Automatically detect fraudulent applications and documents using Claude AI, flag them for underwriter review, and provide evidence-backed alerts.

---

## Detection Types

### 1. Document Authenticity Scoring
```ts
// lib/ai/fraudDetection.ts
// On every document upload, run authenticity check

const systemPrompt = `
You are a mortgage fraud detection specialist.
Analyze the document metadata and extracted fields for signs of tampering or fraud.
Return ONLY valid JSON:
{
  "authenticity_score": <0-100, 100 = definitely authentic>,
  "anomalies": [
    {
      "type": <"font_inconsistency"|"date_mismatch"|"amount_anomaly"|"format_issue"|"other">,
      "description": <string>,
      "severity": <"low"|"medium"|"high">
    }
  ],
  "recommendation": <"accept"|"review"|"reject">
}
`
// Trigger on: document upload (async, don't block UI)
// If anomalies found: INSERT into fraud_flags
```

### 2. Application-Level Fraud Signals
```ts
// Cross-reference checks run on application submission:
const FRAUD_CHECKS = [
  // Income vs declared lifestyle mismatch
  (loan) => loan.income < loan.liabilities * 0.3 && loan.assets > loan.income * 24,
  // Employment start date vs loan application date too close
  (loan) => daysBetween(loan.employmentStart, loan.submittedAt) < 30,
  // Property value vs neighborhood comps deviation > 20%
  (loan) => Math.abs(loan.purchasePrice - loan.estimatedValue) / loan.estimatedValue > 0.20,
]
```

### 3. Fraud Alert Workflow
```tsx
// app/(staff)/loans/[id]/fraud/page.tsx (staff only)
// List of open fraud flags with severity badges
// Each flag: type, description, evidence JSON viewer, severity
// Actions: Mark as Reviewed (dismiss) | Escalate | Confirm Fraud
// Confirmed fraud → UPDATE loan_applications.status = 'cancelled'
//                 → INSERT audit_log with fraud confirmation
```

---

## Acceptance Criteria
- [ ] Document authenticity score computed on every upload
- [ ] Anomalies above threshold create `fraud_flags` rows
- [ ] Application-level cross-checks run on submission
- [ ] Fraud flag list visible to underwriter/admin only
- [ ] Review/escalate/confirm workflow updates flag status
- [ ] Confirmed fraud cancels the loan and logs to audit

---

---

# M16 — Predictive Analytics Engine
> Phase 4 · AI-driven loan performance prediction, borrower abandonment detection, portfolio risk.

## Prerequisites
- M4, M13 complete
- DB tables: `ai_analyses`, `analytics_events`, `loan_applications`

---

## Goal
Use historical loan data and analytics events to predict outcomes, detect at-risk applications, and surface portfolio-level insights.

---

## Key Features

### 1. Loan Performance Prediction
```ts
// lib/ai/predictions.ts
// Weekly batch job (Supabase Edge Function cron)
// For each active loan in pipeline: predict probability of funding

const systemPrompt = `
You are a mortgage analytics AI. Based on the loan profile and pipeline history,
predict the probability this loan will successfully fund.
Return ONLY valid JSON:
{
  "funding_probability": <0.0-1.0>,
  "predicted_close_date": <ISO date string>,
  "risk_factors": [<string>],
  "recommended_actions": [<string>]
}
`
// Store result in ai_analyses with type = 'risk_assessment'
// Show on LO dashboard as "At Risk" indicator when probability < 0.4
```

### 2. Borrower Abandonment Detection
```ts
// analytics_events tracking in borrower portal:
// Track: page views, time on step, field interactions, step completions

// Abandonment signal: borrower_profile_id has:
// - Started application (step 1 completed)
// - No activity for > 3 days
// - Application still in draft status

// Automated action: INSERT notification to LO to follow up
// INSERT email to borrower: "Complete your application"
```

### 3. Portfolio Risk Dashboard
```tsx
// app/(admin)/analytics/portfolio/page.tsx
// Aggregate risk view across all active loans:
// - Distribution of AI pre-qual scores (histogram)
// - Average DTI / LTV by loan type
// - Concentration risk: % loans in same zip code / employer
// - Pipeline stall alerts: loans >2× SLA in any stage
```

---

## Acceptance Criteria
- [ ] Funding probability computed weekly for all active loans
- [ ] "At Risk" badge shown on kanban card when probability < 40%
- [ ] Abandonment detection triggers LO notification after 3 days
- [ ] Portfolio risk dashboard shows score distribution + concentration
- [ ] Predictions stored in ai_analyses for trend analysis

---

---

# M17 — White-Label & Multi-Tenant Portal Builder
> Phase 4 · Per-lender branding, custom domains, no-code workflow builder, tenant feature flags.

## Prerequisites
- M10 complete
- DB tables: `organizations` (brand_colors, settings, custom_domain)

---

## Goal
Allow each lender to fully brand the platform (logo, colors, domain) and customize their workflow without code changes.

---

## Key Features

### 1. Brand Customization
```ts
// Stored in organizations.brand_colors jsonb:
// { primary: '#1a5fa8', secondary: '#e8f0fe', accent: '#34a853', font: 'Inter' }

// Applied via CSS custom properties injected in root layout:
// app/layout.tsx reads org brand from session → injects <style> tag
const brandStyles = `
  :root {
    --brand-primary: ${org.brand_colors.primary};
    --brand-secondary: ${org.brand_colors.secondary};
    --brand-accent: ${org.brand_colors.accent};
  }
`
```

### 2. Custom Domain Setup
```ts
// organizations.custom_domain = 'loans.firstbank.com'
// Vercel: add domain via Vercel API on domain save
// middleware.ts: resolve organization from request hostname
export function resolveOrgFromHost(host: string) {
  if (host.endsWith('.nexuslend.com')) return host.split('.')[0]  // slug
  return host  // custom domain lookup
}
```

### 3. No-Code Workflow Builder
```tsx
// app/(admin)/workflows/page.tsx
// Visual trigger → action builder:
// Triggers: loan_status_changed | document_uploaded | condition_added | days_in_stage
// Actions: send_email | create_task | send_notification | move_stage | assign_lo
// Stored as JSON rules in organizations.settings.workflows
// Evaluated by Supabase Edge Function on relevant DB events
```

### 4. Feature Flags Per Tenant
```ts
// organizations.settings.features jsonb:
const defaultFeatures = {
  ai_prequalification: true,
  ai_fraud_detection: false,
  secondary_market: false,
  sms_notifications: false,
  e_sign: false,
  multi_branch: false
}
// Check in components: const { features } = useOrganization()
// if (!features.ai_fraud_detection) return null
```

---

## Acceptance Criteria
- [ ] Logo and brand colors apply throughout UI for each org
- [ ] Custom domain resolves to correct org context
- [ ] Feature flags toggle modules on/off per org
- [ ] Workflow builder saves trigger→action rules
- [ ] Saved workflows execute correctly on trigger events

---

---

# M18 — Mobile App
> Phase 4 · React Native borrower app with push notifications, document camera, biometric login.

## Prerequisites
- M2 complete (API layer reusable)
- Supabase JS client works in React Native

---

## Goal
Native mobile app for borrowers using React Native (Expo) that mirrors the borrower portal with mobile-optimized UX.

---

## Tech Stack (Mobile)

| Layer | Technology |
|---|---|
| Framework | Expo (React Native) |
| Navigation | Expo Router |
| Auth | Supabase Auth + expo-secure-store |
| Push | Expo Notifications + Supabase Edge Functions |
| Camera | expo-camera + expo-image-picker |
| Biometrics | expo-local-authentication |
| Storage | Same Supabase instance as web |

---

## Key Screens

```
app/
├── (auth)/
│   ├── login.tsx              # Email/password + biometric toggle
│   └── register.tsx
├── (tabs)/
│   ├── index.tsx              # Loan dashboard
│   ├── apply.tsx              # Simplified apply flow
│   ├── documents.tsx          # Document list + camera upload
│   └── messages.tsx           # Message thread
└── loan/
    └── [id].tsx               # Loan status detail
```

---

## Mobile-Specific Features

### Document Camera Capture
```ts
// Use expo-camera to capture documents
// Auto-crop to document edges (expo-image-manipulator)
// Upload to same Supabase Storage bucket as web
import * as ImagePicker from 'expo-image-picker'

const captureDocument = async () => {
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
    allowsEditing: true
  })
  if (!result.canceled) await uploadDocument(result.assets[0])
}
```

### Push Notifications
```ts
// Register Expo push token on login
// Store in profiles.notification_prefs.expo_push_token
// Send from Supabase Edge Function:

await fetch('https://exp.host/--/api/v2/push/send', {
  method: 'POST',
  body: JSON.stringify({
    to: expoPushToken,
    title: 'Document Requested',
    body: 'Your loan officer needs your latest pay stub.'
  })
})
```

### Biometric Login
```ts
// expo-local-authentication for Face ID / Touch ID
// Store session token in expo-secure-store
// On app open: check biometric → decrypt stored token → restore Supabase session
```

---

## Acceptance Criteria
- [ ] Borrower can log in with email/password and biometrics
- [ ] Loan application submittable from mobile (simplified 4-step flow)
- [ ] Document capture works with camera
- [ ] Push notifications delivered on status change + doc request
- [ ] Real-time message thread works on mobile
- [ ] Session persists across app restarts
