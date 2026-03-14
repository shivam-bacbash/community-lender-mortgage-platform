import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

export function PageHeader({
  breadcrumbs,
  title,
  subtitle,
  actions,
}: {
  breadcrumbs?: string[];
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        {breadcrumbs?.length ? (
          <nav className="mb-1 flex items-center gap-2 text-sm text-gray-500">
            {breadcrumbs.map((item, index) => (
              <span key={`${item}-${index}`} className="inline-flex items-center gap-2">
                {index > 0 ? <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" /> : null}
                <span className={index === breadcrumbs.length - 1 ? "font-medium text-gray-900" : ""}>
                  {item}
                </span>
              </span>
            ))}
          </nav>
        ) : null}
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        {subtitle ? <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </div>
  );
}
