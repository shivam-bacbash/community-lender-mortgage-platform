import { AlertCircle, CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils/cn";

export function Alert({
  tone,
  title,
  message,
}: {
  tone: "error" | "success" | "info";
  title?: string;
  message: string;
}) {
  const icon =
    tone === "error" ? (
      <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
    ) : (
      <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
    );

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4 text-sm",
        tone === "error" && "border-error-200 bg-error-25 text-error-700",
        tone === "success" && "border-success-200 bg-success-25 text-success-700",
        tone === "info" && "border-primary-200 bg-primary-25 text-primary-700",
      )}
    >
      {icon}
      <div>
        {title ? <p className="font-semibold">{title}</p> : null}
        <p>{message}</p>
      </div>
    </div>
  );
}
