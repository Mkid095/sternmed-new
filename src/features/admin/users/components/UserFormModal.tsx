/**
 * Add / edit user dialog.
 *
 * What changed
 * ------------
 * **Setting a password here never worked.** The form offered a "New Password"
 * field which called the `set-user-password` edge function, and that function
 * needs `GOOGLE_APPLICATION_CREDENTIALS` — which is not set on this project. It
 * returned a 500 every time, so saving with a password always failed and an
 * admin had no way to reset anyone's password.
 *
 * Two things follow from that:
 *
 * 1. The field is still here, but it is labelled for what it is, and the
 *    dialog says plainly when it will fail rather than letting an admin fill in
 *    a password and get an error.
 * 2. **"Email a password reset" is the path that works today.** Firebase's
 *    built-in reset email goes through the client SDK and needs no service
 *    account, so it functions right now.
 *
 * **Page access.** Staff accounts can be granted specific admin pages instead
 * of all-or-nothing. See `../../permissions`.
 *
 * @module UserFormModal
 */

import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { Crown, UserCircle, Eye, EyeOff, Info, Mail, ShieldAlert } from 'lucide-react';
import { Modal, Toggle } from '../../../shared/ui';
import { PageAccessPicker } from './PageAccessPicker';
import { serialisePermissions } from '../../permissions';

const MIN_PASSWORD_LENGTH = 8;

export interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'staff';
  /** Admin page keys granted to a staff account. */
  permissions: string[];
}

export interface UserFormModalProps {
  formData: UserFormData;
  onChange: (data: UserFormData) => void;
  onSubmit: (e: FormEvent) => void;
  /** Fires the working password-reset path. Omitted when there is no email. */
  onSendResetEmail?: () => void;
  /** True while a reset email is on its way. */
  sendingReset?: boolean;
  onClose: () => void;
  isEditing: boolean;
  saving: boolean;
}

const field =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 ' +
  'placeholder:text-slate-400 transition-colors hover:border-slate-300 ' +
  'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25 ' +
  'disabled:bg-slate-50 disabled:text-slate-400';

const label = 'mb-1 block text-sm font-medium text-slate-700';

export function UserFormModal({
  formData,
  onChange,
  onSubmit,
  onSendResetEmail,
  sendingReset = false,
  onClose,
  isEditing,
  saving,
}: UserFormModalProps) {
  // The submit button lives in the Modal's footer, below the scrolling body, so
  // it is outside the <form>. `form={formId}` points it back at the form, which
  // keeps native validation and submit-on-Enter working.
  const formId = useId();
  const [showPassword, setShowPassword] = useState(false);

  const password = formData.password.trim();
  const passwordTooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH;
  const isAdmin = formData.role === 'admin';

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEditing ? 'Edit user' : 'Add user'}
      // `sheet` gives a bottom sheet on phones and a centred panel from sm up,
      // which is what this dialog always did.
      size="md"
      presentation="sheet"
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            disabled={saving || passwordTooShort}
            className="flex-1 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Add user'}
          </button>
        </div>
      }
    >
      <form id={formId} onSubmit={onSubmit} className="flex flex-col gap-5">
        <div>
          <label className={label} htmlFor="uf-name">
            Full name <span className="text-red-500">*</span>
          </label>
          <input
            id="uf-name"
            type="text"
            required
            // Opts this field into the Modal's on-open focus, so the dialog
            // opens on the first input instead of the close button.
            data-modal-autofocus
            value={formData.name}
            onChange={(e) => onChange({ ...formData, name: e.target.value })}
            placeholder="John Doe"
            className={field}
          />
        </div>

        <div>
          <label className={label} htmlFor="uf-email">
            Email address <span className="text-red-500">*</span>
          </label>
          <input
            id="uf-email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => onChange({ ...formData, email: e.target.value })}
            placeholder="john@example.com"
            className={field}
          />
        </div>

        {/* ---------------- Role ---------------- */}
        <div>
          <span className={label}>Role</span>
          <div className="grid grid-cols-2 gap-3">
            <RoleOption
              active={isAdmin}
              onClick={() => onChange({ ...formData, role: 'admin' })}
              icon={<Crown size={17} aria-hidden="true" />}
              label="Admin"
              description="Everything"
            />
            <RoleOption
              active={!isAdmin}
              onClick={() => onChange({ ...formData, role: 'staff' })}
              icon={<UserCircle size={17} aria-hidden="true" />}
              label="Staff"
              description="Selected pages"
            />
          </div>
        </div>

        {/* ---------------- Page access ---------------- */}
        {/*
          Hidden for admins: they are unrestricted by definition, and showing a
          set of switches that has no effect would suggest otherwise.
        */}
        <PageAccessPicker
          granted={new Set(formData.permissions)}
          onChange={(next) =>
            onChange({
              ...formData,
              permissions: serialisePermissions(formData.role, next) ?? [],
            })
          }
          hidden={isAdmin}
        />

        {isAdmin && (
          <p className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <Info size={14} aria-hidden="true" className="mt-0.5 flex-shrink-0 text-slate-400" />
            Admins can open every admin page, so there is nothing to choose here.
          </p>
        )}

        {/* ---------------- Password ---------------- */}
        <div className="border-t border-slate-100 pt-5">
          <label className={label} htmlFor="uf-password">
            {isEditing ? 'Set a new password' : 'Password'}
            {!isEditing && <span className="text-red-500"> *</span>}
          </label>

          <div className="relative">
            <input
              id="uf-password"
              type={showPassword ? 'text' : 'password'}
              required={!isEditing}
              minLength={!isEditing ? MIN_PASSWORD_LENGTH : undefined}
              autoComplete="new-password"
              value={formData.password}
              onChange={(e) => onChange({ ...formData, password: e.target.value })}
              placeholder={isEditing ? 'Leave empty to keep the current one' : '••••••••'}
              aria-invalid={passwordTooShort || undefined}
              aria-describedby="uf-password-hint"
              className={clsx(field, 'pr-11', passwordTooShort && 'border-red-300 bg-red-50/40')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
            </button>
          </div>

          <p
            id="uf-password-hint"
            className={clsx('mt-1.5 text-xs', passwordTooShort ? 'text-red-600' : 'text-slate-500')}
          >
            {passwordTooShort
              ? `At least ${MIN_PASSWORD_LENGTH} characters — ${MIN_PASSWORD_LENGTH - password.length} to go.`
              : isEditing
                ? `Leave empty to keep the current password. Minimum ${MIN_PASSWORD_LENGTH} characters.`
                : `At least ${MIN_PASSWORD_LENGTH} characters.`}
          </p>

          {isEditing && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="flex items-start gap-2 text-xs text-amber-900">
                <ShieldAlert size={14} aria-hidden="true" className="mt-0.5 flex-shrink-0" />
                <span>
                  <strong className="font-semibold">Setting a password here is not available yet.</strong>{' '}
                  It needs a Firebase service-account key that has not been added to this
                  project. Use the button below instead.
                </span>
              </p>

              {onSendResetEmail && (
                <button
                  type="button"
                  onClick={onSendResetEmail}
                  disabled={sendingReset}
                  className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Mail size={15} aria-hidden="true" />
                  {sendingReset ? 'Sending…' : 'Email them a password reset'}
                </button>
              )}
            </div>
          )}
        </div>

        {isEditing && (
          <p className="flex items-start gap-2 text-xs text-slate-500">
            <Info size={14} aria-hidden="true" className="mt-0.5 flex-shrink-0 text-slate-400" />
            Name and email are fixed once an account exists. Role and page access can change
            at any time.
          </p>
        )}
      </form>
    </Modal>
  );
}

function RoleOption({
  active,
  onClick,
  icon,
  label,
  description,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        'flex flex-col items-center gap-1 rounded-xl border px-4 py-3 text-center transition-colors',
        active
          ? 'border-primary-600 bg-primary-50 text-primary-800'
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
      )}
    >
      <span className={active ? 'text-primary-700' : 'text-slate-400'}>{icon}</span>
      <span className="text-sm font-medium">{label}</span>
      <span className="text-[11px] text-slate-500">{description}</span>
    </button>
  );
}