import Link from "next/link";

import { DocumentViewer } from "@/components/documents/DocumentViewer";
import { VersionHistory } from "@/components/documents/VersionHistory";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { getStaffLoanDocumentDetail } from "@/lib/staff/queries";
import { formatDate } from "@/lib/utils/format";
import { getDocumentTypeLabel } from "@/lib/documents/config";

export default async function StaffLoanDocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string; docId: string }>;
}) {
  const { id, docId } = await params;
  const detail = await getStaffLoanDocumentDetail(id, docId);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={["Staff", detail.loan.loan_number ?? detail.loan.id, "Documents", detail.document.file_name]}
        title={detail.document.file_name}
        subtitle={`${getDocumentTypeLabel(detail.document.document_type)} for ${detail.loan.borrower_name}`}
        actions={
          <Link href={`/staff/loans/${id}/documents`} className="text-sm font-semibold text-primary-700">
            Back to documents
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <DocumentViewer
          signedUrl={detail.signedUrl}
          mimeType={detail.document.mime_type}
          title={detail.document.file_name}
        />

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900">Document details</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-gray-500">Type</dt>
                <dd className="text-right font-medium text-gray-900">
                  {getDocumentTypeLabel(detail.document.document_type)}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-gray-500">Status</dt>
                <dd className="text-right font-medium text-gray-900">{detail.document.status}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-gray-500">Uploaded</dt>
                <dd className="text-right font-medium text-gray-900">
                  {formatDate(detail.document.created_at, "MMM d, yyyy h:mm a")}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-gray-500">Version</dt>
                <dd className="text-right font-medium text-gray-900">v{detail.document.version}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-gray-500">Expires</dt>
                <dd className="text-right font-medium text-gray-900">
                  {detail.document.expires_at ? formatDate(detail.document.expires_at) : "Does not expire"}
                </dd>
              </div>
            </dl>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900">AI extraction</h2>
            {detail.document.ai_extracted_data ? (
              <div className="mt-4 space-y-3 text-sm">
                <p className="text-gray-600">
                  Detected type: <span className="font-medium text-gray-900">{detail.document.ai_extracted_data.detected_type}</span>
                </p>
                <p className="text-gray-600">
                  Confidence: <span className="font-medium text-gray-900">{Math.round(detail.document.ai_extracted_data.confidence * 100)}%</span>
                </p>
                <dl className="space-y-2">
                  {Object.entries(detail.document.ai_extracted_data.extracted_fields).map(([key, value]) => (
                    <div key={key} className="flex items-start justify-between gap-4">
                      <dt className="capitalize text-gray-500">{key.replaceAll("_", " ")}</dt>
                      <dd className="text-right font-medium text-gray-900">{value ?? "Not detected"}</dd>
                    </div>
                  ))}
                </dl>
                {detail.document.ai_extracted_data.anomalies.length ? (
                  <ul className="list-disc space-y-1 pl-5 text-error-700">
                    {detail.document.ai_extracted_data.anomalies.map((anomaly) => (
                      <li key={anomaly}>{anomaly}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-success-700">No anomalies detected.</p>
                )}
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-600">No extraction result is stored yet for this file.</p>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900">Related requests</h2>
            <div className="mt-4 space-y-3">
              {detail.requestHistory.length ? (
                detail.requestHistory.map((request) => (
                  <div key={request.id} className="rounded-2xl border border-gray-200 px-4 py-3 text-sm">
                    <p className="font-semibold text-gray-900">{request.status}</p>
                    <p className="mt-1 text-gray-600">{request.message ?? "Borrower upload requested."}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600">No matching requests recorded.</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      <VersionHistory versions={detail.versionHistory} baseHref={`/staff/loans/${id}/documents`} />
    </div>
  );
}
