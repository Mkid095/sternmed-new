import { User } from '../../types';
import { LogOut } from 'lucide-react';
import { clsx } from 'clsx';

interface AdminUserMenuProps {
  user: User;
  onLogout: () => void;
  /**
   * Desktop rail is collapsed to icons only.
   *
   * Without this the name and role labels rendered at full width inside a 68px
   * rail and spilled out over the page content.
   */
  collapsed?: boolean;
}

export function AdminUserMenu({ user, onLogout, collapsed = false }: AdminUserMenuProps) {
  const initial = user.name.charAt(0).toUpperCase();

  return (
    <div className={clsx('border-t border-slate-200', collapsed ? 'p-2' : 'p-3')}>
      {collapsed ? (
        // Avatar alone carries identity in the rail; the title supplies the
        // name on hover and the accessible name.
        <div
          className="grid h-10 w-10 place-items-center rounded-full bg-primary-600 text-sm font-semibold text-white"
          title={`${user.name} — ${user.role}`}
          aria-label={`${user.name}, ${user.role}`}
        >
          {initial}
        </div>
      ) : (
        <div className="mb-3 flex items-center gap-2">
          <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-primary-600 text-sm font-bold text-white">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
            <p className="truncate text-xs capitalize text-slate-500">{user.role}</p>
          </div>
        </div>
      )}

      <button
        onClick={onLogout}
        // Icon-only in the rail, so the label has to be explicit there.
        aria-label={collapsed ? 'Log out' : undefined}
        title={collapsed ? 'Log out' : undefined}
        className={clsx(
          'flex w-full items-center rounded-lg text-sm text-red-600 transition-colors hover:bg-red-50',
          collapsed ? 'justify-center px-0 py-2.5' : 'gap-2 px-3 py-2',
        )}
      >
        <LogOut size={16} className="shrink-0" />
        {!collapsed && <span>Log out</span>}
      </button>
    </div>
  );
}