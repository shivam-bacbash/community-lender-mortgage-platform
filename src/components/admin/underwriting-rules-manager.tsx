"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { saveUnderwritingRule } from "@/lib/actions/underwriting";
import { UNDERWRITING_LOAN_TYPES } from "@/lib/underwriting/constants";
import type { UnderwritingRuleRecord } from "@/types/admin";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type DraftRule = {
  id?: string;
  loan_type: string;
  rule_name: string;
  min: string;
  max: string;
  is_active: boolean;
  priority: string;
  description: string;
};

function toDraft(rule: UnderwritingRuleRecord): DraftRule {
  return {
    id: rule.id,
    loan_type: rule.loan_type,
    rule_name: rule.rule_name,
    min: rule.rule_config.min !== undefined ? String(rule.rule_config.min) : "",
    max: rule.rule_config.max !== undefined ? String(rule.rule_config.max) : "",
    is_active: rule.is_active,
    priority: String(rule.priority),
    description: rule.description ?? "",
  };
}

export function UnderwritingRulesManager({ rules }: { rules: UnderwritingRuleRecord[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("conventional");
  const [drafts, setDrafts] = useState<Record<string, DraftRule>>(
    Object.fromEntries(rules.map((rule) => [rule.id, toDraft(rule)])),
  );
  const [newRule, setNewRule] = useState<DraftRule>({
    loan_type: "conventional",
    rule_name: "",
    min: "",
    max: "",
    is_active: true,
    priority: "100",
    description: "",
  });
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const visibleRules = rules.filter((rule) => rule.loan_type === activeTab);

  function updateDraft(id: string, field: keyof DraftRule, value: string | boolean) {
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...current[id],
        [field]: value,
      },
    }));
  }

  function saveRule(draft: DraftRule) {
    setServerError(null);
    setServerMessage(null);

    startTransition(async () => {
      const result = await saveUnderwritingRule({
        id: draft.id,
        loan_type: draft.loan_type as never,
        rule_name: draft.rule_name,
        min: draft.min ? Number(draft.min) : undefined,
        max: draft.max ? Number(draft.max) : undefined,
        is_active: draft.is_active,
        priority: draft.priority ? Number(draft.priority) : 100,
        description: draft.description || undefined,
      });

      if (result.error) {
        setServerError(result.error);
        return;
      }

      setServerMessage("Rule saved.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {UNDERWRITING_LOAN_TYPES.map((loanType) => (
          <button
            key={loanType}
            type="button"
            onClick={() => {
              setActiveTab(loanType);
              setNewRule((current) => ({ ...current, loan_type: loanType }));
            }}
            className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
              activeTab === loanType
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {loanType}
          </button>
        ))}
      </div>

      {serverError ? <Alert tone="error" message={serverError} /> : null}
      {serverMessage ? <Alert tone="success" message={serverMessage} /> : null}

      <div className="space-y-4">
        {visibleRules.map((rule) => {
          const draft = drafts[rule.id];
          return (
            <Card key={rule.id} className="p-5">
              <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.7fr_auto]">
                <div className="space-y-2">
                  <Input
                    value={draft.rule_name}
                    onChange={(event) => updateDraft(rule.id, "rule_name", event.target.value)}
                    placeholder="Rule name"
                  />
                  <Input
                    value={draft.description}
                    onChange={(event) => updateDraft(rule.id, "description", event.target.value)}
                    placeholder="Description"
                  />
                </div>
                <Input
                  type="number"
                  value={draft.min}
                  onChange={(event) => updateDraft(rule.id, "min", event.target.value)}
                  placeholder="Min"
                />
                <Input
                  type="number"
                  value={draft.max}
                  onChange={(event) => updateDraft(rule.id, "max", event.target.value)}
                  placeholder="Max"
                />
                <div className="space-y-2">
                  <Input
                    type="number"
                    value={draft.priority}
                    onChange={(event) => updateDraft(rule.id, "priority", event.target.value)}
                    placeholder="Priority"
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={draft.is_active}
                      onChange={(event) => updateDraft(rule.id, "is_active", event.target.checked)}
                    />
                    Active
                  </label>
                </div>
                <div className="flex items-start justify-end">
                  <Button loading={isPending} onClick={() => saveRule(draft)}>
                    Save
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-5">
        <h2 className="text-lg font-semibold text-gray-900">Add custom rule</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.7fr_auto]">
          <div className="space-y-2">
            <Input
              value={newRule.rule_name}
              onChange={(event) => setNewRule((current) => ({ ...current, rule_name: event.target.value }))}
              placeholder="Rule name, e.g. max_cltv"
            />
            <Input
              value={newRule.description}
              onChange={(event) => setNewRule((current) => ({ ...current, description: event.target.value }))}
              placeholder="Description"
            />
          </div>
          <Input
            type="number"
            value={newRule.min}
            onChange={(event) => setNewRule((current) => ({ ...current, min: event.target.value }))}
            placeholder="Min"
          />
          <Input
            type="number"
            value={newRule.max}
            onChange={(event) => setNewRule((current) => ({ ...current, max: event.target.value }))}
            placeholder="Max"
          />
          <Input
            type="number"
            value={newRule.priority}
            onChange={(event) => setNewRule((current) => ({ ...current, priority: event.target.value }))}
            placeholder="Priority"
          />
          <div className="flex items-start justify-end">
            <Button
              loading={isPending}
              onClick={() => {
                saveRule(newRule);
                setNewRule({
                  loan_type: activeTab,
                  rule_name: "",
                  min: "",
                  max: "",
                  is_active: true,
                  priority: "100",
                  description: "",
                });
              }}
            >
              Add rule
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
