import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

import { Label } from "./label";

export function Field({
  id,
  label,
  helperText,
  error,
  required,
  children,
  className,
}: {
  id: string;
  label: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {required ? <span className="ml-0.5 text-error-500">*</span> : null}
      </Label>
      {children}
      {helperText && !error ? (
        <p id={`${id}-hint`} className="text-xs text-gray-500">
          {helperText}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-error-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
