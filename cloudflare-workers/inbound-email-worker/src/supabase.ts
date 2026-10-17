/**
 * Minimal PostgREST client.
 *
 * The worker uses the service-role key, which bypasses RLS — that is intended
 * here (Cloudflare cannot present a user session) and is the reason the whole
 * email dataset must stay unreachable from the browser. See the RLS migration
 * note in sternmed-email/supabase/migrations/20260501_enable_rls_email_tables.sql.
 */

import type { Env } from './env';

export interface StoredAttachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  /** Cloudinary public_id. The frontend rebuilds the download URL from this. */
  storagePath: string;
  /** Content-ID from the MIME part, when the part is an inline image. */
  contentId?: string;
}

export interface InboundRecord {
  threadId?: string;
  aliasId: string;
  senderEmail: string;
  senderName?: string;
  subject?: string;
  bodyHtml?: string;
  bodyText?: string;
  attachments: StoredAttachment[];
  messageId?: string;
  inReplyTo?: string;
  references?: string;
  /** null = no Authentication-Results header, i.e. genuinely unknown. */
  spfPass: boolean | null;
  dkimPass: boolean | null;
  receivedAt: string;
}

export interface UnassignedRecord {
  originalRecipient: string;
  senderEmail: string;
  senderName?: string;
  subject?: string;
  bodyHtml?: string;
  bodyText?: string;
  attachments: StoredAttachment[];
  messageId?: string;
  spfPass: boolean | null;
  dkimPass: boolean | null;
  receivedAt: string;
}

function headers(env: Env): HeadersInit {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function rest<T>(env: Env, path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { ...headers(env), ...(init.headers ?? {}) },
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Supabase ${init.method ?? 'GET'} ${path} failed (${response.status}): ${detail.slice(0, 300)}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export async function findAliasByEmail(env: Env, address: string): Promise<{ id: string } | null> {
  const rows = await rest<Array<{ id: string }>>(
    env,
    `email_aliases?alias_email=eq.${encodeURIComponent(address)}&select=id&limit=1`,
    { method: 'GET' }
  );
  return rows[0] ?? null;
}

export async function hasMessageId(env: Env, messageId: string): Promise<boolean> {
  const rows = await rest<Array<{ id: string }>>(
    env,
    `email_inbound?message_id=eq.${encodeURIComponent(messageId)}&select=id&limit=1`,
    { method: 'GET' }
  );
  return rows.length > 0;
}

export async function findThreadByMessageId(
  env: Env,
  messageId: string
): Promise<{ thread_id: string | null } | null> {
  const rows = await rest<Array<{ thread_id: string | null }>>(
    env,
    `email_inbound?message_id=eq.${encodeURIComponent(messageId)}&select=thread_id&limit=1`,
    { method: 'GET' }
  );
  return rows[0] ?? null;
}

export async function insertInbound(env: Env, record: InboundRecord): Promise<void> {
  await rest<void>(env, 'email_inbound', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      thread_id: record.threadId ?? null,
      alias_id: record.aliasId,
      sender_email: record.senderEmail,
      sender_name: record.senderName ?? null,
      subject: record.subject ?? '',
      body_html: record.bodyHtml ?? null,
      body_text: record.bodyText ?? null,
      attachments: record.attachments,
      message_id: record.messageId ?? null,
      in_reply_to: record.inReplyTo ?? null,
      references: record.references ?? null,
      spf_pass: record.spfPass,
      dkim_pass: record.dkimPass,
      received_at: record.receivedAt,
    }),
  });
}

export async function insertUnassigned(env: Env, record: UnassignedRecord): Promise<void> {
  await rest<void>(env, 'email_inbound_unassigned', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      original_recipient: record.originalRecipient,
      sender_email: record.senderEmail,
      sender_name: record.senderName ?? null,
      subject: record.subject ?? '',
      body_html: record.bodyHtml ?? null,
      body_text: record.bodyText ?? null,
      attachments: record.attachments,
      message_id: record.messageId ?? null,
      spf_pass: record.spfPass,
      dkim_pass: record.dkimPass,
      received_at: record.receivedAt,
    }),
  });
}

export type LogType = 'inbound' | 'outbound' | 'worker_error' | 'template_error';

/**
 * Append to `email_logs`.
 *
 * Logging must never be able to fail an inbound email, so every error here is
 * swallowed after being surfaced to the Worker log. Callers must pass metadata
 * that is already free of secrets — see `describeEnv` in ./env.ts.
 */
export async function logEvent(
  env: Env,
  type: LogType,
  message: string,
  metadata: Record<string, unknown>
): Promise<void> {
  try {
    await rest<void>(env, 'email_logs', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ type, message, metadata }),
    });
  } catch (error) {
    console.error('Failed to write email_logs row:', error);
  }
}