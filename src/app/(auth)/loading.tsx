import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AuthLoading() {
  return (
    <Card className="w-full max-w-md p-8">
      <Skeleton className="h-5 w-28" />
      <Skeleton className="mt-6 h-10 w-3/4" />
      <Skeleton className="mt-3 h-4 w-full" />
      <div className="mt-8 space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    </Card>
  );
}
