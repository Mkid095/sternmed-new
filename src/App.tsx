import { useState, useEffect, type ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastProvider } from './features/shared/ui';
import { ScrollToTop } from './components/ScrollToTop';
import { isDevelopmentMode } from './services/siteSettings.service';

// Layouts
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';

// Public Pages
import { Home } from './features/home';
import { Shop } from './features/shop';
import ProductDetail from './features/shop/ProductDetail';
import { Cart } from './features/cart';
import { AdminLogin } from './features/auth';
import PrivacyPolicy from './features/legal/PrivacyPolicy';
import TermsOfService from './features/legal/TermsOfService';
import { UnderDevelopment } from './features/under-development';

// Admin Pages
import { AdminDashboard } from './features/admin/dashboard';
import { AdminProducts } from './features/admin/products';
import { AdminCategories } from './features/admin/categories';
import { AdminLandingConfig } from './features/admin/landing';
import { AdminBanners } from './features/admin/banners';
import { AdminMails } from './features/admin/mails';
import { AdminEmails } from './features/admin/emails';
import { AdminUsers } from './features/admin/users';
import { AdminSettings } from './features/admin/settings';
import AdminOrders from './features/admin/orders';

// Guards
import { AuthGuard, RoleGuard } from './guards';
import { useAuthStore } from './store/authStore';

// Initialize Firebase
import './config/firebase';

/**
 * Development Mode Wrapper Component
 *
 * Shows UnderDevelopment page for public routes when in development mode.
 * Admin routes are always excluded from this check.
 */
function DevelopmentModeWrapper({ children }: { children: ReactNode }) {
  const [isDevelopment, setIsDevelopment] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkMode = async () => {
      try {
        const devMode = await isDevelopmentMode();
        setIsDevelopment(devMode);
      } catch (error) {
        console.error('Error checking development mode:', error);
        setIsDevelopment(false);
      } finally {
        setLoading(false);
      }
    };

    checkMode();
  }, []);

  // Check if current route is an admin route (never block these)
  const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname === '/login';

  // Allow all admin routes to pass through immediately
  if (isAdminRoute) {
    return <>{children}</>;
  }

  // Show loading spinner for public routes
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  // Show under development page for public routes when in development mode
  if (isDevelopment) {
    return <UnderDevelopment />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <ToastProvider>
      <Router>
        <ScrollToTop />
        <DevelopmentModeWrapper>
          <Routes>
            {/* ADMIN ROUTES - Must come first so they match before public routes */}

            {/* Admin Login Route - Always accessible */}
            <Route path="/login" element={<AdminLogin />} />

            {/* Admin Dashboard Routes - Protected by AdminLayout */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="landing-config" element={<AdminLandingConfig />} />
              <Route path="banners" element={<AdminBanners />} />
              <Route path="mails" element={
                <RoleGuard allowedRoles={['admin']}>
                  <AdminMails />
                </RoleGuard>
              } />
              <Route path="emails" element={<AdminEmails />} />
              <Route path="users" element={
                <RoleGuard allowedRoles={['admin']}>
                  <AdminUsers />
                </RoleGuard>
              } />
              <Route path="settings" element={
                <RoleGuard allowedRoles={['admin']}>
                  <AdminSettings />
                </RoleGuard>
              } />
              <Route path="orders" element={<AdminOrders />} />
            </Route>

            {/* PUBLIC ROUTES (Subject to development mode check) */}
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="shop" element={<Shop />} />
              <Route path="product/:id" element={<ProductDetail />} />
              <Route path="cart" element={<Cart />} />
              <Route path="privacy-policy" element={<PrivacyPolicy />} />
              <Route path="terms" element={<TermsOfService />} />
            </Route>

            {/* Catch-all for unmatched routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DevelopmentModeWrapper>
      </Router>
    </ToastProvider>
  );
}
