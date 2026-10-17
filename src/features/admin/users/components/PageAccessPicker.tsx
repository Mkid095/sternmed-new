/**
 * Page access picker for a staff account.
 *
 * Grants a staff member specific admin pages instead of all-or-nothing. An
 * admin gets everything and so has nothing to pick here.
 *
 * Design notes
 * ------------
 * The toggles are grouped by area rather than listed flat, because the question
 * an admin is actually answering is "what may this person do?" and eight
 * unrelated switches do not answer it. Each row says what the page grants, so
 * "Orders" is a decision rather than a label to decode.
 *
 * "None" and "Everything" are explicit rather than implied by the count. Both
 * are ordinary choices — a staff member who only needs read-only oversight is
 * a real case — and hiding them behind "clear the boxes" makes them look like
 * an accident.
 *
 * @module PageAccessPicker
 */

import { clsx } from 'clsx';
import { Check } from 'lucide-react';
import { Toggle } from '../../../shared/ui';
import { ADMIN_PAGE_GROUPS, type AdminPageAccess } from '../../permissions';

export interface PageAccessPickerProps {
  /** Currently granted page keys. */
  granted: Set<string>;
  onChange: (next: Set<string>) => void;
  /** Admins are unrestricted, so the picker is hidden for them. */
  hidden?: boolean;
}

export function PageAccessPicker({ granted, onChange, hidden = false }: PageAccessPickerProps) {
  if (hidden) return null;

  const allPages = ADMIN_PAGE_GROUPS.flatMap((group) => group.pages);
  const hasAll = allPages.every((page) => granted.has(page.key));
  const hasNone = allPages.every((page) => !granted.has(page.key));

  const toggle = (page: AdminPageAccess, on: boolean) => {
    const next = new Set(granted);
    if (on) next.add(page.key);
    else next.delete(page.key);
    onChange(next);
  };

  return (
    <fieldset className="rounded-xl border border-slate-200 p-4">
      <legend className="sr-only">Page access</legend>

      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-800">Pages they can open</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {hasAll
              ? 'Everything below is enabled.'
              : hasNone
                ? 'None selected — this account sees no admin pages.'
                : `${granted.size} of ${allPages.length} enabled.`}
          </p>
        </div>

        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => onChange(new Set(allPages.map((page) => page.key)))}
            disabled={hasAll}
            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
          >
            Everything
          </button>
          <button
            type="button"
            onClick={() => onChange(new Set())}
            disabled={hasNone}
            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
          >
            None
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {ADMIN_PAGE_GROUPS.map((group) => {
          if (group.pages.length === 0) return null;

          return (
            <div key={group.name}>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {group.name}
              </p>

              <ul className="flex flex-col gap-2">
                {group.pages.map((page) => {
                  const on = granted.has(page.key);
                  return (
                    <li key={page.key}>
                      <Toggle
                        checked={on}
                        onCheckedChange={(next) => toggle(page, next)}
                        label={
                          <span className="flex items-center gap-2">
                            {page.label}
                            {on && (
                              <Check size={13} aria-hidden="true" className="text-primary-600" />
                            )}
                          </span>
                        }
                        hint={page.description}
                        className={clsx(
                          'rounded-lg border px-3 py-2 transition-colors',
                          on ? 'border-primary-200 bg-primary-50/40' : 'border-slate-100',
                        )}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}