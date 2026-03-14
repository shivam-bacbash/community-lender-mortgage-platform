# Repository Guidelines

## Project Structure & Module Organization
This repository is a small Next.js 16 App Router app with Supabase helpers already wired in.

- `src/app`: routes, layouts, page components, and global styles.
- `src/lib/supabase`: shared environment parsing plus browser/server Supabase client factories.
- `public`: static assets such as SVG icons.
- `.env.example`: required public Supabase variables to mirror into `.env.local`.

Keep new feature code close to the route or domain it belongs to. Example: add loan dashboard UI under `src/app/...` and shared data helpers under `src/lib/...`.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `cp .env.example .env.local`: create local environment config.
- `npm run dev`: start the local dev server at `http://localhost:3000`.
- `npm run build`: create a production build with Next.js.
- `npm run start`: run the production build locally.
- `npm run lint`: run ESLint with the Next.js core-web-vitals and TypeScript rules.

## Coding Style & Naming Conventions
Use TypeScript, functional React components, and App Router conventions. Follow the existing style:

- Use the existing formatter style: 2-space indentation, double quotes, and trailing commas where the formatter adds them.
- Name React components in `PascalCase`.
- Name helpers and variables in `camelCase`.
- Keep route files on Next.js defaults such as `page.tsx`, `layout.tsx`, and `globals.css`.
- Prefer colocated constants for small view-only data and `src/lib` for reusable logic.

ESLint is configured in `eslint.config.mjs`; no separate Prettier config is present.

## Testing Guidelines
There is no test framework configured yet. Until one is added:

- Run `npm run lint` before opening a PR.
- Manually verify changed flows in `npm run dev`.
- When adding tests, place them next to the feature or under a top-level `tests/` directory and use clear names such as `loan-workflow.test.ts`.

## Commit & Pull Request Guidelines
Recent history uses short, imperative subjects, often with Conventional Commit prefixes, for example `feat: Add closing and title management for loan workflows`.

- Keep commits focused and descriptive.
- Reference the affected area in the subject line.
- PRs should include a short summary, linked issue or task, local verification steps, and screenshots for UI changes.

## Security & Configuration Tips
Do not commit `.env.local` or Supabase secrets. Only expose values intended for `NEXT_PUBLIC_...`, and keep server-only credentials out of client code.
