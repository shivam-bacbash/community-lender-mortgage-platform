import { PipelineStagesManager } from "@/components/admin/pipeline-stages-manager";
import { PageHeader } from "@/components/shared/page-header";
import { getAdminPipelineStages } from "@/lib/admin/queries";

export default async function AdminPipelinePage() {
  const { stages } = await getAdminPipelineStages();

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={["Admin", "Pipeline"]}
        title="Pipeline stages"
        subtitle="Reorder stages, edit SLAs, and control terminal outcomes for the pipeline board."
      />
      <PipelineStagesManager stages={stages} />
    </div>
  );
}
