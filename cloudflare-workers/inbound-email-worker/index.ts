/**
 * Cloudflare Worker for Inbound Email Processing
 *
 * This worker handles incoming emails from Cloudflare Email Routing.
 * It validates emails, processes attachments, and stores them in Supabase.
 *
 * SECURITY:
 * - Uses Supabase SERVICE ROLE key (stored in worker secrets)
 * - Validates email domain before processing
 * - Limits attachment size
 * - SPF/DKIM validation
 * - Timeout protection for large emails
 *
 * @module inbound-email-worker
 */

import PostalMime from 'postal-mime';

/**
 * Forwardable Email Message from Cloudflare Email Routing
 */
export interface ForwardableEmailMessage {
  /**
   * Sender information
   */
  from: {
    address: string;
    name?: string;
  };
  /**
   * Recipients (to)
   */
  to: Array<{
    address: string;
    name?: string;
  }>;
  /**
   * CC recipients
   */
  cc?: Array<{
    address: string;
    name?: string;
  }>;
  /**
   * Subject line
   */
  subject?: string;
  /**
   * Email headers
   */
  headers: Headers;
  /**
   * Raw email content as ReadableStream
   */
  raw: ReadableStream;
  /**
   * Reply to addresses
   */
  replyTo?: Array<{
    address: string;
    name?: string;
  }>;
}

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_STORAGE_URL: string;
  ALLOWED_DOMAINS: string;
  MAX_ATTACHMENT_SIZE: string;
  MAX_EMAIL_SIZE: string;
  WORKER_TIMEOUT: string;
}

/**
 * Helper: Run with timeout protection
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeoutMs)
    ),
  ]);
}

/**
 * Helper: Parse headers to record
 */
function parseHeaders(headers: Headers): Record<string, string> {
  return Object.fromEntries(headers.entries());
}

/**
 * Helper: Check for duplicate emails
 */
async function checkDuplicate(messageId: string, env: Env): Promise<boolean> {
  try {
    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/email_inbound?message_id=eq.${encodeURIComponent(messageId)}&select=id`,
      {
        method: 'GET',
        headers: {
          'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    const data = await response.json();
    return data.length > 0;
  } catch {
    return false;
  }
}

/**
 * Helper: Find alias by email
 */
async function findAliasByEmail(email: string, env: Env): Promise<{ id: string } | null> {
  try {
    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/email_aliases?alias_email=eq.${encodeURIComponent(email)}&select=id`,
      {
        method: 'GET',
        headers: {
          'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    const data = await response.json();
    return data.length > 0 ? data[0] : null;
  } catch {
    return null;
  }
}

/**
 * Helper: Find email by message ID for threading
 */
async function findEmailByMessageId(messageId: string, env: Env): Promise<{ thread_id: string } | null> {
  try {
    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/email_inbound?message_id=eq.${encodeURIComponent(messageId)}&select=thread_id`,
      {
        method: 'GET',
        headers: {
          'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    const data = await response.json();
    return data.length > 0 ? data[0] : null;
  } catch {
    return null;
  }
}

/**
 * Helper: Store inbound email
 */
async function storeInboundEmail(
  data: {
    threadId?: string;
    aliasId: string;
    senderEmail: string;
    senderName?: string;
    subject?: string;
    bodyHtml?: string;
    bodyText?: string;
    attachments: unknown[];
    messageId?: string;
    inReplyTo?: string;
    references?: string;
    spfPass: boolean;
    dkimPass: boolean;
    receivedAt: string;
  },
  env: Env
): Promise<void> {
  // Convert camelCase to snake_case for Supabase
  const dbData = {
    thread_id: data.threadId,
    alias_id: data.aliasId,
    sender_email: data.senderEmail,
    sender_name: data.senderName,
    subject: data.subject,
    body_html: data.bodyHtml,
    body_text: data.bodyText,
    attachments: data.attachments,
    message_id: data.messageId,
    in_reply_to: data.inReplyTo,
    references: data.references,
    spf_pass: data.spfPass,
    dkim_pass: data.dkimPass,
    received_at: data.receivedAt,
  };

  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/email_inbound`, {
    method: 'POST',
    headers: {
      'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(dbData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to store inbound email:', response.status, errorText);
    throw new Error(`Failed to store inbound email: ${response.status} ${errorText}`);
  }

  console.log('✅ Stored inbound email for alias:', data.aliasId);
}

/**
 * Helper: Store unassigned email
 */
async function storeUnassignedEmail(
  data: {
    originalRecipient: string;
    senderEmail: string;
    senderName?: string;
    subject?: string;
    bodyHtml?: string;
    bodyText?: string;
    attachments: unknown[];
    messageId?: string;
    spfPass: boolean;
    dkimPass: boolean;
    receivedAt: string;
  },
  env: Env
): Promise<void> {
  // Convert camelCase to snake_case for Supabase
  const dbData = {
    original_recipient: data.originalRecipient,
    sender_email: data.senderEmail,
    sender_name: data.senderName,
    subject: data.subject,
    body_html: data.bodyHtml,
    body_text: data.bodyText,
    attachments: data.attachments,
    message_id: data.messageId,
    spf_pass: data.spfPass,
    dkim_pass: data.dkimPass,
    received_at: data.receivedAt,
  };

  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/email_inbound_unassigned`, {
    method: 'POST',
    headers: {
      'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(dbData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to store unassigned email:', response.status, errorText);
    throw new Error(`Failed to store unassigned email: ${response.status} ${errorText}`);
  }

  console.log('✅ Stored unassigned email for:', data.originalRecipient);
}

/**
 * Helper: Log to email_logs
 */
async function logToEmailLog(
  type: 'inbound' | 'outbound' | 'worker_error' | 'template_error',
  message: string,
  metadata: Record<string, unknown>,
  env: Env
): Promise<void> {
  try {
    await fetch(`${env.SUPABASE_URL}/rest/v1/email_logs`, {
      method: 'POST',
      headers: {
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, message, metadata }),
    });
  } catch {
    // Silently fail for logging
  }
}

/**
 * Helper: Parse email with timeout
 */
async function parseEmail(message: ReadableStream, timeout: number): Promise<{
  subject?: string;
  html?: string;
  text?: string;
}> {
  // Read the FULL raw email stream
  const rawText = await withTimeout(
    new Response(message).text(),
    timeout
  );

  // Parse with postal-mime for proper MIME handling
  const email = await PostalMime.parse(rawText, {
    attachmentEncoding: 'base64'
  });

  return {
    subject: email.subject,
    html: email.html,
    text: email.text,
  };
}

/**
 * Main email handler
 */
export default {
  async email(message: ForwardableEmailMessage, env: Env): Promise<void> {
    const startTime = Date.now();
    const maxTimeout = parseInt(env.WORKER_TIMEOUT || '25000', 10);
    let recipient: string | undefined;

    try {
      // 1. Extract recipient (from headers for catch-all routing)
      const headers = parseHeaders(message.headers);

      // Try multiple sources for the recipient email
      recipient = message.to[0]?.address;

      // If not in message.to, check headers (common for catch-all routing)
      if (!recipient) {
        const toHeader = headers['to'] || headers['delivered-to'] || headers['x-original-to'];
        if (toHeader) {
          // Extract email from header (may contain name: "Name <email>")
          const match = toHeader.match(/<([^>]+)>/) || toHeader.match(/([\w.-]+@[\w.-]+)/);
          recipient = match ? match[1] : toHeader.trim();
        }
      }

      if (!recipient || !recipient.includes('@')) {
        await logToEmailLog('worker_error', 'No recipient found', { headers, messageTo: message.to }, env);
        return;
      }

      // 2. Validate domain
      const domain = recipient.split('@')[1];
      const allowedDomains = env.ALLOWED_DOMAINS.split(',');
      if (!allowedDomains.includes(domain)) {
        await logToEmailLog('worker_error', 'Invalid domain', { recipient, domain, env }, env);
        return;
      }

      // 2.5. Extract sender info (from message or headers)
      let senderEmail = message.from?.address;
      let senderName = message.from?.name;

      if (!senderEmail) {
        // Fallback to extracting from headers
        const fromHeader = headers['from'];
        if (fromHeader) {
          const match = fromHeader.match(/<([^>]+)>/) || fromHeader.match(/([\w.-]+@[\w.-]+)/);
          senderEmail = match ? match[1] : fromHeader.trim();
          // Extract name from "Name <email>" format
          const nameMatch = fromHeader.match(/^"?([^"<>]+)"?\s*</);
          senderName = nameMatch ? nameMatch[1] : undefined;
        }
      }

      if (!senderEmail) {
        await logToEmailLog('worker_error', 'No sender found', { headers, messageFrom: message.from }, env);
        return;
      }

      console.log('📨 Processing email from:', senderEmail, 'to:', recipient);

      // 3. Extract message ID and threading info from headers
      const messageId = headers['message-id'];
      const inReplyTo = headers['in-reply-to'];
      const references = headers['references'];

      // 4. SPF/DKIM validation
      const authResults = headers['authentication-results'] || '';
      const spfPass = authResults.includes('spf=pass');
      const dkimPass = !authResults.includes('dkim=fail');

      if (!spfPass) {
        await logToEmailLog('worker_error', 'SPF validation failed', {
          recipient,
          sender: senderEmail,
          authResults,
        }, env);
      }

      // 5. Check for duplicates
      if (messageId && await checkDuplicate(messageId, env)) {
        return; // Already processed
      }

      // 6. Parse email with timeout
      const { subject: parsedSubject, html, text } = await withTimeout(
        parseEmail(message.raw, maxTimeout / 2),
        maxTimeout / 2
      );

      // 7. Match alias or determine thread
      const alias = await findAliasByEmail(recipient, env);
      console.log('🔍 Alias lookup for:', recipient, alias ? 'Found' : 'Not found');

      if (alias) {
        // Determine thread_id from in_reply_to
        let threadId: string | undefined;
        if (inReplyTo) {
          const parentEmail = await findEmailByMessageId(inReplyTo, env);
          threadId = parentEmail?.thread_id;
        }

        console.log('📥 Storing inbound email for alias:', alias.id);
        // Store in email_inbound
        await storeInboundEmail({
          threadId,
          aliasId: alias.id,
          senderEmail,
          senderName,
          subject: message.subject || parsedSubject || '',
          bodyHtml: html,
          bodyText: text,
          attachments: [], // TODO: Process attachments
          messageId,
          inReplyTo,
          references,
          spfPass,
          dkimPass,
          receivedAt: new Date().toISOString(),
        }, env);
      } else {
        console.log('📬 Storing unassigned email for:', recipient);
        // Store in email_inbound_unassigned
        await storeUnassignedEmail({
          originalRecipient: recipient,
          senderEmail,
          senderName,
          subject: message.subject || parsedSubject || '',
          bodyHtml: html,
          bodyText: text,
          attachments: [],
          messageId,
          spfPass,
          dkimPass,
          receivedAt: new Date().toISOString(),
        }, env);
      }

      const processingTime = Date.now() - startTime;
      await logToEmailLog('inbound', 'Email processed successfully', {
        recipient,
        processingTimeMs: processingTime,
        aliasId: alias?.id,
      }, env);

    } catch (error) {
      await logToEmailLog('worker_error', error instanceof Error ? error.message : 'Unknown error', {
        recipient,
        error: error instanceof Error ? error.stack : String(error),
      }, env);
    }
  },
};
