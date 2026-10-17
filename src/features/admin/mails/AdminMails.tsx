/**
 * Email alias administration.
 *
 * What changed
 * ------------
 * - **The page title is gone.** The layout header already reads "Mails", so the
 *   page printed the same word twice, 40px apart.
 * - **Palette and spacing now match the rest of the admin** (primary/slate,
 *   `flex flex-col gap-4 pb-10`) instead of the old blue/gray `p-6` treatment.
 * - **A search box**, because the alias list is only ever going to grow.
 * - **The duplicated "Email Users" panel is gone.** Every row in it repeated an
 *   alias that already appeared above with the same address and the same
 *   "Access Mailbox" button.
 * - **Loading and failure are distinguishable.** Both fetches used to log to
 *   the console and render as though there were simply no aliases.
 *
 * The create flow is unchanged: same validation, same insert, same edge
 * functions, same credentials panel. Password generation, the credentials
 * email and the data fetching moved into `hooks/useEmailAliases.ts`.
 *
 * @module AdminMails
 */

import { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { Plus, Mail, Search, X, ExternalLink, AlertTriangle } from 'lucide-react';
import {
  useEmailAliases,
  type AliasForm,
  type AliasCredentials,
  type EmailAlias,
} from './hooks/useEmailAliases';
import { AliasRow } from './components/AliasRow';
import { CreateAliasModal } from './components/CreateAliasModal';
import { AliasCredentialsModal } from './components/AliasCredentialsModal';
import { ConfirmationModal, useConfirmationModal, useToastSuccess, useToastError } from '../../shared/ui';
import { MAIL_APP_URL } from '../../../constants';

export function AdminMails() {
  const {
    aliases,
    loading,
    error,
    userByAliasId,
    createAlias,
    deleteAlias,
    setAliasActive,
  } = useEmailAliases();

  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<AliasCredentials | null>(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState<AliasForm>({ email: '', name: '', recipientEmail: '' });
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const { confirm, props } = useConfirmationModal();
  const showSuccess = useToastSuccess();
  const showError = useToastError();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return aliases;
    return aliases.filter(
      (a) =>
        a.alias_email.toLowerCase().includes(q) ||
        a.display_name.toLowerCase().includes(q),
    );
  }, [aliases, search]);

  const activeCount = aliases.filter((a) => a.is_active).length;

  const closeCreate = () => {
    setShowCreateModal(false);
    setForm({ email: '', name: '', recipientEmail: '' });
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const credentials = await createAlias(form);
      closeCreate();
      setCreatedCredentials(credentials);
      setShowCredentialsModal(true);
      showSuccess('Email alias created');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not create the alias';
      if (message.includes('EMAIL_EXISTS')) {
        showError('A user with this email already exists');
      } else if (message.includes('INVALID_EMAIL')) {
        showError('That email address is not valid');
      } else {
        showError(message);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (alias: EmailAlias, isActive: boolean) => {
    setBusyId(alias.id);
    try {
      await setAliasActive(alias.id, isActive);
      showSuccess(isActive ? `${alias.alias_email} is receiving mail` : `${alias.alias_email} paused`);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Could not change the alias');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (alias: EmailAlias) => {
    const confirmed = await confirm({
      title: 'Delete email alias',
      message: `${alias.alias_email} will be deleted, along with the login account behind it. This cannot be undone. If you only want to stop mail arriving, pause it instead.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });
    if (!confirmed) return;

    setBusyId(alias.id);
    try {
      await deleteAlias(alias.id);
      showSuccess('Alias deleted');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Could not delete the alias');
    } finally {
      setBusyId(null);
    }
  };

  const copyCredentials = () => {
    if (!createdCredentials) return;
    const text = `Email: ${createdCredentials.email}\nPassword: ${createdCredentials.password}\n\nLogin at: ${MAIL_APP_URL}\n\nCreated for: ${createdCredentials.name} (${createdCredentials.recipientEmail})`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showSuccess('Credentials copied');
  };

  return (
    <div className="flex flex-col gap-4 pb-10">
      {/* No page title — the layout header bar already reads "Mails". */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {loading
            ? 'Loading aliases…'
            : aliases.length === 0
              ? 'No aliases yet'
              : `${activeCount} of ${aliases.length} receiving mail`}
        </p>

        <div className="flex items-center gap-2">
          <a
            href={MAIL_APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <ExternalLink size={14} aria-hidden="true" />
            Open platform
          </a>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="hidden items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-primary-700 sm:flex"
          >
            <Plus size={18} aria-hidden="true" />
            New alias
          </button>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 flex-shrink-0" />
          Could not load the aliases — {error}
        </p>
      )}

      {/* Search */}
      <div className="relative">
        <Search
          size={15}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by address or name"
          aria-label="Search email aliases"
          className={clsx(
            'w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 text-sm text-slate-900',
            'placeholder:text-slate-400 transition-colors',
            'hover:border-slate-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25',
            search ? 'pr-9' : 'pr-3',
          )}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={14} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Alias list */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-primary-600" />
        </div>
      ) : aliases.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-slate-100">
            <Mail size={28} className="text-slate-300" aria-hidden="true" />
          </div>
          <h2 className="mb-2 text-base font-semibold text-slate-900">No email aliases yet</h2>
          <p className="mx-auto mb-5 max-w-sm text-sm text-slate-500">
            Create an alias to give someone their own address and login for the mail platform.
          </p>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-primary-700"
          >
            <Plus size={18} aria-hidden="true" />
            Create your first alias
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center">
          <p className="text-sm font-medium text-slate-700">No alias matches “{search}”</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {filtered.map((alias) => (
            <AliasRow
              key={alias.id}
              alias={alias}
              linkedUser={userByAliasId.get(alias.id)}
              isBusy={busyId === alias.id}
              onToggleActive={handleToggleActive}
              onOpenMailbox={() => window.open(MAIL_APP_URL, '_blank', 'noopener')}
              onDelete={handleDelete}
            />
          ))}
        </ul>
      )}

      {showCreateModal && (
        <CreateAliasModal
          alias={form}
          onChange={setForm}
          onSubmit={handleCreate}
          onClose={closeCreate}
          isCreating={creating}
        />
      )}

      {showCredentialsModal && createdCredentials && (
        <AliasCredentialsModal
          credentials={createdCredentials}
          hasCopied={copied}
          onCopy={copyCredentials}
          onClose={() => {
            setShowCredentialsModal(false);
            setCreatedCredentials(null);
          }}
        />
      )}

      {/* Mobile FAB */}
      <button
        type="button"
        onClick={() => setShowCreateModal(true)}
        aria-label="Create email alias"
        className="fixed bottom-20 right-4 z-30 grid h-14 w-14 place-items-center rounded-full bg-primary-600 text-white shadow-lg transition-all active:scale-95 sm:hidden"
      >
        <Plus size={24} aria-hidden="true" />
      </button>

      <ConfirmationModal {...props} />
    </div>
  );
}