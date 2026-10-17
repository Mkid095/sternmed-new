/**
 * Worker configuration.
 *
 * SECURITY: `Env` holds the Supabase service-role key. Never log it, never
 * spread it into an object that gets persisted. `describeEnv` exists to give
 * operators visibility into *which* secrets are configured without ever
 * revealing a value — the previous worker passed the raw `env` object to the
 * logging helper, which wrote the service-role key into `email_logs.metadata`.
 */

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;

  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_UPLOAD_PRESET: string;
  /** Only needed for signed-upload presets. Unsigned presets ignore this. */
  CLOUDINARY_API_SECRET?: string;

  /** Comma-separated list of domains this worker will accept mail for. */
  ALLOWED_DOMAINS: string;
  /** Bytes, per file. */
  MAX_ATTACHMENT_SIZE: string;
  MAX_ATTACHMENTS_PER_EMAIL: string;
  /** Bytes, whole raw message. */
  MAX_EMAIL_SIZE: string;
  CLOUDINARY_FOLDER: string;
  LOG_SPOOF_FAILURES: string;
}

export interface Config {
  allowedDomains: Set<string>;
  maxAttachmentBytes: number;
  maxAttachments: number;
  maxEmailBytes: number;
  cloudinaryFolder: string;
  logSpoofFailures: boolean;
}

const DEFAULT_MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;
const DEFAULT_MAX_ATTACHMENTS = 20;
const DEFAULT_MAX_EMAIL_BYTES = 25 * 1024 * 1024;
const DEFAULT_CLOUDINARY_FOLDER = 'inbound-email';

function readInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Normalise the raw env once, at the edge of the module, so the rest of the
 * worker never has to defend against a missing or malformed var.
 */
export function readConfig(env: Env): Config {
  return {
    allowedDomains: new Set(
      (env.ALLOWED_DOMAINS ?? '')
        .split(',')
        .map((domain) => domain.trim().toLowerCase())
        .filter(Boolean)
    ),
    maxAttachmentBytes: readInt(env.MAX_ATTACHMENT_SIZE, DEFAULT_MAX_ATTACHMENT_BYTES),
    maxAttachments: readInt(env.MAX_ATTACHMENTS_PER_EMAIL, DEFAULT_MAX_ATTACHMENTS),
    maxEmailBytes: readInt(env.MAX_EMAIL_SIZE, DEFAULT_MAX_EMAIL_BYTES),
    cloudinaryFolder: env.CLOUDINARY_FOLDER || DEFAULT_CLOUDINARY_FOLDER,
    logSpoofFailures: String(env.LOG_SPOOF_FAILURES ?? 'true') !== 'false',
  };
}

/**
 * A log-safe view of the environment: secret NAMES and whether they are set,
 * never values.
 */
export function describeEnv(env: Env): Record<string, string> {
  return {
    allowedDomains: env.ALLOWED_DOMAINS ?? '(unset)',
    cloudinaryConfigured: String(Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_UPLOAD_PRESET)),
    supabaseConfigured: String(Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY)),
  };
}