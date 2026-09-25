import { Link, useLocation } from 'react-router-dom';
import { type ComponentType, ReactNode, useEffect } from 'react';
import { LayoutDashboard, Package, Mail, Users, Settings, Image as ImageIcon, LayoutList, LayoutTemplate, ShoppingCart, X, AlertCircle, FileText } from 'lucide-react';
import { User } from '../../types';

interface NavItem {
  to: string;
  icon: ComponentType<{ size?: number }>;
  label: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/categories', icon: LayoutList, label: 'Categories' },
  { to: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/admin/landing-config', icon: LayoutTemplate, label: 'Landing Config' },
  { to: '/admin/banners', icon: ImageIcon, label: 'Banners' },
  { to: '/admin/mails', icon: Mail, label: 'Mails', adminOnly: true },
  { to: '/admin/emails', icon: Mail, label: 'Email Platform' },
  { to: '/admin/users', icon: Users, label: 'Users & Roles', adminOnly: true },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

interface AdminSidebarProps {
  user: User;
  children?: ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ user, children, isOpen = true, onClose }: AdminSidebarProps) {
  const location = useLocation();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (isOpen && window.innerWidth < 1024) {
      const handleLinkClick = () => onClose?.();
      const links = document.querySelectorAll('aside a');
      links.forEach(link => link.addEventListener('click', handleLinkClick));
      return () => links.forEach(link => link.removeEventListener('click', handleLinkClick));
    }
  }, [isOpen, onClose]);

  return (
    <aside
      className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-white border-r border-primary-200 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-primary-200">
        <Link to="/admin" className="flex items-center">
          <img
            src="https://res.cloudinary.com/dxb22swfg/image/upload/v1765747561/Asset_4_v5ksi6.png"
            alt="Sternmed Afrika Admin"
            className="h-8 w-auto"
            referrerPolicy="no-referrer"
          />
        </Link>
        <button
          onClick={onClose}
          className="lg:hidden p-1 text-primary-600 hover:text-primary-800 rounded-md hover:bg-primary-50"
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navItems
            .filter((item) => !item.adminOnly || user.role === 'admin')
            .map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium
                    ${isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-primary-600 hover:bg-primary-50'}
                  `}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
        </nav>
      </div>

      {children && <div className="border-t border-primary-900">{children}</div>}
    </aside>
  );
}
