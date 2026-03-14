import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";

import { DocumentRow } from "@/components/documents/DocumentRow";

type DocumentGridItem = {
  id: string;
  title: string;
  documentType: string;
  category: string | null;
  createdAt: string;
  status: string;
  subtitle?: string | null;
  version?: number | null;
  expiresAt?: string | null;
  previewUrl?: string | null;
  detailHref?: string | null;
  extractionConfidence?: number | null;
  actions?: ReactNode;
};

export function DocumentGrid({
  documents,
  emptyMessage,
}: {
  documents: DocumentGridItem[];
  emptyMessage: string;
}) {
  if (!documents.length) {
    return (
      <Card className="p-6">
        <p className="text-sm text-gray-600">{emptyMessage}</p>
      </Card>
    );
  }

  const grouped = documents.reduce<Map<string, DocumentGridItem[]>>((accumulator, document) => {
    const key = document.category ?? "other";
    const bucket = accumulator.get(key) ?? [];
    bucket.push(document);
    accumulator.set(key, bucket);
    return accumulator;
  }, new Map());

  return (
    <div className="space-y-6">
      {Array.from(grouped.entries()).map(([category, items]) => (
        <section key={category} className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold capitalize text-gray-900">{category}</h2>
            <p className="text-sm text-gray-500">Latest documents grouped by category.</p>
          </div>
          <div className="space-y-3">
            {items.map((document) => (
              <DocumentRow
                key={document.id}
                title={document.title}
                documentType={document.documentType}
                createdAt={document.createdAt}
                status={document.status}
                subtitle={document.subtitle}
                version={document.version}
                expiresAt={document.expiresAt}
                previewUrl={document.previewUrl}
                detailHref={document.detailHref}
                extractionConfidence={document.extractionConfidence}
                actions={document.actions}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
