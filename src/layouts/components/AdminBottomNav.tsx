import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  LayoutList,
  ShoppingCart,
  Image as ImageIcon,
  Mail,
  Users,
  Settings,
  X,
  LogOut,
  User
} from 'lucide-react';
import { clsx } from 'clsx';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { canAccessPage } from '../../features/admin/permissions';
import { useNavigate } from 'react-router-dom';

interface NavItem {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
  /** Key in `users.permissions` - the same list the sidebar uses. */
  pageKey: string;
}

const menuItems: NavItem[] = [
  { to: '/admin', pageKey: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/products', pageKey: 'products', icon: Package, label: 'Products' },
  { to: '/admin/categories', pageKey: 'categories', icon: LayoutList, label: 'Categories' },
  { to: '/admin/orders', pageKey: 'orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/admin/landing-config', pageKey: 'landing-config', icon: LayoutDashboard, label: 'Landing Page' },
  { to: '/admin/banners', pageKey: 'banners', icon: ImageIcon, label: 'Banners' },
  { to: '/admin/mails', pageKey: 'mails', icon: Mail, label: 'Mails' },
  { to: '/admin/users', pageKey: 'users', icon: Users, label: 'Users' },
  { to: '/admin/settings', pageKey: 'settings', icon: Settings, label: 'Settings' },
];

export function AdminBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Check if current path matches the nav item
  const isActive = (to: string) => {
    if (to === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname === to;
  };

  const handleMenuClick = (to: string) => {
    setMenuOpen(false);
    navigate(to);
  };

  const handleLogout = async () => {
    setProfileOpen(false);
    try {
      // Clear local storage and session storage
      localStorage.clear();
      sessionStorage.clear();

      // Navigate to login immediately
      navigate('/admin/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      // Still navigate even if there's an error
      navigate('/admin/login', { replace: true });
    }
  };

  const filteredMenuItems = menuItems.filter(
    (item) => canAccessPage(user, item.pageKey)
  );

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
        <div className="flex items-center justify-around px-2 h-16">
          {/* Dashboard */}
          <Link
            to="/admin"
            className={clsx(
              'flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 transition-colors py-2',
              isActive('/admin') ? 'text-primary-600' : 'text-slate-500 hover:text-slate-700'
            )}
            aria-label="Dashboard"
          >
            <LayoutDashboard size={22} strokeWidth={2} aria-hidden="true" />
            <span className="text-[10px] font-medium leading-tight">Home</span>
          </Link>

          {/* Products */}
          <Link
            to="/admin/products"
            className={clsx(
              'flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 transition-colors py-2',
              isActive('/admin/products') ? 'text-primary-600' : 'text-slate-500 hover:text-slate-700'
            )}
            aria-label="Products"
          >
            <Package size={22} strokeWidth={2} aria-hidden="true" />
            <span className="text-[10px] font-medium leading-tight">Products</span>
          </Link>

          {/* Center - Prominent Circular Menu Button */}
          <button
            onClick={() => setMenuOpen(true)}
            className="relative -top-5 flex items-center justify-center w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg transition-all active:scale-95"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Orders */}
          <Link
            to="/admin/orders"
            className={clsx(
              'flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 transition-colors py-2',
              isActive('/admin/orders') ? 'text-primary-600' : 'text-slate-500 hover:text-slate-700'
            )}
            aria-label="Orders"
          >
            <ShoppingCart size={22} strokeWidth={2} aria-hidden="true" />
            <span className="text-[10px] font-medium leading-tight">Orders</span>
          </Link>

          {/* Profile */}
          <button
            onClick={() => setProfileOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 transition-colors py-2 text-slate-500 hover:text-slate-700"
            aria-label="Profile"
          >
            <User size={22} strokeWidth={2} aria-hidden="true" />
            <span className="text-[10px] font-medium leading-tight">Profile</span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Slide-Up */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMenuOpen(false)}
          />

          <div className="fixed inset-x-0 bottom-0 z-50 md:hidden flex flex-col max-h-[75vh] animate-slide-up">
            {/* Handle Bar */}
            <div className="flex justify-center pt-3 pb-1 bg-white rounded-t-2xl">
              <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 bg-white border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Menu</h2>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto bg-white px-4 py-2 pb-20">
              <ul className="space-y-1">
                {filteredMenuItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.to);

                  return (
                    <li key={item.to}>
                      <button
                        onClick={() => handleMenuClick(item.to)}
                        className={clsx(
                          'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left font-medium',
                          active ? 'bg-primary-50 text-primary-700' : 'text-slate-700 hover:bg-slate-50'
                        )}
                      >
                        <Icon size={22} strokeWidth={2} className={active ? 'text-primary-600' : 'text-slate-400'} />
                        <span>{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </>
      )}

      {/* Profile Menu Slide-Up */}
      {profileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setProfileOpen(false)}
          />

          <div className="fixed inset-x-0 bottom-0 z-50 md:hidden flex flex-col animate-slide-up">
            {/* Handle Bar */}
            <div className="flex justify-center pt-3 pb-1 bg-white rounded-t-2xl">
              <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 bg-white border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Profile</h2>
              <button
                onClick={() => setProfileOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                aria-label="Close profile"
              >
                <X size={20} />
              </button>
            </div>

            {/* Profile Content */}
            <div className="bg-white px-4 py-6 pb-20">
              {/* User Info */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-20 h-20 rounded-full bg-primary-600 flex items-center justify-center text-white text-2xl font-bold mb-3">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="text-lg font-bold text-slate-900">{user?.name}</h3>
                <p className="text-sm text-slate-500 capitalize">{user?.role}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>

              {/* Menu Options */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    navigate('/admin/settings');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                >
                  <Settings size={20} className="text-slate-400" />
                  <span>Settings</span>
                </button>

                <div className="pt-2 mt-2 border-t border-slate-100">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors font-medium"
                  >
                    <LogOut size={20} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
