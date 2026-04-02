/**
 * Customer Information Card Component
 *
 * Displays customer contact details with clickable links
 * for email, phone, and quick contact buttons.
 *
 * @module CustomerInfoCard
 */

import React from 'react';
import { Order } from '../../../../types';
import { Package, Mail, Phone, MapPin } from 'lucide-react';
import { generateTelLink, generateMailtoLink, generateWhatsAppLink, generateWhatsAppGreeting } from './utils/orderFormatters';

/**
 * Props for the CustomerInfoCard component
 */
export interface CustomerInfoCardProps {
  /** Order object containing customer information */
  order: Order;

  /** Optional CSS class for the card container */
  className?: string;
}

/**
 * Customer information display card
 *
 * Shows customer name, email, phone, and shipping address
 * with clickable links and action buttons.
 *
 * @example
 * <CustomerInfoCard
 *   order={order}
 *   className="mt-4"
 * />
 */
export function CustomerInfoCard({ order, className = '' }: CustomerInfoCardProps) {
  const whatsappLink = generateWhatsAppLink(
    order.customerPhone,
    generateWhatsAppGreeting(order)
  );

  return (
    <div className={`bg-white rounded-lg border border-slate-200 p-4 sm:p-6 ${className}`}>
      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4">
        Customer Information
      </h3>

      <CustomerInfoList order={order} />

      {/* Quick Contact Buttons */}
      <ContactButtons
        email={order.customerEmail}
        phone={order.customerPhone}
        whatsappLink={whatsappLink}
      />
    </div>
  );
}

/**
 * Customer information list with icons
 */
interface CustomerInfoListProps {
  order: Order;
}

function CustomerInfoList({ order }: CustomerInfoListProps) {
  return (
    <div className="space-y-3">
      {/* Customer Name */}
      <InfoItem icon={<Package size={16} className="text-slate-400 flex-shrink-0" />}>
        <InfoItemLabel label="Name" />
        <InfoItemValue truncate>{order.customerName}</InfoItemValue>
      </InfoItem>

      {/* Customer Email */}
      <InfoItem icon={<Mail size={16} className="text-slate-400 flex-shrink-0" />}>
        <InfoItemLabel label="Email" />
        <InfoItemValue>
          <a
            href={generateMailtoLink(order.customerEmail)}
            className="font-medium text-blue-600 hover:text-blue-800 truncate block"
          >
            {order.customerEmail}
          </a>
        </InfoItemValue>
      </InfoItem>

      {/* Customer Phone */}
      {order.customerPhone && (
        <InfoItem icon={<Phone size={16} className="text-slate-400 flex-shrink-0" />}>
          <InfoItemLabel label="Phone" />
          <InfoItemValue>
            <a
              href={generateTelLink(order.customerPhone)}
              className="font-medium text-blue-600 hover:text-blue-800 truncate block"
            >
              {order.customerPhone}
            </a>
          </InfoItemValue>
        </InfoItem>
      )}

      {/* Shipping Address */}
      {order.shippingAddress && (
        <InfoItem icon={<MapPin size={16} className="text-slate-400 flex-shrink-0 mt-0.5" />} iconAlign="start">
          <InfoItemLabel label="Shipping Address" />
          <InfoItemValue breakWords>{order.shippingAddress}</InfoItemValue>
        </InfoItem>
      )}
    </div>
  );
}

/**
 * Individual customer information item
 */
interface InfoItemProps {
  icon: React.ReactNode;
  children: React.ReactNode;
  iconAlign?: 'center' | 'start';
}

function InfoItem({ icon, children, iconAlign = 'center' }: InfoItemProps) {
  return (
    <div className={`flex items-center gap-3 ${iconAlign === 'start' ? 'items-start' : ''}`}>
      <div className="flex-shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/**
 * Label for information item (e.g., "Name", "Email")
 */
interface InfoItemLabelProps {
  label: string;
}

function InfoItemLabel({ label }: InfoItemLabelProps) {
  return <p className="text-xs sm:text-sm text-slate-500">{label}</p>;
}

/**
 * Value for information item
 */
interface InfoItemValueProps {
  children: React.ReactNode;
  truncate?: boolean;
  breakWords?: boolean;
}

function InfoItemValue({ children, truncate = false, breakWords = false }: InfoItemValueProps) {
  const className = [
    'font-medium text-slate-900',
    truncate && 'truncate',
    breakWords && 'break-words',
  ]
    .filter(Boolean)
    .join(' ');

  return <p className={className}>{children}</p>;
}

/**
 * Quick contact buttons component
 */
interface ContactButtonsProps {
  email: string;
  phone?: string;
  whatsappLink: string | null;
}

function ContactButtons({ email, phone, whatsappLink }: ContactButtonsProps) {
  return (
    <div className="mt-4 pt-4 border-t border-slate-200 flex flex-wrap gap-2">
      {/* Email Button */}
      <ContactButton
        href={generateMailtoLink(email)}
        icon={<Mail size={14} className="sm:w-4 sm:h-4" />}
        label="Email"
        color="blue"
      />

      {/* WhatsApp Button */}
      {whatsappLink && (
        <ContactButton
          href={whatsappLink}
          icon="WhatsApp"
          label="WhatsApp"
          color="green"
          openInNewTab
        />
      )}

      {/* Call Button */}
      {phone && (
        <ContactButton
          href={generateTelLink(phone)}
          icon={<Phone size={14} className="sm:w-4 sm:h-4" />}
          label="Call"
          color="purple"
        />
      )}
    </div>
  );
}

/**
 * Individual contact button component
 */
interface ContactButtonProps {
  href: string;
  icon: React.ReactNode | string;
  label: string;
  color: 'blue' | 'green' | 'purple';
  openInNewTab?: boolean;
}

function ContactButton({ href, icon, label, color, openInNewTab = false }: ContactButtonProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
    green: 'bg-green-50 text-green-700 hover:bg-green-100',
    purple: 'bg-purple-50 text-purple-700 hover:bg-purple-100',
  };

  const whatsappIcon = icon === 'WhatsApp' ? (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.871-.267-1.134-.534-.263-.267-.399-1.067-.267-1.067.133-.933.533-1.2.8-.267.267-.534.2-1.067.2-.533 0-1.067.067-1.6.267-.533.2-.933.533-1.067.933-.133.4-.2.933-.2-1.4 0-.533.067-1 .2-1.4.133-.4.4-.733.533-1.067.8-.333.267-.533.8-.733 1.067-.2.267-.733 0-1.067.2-.333.2-.8.667-1.067 1.067-.267.533-.533.733-1.067.8-.533.2-1.067.067-1.6.267-.533.2-.933.533-1.067.933-.133.4-.2.933-.2-1.4 0-.533.067-1 .2-1.4.133-.4.4-.733.533-1.067.8-.333.267-.533.8-.733 1.067-.2.267-.733 0-1.067.2z" />
    </svg>
  ) : icon;

  return (
    <a
      href={href}
      target={openInNewTab ? '_blank' : undefined}
      rel={openInNewTab ? 'noopener noreferrer' : undefined}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:transition-colors text-xs sm:text-sm font-medium ${colorClasses[color]}`}
    >
      {whatsappIcon}
      <span>{label}</span>
    </a>
  );
}
