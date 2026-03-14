import Link from "next/link";

import { APPLICATION_STEPS } from "@/lib/borrower/constants";
import { cn } from "@/lib/utils/cn";

export function StepIndicator({
  currentStep,
  completedSteps,
}: {
  currentStep: number;
  completedSteps: number[];
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Step {currentStep} of {APPLICATION_STEPS.length}
          </p>
          <p className="text-sm text-gray-600">
            {APPLICATION_STEPS.find((item) => item.step === currentStep)?.title}
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {Math.round((currentStep / APPLICATION_STEPS.length) * 100)}% complete
        </div>
      </div>

      <div className="mt-4 h-2 rounded-full bg-gray-100">
        <div
          className="h-2 rounded-full bg-primary-600 transition-all"
          style={{ width: `${(currentStep / APPLICATION_STEPS.length) * 100}%` }}
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {APPLICATION_STEPS.map((item) => {
          const isCurrent = item.step === currentStep;
          const isCompleted = completedSteps.includes(item.step);
          const canNavigate = isCompleted && item.step < currentStep;

          const content = (
            <div
              className={cn(
                "rounded-xl border px-3 py-3 text-left transition-colors",
                isCurrent
                  ? "border-primary-300 bg-primary-25"
                  : isCompleted
                    ? "border-success-200 bg-success-25"
                    : "border-gray-200 bg-white",
              )}
            >
              <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Step {item.step}</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{item.title}</p>
            </div>
          );

          if (!canNavigate) {
            return <div key={item.step}>{content}</div>;
          }

          return (
            <Link key={item.step} href={`/borrower/apply/${item.step}`}>
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
