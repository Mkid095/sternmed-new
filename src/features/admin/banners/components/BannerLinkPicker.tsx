/**
 * Banner link target picker.
 *
 * A banner can point somewhere. The admin picks what kind of destination they
 * want and this turns that into an in-app path — it never asks for a URL to
 * type, because a hand-typed URL is how banners end up dead or pointing off
 * the site.
 *
 * Why a picker and not a text field
 * ---------------------------------
 * The value is a path (`/shop`, `/shop?category=<uuid>`, `/product/<uuid>`).
 * There is no `/category/:id` route — Shop filters by `?category=` — so a
 * category link can only be built correctly here. A free-text field would
 * accept `/categories/<id>` and 404.
 *
 * It also keeps the constraint on the column meaningful: the only writer is
 * this component, and everything it produces starts with `/`.
 *
 * @module BannerLinkPicker
 */

import { useMemo, useState, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { Link2, Link2Off, Search } from 'lucide-react';
import { api } from '../../../../services/api';
import type { Category, Product } from '../../../../types';

type TargetKind = 'none' | 'page' | 'category' | 'product';

const PAGES: Array<{ label: string; path: string }> = [
  { label: 'Home page', path: '/' },
  { label: 'Shop — all products', path: '/shop' },
  { label: 'Cart', path: '/cart' },
  { label: 'Privacy policy', path: '/privacy-policy' },
  { label: 'Terms & Conditions', path: '/terms' },
];

export interface BannerLinkPickerProps {
  value: string | null;
  onChange: (path: string | null) => void;
}

export function BannerLinkPicker({ value, onChange }: BannerLinkPickerProps) {
  const [kind, setKind] = useState<TargetKind>(() => inferKind(value));
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState('');

  /**
   * Catalog is fetched once, and only when a category or product is actually
   * needed. Most banners link to a plain page.
   */
  const ensureCatalog = () => {
    if (loaded) return;
    setLoaded(true);
    Promise.all([api.getCategories(), api.getProducts()])
      .then(([cats, prods]) => {
        setCategories(cats);
        setProducts(prods);
      })
      .catch((err) => {
        console.error('Failed to load banner link targets:', err);
        setLoaded(true);
      });
  };

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, query]);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.slice(0, 60);
    return products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 60);
  }, [products, query]);

  const chooseKind = (next: TargetKind) => {
    setKind(next);
    setQuery('');
    if (next === 'none') return onChange(null);
    if (next === 'page') return onChange(PAGES[0].path);
    ensureCatalog();
    onChange(null); // nothing sensible to point at until one is chosen
  };

  return (
    <div>
      <p className="mb-1.5 block text-sm font-medium text-slate-700">
        Where does this banner link to?
      </p>

      <div
        role="radiogroup"
        aria-label="Banner link destination"
        className="mb-3 flex flex-wrap gap-2"
      >
        <KindChip
          active={kind === 'none'}
          onClick={() => chooseKind('none')}
          icon={<Link2Off size={13} aria-hidden="true" />}
        >
          Not a link
        </KindChip>
        <KindChip
          active={kind === 'page'}
          onClick={() => chooseKind('page')}
          icon={<Link2 size={13} aria-hidden="true" />}
        >
          A page
        </KindChip>
        <KindChip
          active={kind === 'category'}
          onClick={() => chooseKind('category')}
          icon={<Link2 size={13} aria-hidden="true" />}
        >
          A category
        </KindChip>
        <KindChip
          active={kind === 'product'}
          onClick={() => chooseKind('product')}
          icon={<Link2 size={13} aria-hidden="true" />}
        >
          A product
        </KindChip>
      </div>

      {kind === 'page' && (
        <ul className="max-h-56 overflow-y-auto rounded-xl border border-slate-200">
          {PAGES.map((page) => {
            const selected = value === page.path;
            return (
              <li key={page.path}>
                <button
                  type="button"
                  onClick={() => onChange(page.path)}
                  aria-pressed={selected}
                  className={clsx(
                    'flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors',
                    'border-b border-slate-100 last:border-b-0',
                    selected ? 'bg-primary-50 font-medium text-primary-700' : 'text-slate-700 hover:bg-slate-50',
                  )}
                >
                  <span>{page.label}</span>
                  <span className="shrink-0 text-xs text-slate-400">{page.path}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {(kind === 'category' || kind === 'product') && (
        <div>
          <div className="relative mb-2">
            <Search
              size={15}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={kind === 'category' ? 'Search categories' : 'Search products'}
              aria-label={kind === 'category' ? 'Search categories' : 'Search products'}
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm transition-colors hover:border-slate-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25"
            />
          </div>

          <ul className="max-h-56 overflow-y-auto rounded-xl border border-slate-200">
            {!loaded && <li className="px-3 py-3 text-sm text-slate-500">Loading…</li>}

            {loaded && kind === 'category' && filteredCategories.length === 0 && (
              <li className="px-3 py-3 text-sm text-slate-500">No categories match.</li>
            )}
            {loaded && kind === 'product' && filteredProducts.length === 0 && (
              <li className="px-3 py-3 text-sm text-slate-500">
                {query ? 'No products match.' : 'No products yet.'}
              </li>
            )}

            {kind === 'category' &&
              filteredCategories.map((category) => {
                // Shop filters by query string; there is no /category/:id route.
                const path = `/shop?category=${category.id}`;
                const selected = value === path;
                return (
                  <li key={category.id}>
                    <button
                      type="button"
                      onClick={() => onChange(path)}
                      aria-pressed={selected}
                      className={clsx(
                        'flex w-full items-center gap-3 border-b border-slate-100 px-3 py-2 text-left text-sm transition-colors last:border-b-0',
                        selected ? 'bg-primary-50 font-medium text-primary-700' : 'text-slate-700 hover:bg-slate-50',
                      )}
                    >
                      {category.image ? (
                        <img
                          src={category.image}
                          alt=""
                          className="h-7 w-7 flex-shrink-0 rounded object-cover"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span aria-hidden="true" className="h-7 w-7 flex-shrink-0 rounded bg-slate-100" />
                      )}
                      <span className="truncate">{category.name}</span>
                    </button>
                  </li>
                );
              })}

            {kind === 'product' &&
              filteredProducts.map((product) => {
                const path = `/product/${product.id}`;
                const selected = value === path;
                return (
                  <li key={product.id}>
                    <button
                      type="button"
                      onClick={() => onChange(path)}
                      aria-pressed={selected}
                      className={clsx(
                        'flex w-full items-center gap-3 border-b border-slate-100 px-3 py-2 text-left text-sm transition-colors last:border-b-0',
                        selected ? 'bg-primary-50 font-medium text-primary-700' : 'text-slate-700 hover:bg-slate-50',
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">{product.name}</span>
                      <span className="shrink-0 text-xs text-slate-400">
                        Ksh {product.price.toLocaleString()}
                      </span>
                    </button>
                  </li>
                );
              })}
          </ul>
        </div>
      )}

      <p className="mt-2 text-xs text-slate-500">
        {value ? (
          <>
            Visitors who tap the banner go to{' '}
            <span className="font-medium text-slate-700">{value}</span>.
          </>
        ) : (
          'This banner will be shown but not clickable.'
        )}
      </p>
    </div>
  );
}

function KindChip({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={clsx(
        'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'border-primary-600 bg-primary-50 text-primary-700'
          : 'border-slate-200 text-slate-600 hover:bg-slate-50',
      )}
    >
      {icon}
      {children}
    </button>
  );
}

/** Reads an existing path back so editing a banner shows its current target. */
function inferKind(value: string | null): TargetKind {
  if (!value) return 'none';
  if (value.startsWith('/product/')) return 'product';
  if (value.includes('category=')) return 'category';
  return 'page';
}