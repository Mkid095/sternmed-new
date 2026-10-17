/**
 * Cloudflare Email Worker — inbound mail for sternmedafrika.com.
 *
 * Pipeline
 *   raw MIME → guard size/domain → dedupe on Message-ID → parse (postal-mime)
 *            → upload attachments to Cloudinary → thread lookup
 *            → insert into email_inbound / email_inbound_unassigned → log
 *
 * Run `npx wrangler tail` to watch it live. Nothing here may log `env`; see
 * ./env.ts for why.
 */

import PostalMime from 'postal-mime';
import { processAttachments, type ParsedAttachment } from './attachments';
import { describeEnv, readConfig, type Env } from './env';
import {
  extractAddress,
  extractDisplayName,
  parseAuthResults,
  parseHeaders,
} from './mime';
import {
  findAliasByEmail,
  findThreadByMessageId,
  hasMessageId,
  insertInbound,
  insertUnassigned,
  logEvent,
} from './supabase';

/** ForwardableEmailMessage as delivered by Cloudflare Email Routing. */
interface ForwardableEmailMessage {
  from: { address: string; name?: string };
  to: Array<{ address: string; name?: string }>;
  cc?: Array<{ address: string; name?: string }>;
  subject?: string;
  headers: Headers;
  raw: ReadableStream;
  /** Present on recent runtimes; absent means "unknown, check by reading". */
  rawSize?: number;
  replyTo?: Array<{ address: string; name?: string }>;
}

export default {
  async email(message: ForwardableEmailMessage, env: Env): Promise<void> {
    const startedAt = Date.now();
    const config = readConfig(env);
    const headers = parseHeaders(message.headers);
    let recipient: string | null = null;

    try {
      // ── 1. Who is this for? ────────────────────────────────────────
      // Email Routing hands us the envelope recipient in `to`. Catch-all
      // routing can drop it, so fall back to the headers.
      recipient =
        message.to?.[0]?.address ??
        extractAddress(headers['delivered-to']) ??
        extractAddress(headers['x-original-to']) ??
        extractAddress(headers['to']);

      if (!recipient) {
        await logEvent(env, 'worker_error', 'No recipient could be resolved', {
          headers,
          envelopeTo: message.to ?? null,
        });
        return;
      }

      // ── 2. Is this address ours? ───────────────────────────────────
      const domain = recipient.split('@')[1] ?? '';
      if (!config.allowedDomains.has(domain.toLowerCase())) {
        // NOTE: metadata deliberately contains no `env`. The previous version
        // passed the whole environment here, writing SUPABASE_SERVICE_ROLE_KEY
        // into email_logs on every rejected message.
        await logEvent(env, 'worker_error', 'Recipient domain not allowed', {
          recipient,
          domain,
          allowedDomains: [...config.allowedDomains],
          env: describeEnv(env),
        });
        return;
      }

      // ── 3. Oversized messages ──────────────────────────────────────
      const declaredSize = message.rawSize;
      if (typeof declaredSize === 'number' && declaredSize > config.maxEmailBytes) {
        await logEvent(env, 'worker_error', 'Message exceeds size limit', {
          recipient,
          sizeBytes: declaredSize,
          limitBytes: config.maxEmailBytes,
        });
        return;
      }

      // ── 4. Who sent it? ────────────────────────────────────────────
      const senderEmail =
        message.from?.address ?? extractAddress(headers['from']);
      const senderName =
        message.from?.name ?? extractDisplayName(headers['from']) ?? undefined;

      if (!senderEmail) {
        await logEvent(env, 'worker_error', 'No sender could be resolved', {
          recipient,
          headers,
        });
        return;
      }

      // ── 5. Authentication verdicts ─────────────────────────────────
      // null means "no verdict present", which the UI must show as unverified
      // rather than as a pass.
      const auth = parseAuthResults(headers['authentication-results']);

      // ── 6. Duplicate suppression ───────────────────────────────────
      const messageId = headers['message-id'];
      if (messageId && (await hasMessageId(env, messageId))) {
        console.log(`Duplicate message-id ${messageId} — skipping.`);
        return;
      }

      // ── 7. Parse ──────────────────────────────────────────────────
      const rawText = await new Response(message.raw).text();
      if (rawText.length > config.maxEmailBytes) {
        await logEvent(env, 'worker_error', 'Message exceeds size limit', {
          recipient,
          sizeBytes: rawText.length,
          limitBytes: config.maxEmailBytes,
        });
        return;
      }

      // `attachmentEncoding: 'arraybuffer'` hands back decoded bytes.
      //
      // This was previously 'base64', which returns the base64 STRING. Passing
      // that string straight into a Blob uploaded the literal ASCII
      // "iVBORw0KGgo..." as the file content: Cloudinary rejected images as
      // "Invalid image file", and silently accepted raw files — storing PDFs
      // that were base64 text rather than actual PDFs.
      const parsed = await PostalMime.parse(rawText, { attachmentEncoding: 'arraybuffer' });

      const attachments = await processAttachments(
        parsed.attachments as unknown as ParsedAttachment[] | undefined,
        env,
        config,
        messageId ? safeFolderSegment(messageId) : crypto.randomUUID()
      );

      if (config.logSpoofFailures && (auth.spf === false || auth.dkim === false)) {
        await logEvent(env, 'worker_error', 'Sender authentication did not pass', {
          recipient,
          sender: senderEmail,
          authenticationResults: headers['authentication-results'] ?? null,
        });
      }

      // ── 8. Route to an alias, or park it as unassigned ────────────
      const alias = await findAliasByEmail(env, recipient);
      const common = {
        senderEmail,
        senderName,
        subject: message.subject || parsed.subject || '(no subject)',
        bodyHtml: typeof parsed.html === 'string' ? parsed.html : undefined,
        bodyText: typeof parsed.text === 'string' ? parsed.text : undefined,
        attachments: attachments.stored,
        messageId,
        spfPass: auth.spf,
        dkimPass: auth.dkim,
        receivedAt: new Date().toISOString(),
      };

      if (alias) {
        let threadId: string | undefined;
        const inReplyTo = headers['in-reply-to'];
        if (inReplyTo) {
          threadId = (await findThreadByMessageId(env, inReplyTo))?.thread_id ?? undefined;
        }

        await insertInbound(env, {
          ...common,
          threadId,
          aliasId: alias.id,
          inReplyTo: inReplyTo || undefined,
          references: headers['references'] || undefined,
        });
      } else {
        await insertUnassigned(env, {
          ...common,
          originalRecipient: recipient,
        });
      }

      await logEvent(env, 'inbound', 'Inbound email processed', {
        recipient,
        sender: senderEmail,
        matchedAlias: Boolean(alias),
        attachmentCount: attachments.stored.length,
        skippedAttachments: attachments.skipped,
        spf: auth.spf,
        dkim: auth.dkim,
        processingTimeMs: Date.now() - startedAt,
      });

      console.log(
        `Stored inbound mail for ${recipient} (${attachments.stored.length} attachments, ` +
          `${Date.now() - startedAt}ms)`
      );
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      console.error('Inbound processing failed:', detail, error);
      await logEvent(env, 'worker_error', detail.slice(0, 500), {
        recipient,
        stack: error instanceof Error ? error.stack : undefined,
      });
      // Deliberately swallowed: a throw here makes Cloudflare consider the
      // message unhandled, and the mail is already gone either way. The
      // operator sees it via `wrangler tail` and the row in email_logs.
    }
  },
};

/**
 * Message-IDs contain angle brackets, @ and quotes, all of which are awkward
 * in a Cloudinary folder path. Reduce to something safe and stable.
 */
function safeFolderSegment(messageId: string): string {
  const inner = messageId.replace(/^<|>$/g, '');
  return inner.replace(/[^A-Za-z0-9._-]+/g, '-').slice(0, 80) || crypto.randomUUID();
}