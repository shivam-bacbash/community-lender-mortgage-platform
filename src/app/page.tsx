const foundation = [
  {
    title: "Borrower Intake",
    description:
      "Capture applications, supporting documents, and pre-qualification milestones in a structured workflow.",
  },
  {
    title: "Lender Operations",
    description:
      "Use Supabase tables, storage, and auth as the operational backend for underwriting and servicing data.",
  },
  {
    title: "App Router Ready",
    description:
      "Next.js App Router, Tailwind v4, TypeScript, and Supabase SSR utilities are wired in from day one.",
  },
];

const appFolders = [
  "src/app for routes, layouts, and server components",
  "src/lib/supabase for browser and server Supabase clients",
  ".env.example for the public Supabase project credentials",
];

const nextSteps = [
  "Create a Supabase project and copy its URL and anon key into a local .env.local file.",
  "Add auth, borrower, loan, and document tables in Supabase before building dashboards.",
  "Start the app with npm run dev and iterate on the borrower and lender flows.",
];

export default function Home() {
  return (
    <main className="min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="hero-panel overflow-hidden rounded-[2rem] border border-white/60 p-8 shadow-[0_24px_80px_rgba(24,38,30,0.12)] sm:p-12">
          <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-6">
              <span className="inline-flex rounded-full border border-emerald-950/10 bg-white/70 px-4 py-1 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-950">
                Community Lender Mortgage Platform
              </span>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-6xl">
                  Next.js on the front end. Supabase behind every loan workflow.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-slate-700 sm:text-xl">
                  This starter gives you an App Router Next.js project plus the
                  Supabase packages and client helpers you need to build a
                  borrower portal, lender dashboard, and internal operations
                  tooling from one codebase.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm font-medium text-slate-900">
                <span className="rounded-full bg-slate-950 px-4 py-2 text-white">
                  Next.js 16
                </span>
                <span className="rounded-full bg-white px-4 py-2">
                  React 19
                </span>
                <span className="rounded-full bg-white px-4 py-2">
                  Supabase SSR
                </span>
                <span className="rounded-full bg-white px-4 py-2">
                  Tailwind CSS v4
                </span>
              </div>
            </div>

            <aside className="flex flex-col justify-between gap-6 rounded-[1.5rem] border border-emerald-950/10 bg-slate-950 p-6 text-slate-50">
              <div className="space-y-2">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-300">
                  Stack Snapshot
                </p>
                <p className="text-3xl font-semibold tracking-[-0.03em]">
                  Ready for auth, data, and document flows.
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4 font-mono text-sm leading-7 text-emerald-100">
                <p>src/lib/supabase/browser.ts</p>
                <p>src/lib/supabase/server.ts</p>
                <p>.env.example</p>
                <p>npm run dev</p>
              </div>
            </aside>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {foundation.map((item) => (
            <article
              key={item.title}
              className="rounded-[1.5rem] border border-black/5 bg-white/80 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur"
            >
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                {item.title}
              </h2>
              <p className="mt-3 text-base leading-7 text-slate-700">
                {item.description}
              </p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <article className="rounded-[1.75rem] border border-black/5 bg-[#fff7eb] p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-900">
              Included Structure
            </p>
            <ul className="mt-5 space-y-4 text-base leading-7 text-amber-950">
              {appFolders.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-2.5 w-2.5 rounded-full bg-amber-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-[1.75rem] border border-black/5 bg-white/85 p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600">
              Recommended Next Steps
            </p>
            <div className="mt-5 space-y-4">
              {nextSteps.map((item, index) => (
                <div
                  key={item}
                  className="flex gap-4 rounded-2xl bg-slate-100/80 p-4"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <p className="text-base leading-7 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
