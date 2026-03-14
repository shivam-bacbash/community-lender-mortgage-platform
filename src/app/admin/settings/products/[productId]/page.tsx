import Link from "next/link";

import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { getAdminProductDetail } from "@/lib/pricing/queries";

export default async function AdminProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const { product, rateSheets } = await getAdminProductDetail(productId);
  const activeSheet = rateSheets.find((sheet) => sheet.is_active) ?? rateSheets[0] ?? null;

  return (
    <main id="main-content" className="space-y-6">
      <PageHeader
        breadcrumbs={["Admin", "Settings", "Products", product.name]}
        title={product.name}
        subtitle="Product detail, guidelines, and current rate-sheet metadata."
        actions={
          <Link href={`/admin/settings/products/${product.id}/rates`} className="text-sm font-semibold text-primary-700">
            Edit matrix
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900">Product details</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-start justify-between gap-4">
              <dt className="text-gray-500">Loan type</dt>
              <dd className="font-medium text-gray-900">{product.loan_type}</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-gray-500">Term</dt>
              <dd className="font-medium text-gray-900">{product.term_months / 12} years</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-gray-500">Amortization</dt>
              <dd className="font-medium text-gray-900">{product.amortization_type}</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-gray-500">Status</dt>
              <dd className="font-medium text-gray-900">{product.is_active ? "Active" : "Inactive"}</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-gray-600">{product.description ?? "No product description yet."}</p>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900">Rate sheet summary</h2>
          {activeSheet ? (
            <div className="mt-4 space-y-3 text-sm">
              <p className="text-gray-700">Effective date: <span className="font-semibold text-gray-900">{activeSheet.effective_date}</span></p>
              <p className="text-gray-700">Expiry date: <span className="font-semibold text-gray-900">{activeSheet.expiry_date ?? "Open-ended"}</span></p>
              <p className="text-gray-700">Margin: <span className="font-semibold text-gray-900">{activeSheet.margin ?? 0}</span></p>
              <p className="text-gray-700">Matrix entries: <span className="font-semibold text-gray-900">{Object.keys((activeSheet.rate_data as Record<string, unknown>) ?? {}).length}</span></p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-600">No rate sheet exists yet for this product.</p>
          )}
          <div className="mt-6">
            <Link href={`/admin/settings/products/${product.id}/rates`} className="text-sm font-semibold text-primary-700">
              Open rate matrix editor
            </Link>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900">Guidelines JSON</h2>
        <pre className="mt-4 overflow-x-auto rounded-2xl bg-gray-950 p-4 text-xs text-gray-100">
          {JSON.stringify(product.guidelines, null, 2)}
        </pre>
      </Card>
    </main>
  );
}
