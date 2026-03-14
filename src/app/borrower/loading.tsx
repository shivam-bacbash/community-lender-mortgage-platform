import { Skeleton } from "@/components/ui/skeleton";

export default function BorrowerLoading() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10 sm:px-10 lg:px-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </main>
  );
}
