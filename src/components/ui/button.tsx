import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "tertiary" | "destructive" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-600 text-white shadow-sm hover:bg-primary-700 active:bg-primary-800 focus-visible:ring-primary-500",
  secondary:
    "border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100 focus-visible:ring-primary-500",
  tertiary:
    "bg-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100 focus-visible:ring-primary-500",
  destructive:
    "bg-error-600 text-white shadow-sm hover:bg-error-700 active:bg-error-800 focus-visible:ring-error-500",
  ghost:
    "bg-transparent text-primary-700 hover:bg-primary-50 active:bg-primary-100 focus-visible:ring-primary-500",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "rounded-lg px-3 py-2 text-sm",
  md: "rounded-lg px-4 py-2.5 text-sm",
  lg: "rounded-xl px-5 py-3 text-base",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  type,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-colors duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={disabled || loading}
      type={type ?? "button"}
      {...props}
    >
      {loading ? "Working..." : children}
    </button>
  );
}
