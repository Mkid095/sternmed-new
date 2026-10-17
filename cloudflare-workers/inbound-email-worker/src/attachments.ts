/**
 * Attachment processing.
 *
 * This is the piece the original worker stubbed out with `attachments: []`.
 * Mail arrives as multipart MIME; postal-mime decodes the parts, and each one
 * is uploaded to Cloudinary so the webmail client can stream it back without
 * the Supabase row ever holding file bytes.
 *
 * Two rules govern everything here:
 *   1. A failed upload must never cost us the email. The body is the message;
 *      a file is an accessory. Failures are reported and skipped.
 *   2. Inline images (Content-ID parts) ARE stored, because the frontend
 *      resolves `cid:` references by matching attachments on filename. Dropping
 *      them is what left inline images rendering as broken icons.
 */

import { uploadAttachment } from './cloudinary';
import type { Env, Config } from './env';
import type { StoredAttachment } from './supabase';

/**
 * Minimal shape of a postal-mime attachment.
 *
 * Declared locally rather than imported: postal-mime's own types have shifted
 * between major versions, and pinning the worker to one of them would make a
 * dependency bump a compile error in the mail path.
 */
export interface ParsedAttachment {
  filename?: string;
  mimeType?: string;
  contentDisposition?: string;
  disposition?: string;
  related?: boolean;
  contentId?: string;
  /**
   * postal-mime types this as `ArrayBuffer | Uint8Array | string` — the shape
   * depends on the `attachmentEncoding` option. `toBytes` normalises all three
   * so a dependency bump cannot silently start writing base64 text into a file.
   */
  content?: ArrayBuffer | Uint8Array | string;
  encoding?: 'base64' | 'utf8';
}

/**
 * Normalise postal-mime's polymorphic `content` into raw bytes.
 *
 * Returns null when the part cannot be decoded. Never falls back to treating a
 * string as raw text without knowing the encoding: uploading base64 text as if
 * it were the file is worse than skipping the file, because it produces a
 * download that fails much later and much less obviously.
 */
export function toBytes(content: ParsedAttachment['content'], encoding?: 'base64' | 'utf8'): ArrayBuffer | null {
  if (!content) return null;

  if (content instanceof ArrayBuffer) {
    return content;
  }

  if (content instanceof Uint8Array) {
    // Copy into a standalone ArrayBuffer: a Uint8Array view onto a larger
    // buffer would otherwise upload the whole underlying allocation.
    return content.slice().buffer as ArrayBuffer;
  }

  if (typeof content === 'string') {
    if (encoding === 'base64') {
      try {
        const binary = atob(content.replace(/\s+/g, ''));
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) {
          bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
      } catch {
        return null;
      }
    }
    return new TextEncoder().encode(content).buffer as ArrayBuffer;
  }

  return null;
}

export interface AttachmentOutcome {
  stored: StoredAttachment[];
  /** Human-readable reasons for anything that was dropped, for email_logs. */
  skipped: Array<{ filename: string; reason: string }>;
}

export async function processAttachments(
  attachments: ParsedAttachment[] | undefined,
  env: Env,
  config: Config,
  /** Namespaced per-message folder so one mailbox's files never collide. */
  folderPrefix: string
): Promise<AttachmentOutcome> {
  const outcome: AttachmentOutcome = { stored: [], skipped: [] };

  if (!attachments || attachments.length === 0) {
    return outcome;
  }

  // Inline images first: if the count cap is hit, the visible file the user
  // actually attached should win the remaining slots, not an inline logo.
  const ordered = [...attachments].sort((a, b) => inlineScore(a) - inlineScore(b));

  for (const [index, attachment] of ordered.entries()) {
    const filename = attachment.filename?.trim() || `attachment-${index + 1}`;

    if (index >= config.maxAttachments) {
      outcome.skipped.push({ filename, reason: 'attachment count limit reached' });
      continue;
    }

    const content = toBytes(attachment.content, attachment.encoding);
    if (!content || content.byteLength === 0) {
      outcome.skipped.push({ filename, reason: 'empty or undecodable part' });
      continue;
    }

    if (content.byteLength > config.maxAttachmentBytes) {
      outcome.skipped.push({ filename, reason: 'exceeds per-file size limit' });
      continue;
    }

    const contentType = attachment.mimeType || 'application/octet-stream';
    const folder = `${config.cloudinaryFolder}/${folderPrefix}`;

    try {
      const uploaded = await uploadAttachment(content, filename, contentType, env, folder);

      // postal-mime keeps the Content-ID angle brackets ("<abc@host>"); the
      // bare token is what a `cid:` reference in the HTML body matches on.
      const contentId = attachment.contentId?.replace(/^<|>$/g, '').trim();

      outcome.stored.push({
        id: uploaded.publicId,
        filename,
        contentType,
        size: uploaded.bytes,
        storagePath: uploaded.publicId,
        ...(contentId ? { contentId } : {}),
      });
    } catch (error) {
      // Rule 1: keep the mail.
      const reason = error instanceof Error ? error.message : 'upload failed';
      outcome.skipped.push({ filename, reason: reason.slice(0, 200) });
      console.error(`Attachment upload failed for "${filename}":`, reason);
    }
  }

  return outcome;
}

/** Lower sorts first: 0 = regular attachment, 1 = inline image. */
function inlineScore(attachment: ParsedAttachment): number {
  const disposition = (attachment.contentDisposition ?? attachment.disposition ?? '').toLowerCase();
  if (disposition === 'inline' || attachment.related === true) return 1;
  return 0;
}