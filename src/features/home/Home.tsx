/**
 * Home Page Component
 *
 * Main landing page featuring:
 * - Hero banner carousel
 * - Featured products by category
 * - Product carousels with navigation
 *
 * @module Home
 */

import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Product, Category, Banner } from '../../types';
import { useCartStore } from '../../store/cartStore';
import { HeroCarousel } from './components/HeroCarousel';
import { CategorySection } from './components/CategorySection';
import { ProductCard } from '../shared/ui/Card';
import { Package } from 'lucide-react';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prods, cats, bans] = await Promise.all([
          api.getProducts(),
          api.getCategories(),
          api.getBanners()
        ]);
        setProducts(prods);
        setCategories(cats);
        setBanners(bans);
      } catch (error) {
        console.error('Failed to fetch data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Get all featured products for the featured section
  const featuredProducts = useMemo(() => {
    return products.filter((p) =>
      p.isFeatured &&
      p.status !== 'draft' &&
      p.status !== 'archived'
    ).slice(0, 8);
  }, [products]);

  // Get visible categories sorted by name
  const visibleCategories = useMemo(() => {
    return categories
      .filter((c) => c.showOnHome)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-slate-200 border-t-primary-600"></div>
          <p className="text-slate-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  const hasFeaturedProducts = featuredProducts.length > 0;
  const hasCategorySections = visibleCategories.length > 0;

  return (
    <div className="flex flex-col">
      {/* Hero Carousel */}
      <HeroCarousel banners={banners} />

      {/* Main Content */}
      <div className="bg-gradient-to-b from-slate-50 to-white py-4 sm:py-6 lg:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Featured Products Section */}
          {hasFeaturedProducts && (
            <section className="mb-10 sm:mb-12">
              {/* Section Header - simplified */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Featured Products</h2>
                  <p className="text-xs text-slate-500">Hand-picked products for you</p>
                </div>
                <a
                  href="/shop?featured=true"
                  className="text-xs text-slate-600 hover:text-slate-900 font-medium"
                >
                  View All
                </a>
              </div>

              {/* Featured Products Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {featuredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={(e) => {
                      e.stopPropagation();
                      addItem(product);
                    }}
                    onClick={() => navigate(`/product/${product.id}`)}
                    showStock={false}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Category Sections */}
          {hasCategorySections && (
            <div className="space-y-10 sm:space-y-12">
              {/* Simplified section header */}
              <div className="mb-2">
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Shop by Category</h2>
                <p className="text-xs text-slate-500">Browse our selection</p>
              </div>

              {visibleCategories.map((category) => (
                <CategorySection
                  key={category.id}
                  category={category}
                  products={products}
                  onAddToCart={addItem}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!hasFeaturedProducts && !hasCategorySections && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Package size={40} className="text-slate-300" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No products available</h3>
              <p className="text-slate-500">
                Check back later for new arrivals and featured products.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Spacing for Mobile Navigation */}
      <div className="h-16 sm:hidden" />
    </div>
  );
}
