/**
 * Product image and action primitives.
 *
 * Local to the products feature rather than shared, because how a product tile
 * should behave is a decision this page owns — the catalogue is the one screen
 * where a missing image and a destructive action sit directly next to each
 * other, and both need to be right.
 *
 * Three product views exist (compact card, card, table row) and all three had
 * the same two defects, so both pieces are defined once here and used by all
 * three rather than pasted into each.
 */

import { useState, type ImgHTMLAttributes } from 'react';
import { ImageOff, Star, Pencil, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';

/**
 * Product image with a graceful failure state.
 *
 * Without this, a dead image URL makes the browser paint the alt text inside
 * the tile, which then spills across the image area and over the badges — the
 * catalogue was full of tiles reading a long product name over a broken-image
 * glyph. A tile should still look like a tile when the photo is missing.
 */
export function ProductImage({
  src,
  alt,
  className,
  ...rest
}: { src?: string | null; alt: string; className?: string } & Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'alt' | 'className'
>) {
  const [hasFailed, setHasFailed] = useState(false);
  const isMissing = !src || hasFailed;

  if (isMissing) {
    return (
      <div
        className={clsx('grid place-items-center bg-slate-100 text-slate-300', className)}
        // The image is decorative here: the product name is already the
        // adjacent heading, so announcing "image unavailable" twice adds noise.
        role="presentation"
      >
        <ImageOff size={22} aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setHasFailed(true)}
      {...rest}
    />
  );
}

interface ProductActionsProps {
  isFeatured: boolean;
  onToggleFeatured: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isToggling?: boolean;
  /** Hides the labels and shrinks the targets for the table row. */
  size?: 'sm' | 'md';
}

/**
 * The three actions available on a product.
 *
 * Built as quiet icon buttons that only take colour on hover. They used to be
 * three permanently-filled squares — gold, grey and red — sitting in a row on
 * every tile, which put a delete button in permanent bright red next to every
 * product in the catalogue and made the row of them louder than the product
 * itself.
 *
 * The destructive action is still unmistakably red, but only once you are
 * actually pointing at it.
 *
 * `aria-label` on each, not `title`: these are icon-only controls, and a
 * native tooltip is neither announced reliably nor available on touch, where
 * an admin is most likely to be using this view.
 */
export function ProductActions({
  isFeatured,
  onToggleFeatured,
  onEdit,
  onDelete,
  isToggling = false,
  size = 'md',
}: ProductActionsProps) {
  const box = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';
  const icon = size === 'sm' ? 15 : 16;

  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={onToggleFeatured}
        disabled={isToggling}
        aria-label={isFeatured ? 'Remove from featured' : 'Add to featured'}
        aria-pressed={isFeatured}
        className={clsx(
          'grid place-items-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-60',
          box,
          isFeatured
            ? 'text-amber-500 hover:bg-amber-50'
            : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700',
        )}
      >
        {isToggling ? (
          <span
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
        ) : (
          <Star size={icon} fill={isFeatured ? 'currentColor' : 'none'} aria-hidden="true" />
        )}
      </button>

      <button
        type="button"
        onClick={onEdit}
        aria-label="Edit product"
        className={clsx(
          'grid place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700',
          box,
        )}
      >
        <Pencil size={icon} aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete product"
        className={clsx(
          'grid place-items-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600',
          box,
        )}
      >
        <Trash2 size={icon} aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * Status pill.
 *
 * One weight and one size, used across all three product views. Previously each
 * view invented its own — the card used a bold `px-3 py-1.5` badge, the compact
 * card a 9px `px-1.5 py-0.5` one — so the same "Coming Soon" appeared at two
 * very different visual weights on the same screen.
 */
export function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    coming_soon: { label: 'Coming soon', className: 'bg-blue-50 text-blue-700' },
    draft: { label: 'Draft', className: 'bg-slate-100 text-slate-600' },
    archived: { label: 'Archived', className: 'bg-slate-200 text-slate-600' },
    active: { label: 'Active', className: 'bg-emerald-50 text-emerald-700' },
  };
  const entry = map[status];

  if (!entry) return null;

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium leading-tight',
        entry.className,
      )}
    >
      {entry.label}
    </span>
  );
}

/**
 * Stock pill.
 *
 * Out-of-stock is stated plainly and is the one thing on a tile that should
 * draw the eye, since it is the actionable fact.
 */
export function StockPill({ stock }: { stock: number }) {
  const className =
    stock === 0
      ? 'bg-red-50 text-red-700'
      : stock < 20
        ? 'bg-amber-50 text-amber-700'
        : 'bg-emerald-50 text-emerald-700';

  const label = stock === 0 ? 'Out of stock' : stock < 20 ? `Low · ${stock}` : `${stock} in stock`;

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium leading-tight',
        className,
      )}
    >
      {label}
    </span>
  );
}