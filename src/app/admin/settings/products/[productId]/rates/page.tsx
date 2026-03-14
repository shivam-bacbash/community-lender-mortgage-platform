import { RateMatrixEditor } from "@/components/admin/rate-matrix-editor";
import { PageHeader } from "@/components/shared/page-header";
import { getAdminProductDetail } from "@/lib/pricing/queries";

export default async function AdminProductRatesPage({
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
        breadcrumbs={["Admin", "Settings", "Products", product.name, "Rates"]}
        title={`${product.name} rate matrix`}
        subtitle="Edit the active LTV × FICO pricing grid and sheet metadata."
      />
      <RateMatrixEditor productId={product.id} rateSheet={activeSheet} />
    </main>
  );
}
