"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StepIndicator } from "@/components/borrower/step-indicator";
import { submitBorrowerApplication } from "@/lib/actions/borrower-portal";
import { formatCurrency } from "@/lib/utils/format";
import { useApplicationStore } from "@/stores/use-application-store";
import type { BorrowerDraftApplication } from "@/types/borrower";

function Section({
  title,
  editHref,
  children,
}: {
  title: string;
  editHref: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <Link href={editHref} className="text-sm font-medium text-primary-700">
          Edit
        </Link>
      </div>
      <div className="mt-4 text-sm text-gray-600">{children}</div>
    </Card>
  );
}

export function ApplicationReview({ draft }: { draft: BorrowerDraftApplication }) {
  const router = useRouter();
  const reset = useApplicationStore((state) => state.reset);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalIncome = useMemo(() => {
    return draft.employmentRecords.reduce((sum, employer) => {
      return (
        sum +
        Number(employer.base_monthly_income ?? 0) +
        Number(employer.overtime_monthly ?? 0) +
        Number(employer.bonus_monthly ?? 0) +
        Number(employer.commission_monthly ?? 0) +
        Number(employer.other_monthly ?? 0)
      );
    }, 0);
  }, [draft.employmentRecords]);

  return (
    <div className="space-y-6">
      <StepIndicator currentStep={6} completedSteps={[1, 2, 3, 4, 5, 6]} />
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Review and submit</h2>
            <p className="mt-2 text-sm text-gray-600">
              Review each section before submitting the application into the live loan pipeline.
            </p>
          </div>
          <div className="rounded-2xl bg-primary-25 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Loan number</p>
            <p className="text-sm font-semibold text-gray-900">
              {draft.loan_number ?? "Assigned on submit"}
            </p>
          </div>
        </div>

        {serverError ? <div className="mt-6"><Alert tone="error" message={serverError} /></div> : null}

        <div className="mt-6 grid gap-4">
          <Section title="Loan details" editHref="/borrower/apply/1">
            <p className="capitalize">
              {draft.loan_type} {draft.loan_purpose.replaceAll("_", " ")}
            </p>
            <p className="mt-1">Loan amount: {formatCurrency(draft.loan_amount ?? 0)}</p>
            <p className="mt-1">Down payment: {formatCurrency(draft.down_payment ?? 0)}</p>
            <p className="mt-1">
              Property: {draft.property?.address.street}, {draft.property?.address.city},{" "}
              {draft.property?.address.state} {draft.property?.address.zip}
            </p>
          </Section>

          <Section title="Borrower profile" editHref="/borrower/apply/2">
            <p>Date of birth: {draft.borrowerProfile?.dob ?? "Not provided"}</p>
            <p className="mt-1 capitalize">
              Marital status: {draft.borrowerProfile?.marital_status ?? "Not provided"}
            </p>
            <p className="mt-1 capitalize">
              Citizenship: {draft.borrowerProfile?.citizenship?.replaceAll("_", " ") ?? "Not provided"}
            </p>
            <p className="mt-1">Dependents: {draft.borrowerProfile?.dependents_count ?? 0}</p>
          </Section>

          <Section title="Current address" editHref="/borrower/apply/3">
            <p>
              {draft.borrowerProfile?.address_current?.street},{" "}
              {draft.borrowerProfile?.address_current?.city},{" "}
              {draft.borrowerProfile?.address_current?.state}{" "}
              {draft.borrowerProfile?.address_current?.zip}
            </p>
            <p className="mt-1 capitalize">
              Housing: {draft.borrowerProfile?.housing_status?.replaceAll("_", " ") ?? "Not provided"}
            </p>
            <p className="mt-1">Years at address: {draft.borrowerProfile?.years_at_address ?? 0}</p>
          </Section>

          <Section title="Employment" editHref="/borrower/apply/4">
            <p>Total monthly income: {formatCurrency(totalIncome)}</p>
            <div className="mt-2 space-y-2">
              {draft.employmentRecords.map((record) => (
                <p key={record.id}>
                  {record.employer_name}:{" "}
                  {formatCurrency(
                    Number(record.base_monthly_income ?? 0) +
                      Number(record.overtime_monthly ?? 0) +
                      Number(record.bonus_monthly ?? 0) +
                      Number(record.commission_monthly ?? 0) +
                      Number(record.other_monthly ?? 0),
                  )}
                </p>
              ))}
            </div>
          </Section>

          <Section title="Assets" editHref="/borrower/apply/5">
            <div className="space-y-2">
              {draft.assets.map((asset) => (
                <p key={asset.id}>
                  {asset.asset_type.replaceAll("_", " ")}: {formatCurrency(asset.balance)}
                </p>
              ))}
            </div>
          </Section>

          <Section title="Liabilities" editHref="/borrower/apply/6">
            {draft.liabilities.length ? (
              <div className="space-y-2">
                {draft.liabilities.map((liability) => (
                  <p key={liability.id}>
                    {liability.liability_type.replaceAll("_", " ")}:{" "}
                    {formatCurrency(liability.monthly_payment)} / month
                  </p>
                ))}
              </div>
            ) : (
              <p>No liabilities added.</p>
            )}
          </Section>
        </div>

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/borrower/apply/6" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            Back to liabilities
          </Link>
          <Button
            loading={isPending}
            onClick={() => {
              setServerError(null);
              startTransition(async () => {
                const result = await submitBorrowerApplication(draft.id);

                if (result.error) {
                  setServerError(result.error);
                  return;
                }

                if (!result.data) {
                  setServerError("The application could not be submitted.");
                  return;
                }

                reset();
                router.push(result.data.redirectTo);
              });
            }}
          >
            Submit application
          </Button>
        </div>
      </Card>
    </div>
  );
}
