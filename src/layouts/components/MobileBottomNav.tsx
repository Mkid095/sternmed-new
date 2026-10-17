import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, Phone } from 'lucide-react';
import { clsx } from 'clsx';
import { useCartStore } from '../../store/cartStore';

interface NavItem {
  to: string;
  icon: typeof Home;
  label: string;
  showCartBadge?: boolean;
}

interface MobileBottomNavProps {
  /** WhatsApp phone number, digits only (e.g. 254700000000). Hides Contact when empty. */
  whatsappPhone?: string;
}

export function MobileBottomNav({ whatsappPhone = '' }: MobileBottomNavProps) {
  const location = useLocation();
  const totalItems = useCartStore((state) => state.totalItems());

  // Digits-only number for wa.me; empty when the admin hasn't set one yet
  const waDigits = whatsappPhone.replace(/\D/g, '');
  const whatsappLink = `https://wa.me/${waDigits}`;

  // Check if current path matches the nav item
  const isActive = (to: string) => {
    return location.pathname === to;
  };

  const navItems: NavItem[] = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/shop', icon: ShoppingCart, label: 'Products' },
    { to: '/cart', icon: ShoppingCart, label: 'Cart', showCartBadge: true },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);
          const showBadge = item.showCartBadge && totalItems > 0;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={clsx(
                'flex flex-col items-center justify-center gap-1 min-w-0 flex-1 h-full transition-colors relative',
                active ? 'text-primary-600' : 'text-slate-500 hover:text-slate-700'
              )}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={20} strokeWidth={2.5} aria-hidden="true" />
              {showBadge && (
                <span className="absolute -top-0.5 right-4 inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold leading-none text-white bg-red-600 rounded-full">
                  {totalItems}
                </span>
              )}
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* Contact Button - Opens WhatsApp (hidden until a number is configured) */}
        {waDigits && (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-1 min-w-0 flex-1 h-full transition-colors text-slate-500 hover:text-slate-700"
            aria-label="Contact us"
          >
            <Phone size={20} strokeWidth={2.5} aria-hidden="true" />
            <span className="text-[10px] font-medium">Contact</span>
          </a>
        )}
      </div>
    </nav>
  );
}
