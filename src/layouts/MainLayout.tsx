import { Outlet, Link } from 'react-router-dom';
import { ShoppingCart, Phone, Mail, Menu, X } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SiteSettings, Category } from '../types';
import { MobileBottomNav } from './components/MobileBottomNav';
import { FloatingButtons } from '../features/shared/ui';

export default function MainLayout() {
  const totalItems = useCartStore((state) => state.totalItems());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    Promise.all([
      api.getSettings().then(setSettings).catch(console.error),
      api.getCategories().then(setCategories).catch(console.error)
    ]);
  }, []);

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
            <nav className="hidden md:flex space-x-8">
              <Link to="/" className="text-slate-600 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors">Home</Link>
              <Link to="/shop" className="text-slate-600 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors">Shop</Link>
            </nav>

            {/* Cart Icon */}
            <div className="flex items-center">
              <Link to="/cart" className="relative p-2 text-slate-600 hover:text-primary-600 transition-colors">
                <ShoppingCart size={20} />
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

      {/* Footer - White theme with primary accents */}
      <footer className="bg-white text-slate-700 py-12 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img
                src="https://res.cloudinary.com/dxb22swfg/image/upload/v1765747561/Asset_4_v5ksi6.png"
                alt="Sternmed Afrika"
                className="h-10 w-auto"
                referrerPolicy="no-referrer"
              />
            </div>
            <p className="text-sm text-slate-600">{settings?.aboutText || 'Your trusted partner in medical consumables and equipment across Africa.'}</p>
          </div>
          <div>
            <h4 className="text-primary-600 font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/shop" className="hover:text-primary-600 transition-colors">Shop</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-primary-600 font-semibold mb-4">Categories</h4>
            <ul className="space-y-2 text-sm">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link to={`/shop?category=${category.id}`} className="hover:text-primary-600 transition-colors">
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-primary-600 font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-slate-600">{settings?.address || 'Nairobi, Kenya'}</li>
              <li>{settings?.email || 'info@sternmed.afrika'}</li>
              <li>{settings?.phoneNumber || '+254 700 000 000'}</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-8 border-t border-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p className="text-slate-500">
              &copy; {new Date().getFullYear()} Sternmed Afrika Ltd. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center md:justify-end gap-4 text-slate-600">
              <Link to="/privacy-policy" className="hover:text-primary-600 transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-primary-600 transition-colors">Terms & Conditions</Link>
              <Link to="/login" className="hover:text-primary-600 transition-colors">Admin Login</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        whatsappPhone={settings?.phoneNumber || '+254700000000'}
      />

      {/* Floating Action Buttons (WhatsApp & AI Chatbot) */}
      <FloatingButtons
        whatsappPhone={settings?.phoneNumber || '+254700000000'}
      />
    </div>
  );
}
