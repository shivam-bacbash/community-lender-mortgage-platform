"use client";

import { useRef, useState, useTransition } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { uploadBorrowerDocument } from "@/lib/actions/borrower-portal";

export function DocumentUploadForm({ loanId }: { loanId: string }) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [documentType, setDocumentType] = useState("paystub");
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
        const file = fileRef.current?.files?.[0] ?? null;

        startTransition(async () => {
          const result = await uploadBorrowerDocument(
            { loanId, documentType: documentType as never },
            file,
          );

          if (result.error) {
            setServerError(result.error);
            return;
          }

          setServerSuccess("Document uploaded and queued for review.");

          if (fileRef.current) {
            fileRef.current.value = "";
          }
        });
      }}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <Field id="documentType" label="Document type" className="md:flex-1">
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
        <Field id="documentFile" label="File" className="md:flex-1">
          <input
            id="documentFile"
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="block w-full text-sm text-gray-600"
          />
        </Field>
        <Button type="submit" loading={isPending}>
          Upload document
        </Button>
      </div>
      {serverError ? <div className="mt-4"><Alert tone="error" message={serverError} /></div> : null}
      {serverSuccess ? <div className="mt-4"><Alert tone="success" message={serverSuccess} /></div> : null}
    </form>
  );
}
