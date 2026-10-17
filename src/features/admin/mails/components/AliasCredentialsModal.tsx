/**
 * Newly-created alias credentials, shown once after a successful create.
 *
 * The second of the two hand-rolled modals in AdminMails.tsx. Same defects as
 * the create dialog — no focus trap, no Escape, no dialog role — plus a
 * `max-h-[70vh] overflow-y-auto` on the body that fought with the surrounding
 * panel. Now the shared Radix-backed Modal, which owns the height cap, so the
 * body scrolls and the Close / Copy buttons stay pinned.
 *
 * The green success banner that used to be the hand-rolled header now sits at
 * the top of the body. It stays visible because the dialog is the only place
 * these credentials are ever shown: the password was emailed as a best-effort,
 * so if that send failed the admin's clipboard is the last copy.
 *
 * @module AliasCredentialsModal
 */

import { Check, Copy } from 'lucide-react';
import { Modal } from '../../../shared/ui';
import { MAIL_APP_URL } from '../../../../constants';

export interface AliasCredentials {
  email: string;
  password: string;
  name: string;
  recipientEmail: string;
}

export interface AliasCredentialsModalProps {
  credentials: AliasCredentials;
  hasCopied: boolean;
  onCopy: () => void;
  onClose: () => void;
}

export function AliasCredentialsModal({
  credentials,
  hasCopied,
  onCopy,
  onClose,
}: AliasCredentialsModalProps) {
  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Email Alias Created!"
      size="md"
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onCopy}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            {hasCopied ? (
              <>
                <Check size={16} aria-hidden="true" />
                Copied!
              </>
            ) : (
              <>
                <Copy size={16} aria-hidden="true" />
                Copy Credentials
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Success banner, promoted out of the old hand-rolled header. */}
        <div className="flex items-center gap-3 rounded-xl bg-green-50 p-3.5">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-500">
            <Check size={22} className="text-white" aria-hidden="true" />
          </div>
          <p className="text-sm text-slate-600">
            Share these credentials with the user
          </p>
        </div>

        <div className="rounded-xl border border-primary-200 bg-primary-50 p-4">
          <h3 className="mb-2 font-semibold text-primary-700">User Information</h3>
          <p className="text-sm text-primary-700">
            <strong>Name:</strong> {credentials.name}
          </p>
          <p className="text-sm text-primary-700">
            <strong>Recipient Email:</strong> {credentials.recipientEmail}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="mb-3 font-semibold text-slate-900">Login Credentials</h3>
          <div className="flex flex-col gap-3">
            <div>
              <span className="text-xs uppercase tracking-wide text-slate-500">Email</span>
              <div className="mt-1">
                <code className="block break-all rounded border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900">
                  {credentials.email}
                </code>
              </div>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wide text-slate-500">
                Temporary Password
              </span>
              <div className="mt-1">
                <code className="block break-all rounded border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900">
                  {credentials.password}
                </code>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm text-amber-800">
            <strong>Important:</strong> The user should change their password after first login at{' '}
            <a
              href={MAIL_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-amber-900"
            >
              mail.sternmedafrika.com
            </a>
          </p>
        </div>
      </div>
    </Modal>
  );
}