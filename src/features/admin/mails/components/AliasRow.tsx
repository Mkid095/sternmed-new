/**
 * One email alias row.
 *
 * What changed
 * ------------
 * **The address was printed twice.** Every row showed the alias email as the
 * heading and then "User: <the same address>" underneath, because the linked
 * login always has the same address. The second line carried no information, so
 * it is gone; the login is only mentioned when it differs, which is the case
 * worth knowing about.
 *
 * **The status badge was decoration.** `is_active` was rendered as an
 * Active/Inactive pill but nothing anywhere could change it, so an alias could
 * only be deleted outright. It is a real switch now.
 *
 * **Delete was a permanent red button on every row.** A wall of red down the
 * page reads as a list of emergencies. It is now a quiet icon that only turns
 * red on hover, and the destructive confirmation still sits behind it.
 *
 * The two icon actions carry `aria-label`s naming what they act on — a bare
 * icon with only a `title` tooltip is announced as just "button".
 *
 * @module AliasRow
 */

import { memo, type Key } from 'react';
import { clsx } from 'clsx';
import { ExternalLink, Trash2, UserCheck, UserX } from 'lucide-react';
import { Toggle } from '../../../shared/ui';
import type { EmailAlias, EmailUser } from '../hooks/useEmailAliases';

export interface AliasRowProps {
  key?: Key;
  alias: EmailAlias;
  /** The login account linked to this alias, if any. */
  linkedUser?: EmailUser;
  isBusy: boolean;
  onToggleActive: (alias: EmailAlias, isActive: boolean) => void;
  onOpenMailbox: (alias: EmailAlias) => void;
  onDelete: (alias: EmailAlias) => void;
}

/** First letters of a display name, for the avatar. */
function initialsOf(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const formatDate = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

function AliasRowComponent({
  alias,
  linkedUser,
  isBusy,
  onToggleActive,
  onOpenMailbox,
  onDelete,
}: AliasRowProps) {
  const created = formatDate(alias.created_at);
  // Only worth saying when the login address is not simply the alias again.
  const linkedEmailDiffers =
    linkedUser && linkedUser.email.toLowerCase() !== alias.alias_email.toLowerCase();

  return (
    <li
      className={clsx(
        'flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 transition-colors hover:bg-slate-50',
        !alias.is_active && 'bg-slate-50/60',
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          'grid h-10 w-10 flex-shrink-0 place-items-center rounded-full text-sm font-semibold',
          alias.is_active
            ? 'bg-primary-50 text-primary-700'
            : 'bg-slate-100 text-slate-400',
        )}
      >
        {initialsOf(alias.display_name)}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-slate-900">
          {alias.alias_email}
        </span>
        <span className="block truncate text-xs text-slate-500">
          {alias.display_name}
          {linkedEmailDiffers && (
            <>
              {' · '}
              <span className="text-slate-400">login {linkedUser.email}</span>
            </>
          )}
        </span>
      </span>

      {created && (
        <span className="hidden shrink-0 text-xs text-slate-400 lg:block">
          Added {created}
        </span>
      )}

      <span className="w-44 shrink-0">
        <Toggle
          checked={alias.is_active}
          onCheckedChange={(next) => onToggleActive(alias, next)}
          disabled={isBusy}
          label={alias.is_active ? 'Receiving mail' : 'Paused'}
          hint={alias.is_active ? undefined : 'Mail is not delivered'}
        />
      </span>

      <span className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onOpenMailbox(alias)}
          aria-label={`Open the mailbox for ${alias.alias_email}`}
          className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800"
        >
          <ExternalLink size={15} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => onDelete(alias)}
          disabled={isBusy}
          aria-label={`Delete ${alias.alias_email}`}
          className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
        >
          <Trash2 size={15} aria-hidden="true" />
        </button>
      </span>
    </li>
  );
}

export const AliasRow = memo(AliasRowComponent);

/** Exported for the page's summary line. */
export const AliasStatusIcon = alias =>
  alias.is_active ? (
    <UserCheck size={12} aria-hidden="true" className="text-emerald-600" />
  ) : (
    <UserX size={12} aria-hidden="true" className="text-slate-400" />
  );