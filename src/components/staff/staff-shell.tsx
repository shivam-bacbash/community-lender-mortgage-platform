import type { ReactNode } from "react";
import Link from "next/link";
import { Building2, CircleUserRound, Workflow } from "lucide-react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { NotificationBell } from "@/components/shared/notification-bell";
import { StaffNav } from "@/components/staff/staff-nav";
import { cn } from "@/lib/utils/cn";
import type { StaffProfileSummary } from "@/types/staff";

export function StaffShell({
  profile,
  children,
}: {
  profile: StaffProfileSummary;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        <aside className="border-b border-gray-200 bg-white lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col p-5">
            <div className="flex items-center justify-between gap-3">
              <Link href="/staff/dashboard" className="flex items-center gap-3 rounded-xl px-3 py-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-600 text-white">
                  <Building2 className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">NexusLend</p>
                  <p className="text-xs text-gray-500">Staff workspace</p>
                </div>
              </Link>
              <NotificationBell userId={profile.id} />
            </div>

            <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-25 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                  <CircleUserRound className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {profile.first_name} {profile.last_name}
                  </p>
                  <p className="text-xs uppercase tracking-[0.16em] text-gray-500">
                    {profile.role.replaceAll("_", " ")}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <StaffNav />
            </div>

            <div className="mt-6 rounded-2xl bg-primary-25 p-4">
              <p className="text-sm font-semibold text-gray-900">Working view</p>
              <p className="mt-1 text-sm text-gray-600">
                Use the pipeline board to move files, then drill into the loan tabs to review documents, tasks, and underwriting.
              </p>
              <Link
                href="/staff/pipeline"
                className={cn(
                  "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors",
                  "hover:bg-primary-700 active:bg-primary-800",
                )}
              >
                <Workflow className="h-4 w-4" aria-hidden="true" />
                Open pipeline
              </Link>
            </div>

            <div className="mt-auto pt-6">
              <SignOutButton />
            </div>
          </div>
        </aside>

        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</div>
      </div>
    </div>
  );
}
