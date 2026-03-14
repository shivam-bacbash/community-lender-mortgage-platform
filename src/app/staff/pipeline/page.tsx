import { KanbanBoard } from "@/components/pipeline/KanbanBoard";
import { PageHeader } from "@/components/shared/page-header";
import { getStaffPipelineData } from "@/lib/staff/queries";

export default async function StaffPipelinePage() {
  const data = await getStaffPipelineData();

  return (
    <main id="main-content" className="space-y-6">
      <PageHeader
        breadcrumbs={["Staff", "Pipeline"]}
        title="Live pipeline"
        subtitle="Move files across stages, triage SLA risk, and drill into full loan review."
      />
      <KanbanBoard
        initialData={{
          organizationId: data.organizationId,
          profileId: data.profileId,
          stages: data.stages,
          loans: data.loans,
          staffOptions: data.staffOptions,
        }}
      />
    </main>
  );
}
