/**
 * Home Page Component
 *
 * Main landing page featuring:
 * - Hero banner carousel
 * - Featured products by category
 * - Product carousels with navigation
 *
 * Configuration is fetched from site_settings and controls:
 * - Featured section visibility and product count
 * - Category display order
 * - Homepage section ordering
 *
 * @module Home
 */

import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Product, Category, Banner, SiteSettings, HomepageSection, DEFAULT_HOMEPAGE_SECTIONS } from '../../types';
import { useCartStore } from '../../store/cartStore';
import { HeroCarousel } from './components/HeroCarousel';
import { CategorySection } from './components/CategorySection';
import { ProductCard } from '../shared/ui/Card';
import { Package } from 'lucide-react';

// Default settings if none exist
const DEFAULT_SETTINGS: Partial<SiteSettings> = {
  featuredSectionEnabled: true,
  featuredProductCount: 8,
  prominentCategories: [],
  homepageSections: DEFAULT_HOMEPAGE_SECTIONS,
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [settings, setSettings] = useState<Partial<SiteSettings>>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prods, cats, bans, siteSettings] = await Promise.all([
          api.getProducts(),
          api.getCategories(),
          api.getBanners(),
          api.getSettings(),
        ]);
        setProducts(prods);
        setCategories(cats);
        setBanners(bans);
        setSettings(siteSettings);
      } catch (error) {
        console.error('Failed to fetch data', error);
        // Still set loading false even on error to show content
        setProducts([]);
        setCategories([]);
        setBanners([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Get featured products based on settings
  const featuredProducts = useMemo(() => {
    if (settings.featuredSectionEnabled === false) {
      return [];
    }
    const count = settings.featuredProductCount || 8;
    return products.filter((p) =>
      p.isFeatured &&
      p.status !== 'draft' &&
      p.status !== 'archived' &&
      p.status !== 'out_of_stock'
    ).slice(0, count);
  }, [products, settings.featuredSectionEnabled, settings.featuredProductCount]);

  // Get visible categories sorted by prominentCategories order from settings
  const visibleCategories = useMemo(() => {
    const visible = categories.filter((c) => c.showOnHome);

    // If prominentCategories is set, use that order
    if (settings.prominentCategories && settings.prominentCategories.length > 0) {
      const categoryMap = new Map(visible.map(c => [c.id, c]));
      const ordered: Category[] = [];

      for (const id of settings.prominentCategories) {
        const cat = categoryMap.get(id);
        if (cat) {
          ordered.push(cat);
          categoryMap.delete(id);
        }
      }

      // Append any categories not in prominentCategories (maintain original order)
      ordered.push(...categoryMap.values());

      return ordered;
    }

    // Fallback: sort alphabetically by name
    return [...visible].sort((a, b) => a.name.localeCompare(b.name));
  }, [categories, settings.prominentCategories]);

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

  // Get homepage sections from settings, sorted by position
  const homepageSections = settings.homepageSections || DEFAULT_HOMEPAGE_SECTIONS;
  const sortedSections = [...homepageSections].sort((a, b) => a.position - b.position);

  const hasFeaturedProducts = featuredProducts.length > 0;
  const hasCategorySections = visibleCategories.length > 0;
  const hasAnySection = sortedSections.some(s => s.enabled && (
    (s.type === 'featured-products' && hasFeaturedProducts) ||
    (s.type === 'categories' && hasCategorySections) ||
    (s.type === 'hero') ||
    (s.type === 'promotional-banner')
  ));

  // Render a specific section based on type
  const renderSection = (section: HomepageSection) => {
    switch (section.type) {
      case 'hero':
        return <HeroCarousel key="hero" banners={banners} />;

      case 'featured-products':
        if (!section.enabled || !hasFeaturedProducts) return null;
        const productCount = section.config?.productCount || settings.featuredProductCount || 8;
        return (
          <section key="featured-products" className="mb-10 sm:mb-12">
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {featuredProducts.slice(0, productCount).map((product) => (
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
        );

      case 'categories':
        if (!section.enabled || !hasCategorySections) return null;
        return (
          <div key="categories" className="space-y-10 sm:space-y-12">
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
        );

      case 'promotional-banner':
        // Placeholder for promotional banner section
        if (!section.enabled) return null;
        return null;

      default:
        return null;
    }
  };

  // Separate hero from other sections
  const heroSection = sortedSections.find(s => s.type === 'hero' && s.enabled);
  const contentSections = sortedSections.filter(s => s.enabled && (s.type === 'featured-products' || s.type === 'categories'));

  return (
    <div className="flex flex-col">
      {/* Hero Section - full width, no padding */}
      {heroSection && renderSection(heroSection)}

      {/* Content Sections - with proper padding */}
      <div className="bg-gradient-to-b from-slate-50 to-white py-4 sm:py-6 lg:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {contentSections.map(section => renderSection(section))}
        </div>
      </div>

      {/* Empty State - only show if no content sections and no hero */}
      {!heroSection && contentSections.length === 0 && (
        <div className="bg-gradient-to-b from-slate-50 to-white py-4 sm:py-6 lg:py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Package size={40} className="text-slate-300" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No content available</h3>
              <p className="text-slate-500">
                Enable sections in Admin Settings to display content on the homepage.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Spacing for Mobile Navigation */}
      <div className="h-16 sm:hidden" />
    </div>
  );
}
