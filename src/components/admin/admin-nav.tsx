"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  FileCog,
  GitBranchPlus,
  LayoutDashboard,
  Mail,
  Settings2,
  Shuffle,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils/cn";

const ADMIN_NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/branches", label: "Branches", icon: GitBranchPlus },
  { href: "/admin/pipeline", label: "Pipeline", icon: Shuffle },
  { href: "/admin/products", label: "Products", icon: FileCog },
  { href: "/admin/templates", label: "Templates", icon: Mail },
  { href: "/admin/compliance", label: "Compliance", icon: Building2 },
  { href: "/admin/settings", label: "Settings", icon: Settings2 },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {ADMIN_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary-50 text-primary-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
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
