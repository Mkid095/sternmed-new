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
import AdminBanners from './features/admin/banners/AdminBanners';
import { AdminMails } from './features/admin/mails';
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

            {/*
              Admin routes.

              Every page is wrapped in `RoleGuard` with the same page key the
              sidebar hides it by and the user form grants it under — one list
              (`features/admin/permissions`), so the menu, the toggle and the
              route can never disagree.

              This is what makes page access real rather than cosmetic: without
              it, hiding a nav item still leaves the URL working, and a staff
              member who types /admin/settings simply gets the page.

              `settings` is not in ADMIN_PAGES, so no staff checkbox can grant
              it — which makes it admin-only here without a second rule.
            */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route
                index
                element={
                  <RoleGuard requiredPermission="dashboard">
                    <AdminDashboard />
                  </RoleGuard>
                }
              />
              <Route
                path="products"
                element={
                  <RoleGuard requiredPermission="products">
                    <AdminProducts />
                  </RoleGuard>
                }
              />
              <Route
                path="categories"
                element={
                  <RoleGuard requiredPermission="categories">
                    <AdminCategories />
                  </RoleGuard>
                }
              />
              <Route
                path="landing-config"
                element={
                  <RoleGuard requiredPermission="landing-config">
                    <AdminLandingConfig />
                  </RoleGuard>
                }
              />
              <Route
                path="banners"
                element={
                  <RoleGuard requiredPermission="banners">
                    <AdminBanners />
                  </RoleGuard>
                }
              />
              <Route
                path="orders"
                element={
                  <RoleGuard requiredPermission="orders">
                    <AdminOrders />
                  </RoleGuard>
                }
              />
              <Route
                path="mails"
                element={
                  <RoleGuard requiredPermission="mails">
                    <AdminMails />
                  </RoleGuard>
                }
              />
              <Route
                path="users"
                element={
                  <RoleGuard requiredPermission="users">
                    <AdminUsers />
                  </RoleGuard>
                }
              />
              <Route
                path="settings"
                element={
                  <RoleGuard requiredPermission="settings">
                    <AdminSettings />
                  </RoleGuard>
                }
              />
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
