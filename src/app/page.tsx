import Link from "next/link";
import { ArrowRight, Landmark, ShieldCheck, Workflow } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";

const foundation = [
  {
    title: "Borrower Intake",
    description:
      "Capture applications, supporting documents, and pre-qualification milestones in a structured workflow.",
    icon: Workflow,
  },
  {
    title: "Lender Operations",
    description:
      "Use Supabase tables, storage, and auth as the operational backend for underwriting and servicing data.",
    icon: ShieldCheck,
  },
  {
    title: "App Router Ready",
    description:
      "Next.js App Router, Tailwind v4, TypeScript, and Supabase SSR utilities are wired in from day one.",
    icon: Landmark,
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
    <main id="main-content" className="min-h-screen bg-gray-50 px-6 py-10 sm:px-10 lg:px-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <Card className="overflow-hidden p-8 sm:p-12">
          <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-6">
              <span className="inline-flex items-center rounded-full border border-primary-200 bg-primary-25 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700">
                NexusLend foundation
              </span>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-5xl font-semibold text-gray-900 sm:text-6xl">
                  Next.js on the front end. Supabase behind every loan workflow.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-gray-600 sm:text-lg">
                  The project baseline now includes auth, shared UI primitives, migration
                  scaffolding, and the supporting libraries planned for borrower, staff, and admin
                  modules.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/login">
                  <Button>
                    Open auth flow
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="secondary">Create borrower account</Button>
                </Link>
              </div>
            </div>

            <Card className="bg-gray-900 p-6 text-white">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary-100">
                Stack snapshot
              </p>
              <p className="mt-2 text-3xl font-semibold">
                Ready for auth, data, document, and AI modules.
              </p>
              <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 font-mono text-sm leading-7 text-gray-100">
                <p>supabase/migrations/</p>
                <p>src/components/ui/</p>
                <p>src/lib/utils/cn.ts</p>
                <p>npm run dev</p>
              </div>
            </Card>
          </div>
        </Card>

        <section className="grid gap-4 md:grid-cols-3">
          {foundation.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.title} className="p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-gray-900">{item.title}</h2>
                <p className="mt-2 text-sm leading-7 text-gray-600">{item.description}</p>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <Card className="p-7">
            <PageHeader title="Included structure" subtitle="Common folders in the current baseline." />
            <ul className="space-y-4 text-sm leading-7 text-gray-700">
              {appFolders.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-2.5 w-2.5 rounded-full bg-primary-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-7">
            <PageHeader title="Recommended next steps" subtitle="What to do before building the next product module." />
            <div className="space-y-4">
              {nextSteps.map((item, index) => (
                <div key={item} className="flex gap-4 rounded-xl bg-gray-50 p-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-7 text-gray-600">{item}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}
