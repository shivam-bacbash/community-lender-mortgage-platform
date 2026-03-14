# M8 — Communications Hub
> Phase 2 · Multi-channel communication: in-app messaging, email (Resend), SMS (Twilio), notification center.

## Prerequisites
- M1, M2, M3 complete
- DB tables: `messages`, `notifications`, `email_templates`
- Env: `RESEND_API_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` (optional for SMS)

---

## Goal
Build the full communication layer: real-time in-app messaging between borrower and LO, system-triggered email notifications via Resend, optional SMS via Twilio, and a notification bell in the nav.

---

## Routes to Build

```
app/(borrower)/loans/[id]/messages/page.tsx
app/(staff)/loans/[id]/messages/page.tsx
app/api/webhooks/resend/route.ts          # Email delivery webhooks
```

---

## 1. In-App Messaging

### Real-time thread component
```tsx
// components/comms/MessageThread.tsx
// 'use client' — needs realtime subscription

// Fetch messages
const { data: messages } = await supabase
  .from('messages')
  .select('*, sender:profiles(first_name, last_name, role, avatar_url)')
  .eq('loan_application_id', loanId)
  .eq(role === 'borrower' ? 'is_internal' : 'true', role === 'borrower' ? false : 'true')
  .order('created_at', { ascending: true })

// Realtime subscription
supabase.channel(`messages:${loanId}`)
  .on('postgres_changes', {
    event: 'INSERT', schema: 'public', table: 'messages',
    filter: `loan_application_id=eq.${loanId}`
  }, (payload) => appendMessage(payload.new))
  .subscribe()
```

### Message input
```tsx
// components/comms/MessageInput.tsx
// Text area + send button
// Staff: toggle "Internal note" (is_internal = true, shown with different styling)
// File attachment: select from already-uploaded documents
// On send: INSERT into messages, INSERT into notifications for recipient
```

### Message bubble styling
- Borrower messages: right-aligned, primary color
- Staff messages: left-aligned, gray
- Internal notes: left-aligned, amber background, "Internal" badge — hidden from borrower

---

## 2. Email Notifications (Resend)

### Notification service
```ts
// lib/notifications/email.ts
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(event: string, recipientId: string, variables: Record<string, string>) {
  // 1. Fetch email template for this org + event
  const template = await getEmailTemplate(orgId, event)

  // 2. Merge variables into template
  const html = mergeTemplate(template.body_html, variables)
  const subject = mergeTemplate(template.subject, variables)

  // 3. Send via Resend
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: recipientEmail,
    subject,
    html
  })

  // 4. Mark notification as sent_via email
  await supabase.from('notifications').update({ sent_via: ['email'] }).eq('id', notificationId)
}
```

### Triggered email events
| Event | Recipient | Template key |
|---|---|---|
| Application submitted | Borrower + LO | `application_submitted` |
| Status changed | Borrower | `status_changed` |
| Document requested | Borrower | `document_requested` |
| Document accepted | Borrower | `document_accepted` |
| Loan approved | Borrower | `loan_approved` |
| Loan denied | Borrower | `loan_denied` |
| Rate lock expiring | LO | `rate_lock_expiring` |
| Task assigned | Assignee | `task_assigned` |
| Condition added | Borrower | `condition_added` |

---

## 3. Notification Center (UI)

### Bell icon in nav
```tsx
// components/shared/NotificationBell.tsx
// 'use client' — realtime subscription

// Unread count badge
const { count } = await supabase
  .from('notifications')
  .select('*', { count: 'exact', head: true })
  .eq('recipient_id', userId)
  .is('read_at', null)

// Dropdown: last 10 notifications
// Click notification → navigate to resource + mark as read
// "Mark all read" button

// Realtime: subscribe to new notifications for current user
supabase.channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT', schema: 'public', table: 'notifications',
    filter: `recipient_id=eq.${userId}`
  }, () => refetchNotifications())
  .subscribe()
```

---

## 4. Default Email Templates

Seed these on organization creation:
```ts
const DEFAULT_TEMPLATES = [
  {
    trigger_event: 'application_submitted',
    subject: 'We received your application — {{loan_number}}',
    body_html: `<p>Hi {{borrower_name}},</p>
    <p>Your mortgage application {{loan_number}} has been received and is being reviewed.</p>
    <p>Your loan officer {{lo_name}} will be in touch shortly.</p>`
  },
  {
    trigger_event: 'loan_approved',
    subject: 'Great news — your loan has been approved!',
    body_html: `<p>Hi {{borrower_name}},</p>
    <p>Congratulations! Your loan application {{loan_number}} has been approved for {{loan_amount}}.</p>`
  },
  // ... other templates
]
```

---

## Acceptance Criteria
- [ ] Borrower and LO can exchange messages in real-time
- [ ] Internal notes hidden from borrower view
- [ ] Email sent via Resend on application submit
- [ ] Email sent on loan approval/denial
- [ ] Notification bell shows unread count, updates in real-time
- [ ] Clicking notification navigates to correct resource
- [ ] Mark as read works individually and in bulk
- [ ] Email templates editable by admin per org
