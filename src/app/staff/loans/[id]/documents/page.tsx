import { DocumentChecklist } from "@/components/documents/DocumentChecklist";
import { DocumentGrid } from "@/components/documents/DocumentGrid";
import { DocumentReviewActions } from "@/components/documents/DocumentReviewActions";
import { ExpiryAlert } from "@/components/documents/ExpiryAlert";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { getStaffLoanWorkspace } from "@/lib/staff/queries";
import { requestDocument } from "@/lib/actions/loans";
import type { DocumentRequestInput } from "@/lib/validations/loans";
import { getDocumentTypeLabel } from "@/lib/documents/config";
import { PageHeader } from "@/components/shared/page-header";
import { formatDate } from "@/lib/utils/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function StaffLoanDocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workspace = await getStaffLoanWorkspace(id);
  const supabase = await createSupabaseServerClient();
  const signedUrls = await Promise.all(
    workspace.documents.map(async (document) => {
      const { data } = await supabase.storage
        .from("documents")
        .createSignedUrl(document.storage_path, 3600);
      return [document.id, data?.signedUrl ?? null] as const;
    }),
  );
  const urlMap = new Map(signedUrls);

  async function requestDocumentAction(formData: FormData) {
    "use server";

    await requestDocument(id, {
      loanId: id,
      documentType: String(formData.get("documentType")) as DocumentRequestInput["documentType"],
      message: String(formData.get("message") || ""),
      dueDate: String(formData.get("dueDate") || ""),
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={["Staff", workspace.header.loan_number ?? workspace.header.id, "Documents"]}
        title="Document management"
        subtitle="Review borrower uploads, track checklist coverage, and manage request workflows."
      />

      <ExpiryAlert items={workspace.expiringDocuments} />

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900">Request document</h2>
          <form action={requestDocumentAction} className="mt-4 grid gap-4 md:grid-cols-[1fr_2fr_1fr_auto]">
            <Field id="documentType" label="Document type">
              <Select name="documentType" id="documentType">
                <option value="paystub">Paystub</option>
                <option value="w2">W-2</option>
                <option value="tax_return">Tax return</option>
                <option value="bank_statement">Bank statement</option>
                <option value="photo_id">Photo ID</option>
                <option value="purchase_contract">Purchase contract</option>
                <option value="other">Other</option>
              </Select>
            </Field>
            <Field id="message" label="Borrower message">
              <Input id="message" name="message" />
            </Field>
            <Field id="dueDate" label="Due date">
              <Input id="dueDate" name="dueDate" type="date" />
            </Field>
            <div className="flex items-end">
              <Button type="submit">Request</Button>
            </div>
          </form>
        </Card>

        <DocumentChecklist
          title="Loan checklist"
          summary={workspace.documentChecklist}
          items={workspace.documentChecklist.items}
        />
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900">Request history</h2>
        <div className="mt-4 space-y-3">
          {workspace.documentRequests.length ? (
            workspace.documentRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-2xl border border-gray-200 px-4 py-3"
              >
                <p className="text-sm font-semibold text-gray-900">
                  {getDocumentTypeLabel(request.document_type)}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {request.message ?? "Borrower upload requested."}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Requested {formatDate(request.created_at, "MMM d, yyyy h:mm a")}
                  {request.due_date ? ` • due ${formatDate(request.due_date)}` : ""}
                  {request.fulfilled_at ? ` • fulfilled ${formatDate(request.fulfilled_at)}` : ""}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-600">No requests have been sent for this loan yet.</p>
          )}
        </div>
      </Card>

      <DocumentGrid
        documents={workspace.documents.map((document) => ({
          id: document.id,
          title: document.file_name,
          documentType: document.document_type,
          category: document.document_category,
          createdAt: document.created_at,
          status: document.status,
          subtitle:
            document.rejection_reason ??
            `Uploaded by ${document.uploaded_by_name}`,
          version: document.version,
          expiresAt: document.expires_at,
          previewUrl: urlMap.get(document.id) ?? null,
          detailHref: `/staff/loans/${id}/documents/${document.id}`,
          extractionConfidence: document.ai_extracted_data?.confidence ?? null,
          actions: <DocumentReviewActions documentId={document.id} />,
        }))}
        emptyMessage="No documents have been uploaded yet."
      />
    </div>
  );
}
