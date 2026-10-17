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

import { Fragment, useEffect, useState, useMemo, type CSSProperties, type Key } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import {
  Product,
  Category,
  Banner,
  SiteSettings,
  HomepageSection,
  CtaBannerConfig,
  DEFAULT_HOMEPAGE_SECTIONS,
} from '../../types';
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

/**
 * Fallback box shape for a CTA banner until its image reports its own, matching
 * the 1600x400 the admin form recommends and previews at.
 */
const DEFAULT_CTA_RATIO = '1600 / 400';

/** True when a CTA banner is pinned to sit after a specific category. */
function isPinnedToCategory(section: HomepageSection): boolean {
  return (
    section.type === 'cta-banner' &&
    Boolean(((section.config ?? {}) as Partial<CtaBannerConfig>).afterCategoryId)
  );
}

/**
 * One admin-added call-to-action banner.
 *
 * Renders inside the home page's padded content column, in section order. The
 * whole banner is the click target when it has a link — the same convention as
 * the hero carousel, and deliberately no button laid over the artwork.
 *
 * A section with no image yet renders nothing rather than an empty grey box, so
 * a freshly added banner leaves no gap on the live page until it is filled in.
 */
function CtaBanner({ section }: { key?: Key; section: HomepageSection }) {
  const config = (section.config ?? {}) as Partial<CtaBannerConfig>;
  const imageUrl = config.imageUrl;

  // The wrapper needs a definite height. Without one, `h-full` on the image is
  // a percentage against an indefinite parent and resolves to 0px — the banner
  // was in the DOM and completely invisible, which is why adding one appeared
  // to do nothing.
  const [ratio, setRatio] = useState<string | null>(null);
  useEffect(() => { setRatio(null); }, [imageUrl]);

  if (!imageUrl) return null;

  const boxStyle: CSSProperties = { aspectRatio: ratio ?? DEFAULT_CTA_RATIO };

  const image = (
    <img
      src={imageUrl}
      alt={config.alt ?? ''}
      className="h-full w-full object-cover"
      // Measure the real shape so an oddly-proportioned upload is not cropped.
      onLoad={(e) => {
        const { naturalWidth, naturalHeight } = e.currentTarget;
        if (naturalWidth && naturalHeight) setRatio(`${naturalWidth} / ${naturalHeight}`);
      }}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
    />
  );

  const boxClass = 'block w-full overflow-hidden rounded-2xl bg-slate-100';

  return (
    // `mb-10 sm:mb-12` matches the gap the category strips use, so a banner
    // pinned between two of them is spaced exactly like a strip.
    <section className="mb-10 sm:mb-12">
      {config.linkTarget ? (
        <a href={config.linkTarget} className={boxClass} style={boxStyle}>
          {image}
        </a>
      ) : (
        <div className={boxClass} style={boxStyle}>
          {image}
        </div>
      )}
    </section>
  );
}

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
          // Only live banners — a parked one is filtered out server-side rather
          // than here, so the homepage never has to know the flag exists.
          api.getActiveBanners(),
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

  /**
   * Featured products for the section to show.
   *
   * Deliberately NOT gated on `settings.featuredSectionEnabled`. That legacy
   * column was a second on/off switch for the same decision, and it won: the
   * Landing page toggle wrote `homepage_sections` (section enabled), while this
   * column sat at `false` in the database and silently emptied the list. The
   * switch an admin can see said ON and the section rendered nothing.
   *
   * The section's own `enabled` flag in `homepage_sections` is the only control
   * now — see the `featured-products` case in `renderSection`.
   *
   * The row limit prefers the per-section config over the legacy
   * `featuredProductCount`, for the same reason.
   */
  const featuredProducts = useMemo(() => {
    const count = settings.featuredProductCount || 8;
    return products.filter((p) =>
      p.isFeatured &&
      p.status !== 'draft' &&
      p.status !== 'archived' &&
      p.status !== 'out_of_stock'
    ).slice(0, count);
  }, [products, settings.featuredProductCount]);

  // Get visible categories sorted by prominentCategories order from settings
  const visibleCategories = useMemo(() => {
    const visible = categories.filter((c) => c.showOnHome);

    // If prominentCategories is set, use that order
    if (settings.prominentCategories && settings.prominentCategories.length > 0) {
      const categoryMap = new Map<string, Category>(visible.map((c) => [c.id, c] as const));
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
        // Rendered outside the section list, so it needs no key.
        return <HeroCarousel banners={banners} />;

      case 'featured-products':
        if (!section.enabled || !hasFeaturedProducts) return null;
        const productCount = section.config?.productCount ?? settings.featuredProductCount ?? 8;
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

      case 'categories': {
        if (!section.enabled || !hasCategorySections) return null;

        /*
          Banners pinned to a category render inside this block, immediately
          after that category's strip. Grouped by category id so the map lookup
          is O(1) per strip instead of scanning the section list each time.
        */
        const pinnedByCategory = new Map<string, HomepageSection[]>();
        for (const candidate of sortedSections) {
          if (!candidate.enabled || !isPinnedToCategory(candidate)) continue;
          const categoryId = ((candidate.config ?? {}) as Partial<CtaBannerConfig>).afterCategoryId!;
          const bucket = pinnedByCategory.get(categoryId);
          if (bucket) bucket.push(candidate);
          else pinnedByCategory.set(categoryId, [candidate]);
        }

        return (
          <div key="categories" className="space-y-10 sm:space-y-12">
            <div className="mb-2">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Shop by Category</h2>
              <p className="text-xs text-slate-500">Browse our selection</p>
            </div>
            {visibleCategories.map((category) => (
              <Fragment key={category.id}>
                <CategorySection
                  category={category}
                  products={products}
                  onAddToCart={addItem}
                />
                {(pinnedByCategory.get(category.id) ?? []).map((banner) => (
                  <CtaBanner key={banner.id} section={banner} />
                ))}
              </Fragment>
            ))}
          </div>
        );
      }

      case 'cta-banner':
        return <CtaBanner section={section} />;

      case 'promotional-banner':
        // Reserved type, not built yet. Kept out of `contentSections` so it
        // cannot render an empty gap in the page.
        return null;

      default:
        return null;
    }
  };

  // A banner pinned to a category that has since been hidden or deleted would
  // render nowhere at all, so it is put back at the end rather than silently
  // disappearing from the live page.
  const orphanedPins = sortedSections.filter(
    s => s.enabled && isPinnedToCategory(s) &&
      !visibleCategories.some(c => c.id === ((s.config ?? {}) as Partial<CtaBannerConfig>).afterCategoryId)
  );

  // Separate hero from other sections
  const heroSection = sortedSections.find(s => s.type === 'hero' && s.enabled);
  // Everything that is not the hero renders in the padded content column, in
  // position order — including admin-added CTA banners, so a banner dropped
  // between "Featured products" and "Shop by category" lands there.
  const contentSections = sortedSections.filter(
    s => s.enabled && s.type !== 'hero' && s.type !== 'promotional-banner' && !isPinnedToCategory(s)
  );

  return (
    <div className="flex flex-col">
      {/* Hero Section - full width, no padding */}
      {heroSection && renderSection(heroSection)}

      {/* Content Sections - with proper padding */}
      <div className="bg-gradient-to-b from-slate-50 to-white py-4 sm:py-6 lg:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {contentSections.map(section => renderSection(section))}
          {orphanedPins.map(section => (
            <CtaBanner key={`orphan-${section.id}`} section={section} />
          ))}
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
