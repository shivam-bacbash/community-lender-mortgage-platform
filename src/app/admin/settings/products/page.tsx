import { LoanProductsManager } from "@/components/admin/loan-products-manager";
import { PageHeader } from "@/components/shared/page-header";
import { getAdminProductsList } from "@/lib/pricing/queries";

export default async function AdminProductsPage() {
  const { products } = await getAdminProductsList();

  return (
    <main id="main-content" className="space-y-6">
      <PageHeader
        breadcrumbs={["Admin", "Settings", "Products"]}
        title="Loan products"
        subtitle="Manage product definitions, guidelines, and links to daily rate sheets."
      />
      <LoanProductsManager products={products} />
    </main>
  );
}
