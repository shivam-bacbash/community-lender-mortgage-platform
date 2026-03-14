import { DocumentChecklist } from "@/components/documents/DocumentChecklist";
import { DocumentGrid } from "@/components/documents/DocumentGrid";
import { ExpiryAlert } from "@/components/documents/ExpiryAlert";
import { DocumentUploadForm } from "@/components/borrower/document-upload-form";
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
  const workspace = await getBorrowerLoanDocuments(id);

  return (
    <main id="main-content" className="space-y-6">
      <PageHeader
        breadcrumbs={["Borrower", "Loans", workspace.loan.loan_number ?? "Application", "Documents"]}
        title="Documents"
        subtitle="Upload new files, monitor required items, and replace outdated versions."
      />

      <ExpiryAlert items={workspace.expiringDocuments} />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <DocumentUploadForm loanId={id} />
        <DocumentChecklist summary={workspace.checklist} items={workspace.checklist.items} />
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900">Open requests</h2>
        <div className="mt-4 space-y-3">
          {workspace.documentRequests.length ? (
            workspace.documentRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-2xl border border-gray-200 px-4 py-3"
              >
                <p className="text-sm font-semibold text-gray-900">
                  {request.document_type.replaceAll("_", " ")}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {request.message ?? "The loan team requested this document."}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  {request.due_date ? `Due ${formatDate(request.due_date)}` : "No due date"}
                  {request.fulfilled_at ? ` • uploaded ${formatDate(request.fulfilled_at)}` : ""}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-600">No outstanding document requests.</p>
          )}
        </div>
      </Card>

      <DocumentGrid
        documents={workspace.documents.map((document) => ({
          id: document.id,
          title: document.file_name,
          documentType: document.document_type,
          category: document.document_category ?? "borrower",
          createdAt: document.created_at,
          status: document.status,
          subtitle: document.rejection_reason ?? null,
          version: document.version ?? 1,
          expiresAt: document.expires_at ?? null,
          previewUrl: document.signed_url,
          extractionConfidence: document.ai_extracted_data?.confidence ?? null,
        }))}
        emptyMessage="No documents uploaded yet."
      />
    </main>
  );
}
