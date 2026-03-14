import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

export function Select({ className, hasError = false, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500",
        hasError
          ? "border-error-300 focus:border-error-500 focus:ring-error-500"
          : "border-gray-300 hover:border-gray-400 focus:border-primary-500 focus:ring-primary-500",
        className,
      )}
      {...props}
    />
  );
}
