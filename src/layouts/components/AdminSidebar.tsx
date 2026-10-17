/**
 * Admin sidebar.
 *
 * Has two independent states, which used to be conflated into one:
 *
 * - `isOpen` controls the mobile drawer (off-canvas, slides in over content).
 * - `collapsed` controls the desktop rail (256px expanded, 68px icon-only).
 *
 * The header's "Toggle menu" button is desktop-only, yet it was wired to
 * `isOpen`, which desktop ignores — so on a desktop screen the button did
 * nothing at all. The two are now separate, and `collapsed` persists.
 *
 * Items are grouped by purpose. A single ten-row list gives no clue which items
 * belong together, and made it look like a settings list rather than a
 * catalogue tool.
 */

import { Link, useLocation } from 'react-router-dom';
import { type ComponentType, type ReactNode, useEffect, useState } from 'react';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Package,
  Mail,
  Users,
  Settings,
  Image as ImageIcon,
  LayoutList,
  LayoutTemplate,
  ShoppingCart,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { User } from '../../types';

interface NavItem {
  to: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
  adminOnly?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Overview',
    items: [{ to: '/admin', icon: LayoutDashboard, label: 'Dashboard' }],
  },
  {
    title: 'Catalogue',
    items: [
      { to: '/admin/products', icon: Package, label: 'Products' },
      { to: '/admin/categories', icon: LayoutList, label: 'Categories' },
      { to: '/admin/banners', icon: ImageIcon, label: 'Banners' },
      { to: '/admin/landing-config', icon: LayoutTemplate, label: 'Landing page' },
    ],
  },
  {
    title: 'Sales',
    items: [{ to: '/admin/orders', icon: ShoppingCart, label: 'Orders' }],
  },
  {
    title: 'System',
    items: [
      { to: '/admin/mails', icon: Mail, label: 'Mails', adminOnly: true },
      { to: '/admin/users', icon: Users, label: 'Users & roles', adminOnly: true },
      { to: '/admin/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

const STORAGE_KEY = 'admin-sidebar-collapsed';

interface AdminSidebarProps {
  user: User;
  children?: ReactNode;
  /** Mobile drawer state. */
  isOpen?: boolean;
  onClose?: () => void;
  /** Desktop rail state. */
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

export function AdminSidebar({
  user,
  children,
  isOpen = true,
  onClose,
  collapsed = false,
  onToggleCollapsed,
}: AdminSidebarProps) {
  const location = useLocation();
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  // Only the desktop rail collapses. On a phone the sidebar is an off-canvas
  // drawer and a collapsed rail would be a 68px drawer over the whole screen.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    setIsDesktop(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Close the mobile drawer on navigation.
  useEffect(() => {
    if (isOpen && !isDesktop) onClose?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const railCollapsed = isDesktop && collapsed;

  return (
    <aside
      className={clsx(
        'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white',
        'transition-[width,transform] duration-200 ease-out lg:static',
        railCollapsed ? 'w-[68px]' : 'w-64',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}
    >
      <div
        className={clsx(
          'flex h-16 shrink-0 items-center border-b border-slate-200',
          railCollapsed ? 'justify-center px-2' : 'justify-between px-4',
        )}
      >
        {railCollapsed ? (
          // The logo itself becomes the way back out of the rail.
          <button
            onClick={onToggleCollapsed}
            aria-label="Expand sidebar"
            className="grid h-9 w-9 place-items-center rounded-lg transition-colors hover:bg-slate-100"
          >
            <img
              src="https://res.cloudinary.com/dxb22swfg/image/upload/v1765747561/Asset_4_v5ksi6.png"
              alt="Sternmed Afrika Admin"
              className="h-7 w-auto"
              referrerPolicy="no-referrer"
            />
          </button>
        ) : (
          <>
            <Link to="/admin" className="flex min-w-0 items-center">
              <img
                src="https://res.cloudinary.com/dxb22swfg/image/upload/v1765747561/Asset_4_v5ksi6.png"
                alt="Sternmed Afrika Admin"
                className="h-8 w-auto"
                referrerPolicy="no-referrer"
              />
            </Link>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 lg:hidden"
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </>
        )}
      </div>

      <nav
        className={clsx('flex-1 overflow-y-auto overflow-x-hidden py-3', railCollapsed ? 'px-2' : 'px-3')}
        aria-label="Admin sections"
      >
        {NAV_GROUPS.map((group) => {
          const visible = group.items.filter(
            (item) => !item.adminOnly || user.role === 'admin'
          );
          if (visible.length === 0) return null;

          return (
            <div key={group.title} className={clsx(railCollapsed ? 'mb-3' : 'mb-4 last:mb-0')}>
              {/*
                Collapsed, the section labels go away and the groups are
                separated by a hairline instead — otherwise ten icons run
                together as one undifferentiated column.
              */}
              {railCollapsed ? (
                <div className="mx-auto mb-2 h-px w-6 bg-slate-200" aria-hidden="true" />
              ) : (
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {group.title}
                </p>
              )}

              <ul className="flex flex-col gap-0.5">
                {visible.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.to;

                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        // In the rail the label is invisible, so it has to be
                        // exposed to assistive tech and on hover.
                        aria-current={isActive ? 'page' : undefined}
                        title={railCollapsed ? item.label : undefined}
                        className={clsx(
                          'group relative flex items-center rounded-lg text-sm font-medium transition-colors',
                          railCollapsed ? 'justify-center px-0 py-2' : 'gap-3 px-3 py-2',
                          isActive
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                        )}
                      >
                        {/* Active marker as a rail, not a filled block — it keeps
                            the eye on the item without recolouring the whole row. */}
                        {isActive && (
                          <span
                            aria-hidden="true"
                            className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-primary-600"
                          />
                        )}
                        <Icon size={18} strokeWidth={isActive ? 2.2 : 1.9} className="shrink-0" />
                        {!railCollapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {children && (
        <div className={clsx('shrink-0 border-t border-slate-200', railCollapsed && 'px-2')}>
          {children}
        </div>
      )}

      {/* Desktop-only rail toggle. The header bar's own button does the same
          thing; this one keeps the control next to the nav it affects. */}
      {isDesktop && onToggleCollapsed && (
        <button
          onClick={onToggleCollapsed}
          className={clsx(
            'hidden shrink-0 items-center gap-3 border-t border-slate-200 py-3 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800 lg:flex',
            railCollapsed ? 'justify-center px-0' : 'px-6',
          )}
          aria-label={railCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {railCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          {!railCollapsed && <span>Collapse</span>}
        </button>
      )}
    </aside>
  );
}

/** Reads the persisted rail state so a reload keeps the user's choice. */
export function loadCollapsed(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(STORAGE_KEY) === '1';
}

export function saveCollapsed(collapsed: boolean): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
}

export { STORAGE_KEY as ADMIN_SIDEBAR_COLLAPSED_KEY };