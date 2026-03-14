import { requestDocument } from "@/lib/actions/loans";
import { DocumentReviewRow } from "@/components/loan/document-review-row";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { getStaffLoanWorkspace } from "@/lib/staff/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DocumentRequestInput } from "@/lib/validations/loans";

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

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900">Document review</h2>
        <div className="mt-4 space-y-4">
          {workspace.documents.map((document) => (
            <DocumentReviewRow
              key={document.id}
              document={document}
              signedUrl={urlMap.get(document.id) ?? null}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
