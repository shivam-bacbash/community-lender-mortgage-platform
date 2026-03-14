"use client";

import type { ReactNode } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils/cn";

import { Button } from "./button";

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
};

export function Modal({
  open,
  onClose,
  title,
  size = "md",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: keyof typeof sizeClasses;
  children: ReactNode;
}) {
  return (
    <Transition show={open}>
      <Dialog onClose={onClose} className="relative z-50">
        <TransitionChild
          enter="transition-opacity duration-200 ease-out"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-150 ease-in"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/50" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto p-4">
          <div className="flex min-h-full items-end justify-center sm:items-center">
            <TransitionChild
              enter="transition duration-300 ease-out"
              enterFrom="translate-y-2 opacity-0"
              enterTo="translate-y-0 opacity-100"
              leave="transition duration-150 ease-in"
              leaveFrom="translate-y-0 opacity-100"
              leaveTo="translate-y-2 opacity-0"
            >
              <DialogPanel
                className={cn(
                  "w-full rounded-xl border border-gray-200 bg-white p-6 shadow-lg",
                  sizeClasses[size],
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <DialogTitle className="text-lg font-semibold text-gray-900">
                    {title}
                  </DialogTitle>
                  <Button
                    aria-label="Close dialog"
                    variant="tertiary"
                    size="sm"
                    onClick={onClose}
                  >
                    <X aria-hidden="true" className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-4">{children}</div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
