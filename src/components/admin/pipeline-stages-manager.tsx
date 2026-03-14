"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import { deletePipelineStage, reorderStages, savePipelineStage } from "@/lib/actions/admin";
import type { AdminPipelineStageRecord } from "@/types/admin";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

function SortableStageRow({
  stage,
  onChange,
  onSave,
  onDelete,
  disabled,
}: {
  stage: AdminPipelineStageRecord;
  onChange: (stageId: string, field: keyof AdminPipelineStageRecord, value: string | number | boolean | null) => void;
  onSave: (stage: AdminPipelineStageRecord) => void;
  onDelete: (stageId: string) => void;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: stage.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="p-5">
      <div className="flex items-start gap-4">
        <button
          type="button"
          className="mt-2 rounded-lg border border-gray-200 p-2 text-gray-500"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" aria-hidden="true" />
        </button>
        <div className="flex-1 space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Input value={stage.name} onChange={(event) => onChange(stage.id, "name", event.target.value)} />
            <Input value={stage.color} onChange={(event) => onChange(stage.id, "color", event.target.value)} />
            <Input
              type="number"
              value={stage.sla_days ?? ""}
              onChange={(event) => onChange(stage.id, "sla_days", event.target.value ? Number(event.target.value) : null)}
              placeholder="SLA days"
            />
            <Select
              value={stage.terminal_outcome ?? ""}
              onChange={(event) => onChange(stage.id, "terminal_outcome", event.target.value || null)}
              disabled={!stage.is_terminal}
            >
              <option value="">No terminal outcome</option>
              <option value="funded">Funded</option>
              <option value="denied">Denied</option>
              <option value="withdrawn">Withdrawn</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </div>
          <Textarea value={stage.description ?? ""} onChange={(event) => onChange(stage.id, "description", event.target.value)} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={stage.is_terminal}
                onChange={(event) => onChange(stage.id, "is_terminal", event.target.checked)}
              />
              Terminal stage
            </label>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" loading={disabled} onClick={() => onSave(stage)}>
                Save
              </Button>
              <Button
                variant="destructive"
                size="sm"
                loading={disabled}
                disabled={disabled || stage.active_loan_count > 0}
                onClick={() => onDelete(stage.id)}
              >
                Delete
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-500">{stage.active_loan_count} active loans in this stage.</p>
        </div>
      </div>
      </Card>
    </div>
  );
}

export function PipelineStagesManager({ stages }: { stages: AdminPipelineStageRecord[] }) {
  const router = useRouter();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [items, setItems] = useState(stages);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setItems(stages);
  }, [stages]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
      ...item,
      order_index: index + 1,
    }));
    setItems(reordered);

    startTransition(async () => {
      setFeedback(null);
      setError(null);
      const result = await reorderStages(reordered.map((item) => item.id));
      if (result.error) {
        setError(result.error);
        return;
      }
      setFeedback("Stages reordered.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {feedback ? <Alert tone="success" message={feedback} /> : null}
      {error ? <Alert tone="error" message={error} /> : null}

      <Button
        variant="secondary"
        onClick={() =>
          setItems((current) => [
            ...current,
            {
              id: `draft-${current.length + 1}`,
              organization_id: current[0]?.organization_id ?? "",
              name: "New stage",
              color: "#3B82F6",
              description: "",
              order_index: current.length + 1,
              sla_days: null,
              is_terminal: false,
              terminal_outcome: null,
              active_loan_count: 0,
            },
          ])
        }
      >
        Add stage
      </Button>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {items.map((stage) => (
              <SortableStageRow
                key={stage.id}
                stage={stage}
                disabled={isPending}
                onChange={(stageId, field, value) =>
                  setItems((current) =>
                    current.map((item) =>
                      item.id === stageId ? { ...item, [field]: value } : item,
                    ),
                  )
                }
                onSave={(stage) =>
                  startTransition(async () => {
                    setFeedback(null);
                    setError(null);
                    const result = await savePipelineStage({
                      id: stage.id.startsWith("draft-") ? undefined : stage.id,
                      name: stage.name,
                      color: stage.color,
                      description: stage.description ?? undefined,
                      sla_days: stage.sla_days ?? undefined,
                      is_terminal: stage.is_terminal,
                      terminal_outcome: stage.terminal_outcome ?? undefined,
                    });
                    if (result.error) {
                      setError(result.error);
                      return;
                    }
                    setFeedback("Stage saved.");
                    router.refresh();
                  })
                }
                onDelete={(stageId) =>
                  startTransition(async () => {
                    setFeedback(null);
                    setError(null);
                    if (stageId.startsWith("draft-")) {
                      setItems((current) => current.filter((item) => item.id !== stageId));
                      return;
                    }
                    const result = await deletePipelineStage(stageId);
                    if (result.error) {
                      setError(result.error);
                      return;
                    }
                    setFeedback("Stage deleted.");
                    setItems((current) => current.filter((item) => item.id !== stageId));
                    router.refresh();
                  })
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
