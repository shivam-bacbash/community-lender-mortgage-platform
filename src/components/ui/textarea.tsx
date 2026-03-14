import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export function Textarea({ className, hasError = false, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "block min-h-28 w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 transition-colors duration-150 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500",
        hasError
          ? "border-error-300 focus:border-error-500 focus:ring-error-500"
          : "border-gray-300 hover:border-gray-400 focus:border-primary-500 focus:ring-primary-500",
        className,
      )}
      {...props}
    />
  );
}
