import { MessageThread } from "@/components/comms/message-thread";
import { PageHeader } from "@/components/shared/page-header";
import { getStaffLoanWorkspace } from "@/lib/staff/queries";

export default async function StaffLoanMessagesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workspace = await getStaffLoanWorkspace(id);

  return (
    <main id="main-content" className="space-y-6">
      <PageHeader
        breadcrumbs={["Staff", "Loans", workspace.header.loan_number ?? "Application", "Messages"]}
        title="Loan messages"
        subtitle="Borrower conversations and staff-only notes stay together on the file."
      />
      <MessageThread
        loanId={id}
        currentUserId={workspace.currentStaffId}
        viewer="staff"
        initialMessages={workspace.messages}
        attachmentOptions={workspace.documents.map((document) => ({
          id: document.id,
          file_name: document.file_name,
          document_type: document.document_type,
          href: `/staff/loans/${id}/documents/${document.id}`,
        }))}
      />
    </main>
  );
}
