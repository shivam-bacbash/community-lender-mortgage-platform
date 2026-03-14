import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils/format";
import type { StaffActivityItem } from "@/types/staff";

export function ActivityFeed({ items }: { items: StaffActivityItem[] }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900">Recent activity</h2>
        <span className="text-sm text-gray-500">{items.length} items</span>
      </div>
      <div className="mt-5 space-y-4">
        {items.length ? (
          items.map((item) => (
            <div key={item.id} className="rounded-xl bg-gray-25 px-4 py-3">
              <p className="text-sm font-medium text-gray-900">{item.action.replaceAll(".", " ")}</p>
              <p className="mt-1 text-sm text-gray-600">
                {item.actor_name} • {item.resource_type.replaceAll("_", " ")}
              </p>
              <p className="mt-1 text-xs text-gray-500">{formatDate(item.created_at, "MMM d, yyyy h:mm a")}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-600">No recent activity yet.</p>
        )}
      </div>
    </Card>
  );
}
