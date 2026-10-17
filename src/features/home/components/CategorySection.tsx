/**
 * Category Section Component
 *
 * Displays a horizontal carousel of featured products for a specific category.
 * Includes scroll navigation and "View All" link to full category page.
 *
 * @module CategorySection
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Category, Product } from '../../../types';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from '../../shared/ui';

interface CategorySectionProps {
  key?: string;
  category: Category;
  products: Product[];
  onAddToCart: (product: Product) => void;
}

/**
 * Category Section Component
 *
 * Renders a product carousel for each visible category on the home page.
 * Shows only featured products and provides navigation controls.
 */
export function CategorySection({ category, products, onAddToCart }: CategorySectionProps) {
  const navigate = useNavigate();

  // Show products for this category that are not draft, archived, or out-of-stock
  const categoryProducts = products.filter(
    (p) => p.categoryId === category.id && p.status !== 'draft' && p.status !== 'archived' && p.status !== 'out_of_stock'
  );

  if (categoryProducts.length === 0) return null;

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(categoryProducts.length > 1);
  const [isHovered, setIsHovered] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const hasScroll = el.scrollWidth > el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // Initial check
    checkScroll();

    const observer = new ResizeObserver(checkScroll);
    observer.observe(el);

    el.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);

    return () => {
      observer.disconnect();
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [categoryProducts.length]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;

    const cardWidth = el.firstChild instanceof HTMLElement ? el.firstChild.offsetWidth : 200;
    const scrollAmount = cardWidth + 16; // card width + gap
    const newScrollLeft = direction === 'left'
      ? el.scrollLeft - scrollAmount
      : el.scrollLeft + scrollAmount;

    el.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  return (
    <section className="mb-10 sm:mb-12">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900">{category.name}</h2>
          <p className="text-xs text-slate-500">
            {categoryProducts.length} product{categoryProducts.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* View All Button */}
        <a
          href={`/shop?category=${category.id}`}
          className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-medium transition-colors"
        >
          View All
          <ArrowRight size={14} strokeWidth={2.5} />
        </a>
      </div>

      {/* Carousel Container */}
      <div
        className="relative group/carousel"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/*
          Scroll buttons stay visible rather than appearing on hover.

          Hover-revealed arrows are unreachable on a touch screen, where
          `group-hover` never fires — so on a phone the row simply looked cut
          off mid-card with nothing to indicate it moved. They only render when
          that direction has somewhere to go, so a row that fits shows neither.
        */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 -ml-4"
            aria-label={`Scroll ${category.name} products left`}
          >
            <ChevronLeft size={18} strokeWidth={2.5} aria-hidden="true" />
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 -mr-4"
            aria-label={`Scroll ${category.name} products right`}
          >
            <ChevronRight size={18} strokeWidth={2.5} aria-hidden="true" />
          </button>
        )}

        {/* Horizontal Scroll Container */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 scrollbar-hide"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {categoryProducts.map((product) => (
            <div
              key={product.id}
              className="snap-start shrink-0 w-[150px] sm:w-[180px] md:w-[200px]"
            >
              <ProductCard
                product={product}
                onAddToCart={() => onAddToCart(product)}
                to={`/product/${product.id}`}
                showStock={false}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
