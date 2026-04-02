import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Mail, Phone, ExternalLink, ShoppingCart } from 'lucide-react';
import { api } from '../../services/api';

const COMPANY_NAME = 'Sternmed Afrika';
const COMPANY_DESCRIPTION = 'Your trusted partner in medical consumables and equipment across Africa.';

/**
 * Under Development Page Component
 *
 * Shown when the website is in development mode.
 * Displays a "Coming Soon" message with company footer
 * and link to admin portal.
 */
export function UnderDevelopment() {
  const [phone, setPhone] = useState('+254 700 000 000');
  const [email, setEmail] = useState('info@sternmed.afrika');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await api.getSettings();
        if (settings.phoneNumber) setPhone(settings.phoneNumber);
        if (settings.email) setEmail(settings.email);
      } catch (error) {
        console.error('Failed to fetch settings for under development page:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-2xl">
          {/* Lock Icon */}
          <div className="mb-8 flex justify-center">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
              <Lock className="w-12 h-12 text-blue-600" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-4">
            Website Under Development
          </h1>

          {/* Message */}
          <p className="text-xl text-slate-600 mb-8 max-w-lg mx-auto">
            We're currently building something amazing. Our website will be launching soon with an enhanced shopping experience.
          </p>

          {/* Features Coming Soon */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 text-left max-w-3xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <ExternalLink className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Product Catalog</h3>
              <p className="text-sm text-slate-600">Browse our extensive medical supplies catalog</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                <ShoppingCart className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Easy Ordering</h3>
              <p className="text-sm text-slate-600">Quick and convenient ordering process</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                <Phone className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Customer Support</h3>
              <p className="text-sm text-slate-600">Dedicated support for all your needs</p>
            </div>
          </div>

          {/* Admin Portal Link */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
            <p className="text-sm text-blue-800 mb-3">
              Are you an administrator? Access the admin portal below:
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              Admin Portal
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Company Info */}
            <div>
              <h3 className="text-lg font-semibold mb-4">{COMPANY_NAME}</h3>
              <p className="text-slate-300 text-sm mb-4">
                {COMPANY_DESCRIPTION}
              </p>
              <div className="space-y-2 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <Phone size={16} />
                  <span>{phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={16} />
                  <span>{email}</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <Link to="/login" className="hover:text-white transition-colors">
                    Admin Portal
                  </Link>
                </li>
                <li>
                  <a href={`mailto:${email}`} className="hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>

            {/* Business Hours */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Business Hours</h3>
              <div className="text-sm text-slate-400 space-y-1">
                <p>Monday - Friday: 8:00 AM - 6:00 PM</p>
                <p>Saturday: 9:00 AM - 1:00 PM</p>
                <p>Sunday: Closed</p>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 pt-8 border-t border-slate-800 text-center text-sm text-slate-400">
            <p>&copy; {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved.</p>
            <p className="mt-1">Leading Supplier of Medical Consumables & Equipment in Africa</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
