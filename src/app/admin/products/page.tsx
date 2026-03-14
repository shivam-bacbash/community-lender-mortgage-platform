import { LoanProductsManager } from "@/components/admin/loan-products-manager";
import { PageHeader } from "@/components/shared/page-header";
import { getAdminProductsList } from "@/lib/pricing/queries";

export default async function AdminProductsRootPage() {
  const { products } = await getAdminProductsList();

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={["Admin", "Products"]}
        title="Loan products"
        subtitle="Manage product configuration and daily rate-sheet coverage."
      />
      <LoanProductsManager products={products} />
    </div>
  );
}
