"use client";

import { useState, useTransition } from "react";

import { UploadZone } from "@/components/documents/UploadZone";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { uploadBorrowerDocument } from "@/lib/actions/borrower-portal";
import { getDocumentTypeLabel } from "@/lib/documents/config";

export function DocumentUploadForm({ loanId }: { loanId: string }) {
  const [documentType, setDocumentType] = useState("paystub");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="rounded-2xl border border-gray-200 bg-white p-5"
      onSubmit={(event) => {
        event.preventDefault();
        setServerError(null);
        setServerSuccess(null);

        startTransition(async () => {
          const result = await uploadBorrowerDocument(
            { loanId, documentType: documentType as never },
            selectedFile,
          );

          if (result.error) {
            setServerError(result.error);
            return;
          }

          setServerSuccess(`${getDocumentTypeLabel(documentType)} uploaded and queued for review.`);
          setSelectedFile(null);
        });
      }}
    >
      <div className="grid gap-4 lg:grid-cols-[240px_1fr_auto] lg:items-end">
        <Field id="documentType" label="Document type">
          <Select id="documentType" value={documentType} onChange={(event) => setDocumentType(event.target.value)}>
            <option value="paystub">Paystub</option>
            <option value="w2">W-2</option>
            <option value="tax_return">Tax return</option>
            <option value="bank_statement">Bank statement</option>
            <option value="photo_id">Photo ID</option>
            <option value="social_security">Social Security card</option>
            <option value="purchase_contract">Purchase contract</option>
            <option value="other">Other</option>
          </Select>
        </Field>
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">File</p>
          <UploadZone
            label={`Upload ${getDocumentTypeLabel(documentType)}`}
            accept=".pdf,.jpg,.jpeg,.png"
            fileName={selectedFile?.name ?? null}
            onFileSelect={setSelectedFile}
          />
        </div>
        <Button type="submit" loading={isPending} disabled={!selectedFile} className="lg:self-end">
          Upload document
        </Button>
      </div>
      {serverError ? <div className="mt-4"><Alert tone="error" message={serverError} /></div> : null}
      {serverSuccess ? <div className="mt-4"><Alert tone="success" message={serverSuccess} /></div> : null}
    </form>
  );
}
