"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseBusiness, LayoutDashboard } from "lucide-react";

import { cn } from "@/lib/utils/cn";

const ITEMS = [
  {
    href: "/staff/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/staff/pipeline",
    label: "Pipeline",
    icon: BriefcaseBusiness,
  },
] as const;

export function StaffNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary-50 text-primary-700"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
