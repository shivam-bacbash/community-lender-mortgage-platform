import { StaffMessageThread } from "@/components/loan/staff-message-thread";
import { getStaffLoanWorkspace } from "@/lib/staff/queries";

export default async function StaffLoanMessagesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workspace = await getStaffLoanWorkspace(id);

  return <StaffMessageThread workspace={workspace} />;
}
