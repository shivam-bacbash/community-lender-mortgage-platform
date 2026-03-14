"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { saveOrganizationSettings } from "@/lib/actions/admin";
import type { AdminOrganizationSettings } from "@/types/admin";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function OrganizationSettingsForm({ organization }: { organization: AdminOrganizationSettings }) {
  const router = useRouter();
  const [draft, setDraft] = useState({
    name: organization.name,
    slug: organization.slug,
    plan: organization.plan,
    primary_color: organization.brand_colors?.primary ?? "#0F766E",
    secondary_color: organization.brand_colors?.secondary ?? "#111827",
    accent_color: organization.brand_colors?.accent ?? "#F59E0B",
    nmls_id: organization.settings?.nmls_id ?? "",
    default_assignment_mode: organization.settings?.default_assignment_mode ?? "manual",
    ai_prequalification: Boolean(organization.settings?.feature_flags?.ai_prequalification),
    sms_notifications: Boolean(organization.settings?.feature_flags?.sms_notifications),
    secondary_market: Boolean(organization.settings?.feature_flags?.secondary_market),
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const previewStyle = useMemo(
    () => ({
      background: `linear-gradient(135deg, ${draft.primary_color}, ${draft.secondary_color})`,
      borderColor: draft.accent_color,
    }),
    [draft.accent_color, draft.primary_color, draft.secondary_color],
  );

  return (
    <div className="space-y-6">
      {feedback ? <Alert tone="success" message={feedback} /> : null}
      {error ? <Alert tone="error" message={error} /> : null}

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900">Organization settings</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Organization name" />
          <Input value={draft.slug} onChange={(event) => setDraft((current) => ({ ...current, slug: event.target.value }))} placeholder="Slug" />
          <Select value={draft.plan} onChange={(event) => setDraft((current) => ({ ...current, plan: event.target.value }))}>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </Select>
          <Input value={draft.nmls_id} onChange={(event) => setDraft((current) => ({ ...current, nmls_id: event.target.value }))} placeholder="NMLS ID" />
          <Select
            value={draft.default_assignment_mode}
            onChange={(event) => setDraft((current) => ({ ...current, default_assignment_mode: event.target.value as "round_robin" | "manual" }))}
          >
            <option value="manual">Manual assignment</option>
            <option value="round_robin">Round robin</option>
          </Select>
          <Input type="file" accept="image/*" onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)} />
          <Input type="color" value={draft.primary_color} onChange={(event) => setDraft((current) => ({ ...current, primary_color: event.target.value }))} />
          <Input type="color" value={draft.secondary_color} onChange={(event) => setDraft((current) => ({ ...current, secondary_color: event.target.value }))} />
          <Input type="color" value={draft.accent_color} onChange={(event) => setDraft((current) => ({ ...current, accent_color: event.target.value }))} />
        </div>

        <div className="mt-5 flex flex-wrap gap-4">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={draft.ai_prequalification}
              onChange={(event) => setDraft((current) => ({ ...current, ai_prequalification: event.target.checked }))}
            />
            AI prequalification
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={draft.sms_notifications}
              onChange={(event) => setDraft((current) => ({ ...current, sms_notifications: event.target.checked }))}
            />
            SMS notifications
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={draft.secondary_market}
              onChange={(event) => setDraft((current) => ({ ...current, secondary_market: event.target.checked }))}
            />
            Secondary market
          </label>
        </div>

        <div className="mt-5 rounded-2xl border p-6 text-white" style={previewStyle}>
          <p className="text-xs uppercase tracking-[0.16em] opacity-80">Brand preview</p>
          <p className="mt-2 text-2xl font-semibold">{draft.name}</p>
          <p className="mt-1 text-sm opacity-90">Plan: {draft.plan} • Assignment: {draft.default_assignment_mode.replaceAll("_", " ")}</p>
        </div>

        <div className="mt-5 flex justify-end">
          <Button
            loading={isPending}
            onClick={() =>
              startTransition(async () => {
                setFeedback(null);
                setError(null);
                const result = await saveOrganizationSettings(
                  {
                    ...draft,
                    plan: draft.plan as "starter" | "pro" | "enterprise",
                  },
                  logoFile,
                );
                if (result.error) {
                  setError(result.error);
                  return;
                }
                setFeedback("Organization settings saved.");
                router.refresh();
              })
            }
          >
            Save settings
          </Button>
        </div>
      </Card>
    </div>
  );
}
