"use client";

import { UploadCloud } from "lucide-react";

import { cn } from "@/lib/utils/cn";

export function UploadZone({
  label,
  accept,
  onFileSelect,
  fileName,
}: {
  label: string;
  accept: string;
  onFileSelect: (file: File | null) => void;
  fileName?: string | null;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-8 text-center transition hover:border-primary-400 hover:bg-primary-25",
      )}
    >
      <UploadCloud className="h-8 w-8 text-primary-600" aria-hidden="true" />
      <span className="mt-3 text-sm font-semibold text-gray-900">{label}</span>
      <span className="mt-1 text-sm text-gray-500">
        Drag a file here or click to browse. PDF, JPG, and PNG up to 25MB.
      </span>
      <span className="mt-2 text-xs text-gray-500">{fileName ?? "No file selected"}</span>
      <input
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => onFileSelect(event.target.files?.[0] ?? null)}
      />
    </label>
  );
}
