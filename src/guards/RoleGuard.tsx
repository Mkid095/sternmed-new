/**
 * Route guard for admin pages.
 *
 * Why this exists
 * ---------------
 * `RoleGuard` declared a `requiredPermission` prop and never used it. It was
 * destructured away and only `allowedRoles` was checked, so every call site
 * that reached for per-page permissions was silently a no-op.
 *
 * With page-level access control in place (see
 * `features/admin/permissions`), hiding a nav item is not access control: the
 * URL still resolves and the page still loads. This is the layer that stops
 * that, so a staff member without Orders cannot reach `/admin/orders` by typing
 * it.
 *
 * Client-side guarding is a usability feature, not a security boundary — the
 * bundle is public and a determined caller can always call the API directly.
 * The real enforcement for sensitive tables is RLS and the edge functions. It
 * is still worth doing: it stops the ordinary mistake of following a stale link.
 */

import { ReactNode } from 'react';
import { User, Role } from '../types';
import { useAuthStore } from '../store/authStore';
import { canAccessPage } from '../features/admin/permissions';
import { AlertTriangle, Home } from 'lucide-react';

interface RoleGuardProps {
  children: ReactNode;
  /** Restrict by role. Kept for the coarse admin/staff split. */
  allowedRoles?: Role[];
  /**
   * Key in `users.permissions` required to view this page. Admins pass this
   * automatically — `canAccessPage` returns true for them.
   */
  requiredPermission?: string;
  fallback?: ReactNode;
}

export default function RoleGuard({
  children,
  allowedRoles,
  requiredPermission,
  fallback,
}: RoleGuardProps) {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <>{fallback ?? null}</>;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <>{fallback ?? <AccessDenied user={user} />}</>;
  }

  if (requiredPermission && !canAccessPage(user, requiredPermission)) {
    return <>{fallback ?? <AccessDenied user={user} />}</>;
  }

  return <>{children}</>;
}

/**
 * Shown when the guard blocks a page.
 *
 * It says plainly that this is a permissions limit rather than a missing page,
 * because the two look identical otherwise and "you do not have access" is the
 * only thing an admin needs to act on.
 */
function AccessDenied({ user }: { user: User }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-16 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-amber-50">
        <AlertTriangle size={24} className="text-amber-500" aria-hidden="true" />
      </div>
      <h2 className="mb-1 text-base font-semibold text-slate-900">You do not have access to this page</h2>
      <p className="mb-5 max-w-sm text-sm text-slate-500">
        Your account does not include this page. Ask an administrator to enable it for you.
      </p>
      <a
        href="/admin"
        className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
      >
        <Home size={15} aria-hidden="true" />
        Back to the dashboard
        {user.role === 'staff' && <span className="sr-only">(if permitted)</span>}
      </a>
    </div>
  );
}