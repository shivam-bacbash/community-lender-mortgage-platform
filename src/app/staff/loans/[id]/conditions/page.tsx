import { ConditionList } from "@/components/loan/condition-list";
import { getStaffLoanWorkspace } from "@/lib/staff/queries";

export default async function StaffLoanConditionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workspace = await getStaffLoanWorkspace(id);

  return <ConditionList workspace={workspace} />;
}
