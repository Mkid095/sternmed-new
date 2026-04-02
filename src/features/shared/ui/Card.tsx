import React, { ReactNode, useEffect, useState } from 'react';
import { ShoppingBag, MessageCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { ProductStatus, SiteSettings } from '../../../types';
import { api } from '../../../services/api';
import { generateWhatsAppLink } from '../../../constants';

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
  onClick?: () => void;
}

export function ProductCard({
  product,
  onAddToCart,
  showStock = true,
  showWishlistButton = false,
  onClick,
}: ProductCardProps) {
  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(e);
    }
  };

  // Fetch settings for WhatsApp contact
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  useEffect(() => {
    api.getSettings().then(setSettings).catch(console.error);
  }, []);

  return (
    <div
      onClick={handleCardClick}
      className="bg-white border border-slate-200 rounded overflow-hidden hover:shadow-md hover:border-slate-300 transition-all flex flex-col group cursor-pointer"
    >
      {/* Image Container */}
      <div className="aspect-square bg-slate-100 relative overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {/* Featured Badge - smaller, subtler */}
        {product.isFeatured && (
          <div className="absolute top-2 left-2 bg-amber-500 text-white px-2 py-0.5 rounded text-xs font-semibold shadow-sm">
            Featured
          </div>
        )}
        {/* Coming Soon Badge */}
        {product.status === 'coming_soon' && (
          <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-0.5 rounded text-xs font-semibold shadow-sm">
            Coming Soon
          </div>
        )}
      </div>

      {/* Content - more compact */}
      <div className="p-3 flex flex-col gap-1.5">
        {/* Product Name */}
        <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">
          {product.name}
        </h3>

        {/* Short Description - 1 line only */}
        <p className="text-xs text-slate-500 line-clamp-1">
          {product.description}
        </p>

        {/* Stock Count - small and subtle */}
        {showStock && product.stock > 0 && (
          <p className="text-xs text-slate-400">
            {product.stock} in stock
          </p>
        )}
        {showStock && product.stock === 0 && (
          <p className="text-xs text-red-500">
            Out of stock
          </p>
        )}

        {/* Price or Enquire Button */}
        {product.status === 'coming_soon' ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              const phone = settings?.phoneNumber || '254700000000';
              const message = `Hi, I'd like to enquire about: ${product.name}`;
              window.open(generateWhatsAppLink(phone, message), '_blank');
            }}
            className="w-full py-2 flex items-center justify-center gap-2 bg-primary-600 text-white rounded font-medium hover:bg-primary-700 transition-colors"
          >
            <MessageCircle size={16} />
            Enquire
          </button>
        ) : (
          <div className="flex items-center justify-between pt-1 mt-auto gap-2">
            <span className="text-sm font-bold text-slate-900">
              Ksh {product.price.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            {onAddToCart && product.stock > 0 && product.status === 'active' && (
              <button
                onClick={handleAddToCart}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium transition-colors"
                aria-label="Add to cart"
              >
                Add
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
