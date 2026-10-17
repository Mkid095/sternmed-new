/**
 * Cloudinary upload for inbound attachments.
 *
 * Uses an UNSIGNED upload preset — the same `sternmed_uploads` preset the
 * browser uses in `src/services/storage.service.ts`. That is deliberate: a
 * signed upload needs a SHA-1 over the request params, and the Workers
 * SubtleCrypto API does not implement SHA-1, so signing in a Worker would mean
 * shipping a hand-rolled hash. Keeping the preset unsigned keeps the API secret
 * out of the worker entirely.
 *
 * The consequence is that `storagePath` (the Cloudinary public_id) is
 * predictable to anyone who knows the folder. Attachments are customer mail, so
 * the preset should be switched to `authenticated` (private) delivery before
 * this handles anything sensitive — see CLOUDINARY.md.
 */

import type { Env } from './env';

export interface UploadedAsset {
  publicId: string;
  url: string;
  bytes: number;
  resourceType: string;
}

/**
 * Cloudinary stores images and everything else under different endpoints. The
 * frontend derives the resource type from the content type when it rebuilds a
 * download URL, so the two must agree or the link 404s.
 */
export function resourceTypeFor(contentType: string): 'image' | 'raw' {
  return contentType.startsWith('image/') ? 'image' : 'raw';
}

/**
 * Make a filename safe to embed in a Cloudinary public_id and a URL path.
 *
 * Mail filenames arrive from the internet and routinely contain spaces,
 * quotes, path separators, and (occasionally) traversal sequences. Cloudinary
 * treats `/` as a folder separator, so anything resembling a path is stripped
 * rather than escaped.
 */
export function sanitizeFilename(filename: string, fallback = 'attachment'): string {
  const base = filename.split(/[/\\]/).pop() ?? '';
  const cleaned = base
    // Strip C0/C1 control characters: illegal in a public_id, and they would
    // otherwise survive the next pass as literal bytes in the URL.
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1f\x7f-\x9f]/g, '')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-.]+/, '')
    .slice(0, 120);

  return cleaned.length > 0 ? cleaned : fallback;
}

function buildUploadUrl(env: Env, resourceType: string): string {
  return `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;
}

/**
 * Upload one attachment. Returns the public_id plus the delivered URL.
 *
 * Throws on failure — the caller decides whether a failed attachment should
 * abort the whole message (it should not: losing the email body is far worse
 * than losing one file).
 */
export async function uploadAttachment(
  bytes: ArrayBuffer,
  filename: string,
  contentType: string,
  env: Env,
  folder: string
): Promise<UploadedAsset> {
  const resourceType = resourceTypeFor(contentType);
  const safeName = sanitizeFilename(filename);

  const form = new FormData();
  form.append('file', new Blob([bytes], { type: contentType }), safeName);
  form.append('upload_preset', env.CLOUDINARY_UPLOAD_PRESET);
  if (folder) {
    form.append('folder', folder);
  }

  const response = await fetch(buildUploadUrl(env, resourceType), {
    method: 'POST',
    body: form,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Cloudinary upload failed (${response.status}): ${detail.slice(0, 300)}`);
  }

  const data = (await response.json()) as {
    public_id?: string;
    secure_url?: string;
    bytes?: number;
  };

  if (!data.public_id) {
    throw new Error('Cloudinary upload returned no public_id');
  }

  return {
    publicId: data.public_id,
    url: data.secure_url ?? '',
    bytes: data.bytes ?? bytes.byteLength,
    resourceType,
  };
}