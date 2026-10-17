/**
 * Product card views.
 *
 * Split out of AdminProducts.tsx, which had grown past 1000 lines. The compact
 * card, the grid tile and the table row each described the same product with
 * their own image handling, button sizing and badge weight; they now share the
 * primitives in ProductBits and differ only in layout.
 *
 * @module ProductCards
 */

import type { Key } from 'react';
import { Star } from 'lucide-react';
import type { Product, Category } from '../../../../types';
import { ProductImage, ProductActions, StatusPill, StockPill } from './ProductBits';

interface ProductCompactCardProps {
  key?: Key;
  product: Product;
  category?: Category;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onToggleFeatured: (id: string, status: boolean) => void;
  isTogglingFeatured?: boolean;
}

function ProductCompactCard({ product, category, onEdit, onDelete, onToggleFeatured, isTogglingFeatured = false }: ProductCompactCardProps) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:border-slate-300 hover:shadow-md">
      <div className="relative aspect-square bg-slate-100">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover"
        />

        <div className="absolute inset-x-1.5 top-1.5 flex items-start justify-between gap-1">
          <StatusPill status={product.status} />
          {product.isFeatured && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-white/95 px-1.5 py-0.5 text-[10px] font-medium leading-tight text-amber-700 shadow-sm backdrop-blur">
              <Star size={9} fill="currentColor" aria-hidden="true" />
              Featured
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-2.5">
        <h3 className="line-clamp-2 text-xs font-medium leading-snug text-slate-900">{product.name}</h3>

        <div className="mt-auto pt-2.5">
          <p className="whitespace-nowrap text-sm font-semibold tabular-nums text-slate-900">
            {product.price > 0 ? `Ksh ${product.price.toLocaleString()}` : 'No price'}
          </p>

          <div className="mt-1.5 flex items-center justify-between gap-1">
            {product.status === 'active' ? (
              <StockPill stock={product.stock} />
            ) : (
              <span className="text-[11px] text-slate-400">{category?.name || 'Uncategorised'}</span>
            )}
            <ProductActions
              size="sm"
              isFeatured={Boolean(product.isFeatured)}
              onToggleFeatured={() => onToggleFeatured(product.id, product.isFeatured)}
              onEdit={() => onEdit(product)}
              onDelete={() => onDelete(product.id)}
              isToggling={isTogglingFeatured}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * Product tile (desktop grid).
 *
 * Rebuilt around ProductImage / ProductActions / StatusPill so it matches the
 * compact card and the table row instead of each inventing its own image
 * fallback, button sizing and badge weight.
 */
function ProductCard({ product, category, onEdit, onDelete, onToggleFeatured, isTogglingFeatured = false }: ProductCompactCardProps) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:border-slate-300 hover:shadow-md">
      <div className="relative aspect-[4/3] bg-slate-100">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover"
        />

        {/* Badges sit over the image but are anchored to its top edge with a
            hairline rather than floating in the middle of the photo. */}
        <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-2">
          <StatusPill status={product.status} />
          {product.isFeatured && (
            <span className="inline-flex items-center gap-1 rounded-md bg-white/95 px-2 py-0.5 text-[11px] font-medium leading-tight text-amber-700 shadow-sm backdrop-blur">
              <Star size={11} fill="currentColor" aria-hidden="true" />
              Featured
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 text-sm font-semibold text-slate-900">{product.name}</h3>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{product.description}</p>

        <div className="mt-auto pt-3">
          {/*
            Price and category stack on the left and the actions get their own
            row. Sharing one row meant three 36px buttons plus the price did not
            fit a five-across tile, and the delete button was clipped off the
            card edge — the one control that must never be unreachable.
          */}
          <p className="whitespace-nowrap text-base font-semibold tabular-nums text-slate-900">
            {product.price > 0 ? `Ksh ${product.price.toLocaleString()}` : 'No price'}
          </p>

          <p className="mt-0.5 truncate text-xs text-slate-400">
            {category?.name || 'Uncategorised'}
          </p>

          <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
            {product.status === 'active' ? (
              <StockPill stock={product.stock} />
            ) : (
              <span />
            )}

            <ProductActions
              size="sm"
              isFeatured={Boolean(product.isFeatured)}
              onToggleFeatured={() => onToggleFeatured(product.id, product.isFeatured)}
              onEdit={() => onEdit(product)}
              onDelete={() => onDelete(product.id)}
              isToggling={isTogglingFeatured}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * Product table row (desktop list view).
 *
 * Shares ProductImage / ProductActions / StatusPill / StockPill with the two
 * card views so the same product looks the same whichever view you are in.
 */
function ProductTableRow({ product, category, onEdit, onDelete, onToggleFeatured, isTogglingFeatured = false }: ProductCompactCardProps) {
  return (
    <tr className="transition-colors hover:bg-slate-50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
            <ProductImage
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium text-slate-900">{product.name}</span>
              <StatusPill status={product.status} />
              {product.isFeatured && (
                <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                  <Star size={9} fill="currentColor" aria-hidden="true" />
                  Featured
                </span>
              )}
            </div>
            <p className="max-w-[280px] truncate text-xs text-slate-500">{product.description}</p>
          </div>
        </div>
      </td>

      <td className="px-4 py-3 text-sm text-slate-600">{category?.name || 'Uncategorised'}</td>

      <td className="px-4 py-3 text-sm font-medium tabular-nums text-slate-900">
        {product.price > 0 ? `Ksh ${product.price.toLocaleString()}` : <span className="text-slate-400">No price</span>}
      </td>

      <td className="px-4 py-3">
        {product.status === 'active' ? <StockPill stock={product.stock} /> : null}
      </td>

      <td className="px-4 py-3 text-right">
        <ProductActions
          size="sm"
          isFeatured={Boolean(product.isFeatured)}
          onToggleFeatured={() => onToggleFeatured(product.id, product.isFeatured)}
          onEdit={() => onEdit(product)}
          onDelete={() => onDelete(product.id)}
          isToggling={isTogglingFeatured}
        />
      </td>
    </tr>
  );
}

export { ProductCompactCard, ProductCard, ProductTableRow };
