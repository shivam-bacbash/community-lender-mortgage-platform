## Community Lender Mortgage Platform

Next.js App Router starter for a mortgage platform using Supabase as the backend.

### Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- Supabase (`@supabase/supabase-js` and `@supabase/ssr`)

### Getting Started

1. Install dependencies if needed:

```bash
npm install
```

2. Copy the example env file and add your Supabase project values:

```bash
cp .env.example .env.local
```

3. Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

### Supabase Utilities

- `src/lib/supabase/browser.ts`: browser client factory
- `src/lib/supabase/server.ts`: server client factory for App Router usage
- `src/lib/supabase/env.ts`: shared environment variable lookup

### Suggested Next Build-Out

- Supabase Auth for borrower and lender roles
- Tables for applications, loans, documents, and underwriting decisions
- Storage buckets for document upload workflows
- Protected dashboard routes and server actions for lending operations

### Commands

```bash
npm run dev
npm run lint
npm run build
```
