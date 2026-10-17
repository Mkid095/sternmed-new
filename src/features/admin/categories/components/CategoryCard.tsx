/**
 * Category card views.
 *
 * Split out of AdminCategories.tsx, which is over 500 lines and was about to
 * grow further.
 *
 * What changed
 * ------------
 * The card had two controls for one boolean: a "Visible" badge that was not
 * interactive, and a separate eye button in the corner that actually did
 * something. Reading the card you could not tell what was live, and the badge
 * looked like a label rather than state. There is now a single switch that
 * states its own state in words — "On home" or "Not on home" — so the state is
 * legible without reading the switch's position.
 *
 * The two full-width filled buttons (grey Edit, red Delete) became quiet icons
 * overlaid on the image. A permanently red Delete under every category made the
 * grid read as a wall of warnings, and moving them off the bottom row leaves
 * the toggle with the full width of the card instead of being squeezed beside
 * two buttons.
 *
 * @module CategoryCard
 */

import type { Key, ReactNode } from 'react';
import { Package, Pencil, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import type { Category } from '../../../../types';
import { Toggle } from '../../../shared/ui';

export interface CategoryCardProps {
  key?: Key;
  category: Category & { productCount?: number };
  onEdit: (category: Category) => void;
  onDelete: (id: string, name: string) => void;
  onToggleVisibility: (category: Category) => void;
  /** While the toggle request is in flight. */
  isToggling?: boolean;
}

function CategoryImage({ category }: { category: CategoryCardProps['category'] }) {
  if (category.image) {
    return (
      <img
        src={category.image}
        alt=""
        className="h-full w-full object-cover"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div className="grid h-full w-full place-items-center bg-slate-50" role="presentation">
      <Package size={26} className="text-slate-300" aria-hidden="true" />
    </div>
  );
}

/** Overlay icon button. The scrim keeps it legible over a light photo. */
function OverlayAction({
  label,
  onClick,
  tone,
  children,
}: {
  label: string;
  onClick: () => void;
  tone: 'default' | 'danger';
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={clsx(
        'grid h-8 w-8 place-items-center rounded-lg bg-white/90 text-slate-600 backdrop-blur',
        'transition-colors hover:bg-white',
        tone === 'danger' ? 'hover:text-red-600' : 'hover:text-slate-900',
      )}
    >
      {children}
    </button>
  );
}

export function CategoryCard({
  category,
  onEdit,
  onDelete,
  onToggleVisibility,
  isToggling = false,
}: CategoryCardProps) {
  const count = category.productCount ?? 0;

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:border-slate-300 hover:shadow-md">
      <div className="relative aspect-[4/3] bg-slate-50">
        <CategoryImage category={category} />

        <div className="absolute right-2 top-2 flex gap-1">
          <OverlayAction label={`Edit ${category.name}`} onClick={() => onEdit(category)} tone="default">
            <Pencil size={15} aria-hidden="true" />
          </OverlayAction>
          <OverlayAction
            label={`Delete ${category.name}`}
            onClick={() => onDelete(category.id, category.name)}
            tone="danger"
          >
            <Trash2 size={15} aria-hidden="true" />
          </OverlayAction>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 text-sm font-semibold text-slate-900">{category.name}</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          {count} product{count === 1 ? '' : 's'}
        </p>

        <div className="mt-auto border-t border-slate-100 pt-3">
          <Toggle
            checked={category.showOnHome}
            onCheckedChange={() => onToggleVisibility(category)}
            disabled={isToggling}
            // States the position rather than just naming the setting, so the
            // card reads correctly at a glance and without relying on colour
            // or the switch's own position.
            label={category.showOnHome ? 'On home' : 'Not on home'}
          />
        </div>
      </div>
    </article>
  );
}

/**
 * Compact card for the small-screen grid.
 *
 * Same content as CategoryCard at a size that still fits two across on a
 * phone. Actions stay overlaid on the image so the toggle keeps the full width
 * of the card — sharing a row with two 32px buttons squeezed its label onto
 * two lines ("On" / "hom").
 */
export function CategoryCompactCard({
  category,
  onEdit,
  onDelete,
  onToggleVisibility,
  isToggling = false,
}: CategoryCardProps) {
  const count = category.productCount ?? 0;

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="relative aspect-square bg-slate-50">
        <CategoryImage category={category} />

        <div className="absolute right-1.5 top-1.5 flex gap-1">
          <OverlayAction label={`Edit ${category.name}`} onClick={() => onEdit(category)} tone="default">
            <Pencil size={14} aria-hidden="true" />
          </OverlayAction>
          <OverlayAction
            label={`Delete ${category.name}`}
            onClick={() => onDelete(category.id, category.name)}
            tone="danger"
          >
            <Trash2 size={14} aria-hidden="true" />
          </OverlayAction>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-2.5">
        <h3 className="line-clamp-2 text-xs font-medium leading-snug text-slate-900">
          {category.name}
        </h3>
        <p className="mt-0.5 text-[11px] text-slate-500">
          {count} product{count === 1 ? '' : 's'}
        </p>

        <div className="mt-auto border-t border-slate-100 pt-2">
          <Toggle
            checked={category.showOnHome}
            onCheckedChange={() => onToggleVisibility(category)}
            disabled={isToggling}
            label={category.showOnHome ? 'On home' : 'Not on home'}
          />
        </div>
      </div>
    </article>
  );
}