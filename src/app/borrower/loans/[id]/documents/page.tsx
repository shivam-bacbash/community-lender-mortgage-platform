import { ExternalLink } from "lucide-react";

import { DocumentUploadForm } from "@/components/borrower/document-upload-form";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { getBorrowerLoanDocuments } from "@/lib/borrower/queries";
import { formatDate } from "@/lib/utils/format";

export default async function BorrowerLoanDocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { loan, documents } = await getBorrowerLoanDocuments(id);

  return (
    <main id="main-content" className="space-y-6">
      <PageHeader
        breadcrumbs={["Borrower", "Loans", loan.loan_number ?? "Application", "Documents"]}
        title="Documents"
        subtitle="Upload new files and review what the loan team has already received."
      />

      <DocumentUploadForm loanId={id} />

      <Card className="p-6">
        <div className="space-y-4">
          {documents.length ? (
            documents.map((document) => (
              <div key={document.id} className="flex flex-col gap-3 rounded-2xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{document.file_name}</p>
                  <p className="mt-1 text-sm text-gray-600">
                    {document.document_type.replaceAll("_", " ")} • uploaded {formatDate(document.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={document.status} />
                  {document.signed_url ? (
                    <a
                      href={document.signed_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700"
                    >
                      View
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    </a>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-600">No documents uploaded yet.</p>
          )}
        </div>
      </Card>
    </main>
  );
}
