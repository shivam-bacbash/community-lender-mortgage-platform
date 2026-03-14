import { TaskList } from "@/components/tasks/task-list";
import { getStaffLoanWorkspace } from "@/lib/staff/queries";

export default async function StaffLoanTasksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workspace = await getStaffLoanWorkspace(id);

  return <TaskList workspace={workspace} />;
}
