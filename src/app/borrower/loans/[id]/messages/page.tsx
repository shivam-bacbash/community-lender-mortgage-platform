import { Card } from "@/components/ui/card";
import { MessageComposer } from "@/components/borrower/message-composer";
import { PageHeader } from "@/components/shared/page-header";
import { getBorrowerLoanMessages } from "@/lib/borrower/queries";
import { formatDate } from "@/lib/utils/format";

export default async function BorrowerLoanMessagesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { loan, messages } = await getBorrowerLoanMessages(id);

  return (
    <main id="main-content" className="space-y-6">
      <PageHeader
        breadcrumbs={["Borrower", "Loans", loan.loan_number ?? "Application", "Messages"]}
        title="Messages"
        subtitle="Questions and updates shared with your loan team."
      />

      <MessageComposer loanId={id} />

      <Card className="p-6">
        <div className="space-y-4">
          {messages.length ? (
            messages.map((message) => (
              <div key={message.id} className="rounded-2xl border border-gray-200 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">{message.sender_name}</p>
                  <span className="text-xs uppercase tracking-[0.16em] text-gray-500">
                    {message.sender_role.replaceAll("_", " ")}
                  </span>
                </div>
                <p className="mt-3 text-sm text-gray-700">{message.body}</p>
                <p className="mt-3 text-xs text-gray-500">{formatDate(message.created_at, "MMM d, yyyy h:mm a")}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-600">No messages yet.</p>
          )}
        </div>
      </Card>
    </main>
  );
}
