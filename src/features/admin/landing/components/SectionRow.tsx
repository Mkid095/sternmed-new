/**
 * One home page section row.
 *
 * Design notes
 * ------------
 * The icon is a small monochrome glyph on a neutral tint. It used to be a 40px
 * square with a saturated gradient — four of those stacked down the page read
 * as a set of alerts rather than as a list of layout blocks, and the colour
 * carried no information the label did not already carry.
 *
 * The row states its own position ("1 of 3") and its own state ("Showing" /
 * "Hidden") in words, so the order and the on/off state are readable without
 * relying on drag position or colour alone.
 *
 * @module SectionRow
 */

import { memo, type DragEvent, type Key } from 'react';
import { clsx } from 'clsx';
import { LayoutTemplate, Star, Package, Megaphone, GripVertical, ChevronUp, ChevronDown, Pencil } from 'lucide-react';
import { Toggle } from '../../../shared/ui';
import { SECTION_META } from '../hooks/useHomeSections';
import type { HomepageSection } from '../../../../types';

const ICONS = {
  hero: LayoutTemplate,
  featured: Star,
  categories: Package,
  promo: Megaphone,
} as const;

export interface SectionRowProps {
  key?: Key;
  section: HomepageSection;
  index: number;
  total: number;
  isDragging: boolean;
  isSaving: boolean;
  onToggle: (id: string, enabled: boolean) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  /** Opens the section's editor. Only CTA banners have one. */
  onEdit?: (id: string) => void;
  onDragStart: (e: DragEvent<HTMLElement>, id: string) => void;
  onDragOver: (e: DragEvent<HTMLElement>) => void;
  onDrop: (e: DragEvent<HTMLElement>, id: string) => void;
}

function SectionRowComponent({
  section,
  index,
  total,
  isDragging,
  isSaving,
  onToggle,
  onMove,
  onEdit,
  onDragStart,
  onDragOver,
  onDrop,
}: SectionRowProps) {
  const meta = SECTION_META[section.type] ?? { label: section.type, description: '', iconName: 'hero' as const };
  const Icon = ICONS[meta.iconName];
  const isFirst = index === 0;
  const isLast = index === total - 1;

  return (
    <li
      draggable={!isSaving}
      onDragStart={(e) => onDragStart(e, section.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, section.id)}
      className={clsx(
        'flex items-center gap-3 rounded-xl border bg-white px-3 py-3 transition-colors',
        isDragging ? 'border-primary-300 opacity-50' : 'border-slate-200 hover:border-slate-300',
      )}
    >
      <span
        aria-hidden="true"
        title="Drag to reorder"
        className="hidden cursor-grab text-slate-300 active:cursor-grabbing hover:text-slate-500 sm:block"
      >
        <GripVertical size={16} />
      </span>

      <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
        <Icon size={17} aria-hidden="true" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-slate-900">{meta.label}</span>
        <span className="block truncate text-xs text-slate-500">{meta.description}</span>
      </span>

      <span className="hidden shrink-0 text-xs tabular-nums text-slate-400 sm:block">
        {index + 1} of {total}
      </span>

      {onEdit && (
        <button
          type="button"
          onClick={() => onEdit(section.id)}
          aria-label={`Edit ${meta.label}`}
          className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40"
          disabled={isSaving}
        >
          <Pencil size={14} aria-hidden="true" />
        </button>
      )}

      {/* No touch equivalent of HTML5 drag, so small screens get buttons. */}
      <span className="flex shrink-0 gap-1 sm:hidden">
        <button
          type="button"
          onClick={() => onMove(section.id, -1)}
          disabled={isFirst || isSaving}
          aria-label={`Move ${meta.label} earlier`}
          className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-30"
        >
          <ChevronUp size={15} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onMove(section.id, 1)}
          disabled={isLast || isSaving}
          aria-label={`Move ${meta.label} later`}
          className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-30"
        >
          <ChevronDown size={15} aria-hidden="true" />
        </button>
      </span>

      <span className="shrink-0">
        <Toggle
          checked={section.enabled}
          onCheckedChange={(next) => onToggle(section.id, next)}
          disabled={isSaving}
          hideLabel
        />
        <span className="sr-only">{section.enabled ? 'Showing' : 'Hidden'}</span>
      </span>
    </li>
  );
}

export const SectionRow = memo(SectionRowComponent);