import { MessageThread } from "@/components/comms/message-thread";
import { PageHeader } from "@/components/shared/page-header";
import { getBorrowerLoanMessages } from "@/lib/borrower/queries";

export default async function BorrowerLoanMessagesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { loan, messages, attachmentOptions, borrowerId } = await getBorrowerLoanMessages(id);

  return (
    <main id="main-content" className="space-y-6">
      <PageHeader
        breadcrumbs={["Borrower", "Loans", loan.loan_number ?? "Application", "Messages"]}
        title="Messages"
        subtitle="Questions and updates shared with your loan team."
      />
      <MessageThread
        loanId={id}
        currentUserId={borrowerId}
        viewer="borrower"
        initialMessages={messages}
        attachmentOptions={attachmentOptions}
      />
    </main>
  );
}
