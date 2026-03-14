import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { RateMatrixEditor } from "@/components/admin/rate-matrix-editor";
import { getAdminProductDetail } from "@/lib/pricing/queries";

export default async function AdminProductRootDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const { product, rateSheets } = await getAdminProductDetail(productId);
  const activeSheet = rateSheets.find((sheet) => sheet.is_active) ?? rateSheets[0] ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={["Admin", "Products", product.name]}
        title={product.name}
        subtitle="Product configuration, guidelines, and active rate-sheet matrix."
      />

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900">Configuration</h2>
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
          <p className="mt-4 text-sm text-gray-600">{product.description ?? "No description provided."}</p>
          <pre className="mt-6 overflow-x-auto rounded-2xl bg-gray-950 p-4 text-xs text-gray-100">
            {JSON.stringify(product.guidelines, null, 2)}
          </pre>
        </Card>
        <RateMatrixEditor productId={product.id} rateSheet={activeSheet} />
      </div>
    </div>
  );
}
