"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StepIndicator } from "@/components/borrower/step-indicator";
import {
  saveLoanStep1,
  saveLoanStep2,
  saveLoanStep3,
  saveLoanStep4,
  saveLoanStep5,
  saveLoanStep6,
} from "@/lib/actions/borrower-portal";
import {
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
  step6Schema,
  type Step1Input,
  type Step2Input,
  type Step3Input,
  type Step4Input,
  type Step5Input,
  type Step6Input,
} from "@/lib/validations/application";
import { cn } from "@/lib/utils/cn";
import { formatCurrency, formatPercent } from "@/lib/utils/format";
import { useApplicationStore } from "@/stores/use-application-store";
import type { BorrowerDraftApplication } from "@/types/borrower";

function currencyInputValue(value: number | null | undefined) {
  return value ?? 0;
}

function getStep1Defaults(draft: BorrowerDraftApplication | null, stored: Step1Input | null): Step1Input {
  if (stored) {
    return stored;
  }

  return {
    loan_purpose: (draft?.loan_purpose as Step1Input["loan_purpose"]) ?? "purchase",
    loan_type: (draft?.loan_type as Step1Input["loan_type"]) ?? "conventional",
    loan_amount: currencyInputValue(draft?.loan_amount),
    down_payment: currencyInputValue(draft?.down_payment),
    property_street: draft?.property?.address.street ?? "",
    property_city: draft?.property?.address.city ?? "",
    property_state: draft?.property?.address.state ?? "",
    property_zip: draft?.property?.address.zip ?? "",
    property_type: (draft?.property?.property_type as Step1Input["property_type"]) ?? "sfr",
    occupancy_type: (draft?.property?.occupancy_type as Step1Input["occupancy_type"]) ?? "primary",
    purchase_price: draft?.property?.purchase_price ?? 0,
  };
}

function getStep2Defaults(draft: BorrowerDraftApplication | null, stored: Step2Input | null): Step2Input {
  if (stored) {
    return stored;
  }

  return {
    ssn: "",
    dob: draft?.borrowerProfile?.dob ?? "",
    marital_status: (draft?.borrowerProfile?.marital_status as Step2Input["marital_status"]) ?? "single",
    citizenship:
      (draft?.borrowerProfile?.citizenship as Step2Input["citizenship"]) ?? "us_citizen",
    dependents_count: draft?.borrowerProfile?.dependents_count ?? 0,
  };
}

function getStep3Defaults(draft: BorrowerDraftApplication | null, stored: Step3Input | null): Step3Input {
  if (stored) {
    return stored;
  }

  return {
    current_street: draft?.borrowerProfile?.address_current?.street ?? "",
    current_city: draft?.borrowerProfile?.address_current?.city ?? "",
    current_state: draft?.borrowerProfile?.address_current?.state ?? "",
    current_zip: draft?.borrowerProfile?.address_current?.zip ?? "",
    current_county: draft?.borrowerProfile?.address_current?.county ?? "",
    housing_status:
      (draft?.borrowerProfile?.housing_status as Step3Input["housing_status"]) ?? "rent",
    years_at_address: draft?.borrowerProfile?.years_at_address ?? 0,
    monthly_housing_payment: draft?.borrowerProfile?.monthly_housing_payment ?? 0,
  };
}

function getStep4Defaults(draft: BorrowerDraftApplication | null, stored: Step4Input | null): Step4Input {
  if (stored) {
    return stored;
  }

  if (draft?.employmentRecords.length) {
    return {
      employers: draft.employmentRecords.map((record) => ({
        employer_name: record.employer_name,
        employer_phone: record.employer_phone ?? "",
        position: record.position ?? "",
        employment_type: record.employment_type as Step4Input["employers"][number]["employment_type"],
        start_date: record.start_date ?? "",
        end_date: record.end_date ?? "",
        is_current: record.is_current,
        is_primary: record.is_primary,
        employer_street: record.employer_address?.street ?? "",
        employer_city: record.employer_address?.city ?? "",
        employer_state: record.employer_address?.state ?? "",
        employer_zip: record.employer_address?.zip ?? "",
        base_monthly_income: record.base_monthly_income ?? 0,
        overtime_monthly: record.overtime_monthly ?? 0,
        bonus_monthly: record.bonus_monthly ?? 0,
        commission_monthly: record.commission_monthly ?? 0,
        other_monthly: record.other_monthly ?? 0,
      })),
    };
  }

  return {
    employers: [
      {
        employer_name: "",
        employer_phone: "",
        position: "",
        employment_type: "w2",
        start_date: "",
        end_date: "",
        is_current: true,
        is_primary: true,
        employer_street: "",
        employer_city: "",
        employer_state: "",
        employer_zip: "",
        base_monthly_income: 0,
        overtime_monthly: 0,
        bonus_monthly: 0,
        commission_monthly: 0,
        other_monthly: 0,
      },
    ],
  };
}

function getStep5Defaults(draft: BorrowerDraftApplication | null, stored: Step5Input | null): Step5Input {
  if (stored) {
    return stored;
  }

  if (draft?.assets.length) {
    return {
      assets: draft.assets.map((asset) => ({
        asset_type: asset.asset_type as Step5Input["assets"][number]["asset_type"],
        institution_name: asset.institution_name ?? "",
        account_last4: asset.account_last4 ?? "",
        balance: asset.balance,
        is_gift: asset.is_gift,
        gift_source: asset.gift_source ?? "",
      })),
    };
  }

  return {
    assets: [
      {
        asset_type: "checking",
        institution_name: "",
        account_last4: "",
        balance: 0,
        is_gift: false,
        gift_source: "",
      },
    ],
  };
}

function getStep6Defaults(draft: BorrowerDraftApplication | null, stored: Step6Input | null): Step6Input {
  if (stored) {
    return stored;
  }

  if (draft?.liabilities.length) {
    return {
      liabilities: draft.liabilities.map((liability) => ({
        liability_type: liability.liability_type as Step6Input["liabilities"][number]["liability_type"],
        creditor_name: liability.creditor_name ?? "",
        account_number_last4: liability.account_number_last4 ?? "",
        monthly_payment: liability.monthly_payment,
        outstanding_balance: liability.outstanding_balance ?? 0,
        months_remaining: liability.months_remaining ?? 0,
        to_be_paid_off: liability.to_be_paid_off,
        exclude_from_dti: liability.exclude_from_dti,
        exclude_reason: liability.exclude_reason ?? "",
      })),
    };
  }

  return {
    liabilities: [],
  };
}

function getCompletedSteps(draft: BorrowerDraftApplication | null, stepData: ReturnType<typeof useApplicationStore.getState>["stepData"]) {
  const steps = new Set<number>();

  if (draft?.id || stepData.step1) {
    steps.add(1);
  }

  if (draft?.borrowerProfile?.dob || stepData.step2) {
    steps.add(2);
  }

  if (draft?.borrowerProfile?.address_current?.street || stepData.step3) {
    steps.add(3);
  }

  if (draft?.employmentRecords.length || stepData.step4) {
    steps.add(4);
  }

  if (draft?.assets.length || stepData.step5) {
    steps.add(5);
  }

  if (stepData.step6 || draft?.liabilities.length) {
    steps.add(6);
  }

  return [...steps];
}

function StepLayout({
  currentStep,
  completedSteps,
  title,
  description,
  children,
}: {
  currentStep: number;
  completedSteps: number[];
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <StepIndicator currentStep={currentStep} completedSteps={completedSteps} />
      <Card className="p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
          <p className="mt-2 text-sm text-gray-600">{description}</p>
        </div>
        {children}
      </Card>
    </div>
  );
}

function StepActions({ previousHref, isPending }: { previousHref?: string; isPending: boolean }) {
  return (
    <div className="mt-8 flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {previousHref ? (
          <Link href={previousHref} className="text-sm font-medium text-gray-600 hover:text-gray-900">
            Back
          </Link>
        ) : null}
      </div>
      <Button type="submit" loading={isPending}>
        Save and continue
      </Button>
    </div>
  );
}

function LoanDetailsStep({
  applicationId,
  draft,
  completedSteps,
}: {
  applicationId: string | null;
  draft: BorrowerDraftApplication | null;
  completedSteps: number[];
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const setApplicationId = useApplicationStore((state) => state.setApplicationId);
  const setStepData = useApplicationStore((state) => state.setStepData);
  const stored = useApplicationStore((state) => state.stepData.step1);
  const defaults = useMemo(() => getStep1Defaults(draft, stored), [draft, stored]);
  const form = useForm<Step1Input>({
    resolver: zodResolver(step1Schema),
    defaultValues: defaults,
  });

  useEffect(() => {
    form.reset(defaults);
  }, [defaults, form]);

  return (
    <StepLayout
      currentStep={1}
      completedSteps={completedSteps}
      title="Loan details"
      description="Set the basics for the loan request and property so the application can be created."
    >
      <form
        onSubmit={form.handleSubmit((values) => {
          setServerError(null);
          startTransition(async () => {
            const result = await saveLoanStep1(values, applicationId);

            if (result.error) {
              setServerError(result.error);
              return;
            }

            if (!result.data) {
              setServerError("The application could not be saved.");
              return;
            }

            setStepData("step1", values);
            setApplicationId(result.data.applicationId);
            router.push(result.data.nextPath);
          });
        })}
      >
        {serverError ? <Alert tone="error" message={serverError} /> : null}
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="loan_purpose" label="Loan purpose" error={form.formState.errors.loan_purpose?.message} required>
            <Select id="loan_purpose" {...form.register("loan_purpose")}>
              <option value="purchase">Purchase</option>
              <option value="refinance">Refinance</option>
              <option value="cash_out">Cash-out refinance</option>
            </Select>
          </Field>
          <Field id="loan_type" label="Loan type" error={form.formState.errors.loan_type?.message} required>
            <Select id="loan_type" {...form.register("loan_type")}>
              <option value="conventional">Conventional</option>
              <option value="fha">FHA</option>
              <option value="va">VA</option>
              <option value="usda">USDA</option>
              <option value="jumbo">Jumbo</option>
            </Select>
          </Field>
          <Field id="loan_amount" label="Loan amount" error={form.formState.errors.loan_amount?.message} required>
            <Input id="loan_amount" type="number" step="1000" {...form.register("loan_amount", { valueAsNumber: true })} />
          </Field>
          <Field id="down_payment" label="Down payment" error={form.formState.errors.down_payment?.message} required>
            <Input id="down_payment" type="number" step="1000" {...form.register("down_payment", { valueAsNumber: true })} />
          </Field>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Field id="property_street" label="Property street" error={form.formState.errors.property_street?.message} required>
            <Input id="property_street" {...form.register("property_street")} />
          </Field>
          <Field id="property_city" label="City" error={form.formState.errors.property_city?.message} required>
            <Input id="property_city" {...form.register("property_city")} />
          </Field>
          <Field id="property_state" label="State" error={form.formState.errors.property_state?.message} required>
            <Input id="property_state" maxLength={2} {...form.register("property_state")} />
          </Field>
          <Field id="property_zip" label="ZIP" error={form.formState.errors.property_zip?.message} required>
            <Input id="property_zip" maxLength={5} {...form.register("property_zip")} />
          </Field>
          <Field id="property_type" label="Property type" error={form.formState.errors.property_type?.message} required>
            <Select id="property_type" {...form.register("property_type")}>
              <option value="sfr">Single-family</option>
              <option value="condo">Condo</option>
              <option value="townhouse">Townhouse</option>
              <option value="2_unit">2 unit</option>
              <option value="3_unit">3 unit</option>
              <option value="4_unit">4 unit</option>
            </Select>
          </Field>
          <Field id="occupancy_type" label="Occupancy" error={form.formState.errors.occupancy_type?.message} required>
            <Select id="occupancy_type" {...form.register("occupancy_type")}>
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="investment">Investment</option>
            </Select>
          </Field>
        </div>
        <StepActions isPending={isPending} />
      </form>
    </StepLayout>
  );
}

function PersonalInfoStep({
  applicationId,
  draft,
  completedSteps,
}: {
  applicationId: string;
  draft: BorrowerDraftApplication | null;
  completedSteps: number[];
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const setStepData = useApplicationStore((state) => state.setStepData);
  const stored = useApplicationStore((state) => state.stepData.step2);
  const defaults = useMemo(() => getStep2Defaults(draft, stored), [draft, stored]);
  const form = useForm<Step2Input>({
    resolver: zodResolver(step2Schema),
    defaultValues: defaults,
  });

  useEffect(() => {
    form.reset(defaults);
  }, [defaults, form]);

  return (
    <StepLayout
      currentStep={2}
      completedSteps={completedSteps}
      title="Personal info"
      description="Provide borrower identity details. SSN is encrypted before it is stored."
    >
      <form
        onSubmit={form.handleSubmit((values) => {
          setServerError(null);
          startTransition(async () => {
            const result = await saveLoanStep2(applicationId, values);

            if (result.error) {
              setServerError(result.error);
              return;
            }

            if (!result.data) {
              setServerError("The application could not be saved.");
              return;
            }

            setStepData("step2", values);
            router.push(result.data.nextPath);
          });
        })}
      >
        {serverError ? <Alert tone="error" message={serverError} /> : null}
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="ssn" label="SSN" error={form.formState.errors.ssn?.message} required>
            <Input id="ssn" placeholder="000-00-0000" {...form.register("ssn")} />
          </Field>
          <Field id="dob" label="Date of birth" error={form.formState.errors.dob?.message} required>
            <Input id="dob" type="date" {...form.register("dob")} />
          </Field>
          <Field id="marital_status" label="Marital status" error={form.formState.errors.marital_status?.message} required>
            <Select id="marital_status" {...form.register("marital_status")}>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="separated">Separated</option>
            </Select>
          </Field>
          <Field id="citizenship" label="Citizenship" error={form.formState.errors.citizenship?.message} required>
            <Select id="citizenship" {...form.register("citizenship")}>
              <option value="us_citizen">US citizen</option>
              <option value="permanent_resident">Permanent resident</option>
              <option value="non_permanent_resident">Non-permanent resident</option>
            </Select>
          </Field>
          <Field id="dependents_count" label="Dependents" error={form.formState.errors.dependents_count?.message} required>
            <Input id="dependents_count" type="number" min={0} {...form.register("dependents_count", { valueAsNumber: true })} />
          </Field>
        </div>
        <StepActions previousHref="/borrower/apply/1" isPending={isPending} />
      </form>
    </StepLayout>
  );
}

function AddressStep({
  applicationId,
  draft,
  completedSteps,
}: {
  applicationId: string;
  draft: BorrowerDraftApplication | null;
  completedSteps: number[];
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const setStepData = useApplicationStore((state) => state.setStepData);
  const stored = useApplicationStore((state) => state.stepData.step3);
  const defaults = useMemo(() => getStep3Defaults(draft, stored), [draft, stored]);
  const form = useForm<Step3Input>({
    resolver: zodResolver(step3Schema),
    defaultValues: defaults,
  });

  useEffect(() => {
    form.reset(defaults);
  }, [defaults, form]);

  return (
    <StepLayout
      currentStep={3}
      completedSteps={completedSteps}
      title="Current address"
      description="Capture occupancy details used later in the debt-to-income preview."
    >
      <form
        onSubmit={form.handleSubmit((values) => {
          setServerError(null);
          startTransition(async () => {
            const result = await saveLoanStep3(applicationId, values);

            if (result.error) {
              setServerError(result.error);
              return;
            }

            if (!result.data) {
              setServerError("The application could not be saved.");
              return;
            }

            setStepData("step3", values);
            router.push(result.data.nextPath);
          });
        })}
      >
        {serverError ? <Alert tone="error" message={serverError} /> : null}
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="current_street" label="Street" error={form.formState.errors.current_street?.message} required>
            <Input id="current_street" {...form.register("current_street")} />
          </Field>
          <Field id="current_city" label="City" error={form.formState.errors.current_city?.message} required>
            <Input id="current_city" {...form.register("current_city")} />
          </Field>
          <Field id="current_state" label="State" error={form.formState.errors.current_state?.message} required>
            <Input id="current_state" maxLength={2} {...form.register("current_state")} />
          </Field>
          <Field id="current_zip" label="ZIP" error={form.formState.errors.current_zip?.message} required>
            <Input id="current_zip" maxLength={5} {...form.register("current_zip")} />
          </Field>
          <Field id="current_county" label="County" error={form.formState.errors.current_county?.message}>
            <Input id="current_county" {...form.register("current_county")} />
          </Field>
          <Field id="housing_status" label="Housing status" error={form.formState.errors.housing_status?.message} required>
            <Select id="housing_status" {...form.register("housing_status")}>
              <option value="own">Own</option>
              <option value="rent">Rent</option>
              <option value="living_with_family">Living with family</option>
            </Select>
          </Field>
          <Field id="years_at_address" label="Years at address" error={form.formState.errors.years_at_address?.message} required>
            <Input id="years_at_address" type="number" min={0} step="0.5" {...form.register("years_at_address", { valueAsNumber: true })} />
          </Field>
          <Field id="monthly_housing_payment" label="Estimated monthly housing payment" error={form.formState.errors.monthly_housing_payment?.message} required>
            <Input id="monthly_housing_payment" type="number" min={0} step="50" {...form.register("monthly_housing_payment", { valueAsNumber: true })} />
          </Field>
        </div>
        <StepActions previousHref="/borrower/apply/2" isPending={isPending} />
      </form>
    </StepLayout>
  );
}

function EmploymentStep({
  applicationId,
  draft,
  completedSteps,
}: {
  applicationId: string;
  draft: BorrowerDraftApplication | null;
  completedSteps: number[];
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const setStepData = useApplicationStore((state) => state.setStepData);
  const stored = useApplicationStore((state) => state.stepData.step4);
  const defaults = useMemo(() => getStep4Defaults(draft, stored), [draft, stored]);
  const form = useForm<Step4Input>({
    resolver: zodResolver(step4Schema),
    defaultValues: defaults,
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "employers" });
  const employers = useWatch({ control: form.control, name: "employers" });
  const totalIncome = (employers ?? []).reduce((sum, employer) => {
    return (
      sum +
      Number(employer?.base_monthly_income ?? 0) +
      Number(employer?.overtime_monthly ?? 0) +
      Number(employer?.bonus_monthly ?? 0) +
      Number(employer?.commission_monthly ?? 0) +
      Number(employer?.other_monthly ?? 0)
    );
  }, 0);

  useEffect(() => {
    form.reset(defaults);
  }, [defaults, form]);

  return (
    <StepLayout
      currentStep={4}
      completedSteps={completedSteps}
      title="Employment"
      description="Add all current income sources. The total monthly income updates as you type."
    >
      <form
        onSubmit={form.handleSubmit((values) => {
          setServerError(null);
          startTransition(async () => {
            const result = await saveLoanStep4(applicationId, values);

            if (result.error) {
              setServerError(result.error);
              return;
            }

            if (!result.data) {
              setServerError("The application could not be saved.");
              return;
            }

            setStepData("step4", values);
            router.push(result.data.nextPath);
          });
        })}
      >
        {serverError ? <Alert tone="error" message={serverError} /> : null}
        <div className="mb-6 rounded-2xl bg-primary-25 p-4">
          <p className="text-sm font-medium text-gray-600">Total monthly income</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{formatCurrency(totalIncome)}</p>
        </div>

        <div className="space-y-6">
          {fields.map((field, index) => (
            <div key={field.id} className="rounded-2xl border border-gray-200 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-gray-900">Employer {index + 1}</p>
                  <p className="text-sm text-gray-600">
                    Add the borrower&apos;s primary and any secondary income sources.
                  </p>
                </div>
                {fields.length > 1 ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 text-sm font-medium text-error-600"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Remove
                  </button>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field id={`employers.${index}.employer_name`} label="Employer name" error={form.formState.errors.employers?.[index]?.employer_name?.message} required>
                  <Input {...form.register(`employers.${index}.employer_name`)} />
                </Field>
                <Field id={`employers.${index}.employment_type`} label="Employment type" error={form.formState.errors.employers?.[index]?.employment_type?.message} required>
                  <Select {...form.register(`employers.${index}.employment_type`)}>
                    <option value="w2">W-2</option>
                    <option value="self_employed">Self-employed</option>
                    <option value="1099">1099</option>
                    <option value="retired">Retired</option>
                    <option value="other">Other</option>
                  </Select>
                </Field>
                <Field id={`employers.${index}.position`} label="Position" error={form.formState.errors.employers?.[index]?.position?.message}>
                  <Input {...form.register(`employers.${index}.position`)} />
                </Field>
                <Field id={`employers.${index}.employer_phone`} label="Phone" error={form.formState.errors.employers?.[index]?.employer_phone?.message}>
                  <Input {...form.register(`employers.${index}.employer_phone`)} />
                </Field>
                <Field id={`employers.${index}.start_date`} label="Start date" error={form.formState.errors.employers?.[index]?.start_date?.message}>
                  <Input type="date" {...form.register(`employers.${index}.start_date`)} />
                </Field>
                <Field id={`employers.${index}.end_date`} label="End date" error={form.formState.errors.employers?.[index]?.end_date?.message}>
                  <Input type="date" {...form.register(`employers.${index}.end_date`)} />
                </Field>
                <Field id={`employers.${index}.base_monthly_income`} label="Base monthly income" error={form.formState.errors.employers?.[index]?.base_monthly_income?.message} required>
                  <Input type="number" min={0} step="100" {...form.register(`employers.${index}.base_monthly_income`, { valueAsNumber: true })} />
                </Field>
                <Field id={`employers.${index}.overtime_monthly`} label="Overtime" error={form.formState.errors.employers?.[index]?.overtime_monthly?.message} required>
                  <Input type="number" min={0} step="100" {...form.register(`employers.${index}.overtime_monthly`, { valueAsNumber: true })} />
                </Field>
                <Field id={`employers.${index}.bonus_monthly`} label="Bonus" error={form.formState.errors.employers?.[index]?.bonus_monthly?.message} required>
                  <Input type="number" min={0} step="100" {...form.register(`employers.${index}.bonus_monthly`, { valueAsNumber: true })} />
                </Field>
                <Field id={`employers.${index}.commission_monthly`} label="Commission" error={form.formState.errors.employers?.[index]?.commission_monthly?.message} required>
                  <Input type="number" min={0} step="100" {...form.register(`employers.${index}.commission_monthly`, { valueAsNumber: true })} />
                </Field>
                <Field id={`employers.${index}.other_monthly`} label="Other income" error={form.formState.errors.employers?.[index]?.other_monthly?.message} required>
                  <Input type="number" min={0} step="100" {...form.register(`employers.${index}.other_monthly`, { valueAsNumber: true })} />
                </Field>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary-700"
          onClick={() =>
            append({
              employer_name: "",
              employer_phone: "",
              position: "",
              employment_type: "w2",
              start_date: "",
              end_date: "",
              is_current: true,
              is_primary: false,
              employer_street: "",
              employer_city: "",
              employer_state: "",
              employer_zip: "",
              base_monthly_income: 0,
              overtime_monthly: 0,
              bonus_monthly: 0,
              commission_monthly: 0,
              other_monthly: 0,
            })
          }
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add employer
        </button>
        <StepActions previousHref="/borrower/apply/3" isPending={isPending} />
      </form>
    </StepLayout>
  );
}

function AssetsStep({
  applicationId,
  draft,
  completedSteps,
}: {
  applicationId: string;
  draft: BorrowerDraftApplication | null;
  completedSteps: number[];
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const setStepData = useApplicationStore((state) => state.setStepData);
  const stored = useApplicationStore((state) => state.stepData.step5);
  const defaults = useMemo(() => getStep5Defaults(draft, stored), [draft, stored]);
  const form = useForm<Step5Input>({
    resolver: zodResolver(step5Schema),
    defaultValues: defaults,
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "assets" });

  useEffect(() => {
    form.reset(defaults);
  }, [defaults, form]);

  return (
    <StepLayout
      currentStep={5}
      completedSteps={completedSteps}
      title="Assets"
      description="Capture liquid funds, retirement accounts, and gift funds available for the loan."
    >
      <form
        onSubmit={form.handleSubmit((values) => {
          setServerError(null);
          startTransition(async () => {
            const result = await saveLoanStep5(applicationId, values);

            if (result.error) {
              setServerError(result.error);
              return;
            }

            if (!result.data) {
              setServerError("The application could not be saved.");
              return;
            }

            setStepData("step5", values);
            router.push(result.data.nextPath);
          });
        })}
      >
        {serverError ? <Alert tone="error" message={serverError} /> : null}
        <div className="space-y-6">
          {fields.map((field, index) => (
            <div key={field.id} className="rounded-2xl border border-gray-200 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-base font-semibold text-gray-900">Asset {index + 1}</p>
                {fields.length > 1 ? (
                  <button type="button" className="text-sm font-medium text-error-600" onClick={() => remove(index)}>
                    Remove
                  </button>
                ) : null}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field id={`assets.${index}.asset_type`} label="Asset type" error={form.formState.errors.assets?.[index]?.asset_type?.message} required>
                  <Select {...form.register(`assets.${index}.asset_type`)}>
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                    <option value="money_market">Money market</option>
                    <option value="cd">CD</option>
                    <option value="401k">401(k)</option>
                    <option value="ira">IRA</option>
                    <option value="stocks">Stocks</option>
                    <option value="bonds">Bonds</option>
                    <option value="real_estate">Real estate</option>
                    <option value="gift">Gift funds</option>
                    <option value="other">Other</option>
                  </Select>
                </Field>
                <Field id={`assets.${index}.institution_name`} label="Institution" error={form.formState.errors.assets?.[index]?.institution_name?.message}>
                  <Input {...form.register(`assets.${index}.institution_name`)} />
                </Field>
                <Field id={`assets.${index}.account_last4`} label="Account last 4" error={form.formState.errors.assets?.[index]?.account_last4?.message}>
                  <Input maxLength={4} {...form.register(`assets.${index}.account_last4`)} />
                </Field>
                <Field id={`assets.${index}.balance`} label="Balance" error={form.formState.errors.assets?.[index]?.balance?.message} required>
                  <Input type="number" min={0} step="100" {...form.register(`assets.${index}.balance`, { valueAsNumber: true })} />
                </Field>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input type="checkbox" {...form.register(`assets.${index}.is_gift`)} />
                  Mark as gift funds
                </label>
                <Field id={`assets.${index}.gift_source`} label="Gift source" error={form.formState.errors.assets?.[index]?.gift_source?.message}>
                  <Input {...form.register(`assets.${index}.gift_source`)} />
                </Field>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary-700"
          onClick={() =>
            append({
              asset_type: "checking",
              institution_name: "",
              account_last4: "",
              balance: 0,
              is_gift: false,
              gift_source: "",
            })
          }
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add asset
        </button>
        <StepActions previousHref="/borrower/apply/4" isPending={isPending} />
      </form>
    </StepLayout>
  );
}

function LiabilitiesStep({
  applicationId,
  draft,
  completedSteps,
}: {
  applicationId: string;
  draft: BorrowerDraftApplication | null;
  completedSteps: number[];
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const setStepData = useApplicationStore((state) => state.setStepData);
  const storedStep6 = useApplicationStore((state) => state.stepData.step6);
  const storedStep4 = useApplicationStore((state) => state.stepData.step4);
  const storedStep3 = useApplicationStore((state) => state.stepData.step3);
  const defaults = useMemo(() => getStep6Defaults(draft, storedStep6), [draft, storedStep6]);
  const form = useForm<Step6Input>({
    resolver: zodResolver(step6Schema),
    defaultValues: defaults,
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "liabilities" });
  const liabilities = useWatch({ control: form.control, name: "liabilities" }) ?? [];

  useEffect(() => {
    form.reset(defaults);
  }, [defaults, form]);

  const grossMonthlyIncome = useMemo(() => {
    const source = storedStep4?.employers?.length
      ? storedStep4.employers
      : draft?.employmentRecords ?? [];

    return source.reduce((sum, employer) => {
      return (
        sum +
        Number("base_monthly_income" in employer ? employer.base_monthly_income : 0) +
        Number("overtime_monthly" in employer ? employer.overtime_monthly : 0) +
        Number("bonus_monthly" in employer ? employer.bonus_monthly : 0) +
        Number("commission_monthly" in employer ? employer.commission_monthly : 0) +
        Number("other_monthly" in employer ? employer.other_monthly : 0)
      );
    }, 0);
  }, [draft?.employmentRecords, storedStep4]);

  const estimatedPiti =
    storedStep3?.monthly_housing_payment ??
    draft?.borrowerProfile?.monthly_housing_payment ??
    0;

  const debtLoad = liabilities.reduce((sum, liability) => {
    if (liability.exclude_from_dti || liability.to_be_paid_off) {
      return sum;
    }

    return sum + Number(liability.monthly_payment ?? 0);
  }, 0);

  const dti = grossMonthlyIncome > 0 ? (debtLoad + estimatedPiti) / grossMonthlyIncome : 0;
  const dtiTone =
    dti < 0.36 ? "text-success-700 bg-success-25" : dti <= 0.43 ? "text-warning-700 bg-warning-25" : "text-error-700 bg-error-25";

  return (
    <StepLayout
      currentStep={6}
      completedSteps={completedSteps}
      title="Liabilities"
      description="Mark debts that will be paid off at closing and review the live DTI preview before submitting."
    >
      <form
        onSubmit={form.handleSubmit((values) => {
          setServerError(null);
          startTransition(async () => {
            const result = await saveLoanStep6(applicationId, values);

            if (result.error) {
              setServerError(result.error);
              return;
            }

            if (!result.data) {
              setServerError("The application could not be saved.");
              return;
            }

            setStepData("step6", values);
            router.push(result.data.nextPath);
          });
        })}
      >
        {serverError ? <Alert tone="error" message={serverError} /> : null}
        <div className={cn("mb-6 rounded-2xl p-4", dtiTone)}>
          <p className="text-sm font-medium">Live DTI preview</p>
          <p className="mt-1 text-2xl font-semibold">{formatPercent(dti)}</p>
          <p className="mt-1 text-sm">
            ({formatCurrency(debtLoad + estimatedPiti)} monthly debts and housing / {formatCurrency(grossMonthlyIncome)} gross income)
          </p>
        </div>

        <div className="space-y-6">
          {fields.map((field, index) => (
            <div key={field.id} className="rounded-2xl border border-gray-200 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-base font-semibold text-gray-900">Liability {index + 1}</p>
                <button type="button" className="text-sm font-medium text-error-600" onClick={() => remove(index)}>
                  Remove
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field id={`liabilities.${index}.liability_type`} label="Liability type" error={form.formState.errors.liabilities?.[index]?.liability_type?.message} required>
                  <Select {...form.register(`liabilities.${index}.liability_type`)}>
                    <option value="mortgage">Mortgage</option>
                    <option value="auto">Auto</option>
                    <option value="student">Student loan</option>
                    <option value="credit_card">Credit card</option>
                    <option value="personal_loan">Personal loan</option>
                    <option value="child_support">Child support</option>
                    <option value="alimony">Alimony</option>
                    <option value="other">Other</option>
                  </Select>
                </Field>
                <Field id={`liabilities.${index}.creditor_name`} label="Creditor" error={form.formState.errors.liabilities?.[index]?.creditor_name?.message}>
                  <Input {...form.register(`liabilities.${index}.creditor_name`)} />
                </Field>
                <Field id={`liabilities.${index}.account_number_last4`} label="Account last 4" error={form.formState.errors.liabilities?.[index]?.account_number_last4?.message}>
                  <Input maxLength={4} {...form.register(`liabilities.${index}.account_number_last4`)} />
                </Field>
                <Field id={`liabilities.${index}.monthly_payment`} label="Monthly payment" error={form.formState.errors.liabilities?.[index]?.monthly_payment?.message} required>
                  <Input type="number" min={0} step="25" {...form.register(`liabilities.${index}.monthly_payment`, { valueAsNumber: true })} />
                </Field>
                <Field id={`liabilities.${index}.outstanding_balance`} label="Outstanding balance" error={form.formState.errors.liabilities?.[index]?.outstanding_balance?.message}>
                  <Input type="number" min={0} step="100" {...form.register(`liabilities.${index}.outstanding_balance`, { valueAsNumber: true })} />
                </Field>
                <Field id={`liabilities.${index}.months_remaining`} label="Months remaining" error={form.formState.errors.liabilities?.[index]?.months_remaining?.message}>
                  <Input type="number" min={0} {...form.register(`liabilities.${index}.months_remaining`, { valueAsNumber: true })} />
                </Field>
              </div>
              <div className="mt-4 flex flex-wrap gap-6">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input type="checkbox" {...form.register(`liabilities.${index}.to_be_paid_off`)} />
                  To be paid off at closing
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input type="checkbox" {...form.register(`liabilities.${index}.exclude_from_dti`)} />
                  Exclude from DTI
                </label>
              </div>
              <div className="mt-4">
                <Field id={`liabilities.${index}.exclude_reason`} label="Exclude reason" error={form.formState.errors.liabilities?.[index]?.exclude_reason?.message}>
                  <Input {...form.register(`liabilities.${index}.exclude_reason`)} />
                </Field>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary-700"
          onClick={() =>
            append({
              liability_type: "credit_card",
              creditor_name: "",
              account_number_last4: "",
              monthly_payment: 0,
              outstanding_balance: 0,
              months_remaining: 0,
              to_be_paid_off: false,
              exclude_from_dti: false,
              exclude_reason: "",
            })
          }
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add liability
        </button>
        <StepActions previousHref="/borrower/apply/5" isPending={isPending} />
      </form>
    </StepLayout>
  );
}

export function ApplicationStepForm({
  step,
  draft,
}: {
  step: number;
  draft: BorrowerDraftApplication | null;
}) {
  const applicationId = useApplicationStore((state) => state.applicationId);
  const setApplicationId = useApplicationStore((state) => state.setApplicationId);
  const stepData = useApplicationStore((state) => state.stepData);
  const hydratedApplicationId = applicationId ?? draft?.id ?? null;
  const completedSteps = useMemo(() => getCompletedSteps(draft, stepData), [draft, stepData]);

  useEffect(() => {
    if (draft?.id) {
      setApplicationId(draft.id);
    }
  }, [draft?.id, setApplicationId]);

  if (step === 1) {
    return <LoanDetailsStep applicationId={hydratedApplicationId} draft={draft} completedSteps={completedSteps} />;
  }

  if (!hydratedApplicationId) {
    return (
      <Alert
        tone="info"
        message="Start with step 1 so we can create your application before collecting the rest of the file."
      />
    );
  }

  switch (step) {
    case 2:
      return <PersonalInfoStep applicationId={hydratedApplicationId} draft={draft} completedSteps={completedSteps} />;
    case 3:
      return <AddressStep applicationId={hydratedApplicationId} draft={draft} completedSteps={completedSteps} />;
    case 4:
      return <EmploymentStep applicationId={hydratedApplicationId} draft={draft} completedSteps={completedSteps} />;
    case 5:
      return <AssetsStep applicationId={hydratedApplicationId} draft={draft} completedSteps={completedSteps} />;
    case 6:
      return <LiabilitiesStep applicationId={hydratedApplicationId} draft={draft} completedSteps={completedSteps} />;
    default:
      return null;
  }
}
