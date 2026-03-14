import { redirect } from "next/navigation";

import { ApplicationReview } from "@/components/borrower/application-review";
import { PageHeader } from "@/components/shared/page-header";
import { getBorrowerDraftApplication } from "@/lib/borrower/queries";

export default async function BorrowerApplicationReviewPage() {
  const { draft } = await getBorrowerDraftApplication();

  if (!draft) {
    redirect("/borrower/apply/1");
  }

  return (
    <main id="main-content" className="space-y-6">
      <PageHeader
        breadcrumbs={["Borrower", "Apply", "Review"]}
        title="Review application"
        subtitle="Confirm each section and submit the file into the live pipeline."
      />
      <ApplicationReview draft={draft} />
    </main>
  );
}
