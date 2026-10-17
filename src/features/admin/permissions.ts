/**
 * Admin page access control.
 *
 * `role` decides who you are; `permissions` decides which pages you may open.
 * Staff accounts get the second one so someone can be given Orders without also
 * getting Settings and user management.
 *
 * One definition, used by both the sidebar (which hides what you cannot open)
 * and the user form (which offers exactly these toggles). Two separate lists
 * would drift, and the failure mode is silent: a page the form can grant but
 * the sidebar never shows, or worse, one the sidebar hides from someone the
 * form promised.
 *
 * @module permissions
 */

import type { Role, User } from '../../types';

export interface AdminPageAccess {
  /** Page key stored in `users.permissions`. Matches the route under /admin. */
  key: string;
  label: string;
  /** One line on what holding this key actually grants. */
  description: string;
  group: 'Overview' | 'Catalogue' | 'Sales' | 'System';
}

/**
 * Every admin page an account can be given access to.
 *
 * `Settings` is deliberately absent: it holds the site's contact details and
 * legal text, and there is no staff reason to edit those. Admins still reach it
 * through the unrestricted default — this list only governs what a staff
 * checkbox can hand out.
 */
export const ADMIN_PAGES: AdminPageAccess[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    description: 'Revenue, order and sales charts',
    group: 'Overview',
  },
  {
    key: 'products',
    label: 'Products',
    description: 'Add, edit and retire products',
    group: 'Catalogue',
  },
  {
    key: 'categories',
    label: 'Categories',
    description: 'Categories and what appears on the home page',
    group: 'Catalogue',
  },
  {
    key: 'banners',
    label: 'Banners',
    description: 'The home page carousel and its links',
    group: 'Catalogue',
  },
  {
    key: 'landing-config',
    label: 'Landing page',
    description: 'Which sections the home page is made of',
    group: 'Catalogue',
  },
  {
    key: 'orders',
    label: 'Orders',
    description: 'View orders and change their status',
    group: 'Sales',
  },
  {
    key: 'mails',
    label: 'Mails',
    description: 'Email aliases and mail accounts',
    group: 'System',
  },
  {
    key: 'users',
    label: 'Users & roles',
    description: 'Invite staff and change what they can see',
    group: 'System',
  },
];

/** Pages grouped for display, in the order the form should show them. */
export const ADMIN_PAGE_GROUPS: Array<{
  name: AdminPageAccess['group'];
  pages: AdminPageAccess[];
}> = [
  { name: 'Overview', pages: ADMIN_PAGES.filter((p) => p.group === 'Overview') },
  { name: 'Catalogue', pages: ADMIN_PAGES.filter((p) => p.group === 'Catalogue') },
  { name: 'Sales', pages: ADMIN_PAGES.filter((p) => p.group === 'Sales') },
  { name: 'System', pages: ADMIN_PAGES.filter((p) => p.group === 'System') },
];

/** Narrow a possibly-missing stored value to a known page key. */
function isKnownKey(key: string): key is string {
  return ADMIN_PAGES.some((page) => page.key === key);
}

/**
 * The pages this user may open.
 *
 * `null`/`undefined` permissions mean unrestricted — that is the admin case and
 * the default for any account created before this column existed. Storing an
 * explicit list for staff means revoking access is just removing a key, and
 * there is never a question about what the default was.
 *
 * Unknown keys are dropped rather than trusted: a page key this build does not
 * recognise cannot grant anything, and keeping it would suggest it did.
 */
export function permittedPages(user: Pick<User, 'role' | 'permissions'> | null): Set<string> | null {
  if (!user) return null;
  if (user.role === 'admin') return null;
  if (!Array.isArray(user.permissions)) return new Set<string>();
  return new Set(user.permissions.filter(isKnownKey));
}

/** True when this user may open `pageKey`. Admins may open everything. */
export function canAccessPage(
  user: Pick<User, 'role' | 'permissions'> | null,
  pageKey: string,
): boolean {
  const allowed = permittedPages(user);
  return allowed === null || allowed.has(pageKey);
}

/**
 * The value to persist for a set of granted keys.
 *
 * Admins store `null` so they are never locked out by a stale list. Staff store
 * the array, empty included — an empty array means "no admin pages", which is
 * a real state and is different from the unrestricted `null`.
 */
export function serialisePermissions(
  role: Role,
  granted: Set<string>,
): string[] | null {
  if (role === 'admin') return null;
  return ADMIN_PAGES.filter((page) => granted.has(page.key)).map((page) => page.key);
}