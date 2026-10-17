import React, { ReactNode, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, MessageCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { ProductStatus, SiteSettings } from '../../../types';
import { api } from '../../../services/api';
import { generateWhatsAppLink } from '../../../constants';
import { resolveWhatsAppNumber } from '../../../services/supabase/settings.service';

/**
 * Site settings, fetched once and shared by every card on the page.
 *
 * Each ProductCard used to call `api.getSettings()` for itself, so a page with
 * a featured row and several category strips issued dozens of identical
 * requests for one small row of key/value settings. The promise is cached at
 * module scope, so the first card starts the fetch and the rest await it.
 */
let settingsPromise: Promise<SiteSettings> | null = null;
function loadSettings(): Promise<SiteSettings> {
  if (!settingsPromise) {
    settingsPromise = api.getSettings().catch((err) => {
      // Don't cache a failure: a later mount should get a fresh attempt.
      settingsPromise = null;
      console.error('Failed to load site settings:', err);
      throw err;
    });
  }
  return settingsPromise;
}

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export function Card({ children, className, padding = 'md', hover = false }: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={clsx(
        'bg-white rounded-lg border border-slate-200 shadow-sm',
        hover && 'hover:shadow-md transition-shadow',
        paddings[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

interface ProductCardProps {
  key?: string;
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    stock: number;
    isFeatured?: boolean;
    status: ProductStatus;
  };
  onAddToCart?: (e: React.MouseEvent) => void;
  showStock?: boolean;
  showWishlistButton?: boolean;
  /**
   * Where the card navigates. Every listing links to the product page, so this
   * is only optional for a card that genuinely is not a link.
   */
  to?: string;
}

/**
 * Product tile used by the home page and the shop grid.
 *
 * Why the link is an overlay
 * --------------------------
 * This used to be a `<div onClick={navigate}>`: not focusable, not announced as
 * a link, no href for the browser to hover-status or middle-click, and
 * invisible to anything indexing the page. Every listing on the site — featured
 * row, category strips, shop grid — rendered products as unlabelled divs.
 *
 * A `<button>` inside an `<a>` is invalid HTML and breaks both controls, so the
 * obvious fix — wrapping the card in a `Link` — is not available. Instead the
 * card is a positioned container, the `Link` is a transparent overlay covering
 * it, and the action button sits above the overlay at a higher `z-index`. One
 * real link per card, keyboard focusable, openable in a new tab, and the button
 * still wins the click.
 */
export function ProductCard({
  product,
  onAddToCart,
  showStock = true,
  to,
}: ProductCardProps) {
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(e);
    }
  };

  // Shared with every other card, so this is a cache hit rather than a request.
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  useEffect(() => {
    let cancelled = false;
    loadSettings().then((s) => { if (!cancelled) setSettings(s); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // A missing or dead image URL used to leave the browser drawing the alt text
  // across the whole tile. The name is already in the card body, so the image is
  // decorative (`alt=""`) and a broken one gets a placeholder instead.
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [product.imageUrl]);

  const body = (
    <>
      {/* Image container */}
      <div className="relative aspect-square overflow-hidden bg-slate-50">
        {product.imageUrl && !imageFailed ? (
          <img
            src={product.imageUrl}
            alt=""
            onError={() => setImageFailed(true)}
            /*
              `contain`, not `cover`. Catalogue shots of medical consumables are
              tall portrait images on white; `cover` in a square tile crops the
              top and bottom off the product itself, which is the one part of the
              image a buyer needs to see. `contain` shows the whole item.
            */
            className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          /*
            Placeholder carries the product initial so a grid of unphotographed
            items still reads as a deliberate catalogue rather than a page that
            failed to load its images.
          */
          <span
            aria-hidden="true"
            className="absolute inset-0 grid place-items-center bg-slate-50"
          >
            <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-sm font-semibold text-slate-300 ring-1 ring-slate-200">
              {product.name.trim().charAt(0).toUpperCase() || '•'}
            </span>
          </span>
        )}

        {/* Badges sit on a translucent plate so they stay legible over a
            white-background product shot instead of fighting it. */}
        {product.isFeatured && (
          <span className="absolute left-2 top-2 rounded-md bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-amber-700 shadow-sm ring-1 ring-amber-200">
            Featured
          </span>
        )}
        {product.status === 'coming_soon' && (
          <span className="absolute right-2 top-2 rounded-md bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200">
            Coming soon
          </span>
        )}
      </div>

      {/* Body. `flex-1` plus `mt-auto` on the footer row is what keeps the price
          or Enquire button on the baseline of every card in a row, whatever the
          product name length. */}
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">
          {product.name}
        </h3>

        <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">
          {product.description}
        </p>

        {showStock && product.stock > 0 && (
          <p className="text-xs text-slate-400">{product.stock} in stock</p>
        )}
        {showStock && product.stock === 0 && (
          <p className="text-xs text-red-500">Out of stock</p>
        )}

        {/* Footer — pinned to the bottom of the card. */}
        {product.status === 'coming_soon' ? (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              /*
                `resolveWhatsAppNumber`, not `settings.phoneNumber`. The raw
                setting is a display string — "+254 799 526972" — and dropping
                that straight into wa.me produces a dead link. The old fallback
                of '254700000000' was worse: if settings had not loaded yet, or
                the request failed, every enquiry went to a number that is not
                the business's.
              */
              const phone = resolveWhatsAppNumber(settings);
              if (!phone) {
                console.warn('Enquiry link unavailable: no WhatsApp number configured.');
                return;
              }
              const message = `Hi, I'd like to enquire about: ${product.name}`;
              window.open(generateWhatsAppLink(phone, message), '_blank', 'noopener');
            }}
            // Above the link overlay, or the overlay eats the click.
            className="relative z-20 mt-auto flex w-full items-center justify-center gap-2 rounded-lg border border-primary-200 bg-primary-50 py-2 text-sm font-medium text-primary-700 transition-colors hover:border-primary-300 hover:bg-primary-100"
          >
            <MessageCircle size={15} aria-hidden="true" />
            Enquire
          </button>
        ) : (
          <div className="mt-auto flex items-center justify-between gap-2 pt-2">
            <span className="text-sm font-bold text-slate-900">
              Ksh {product.price.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            {onAddToCart && product.stock > 0 && product.status === 'active' && (
              <button
                onClick={handleAddToCart}
                aria-label={`Add ${product.name} to cart`}
                className="relative z-20 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-800"
              >
                Add
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );

  const shell =
    'group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white ' +
    'transition-all hover:border-slate-300 hover:shadow-md focus-within:border-primary-400 ' +
    'focus-within:ring-2 focus-within:ring-primary-500/25';

  if (!to) {
    return <div className={shell}>{body}</div>;
  }

  return (
    <div className={shell}>
      {body}
      {/*
        The overlay. It comes after the body so it paints above the card
        content, and any button inside the body carries `z-20` to sit above it
        again. It carries the accessible name, because the visible text it
        covers is not the only thing a screen reader should announce.
      */}
      <Link
        to={to}
        className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
      >
        <span className="sr-only">{product.name}</span>
      </Link>
    </div>
  );
}
