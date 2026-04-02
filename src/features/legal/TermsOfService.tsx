/**
 * Terms & Conditions Page
 *
 * Displays terms and conditions for using the platform.
 * Content can be configured in admin settings.
 *
 * @module TermsOfService
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { SiteSettings } from '../../types';
import { sanitizeHtml } from '../../utils/sanitizeHtml';

/**
 * Terms & Conditions Page Component
 *
 * Displays terms and conditions from settings or default content.
 * All HTML content is sanitized to prevent XSS attacks.
 *
 * @example
 * <Route path="/terms" element={<TermsOfService />} />
 */
export default function TermsOfService() {
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
        setError('Unable to load terms and conditions. Please try again later.');
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
          {settings?.termsOfService ? (
            // Sanitize HTML before rendering to prevent XSS
            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(settings.termsOfService) }} />
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
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms & Conditions</h1>
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
 * Default terms and conditions content
 * Used when no content is configured in settings
 */
interface DefaultContentProps {
  settings: SiteSettings | null;
}

function DefaultContent({ settings }: DefaultContentProps) {
  return (
    <>
      <h2 className="text-xl font-semibold text-slate-900 mb-4">
        Terms & Conditions
      </h2>
      <p className="text-slate-600 mb-4">
        Welcome to Sternmed Afrika Ltd. These terms and conditions outline the
        rules and regulations for the use of our website and services.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-3">
        1. Introduction
      </h3>
      <p className="text-slate-600 mb-4">
        By accessing this website, we assume you accept these terms and
        conditions. Do not continue to use Sternmed Afrika website if you do not
        agree to take all of the terms and conditions stated on this page.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-3">
        2. License to Use
      </h3>
      <p className="text-slate-600 mb-4">
        Unless otherwise stated, Sternmed Afrika Ltd and/or its licensors own
        the intellectual property rights for all material on this website. All
        intellectual property rights are reserved.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-3">
        3. Products and Services
      </h3>
      <p className="text-slate-600 mb-4">
        Our company offers medical consumables and equipment. All products are
        subject to availability. We reserve the right to discontinue any product
        at any time.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-3">
        4. Pricing and Payment
      </h3>
      <p className="text-slate-600 mb-4">
        All prices are in Kenyan Shilling (Ksh) unless otherwise stated. We
        reserve the right to modify prices at any time without notice. Payment is
        processed through our WhatsApp checkout system.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-3">
        5. Delivery
      </h3>
      <p className="text-slate-600 mb-4">
        Delivery times are estimates and not guaranteed. We are not liable for
        any delays in delivery. Delivery costs will be communicated during the
        checkout process.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-3">
        6. Returns and Refunds
      </h3>
      <p className="text-slate-600 mb-4">
        Due to the nature of medical products, returns are only accepted for
        defective items. Please contact our customer service team within 48
        hours of delivery if you receive a defective product.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-3">
        7. Limitation of Liability
      </h3>
      <p className="text-slate-600 mb-4">
        Sternmed Afrika Ltd shall not be held liable for any indirect,
        incidental, special, consequential or punitive damages resulting from
        your access to or use of this website.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-3">
        8. Governing Law
      </h3>
      <p className="text-slate-600 mb-4">
        These terms and conditions are governed by and construed in accordance
        with the laws of Kenya and you irrevocably submit to the exclusive
        jurisdiction of the courts in Kenya.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-3">
        9. Contact Information
      </h3>
      <p className="text-slate-600 mb-4">
        For any questions about these terms and conditions, please contact us:
        <br />
        <strong>Company:</strong> Sternmed Afrika Ltd
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
