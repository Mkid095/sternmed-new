/**
 * Privacy Policy Page
 *
 * Displays privacy policy for the platform.
 * Content can be configured in admin settings.
 *
 * @module PrivacyPolicy
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { SiteSettings } from '../../types';
import { sanitizeHtml } from '../../utils/sanitizeHtml';

/**
 * Privacy Policy Page Component
 *
 * Displays privacy policy from settings or default content.
 * All HTML content is sanitized to prevent XSS attacks.
 *
 * @example
 * <Route path="/privacy" element={<PrivacyPolicy />} />
 */
export default function PrivacyPolicy() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.getSettings();
        setSettings(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch settings:', err);
        setError('Unable to load privacy policy. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // ============ Loading State ============

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 flex justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  // ============ Error State ============

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-4">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-semibold text-red-900 mb-1">Unable to Load Content</h3>
            <p className="text-red-700 text-sm mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-red-700 underline text-sm hover:no-underline"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============ Main Content ============

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Back Link */}
      <BackLink />

      {/* Content Card */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8 md:p-12">
        <PageHeader settings={settings} />

        <div className="prose prose-slate max-w-none">
          {settings?.privacyPolicy ? (
            // Sanitize HTML before rendering to prevent XSS
            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(settings.privacyPolicy) }} />
          ) : (
            <DefaultContent settings={settings} />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Back to home link
 */
function BackLink() {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-8"
    >
      <ArrowLeft size={18} />
      Back to Home
    </Link>
  );
}

/**
 * Page header with title and last updated date
 */
interface PageHeaderProps {
  settings: SiteSettings | null;
}

function PageHeader({ settings }: PageHeaderProps) {
  return (
    <>
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-slate-500 mb-8">
        Last Updated:{' '}
        {settings?.updatedAt
          ? new Date(settings.updatedAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })
          : new Date().toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
      </p>
    </>
  );
}

/**
 * Default privacy policy content
 * Used when no content is configured in settings
 */
interface DefaultContentProps {
  settings: SiteSettings | null;
}

function DefaultContent({ settings }: DefaultContentProps) {
  return (
    <>
      <h2 className="text-xl font-semibold text-slate-900 mb-4">
        Privacy Policy
      </h2>
      <p className="text-slate-600 mb-4">
        Welcome to Sternmed Afrika Ltd. We respect your privacy and are committed
        to protecting your personal data. This privacy policy will inform you as
        to how we look after your personal data when you visit our website and
        tell you about your privacy rights and how the law protects you.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-3">
        1. Information We Collect
      </h3>
      <p className="text-slate-600 mb-4">
        We may collect, use, store and transfer different kinds of personal data
        about you, which we have grouped together follows:
      </p>
      <ul className="list-disc pl-6 text-slate-600 mb-4 space-y-2">
        <li>
          <strong>Identity Data:</strong> includes first name, maiden name,
          last name, username or similar identifier.
        </li>
        <li>
          <strong>Contact Data:</strong> includes email address and phone
          numbers.
        </li>
        <li>
          <strong>Transaction Data:</strong> includes details about payments
          from you and other details of products and services you have purchased
          from us.
        </li>
      </ul>

      <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-3">
        2. How We Use Your Information
      </h3>
      <p className="text-slate-600 mb-4">
        We will only use your personal data when the law allows us to. Most
        commonly, we will use your personal data in the following circumstances:
      </p>
      <ul className="list-disc pl-6 text-slate-600 mb-4 space-y-2">
        <li>To process and deliver your orders</li>
        <li>To manage our relationship with you</li>
        <li>To inform you about changes to our service</li>
        <li>To comply with legal obligations</li>
      </ul>

      <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-3">
        3. Data Security
      </h3>
      <p className="text-slate-600 mb-4">
        We have put in place appropriate security measures to prevent your
        personal data from being accidentally lost, used or accessed in an
        unauthorized way, altered or disclosed.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-3">
        4. Your Legal Rights
      </h3>
      <p className="text-slate-600 mb-4">
        Under certain circumstances, you have rights under data protection laws
        in relation to your personal data including the right to access, correct
        or erase your personal data.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-3">
        5. Contact Us
      </h3>
      <p className="text-slate-600 mb-4">
        If you have any questions about this privacy policy, please contact us at:
        <br />
        <strong>Email:</strong> {settings?.email || 'info@sternmedafrika.com'}
        <br />
        <strong>Phone:</strong> {settings?.phoneNumber || '+254 700 000 000'}
        <br />
        <strong>Address:</strong> {settings?.address || 'Nairobi, Kenya'}
      </p>
    </>
  );
}
