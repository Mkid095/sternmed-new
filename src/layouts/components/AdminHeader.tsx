import { Menu, User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

/**
 * Page title per route.
 *
 * The header was rendered as `<AdminHeader onMenuClick={...} />` with no title,
 * so it fell back to its default and every admin screen — Products, Orders,
 * Settings and all the rest — was headed "Admin Dashboard". Deriving it from the
 * path means each page names itself.
 */
const TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/products': 'Products',
  '/admin/categories': 'Categories',
  '/admin/orders': 'Orders',
  '/admin/landing-config': 'Landing Config',
  '/admin/banners': 'Banners',
  '/admin/mails': 'Mails',
  '/admin/emails': 'Email Platform',
  '/admin/users': 'Users & Roles',
  '/admin/settings': 'Settings',
};

interface AdminHeaderProps {
  /** Overrides the route-derived title. Rarely needed. */
  title?: string;
  onMenuClick?: () => void;
}

export function AdminHeader({ title, onMenuClick }: AdminHeaderProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);

  const heading = title ?? TITLES[location.pathname] ?? 'Admin';
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileOpen]);

  /**
   * Signs out of Firebase, then navigates.
   *
   * This used to clear localStorage and navigate without ever calling Firebase
   * `signOut`. Firebase persists its session outside localStorage, so the token
   * survived: the store still held the user, and navigating back to /admin
   * restored the session. The header had its own copy of this handler, separate
   * from the sidebar's, and only the sidebar's actually worked — so signing out
   * from the profile menu (desktop and mobile) silently failed.
   */
  const handleLogout = async () => {
    setProfileOpen(false);
    try {
      await logout();
    } catch (error) {
      // A failed sign-out must still land on the login screen, otherwise the
      // person is left staring at an admin portal they believe they closed.
      console.error('Logout error:', error);
    } finally {
      navigate('/login', { replace: true });
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Menu button only on desktop for sidebar toggle */}
        <button
          onClick={onMenuClick}
          className="hidden lg:block p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          <Menu size={22} strokeWidth={2} />
        </button>
        <h1 className="text-lg sm:text-xl font-semibold text-slate-800 truncate">{heading}</h1>
      </div>

      {/* Profile Menu - Desktop */}
      <div className="hidden lg:block" ref={profileRef}>
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Open profile menu"
        >
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-slate-700">{user?.name}</span>
          <ChevronDown size={16} className={`text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Profile Dropdown */}
        {profileOpen && (
          <div className="absolute right-8 top-14 w-56 bg-white rounded-xl border border-slate-200 shadow-lg py-2 z-50">
            {/* User Info */}
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
              <p className="text-xs text-primary-600 capitalize font-medium">{user?.role}</p>
            </div>

            {/* Menu Items */}
            <button
              onClick={() => {
                setProfileOpen(false);
                navigate('/admin/settings');
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Settings size={18} className="text-slate-400" />
              <span>Settings</span>
            </button>

            <div className="border-t border-slate-100 mt-1 pt-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Profile Icon - Mobile */}
      <div className="lg:hidden">
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Profile"
        >
          <User size={22} strokeWidth={2} />
        </button>

        {/* Profile Modal for Mobile */}
        {profileOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setProfileOpen(false)}
            />

            <div className="fixed inset-x-4 top-20 z-50 bg-white rounded-xl border border-slate-200 shadow-lg p-4 lg:hidden animate-slide-down">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                  <p className="text-xs text-primary-600 capitalize">{user?.role}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setProfileOpen(false);
                  navigate('/admin/settings');
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors mb-1"
              >
                <Settings size={18} className="text-slate-400" />
                <span>Settings</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
