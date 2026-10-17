/**
 * Public site footer.
 *
 * What this replaces
 * ------------------
 * A flat four-column block whose problems were mostly structural:
 *
 * 1. **"Quick Links" contained exactly one link.** A column with a single item
 *    reads as a broken component, and it was.
 * 2. **Contact details were plain text, not links.** No `tel:`, no `mailto:`, no
 *    WhatsApp. On a page whose entire checkout runs through WhatsApp, the footer
 *    offered no way to start one.
 * 3. **The placeholders were wrong, not just stale.** A missing phone number
 *    rendered `+254 700 000 000` and a missing email rendered
 *    `info@sternmed.afrika`. Neither is this business's: the real line is
 *    799 526 972 and the real domain is sternmedafrika.com. A visitor who saw
 *    the fallback dialled or emailed a stranger. Nothing is shown now unless a
 *    real value exists.
 * 4. **Admin Login sat among the legal links**, giving a visitor-facing page a
 *    link that is 99% of the time useless to them and looks like content.
 *
 * Structure
 * ---------
 * A contact band first — for a business that sells by WhatsApp, that is the
 * point of the footer, not an afterthought. Then the columns. Then the legal
 * line, kept separate from staff-only links.
 *
 * Everything here reads from site settings. The footer is the last place a
 * hardcoded phone number or email survives, so it is where "one owner per fact"
 * has to actually hold.
 *
 * @module SiteFooter
 */

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Truck,
  Clock,
} from 'lucide-react';
import type { Category, SiteSettings } from '../../types';
import { generateWhatsAppLink } from '../../constants';

interface SiteFooterProps {
  settings: SiteSettings | null;
  categories: Category[];
}

const LOGO_URL =
  'https://res.cloudinary.com/dxb22swfg/image/upload/v1765747561/Asset_4_v5ksi6.png';

/** Categories shown in the footer. The rest stay reachable from Products. */
const MAX_FOOTER_CATEGORIES = 6;

export function SiteFooter({ settings, categories }: SiteFooterProps) {
  /*
   * No fallback values. A missing setting renders nothing rather than a
   * placeholder — see the module note on why the old placeholders pointed at a
   * number and domain that are not this business's.
   */
  const phone = settings?.phoneNumber?.trim() || '';
  const email = settings?.email?.trim() || '';
  const address = settings?.address?.trim() || '';
  const about = settings?.aboutText?.trim() || '';

  const whatsapp = settings?.whatsappNumber?.trim() || phone;
  const waDigits = whatsapp.replace(/\D/g, '');

  const shownCategories = categories.slice(0, MAX_FOOTER_CATEGORIES);
  const hiddenCategoryCount = categories.length - shownCategories.length;

  return (
    <footer className="mt-12 border-t border-slate-200 bg-white">
      {/* ---------------- Contact band ---------------- */}
      <div className="bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <h2 className="text-xl font-semibold text-white sm:text-2xl">
                Need a quote or a bulk order?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                Send us the products and quantities and we will come back with
                availability, pricing and delivery. Most replies go out the same
                working day.
              </p>

              <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
                <li className="flex items-center gap-2">
                  <Truck size={15} className="text-slate-500" aria-hidden="true" />
                  Delivery across Kenya
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck size={15} className="text-slate-500" aria-hidden="true" />
                  Quality guaranteed
                </li>
                <li className="flex items-center gap-2">
                  <Clock size={15} className="text-slate-500" aria-hidden="true" />
                  Mon–Sat, 8am–5pm
                </li>
              </ul>
            </div>

            {/* The primary action for this business. */}
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:flex-col lg:items-stretch">
              {waDigits && (
                <a
                  href={generateWhatsAppLink(
                    waDigits,
                    "Hi, I'd like to enquire about your products.",
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#25D366] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  <MessageCircle size={18} aria-hidden="true" />
                  Chat on WhatsApp
                </a>
              )}
              {phone && (
                <a
                  href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                  className="inline-flex items-center justify-center gap-2.5 rounded-xl border border-slate-700 px-6 py-3 text-sm font-medium text-slate-200 transition-colors hover:border-slate-500 hover:text-white"
                >
                  <Phone size={16} aria-hidden="true" />
                  {phone}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- Columns ---------------- */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
          {/* About */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-block" aria-label="Sternmed Afrika — home">
              <img
                src={LOGO_URL}
                alt="Sternmed Afrika"
                className="h-9 w-auto"
                referrerPolicy="no-referrer"
              />
            </Link>
            {about && (
              <p className="mt-4 text-sm leading-relaxed text-slate-600">{about}</p>
            )}
          </div>

          {/* Categories */}
          <nav aria-labelledby="footer-categories">
            <h3
              id="footer-categories"
              className="text-xs font-semibold uppercase tracking-wider text-slate-900"
            >
              Categories
            </h3>
            <ul className="mt-4 space-y-2.5">
              {shownCategories.map((category) => (
                <li key={category.id}>
                  <FooterLink to={`/shop?category=${category.id}`}>
                    {category.name}
                  </FooterLink>
                </li>
              ))}
              {/* Without this, a long catalogue simply stops being reachable. */}
              {(hiddenCategoryCount > 0 || categories.length > 0) && (
                <li>
                  <Link
                    to="/shop"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
                  >
                    All products
                    <ArrowRight size={13} aria-hidden="true" />
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          {/* Quick links */}
          <nav aria-labelledby="footer-links">
            <h3
              id="footer-links"
              className="text-xs font-semibold uppercase tracking-wider text-slate-900"
            >
              Browse
            </h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <FooterLink to="/shop">All products</FooterLink>
              </li>
              <li>
                <FooterLink to="/shop?featured=true">Featured products</FooterLink>
              </li>
              <li>
                <FooterLink to="/cart">Your cart</FooterLink>
              </li>
              <li>
                <FooterLink to="/privacy-policy">Privacy policy</FooterLink>
              </li>
              <li>
                <FooterLink to="/terms">Terms &amp; conditions</FooterLink>
              </li>
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Contact
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              {address && (
                <li className="flex items-start gap-2.5 text-slate-600">
                  <MapPin
                    size={16}
                    aria-hidden="true"
                    className="mt-0.5 flex-shrink-0 text-slate-400"
                  />
                  <span>{address}</span>
                </li>
              )}
              {phone && (
                <li className="flex items-start gap-2.5">
                  <Phone
                    size={16}
                    aria-hidden="true"
                    className="mt-0.5 flex-shrink-0 text-slate-400"
                  />
                  <a
                    href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                    className="text-slate-600 transition-colors hover:text-primary-600"
                  >
                    {phone}
                  </a>
                </li>
              )}
              {email && (
                <li className="flex items-start gap-2.5">
                  <Mail
                    size={16}
                    aria-hidden="true"
                    className="mt-0.5 flex-shrink-0 text-slate-400"
                  />
                  <a
                    href={`mailto:${email}`}
                    className="break-all text-slate-600 transition-colors hover:text-primary-600"
                  >
                    {email}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* ---------------- Legal bar ---------------- */}
      <div className="border-t border-slate-200">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm sm:px-6 md:flex-row lg:px-8">
          <p className="text-slate-500">
            &copy; {new Date().getFullYear()} Sternmed Afrika Ltd. All rights
            reserved.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link
              to="/privacy-policy"
              className="text-slate-600 transition-colors hover:text-primary-600"
            >
              Privacy policy
            </Link>
            <Link
              to="/terms"
              className="text-slate-600 transition-colors hover:text-primary-600"
            >
              Terms &amp; conditions
            </Link>
            {/*
              Staff-only, so it is quiet and sits apart from the legal links.
              Sitting between them made it look like part of the legal text.
            */}
            <Link
              to="/login"
              className="text-slate-400 transition-colors hover:text-slate-600"
            >
              Staff login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="text-sm text-slate-600 transition-colors hover:text-primary-600"
    >
      {children}
    </Link>
  );
}