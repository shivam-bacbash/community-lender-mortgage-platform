"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { saveLoanProduct } from "@/lib/actions/pricing";
import type { PricingProduct } from "@/types/pricing";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type DraftProduct = {
  id?: string;
  name: string;
  loan_type: string;
  term_months: string;
  amortization_type: string;
  description: string;
  is_active: boolean;
  display_order: string;
  guidelines_json: string;
};

function toDraft(product: PricingProduct): DraftProduct {
  return {
    id: product.id,
    name: product.name,
    loan_type: product.loan_type,
    term_months: String(product.term_months),
    amortization_type: product.amortization_type,
    description: product.description ?? "",
    is_active: product.is_active,
    display_order: String(product.display_order ?? 0),
    guidelines_json: JSON.stringify(product.guidelines, null, 2),
  };
}

export function LoanProductsManager({ products }: { products: PricingProduct[] }) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Record<string, DraftProduct>>(
    Object.fromEntries(products.map((product) => [product.id, toDraft(product)])),
  );
  const [newProduct, setNewProduct] = useState<DraftProduct>({
    name: "",
    loan_type: "conventional",
    term_months: "360",
    amortization_type: "fixed",
    description: "",
    is_active: true,
    display_order: "100",
    guidelines_json: "{\n  \"min_credit_score\": 620\n}",
  });
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateDraft(id: string, field: keyof DraftProduct, value: string | boolean) {
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...current[id],
        [field]: value,
      },
    }));
  }

  function persistDraft(draft: DraftProduct) {
    setServerError(null);
    setServerSuccess(null);
    startTransition(async () => {
      const result = await saveLoanProduct({
        id: draft.id,
        name: draft.name,
        loan_type: draft.loan_type as never,
        term_months: Number(draft.term_months),
        amortization_type: draft.amortization_type as never,
        description: draft.description || undefined,
        is_active: draft.is_active,
        display_order: Number(draft.display_order),
        guidelines_json: draft.guidelines_json,
      });

      if (result.error) {
        setServerError(result.error);
        return;
      }

      setServerSuccess("Product saved.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {serverError ? <Alert tone="error" message={serverError} /> : null}
      {serverSuccess ? <Alert tone="success" message={serverSuccess} /> : null}

      <div className="space-y-4">
        {products.map((product) => {
          const draft = drafts[product.id];
          return (
            <Card key={product.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Input value={draft.name} onChange={(event) => updateDraft(product.id, "name", event.target.value)} />
                    <Select value={draft.loan_type} onChange={(event) => updateDraft(product.id, "loan_type", event.target.value)}>
                      <option value="conventional">Conventional</option>
                      <option value="fha">FHA</option>
                      <option value="va">VA</option>
                      <option value="usda">USDA</option>
                      <option value="jumbo">Jumbo</option>
                    </Select>
                    <Input type="number" value={draft.term_months} onChange={(event) => updateDraft(product.id, "term_months", event.target.value)} />
                    <Select value={draft.amortization_type} onChange={(event) => updateDraft(product.id, "amortization_type", event.target.value)}>
                      <option value="fixed">Fixed</option>
                      <option value="arm">ARM</option>
                    </Select>
                  </div>
                  <Textarea value={draft.guidelines_json} onChange={(event) => updateDraft(product.id, "guidelines_json", event.target.value)} />
                  <div className="grid gap-4 md:grid-cols-[1fr_120px_auto]">
                    <Input value={draft.description} onChange={(event) => updateDraft(product.id, "description", event.target.value)} placeholder="Description" />
                    <Input type="number" value={draft.display_order} onChange={(event) => updateDraft(product.id, "display_order", event.target.value)} placeholder="Order" />
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox" checked={draft.is_active} onChange={(event) => updateDraft(product.id, "is_active", event.target.checked)} />
                      Active
                    </label>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <Button loading={isPending} onClick={() => persistDraft(draft)}>
                    Save
                  </Button>
                  <Link href={`/admin/settings/products/${product.id}`} className="text-sm font-semibold text-primary-700">
                    Details
                  </Link>
                  <Link href={`/admin/settings/products/${product.id}/rates`} className="text-sm font-semibold text-primary-700">
                    Rates
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-5">
        <h2 className="text-lg font-semibold text-gray-900">Add product</h2>
        <div className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Input value={newProduct.name} onChange={(event) => setNewProduct((current) => ({ ...current, name: event.target.value }))} placeholder="Product name" />
            <Select value={newProduct.loan_type} onChange={(event) => setNewProduct((current) => ({ ...current, loan_type: event.target.value }))}>
              <option value="conventional">Conventional</option>
              <option value="fha">FHA</option>
              <option value="va">VA</option>
              <option value="usda">USDA</option>
              <option value="jumbo">Jumbo</option>
            </Select>
            <Input type="number" value={newProduct.term_months} onChange={(event) => setNewProduct((current) => ({ ...current, term_months: event.target.value }))} placeholder="Term months" />
            <Select value={newProduct.amortization_type} onChange={(event) => setNewProduct((current) => ({ ...current, amortization_type: event.target.value }))}>
              <option value="fixed">Fixed</option>
              <option value="arm">ARM</option>
            </Select>
          </div>
          <Textarea value={newProduct.guidelines_json} onChange={(event) => setNewProduct((current) => ({ ...current, guidelines_json: event.target.value }))} />
          <div className="grid gap-4 md:grid-cols-[1fr_120px_auto]">
            <Input value={newProduct.description} onChange={(event) => setNewProduct((current) => ({ ...current, description: event.target.value }))} placeholder="Description" />
            <Input type="number" value={newProduct.display_order} onChange={(event) => setNewProduct((current) => ({ ...current, display_order: event.target.value }))} placeholder="Order" />
            <Button
              loading={isPending}
              onClick={() =>
                persistDraft(newProduct)
              }
            >
              Add product
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
