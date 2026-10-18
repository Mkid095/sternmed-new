import { Outlet, Link } from 'react-router-dom';
import { ShoppingCart, Phone, Mail, Menu, X } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { resolveWhatsAppNumber } from '../services/supabase/settings.service';
import { SiteSettings, Category } from '../types';
import { MobileBottomNav } from './components/MobileBottomNav';
import { SiteFooter } from './components/SiteFooter';
import { FloatingButtons } from '../features/shared/ui';

export default function MainLayout() {
  const totalItems = useCartStore((state) => state.totalItems());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const { pathname } = useLocation();
  const isCheckout = pathname === '/cart';

  useEffect(() => {
    Promise.all([
      api.getSettings().then(setSettings).catch(console.error),
      api.getCategories().then(setCategories).catch(console.error)
    ]);
  }, []);

  // Admin-configured WhatsApp contact (falls back to the general phone number)
  const whatsappPhone = resolveWhatsAppNumber(settings) ?? '';

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900 bg-slate-50 pb-16 md:pb-0">
      {/* Information Header - Hidden on small mobile, simplified on tablet */}
      <div className="hidden sm:block bg-primary-600 text-white text-xs py-2 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4 md:gap-6">
            <span className="flex items-center gap-1.5"><Phone size={12} /> {settings?.phoneNumber || '+254 700 000 000'}</span>
            <span className="flex items-center gap-1.5"><Mail size={12} /> {settings?.email || 'info@sternmed.afrika'}</span>
          </div>
          <span className="hidden lg:inline text-white/90">Leading Supplier of Medical Consumables & Equipment</span>
        </div>
      </div>

      {/* Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 md:h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center">
                <img
                  src="https://res.cloudinary.com/dxb22swfg/image/upload/v1765747561/Asset_4_v5ksi6.png"
                  alt="Sternmed Afrika"
                  className="h-8 md:h-10 w-auto"
                  referrerPolicy="no-referrer"
                />
              </Link>
            </div>

            {/* Desktop Nav */}
            {/*
              "Products", not "Shop". The home page shows only what has been
              featured, so "Shop" read as a subset of the page you were already
              on — the label did not tell a first-time visitor that this is
              where the rest of the catalogue lives.
            */}
            <nav className="hidden md:flex space-x-8">
              <Link to="/" className="text-slate-600 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors">Home</Link>
              <Link to="/shop" className="text-slate-600 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors">Products</Link>
            </nav>

            {/* Cart Icon */}
            <div className="flex items-center">
              <Link
                to="/cart"
                // The badge count is visual only; without this a screen reader
                // hears "cart" and never learns the cart is not empty.
                aria-label={
                  totalItems > 0
                    ? `Cart, ${totalItems} ${totalItems === 1 ? 'item' : 'items'}`
                    : 'Cart, empty'
                }
                className="relative p-2 text-slate-600 hover:text-primary-600 transition-colors"
              >
                <ShoppingCart size={20} aria-hidden="true" />
                {totalItems > 0 && (
                  <span className="absolute top-1 right-1 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold leading-none text-white bg-accent-500 rounded-full">
                    {totalItems}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <SiteFooter settings={settings} categories={categories} />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav whatsappPhone={whatsappPhone} />

      {/*
        Floating Action Buttons (WhatsApp & AI Chatbot).

        Not on the cart. Its bottom edge occupies exactly the band the sticky
        pay bar sits in, so the WhatsApp button covered the total and the chatbot
        covered the checkout button. Both are also redundant here — the page's
        whole purpose is a WhatsApp hand-off, and there is a button for it.
      */}
      {!isCheckout && <FloatingButtons whatsappPhone={whatsappPhone} />}
    </div>
  );
}
