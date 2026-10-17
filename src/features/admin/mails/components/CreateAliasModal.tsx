/**
 * New email alias dialog.
 *
 * Was one of the two hand-rolled modals in AdminMails.tsx: a fixed overlay
 * painted straight into the page, with no focus trap, no Escape handling, no
 * `role="dialog"` / `aria-modal`, and no height cap — so a short viewport could
 * push the Create button below the fold with no way to scroll to it. It is now
 * the shared Radix-backed Modal, with the actions in its footer so they stay
 * reachable while the body scrolls.
 *
 * The submit button sits outside the <form> and is wired to it by id through
 * the `form` attribute, which is what lets the footer stay pinned instead of
 * scrolling away under the form.
 *
 * Validation deliberately does NOT live here. It stays in the parent's submit
 * handler so the toast it raises has one owner and the same rules apply no
 * matter whether the form is submitted by the button or by pressing Enter.
 *
 * @module CreateAliasModal
 */

import { useId } from 'react';
import { Plus } from 'lucide-react';
import { Modal } from '../../../shared/ui';

export interface AliasForm {
  email: string;
  name: string;
  recipientEmail: string;
}

const DOMAIN = '@sternmedafrika.com';

const field =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25';
const label = 'mb-1.5 block text-sm font-medium text-slate-700';

export interface CreateAliasModalProps {
  alias: AliasForm;
  onChange: (alias: AliasForm) => void;
  onSubmit: () => void;
  onClose: () => void;
  isCreating: boolean;
}

export function CreateAliasModal({
  alias,
  onChange,
  onSubmit,
  onClose,
  isCreating,
}: CreateAliasModalProps) {
  const formId = useId();

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Create Email Alias"
      size="md"
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            disabled={isCreating}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isCreating ? 'Creating…' : (
              <>
                <Plus size={16} aria-hidden="true" />
                Create Alias
              </>
            )}
          </button>
        </div>
      }
    >
      <form
        id={formId}
        onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
        className="flex flex-col gap-4"
      >
        <div>
          <label htmlFor="ca-alias" className={label}>
            Alias Name
          </label>
          <input
            id="ca-alias"
            type="text"
            data-modal-autofocus
            value={alias.email}
            // Strips anything from an "@" onwards so the local part cannot
            // smuggle in a domain of its own — the alias always resolves to the
            // official one.
            onChange={(e) => onChange({ ...alias, email: e.target.value.replace(/@.*$/, '') })}
            placeholder="kennedy"
            className={field}
          />
          <p className="mt-1 text-xs text-slate-500">
            Will become:{' '}
            <span className="font-mono text-primary-600">
              {alias.email || 'alias'}
              {DOMAIN}
            </span>
          </p>
        </div>

        <div>
          <label htmlFor="ca-name" className={label}>
            Display Name
          </label>
          <input
            id="ca-name"
            type="text"
            value={alias.name}
            onChange={(e) => onChange({ ...alias, name: e.target.value })}
            placeholder="Kennedy Omondi"
            className={field}
          />
        </div>

        <div>
          <label htmlFor="ca-recipient" className={label}>
            Recipient Email (for credentials)
          </label>
          <input
            id="ca-recipient"
            type="email"
            value={alias.recipientEmail}
            onChange={(e) => onChange({ ...alias, recipientEmail: e.target.value })}
            placeholder="personal@example.com"
            className={field}
          />
          <p className="mt-1 text-xs text-slate-500">
            Login credentials will be sent here (for your reference)
          </p>
        </div>
      </form>
    </Modal>
  );
}