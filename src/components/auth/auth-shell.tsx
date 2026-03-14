import Link from "next/link";
import { Landmark } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function AuthShell({
  eyebrow,
  title,
  description,
  footer,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="w-full max-w-md p-8">
      <CardHeader className="space-y-3">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 rounded-full border border-primary-200 bg-primary-25 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700"
        >
          <Landmark aria-hidden="true" className="h-3.5 w-3.5" />
          {eyebrow}
        </Link>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-gray-900">{title}</h1>
          <p className="text-sm leading-6 text-gray-600">{description}</p>
        </div>
      </CardHeader>
      <CardContent className="mt-8">{children}</CardContent>
      {footer ? <div className="mt-6 text-sm text-gray-600">{footer}</div> : null}
    </Card>
  );
}
