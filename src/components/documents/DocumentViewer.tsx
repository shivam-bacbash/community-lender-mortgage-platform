import { Card } from "@/components/ui/card";

export function DocumentViewer({
  signedUrl,
  mimeType,
  title,
}: {
  signedUrl: string | null;
  mimeType: string | null;
  title?: string;
}) {
  if (!signedUrl) {
    return (
      <Card className="p-6">
        <p className="text-sm text-gray-600">Preview unavailable for this document.</p>
      </Card>
    );
  }

  const isImage = mimeType?.startsWith("image/");

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">{title ?? "Document preview"}</h2>
      </div>
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={signedUrl} alt={title ?? "Document preview"} className="w-full bg-gray-50 object-contain" />
      ) : (
        <iframe
          title={title ?? "Document preview"}
          src={signedUrl}
          className="h-[720px] w-full border-0"
        />
      )}
    </Card>
  );
}
