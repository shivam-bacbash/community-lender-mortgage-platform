import { notFound, redirect } from "next/navigation";

import { ApplicationStepForm } from "@/components/borrower/application-step-form";
import { PageHeader } from "@/components/shared/page-header";
import { getBorrowerDraftApplication } from "@/lib/borrower/queries";

const VALID_STEPS = new Set(["1", "2", "3", "4", "5", "6"]);

export default async function BorrowerApplicationStepPage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step } = await params;

  if (!VALID_STEPS.has(step)) {
    notFound();
  }

  const stepNumber = Number(step);
  const { draft } = await getBorrowerDraftApplication();

  if (stepNumber > 1 && !draft) {
    redirect("/borrower/apply/1");
  }

  return (
    <main id="main-content" className="space-y-6">
      <PageHeader
        breadcrumbs={["Borrower", "Apply"]}
        title="Mortgage application"
        subtitle="Complete each step to move your application from draft to submitted."
      />
      <ApplicationStepForm step={stepNumber} draft={draft} />
    </main>
  );
}
