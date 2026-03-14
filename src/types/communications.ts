export interface MessageAttachment {
  id: string;
  file_name: string;
  document_type: string;
  href: string;
}

export interface MessageThreadItem {
  id: string;
  body: string;
  created_at: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  channel: string;
  is_internal: boolean;
  attachment_ids: string[];
  attachments: MessageAttachment[];
}

export interface NotificationListItem {
  id: string;
  title: string;
  body: string | null;
  action_url: string | null;
  resource_type: string | null;
  resource_id: string | null;
  created_at: string;
  read_at: string | null;
  sent_via: string[];
  type: string;
}

export interface EmailTemplateRecord {
  id: string;
  organization_id: string;
  trigger_event: string;
  subject: string;
  body_html: string;
  body_text: string | null;
  reply_to: string | null;
  variables: Array<{ key: string; label?: string }>;
  is_active: boolean;
  is_default: boolean;
  updated_at: string;
}
