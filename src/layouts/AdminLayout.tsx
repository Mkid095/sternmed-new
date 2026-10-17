import { Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AdminSidebar } from './components/AdminSidebar';
import { AdminHeader } from './components/AdminHeader';
import { AdminUserMenu } from './components/AdminUserMenu';
import { AdminBottomNav } from './components/AdminBottomNav';

export default function AdminLayout() {
  const { user, logout, initialize, initialized, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = initialize();
    return () => unsubscribe();
  }, [initialize]);

  useEffect(() => {
    if (initialized && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, initialized, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (isLoading || !initialized) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    /*
      White canvas, not a grey one.

      The content sat on bg-slate-100 with white cards floating on it. That
      pushes contrast onto every individual panel — a chart on grey has no
      surface to read against, so gridlines wash out and axis labels vanish —
      and it produces the bordered-box look everywhere. A white canvas lets a
      chart be simply *there* at full contrast, and separates sections with
      hairlines instead of boxes.
    */
    <div className="h-screen flex bg-white font-sans text-slate-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <AdminSidebar
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      >
        <AdminUserMenu user={user} onLogout={handleLogout} />
      </AdminSidebar>

      <main className="flex-1 flex flex-col overflow-hidden min-w-0 pb-16 lg:pb-0">
        <AdminHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pt-2 pb-4 sm:pb-6 lg:pb-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <AdminBottomNav />
    </div>
  );
}
