/**
 * Banner card.
 *
 * Shows the banner at its real carousel ratio with a drag handle, a position
 * number, a live/parked switch and delete.
 *
 * Design notes
 * ------------
 * A parked banner is not greyed out to the point of being unreadable. It keeps
 * its image at normal contrast and states its status in words ("Parked"), so
 * the grid stays scannable and the difference is legible without relying on
 * colour. The switch is the shared Radix Toggle so it behaves like every other
 * switch in the admin — Space and Enter work, and it carries role="switch".
 *
 * Drag-and-drop is native HTML5. It has no touch equivalent, so on a phone the
 * move buttons are the only way to reorder — hence both, with the buttons
 * hidden from pointer devices that can drag.
 *
 * @module BannerCard
 */

import { memo, type DragEvent, type Key } from 'react';
import { clsx } from 'clsx';
import { GripVertical, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import type { Banner } from '../../../../types';
import { Toggle } from '../../../shared/ui';

export interface BannerCardProps {
  key?: Key;
  banner: Banner;
  index: number;
  total: number;
  isDragging: boolean;
  isPending: boolean;
  onToggleLive: (banner: Banner) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onDragStart: (e: DragEvent<HTMLElement>, id: string) => void;
  onDragOver: (e: DragEvent<HTMLElement>) => void;
  onDrop: (e: DragEvent<HTMLElement>, id: string) => void;
}

function BannerCardComponent({
  banner,
  index,
  total,
  isDragging,
  isPending,
  onToggleLive,
  onDelete,
  onMove,
  onDragStart,
  onDragOver,
  onDrop,
}: BannerCardProps) {
  const isActive = banner.isActive !== false;
  const isFirst = index === 0;
  const isLast = index === total - 1;

  return (
    <article
      draggable={!isPending}
      onDragStart={(e) => onDragStart(e, banner.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, banner.id)}
      aria-label={`Banner ${banner.order}`}
      className={clsx(
        'flex flex-col overflow-hidden rounded-xl border bg-white transition-all',
        isDragging ? 'border-primary-300 opacity-50' : 'border-slate-200 hover:border-slate-300',
      )}
    >
      <div className="relative aspect-[3.8/1] bg-slate-50">
        <img
          src={banner.imageUrl}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
        />

        {/* Position, so the carousel order is readable without dragging. */}
        <span className="absolute left-2 top-2 rounded-md bg-slate-900/70 px-1.5 py-0.5 text-[11px] font-semibold text-white">
          {banner.order}
        </span>

        <span
          className="absolute right-2 top-2 rounded-md bg-slate-900/70 px-1.5 py-0.5 text-[11px] font-medium text-white"
        >
          {isActive ? 'Live' : 'Parked'}
        </span>

        <span
          aria-hidden="true"
          title="Drag to reorder"
          className="absolute bottom-2 left-2 grid h-7 w-7 cursor-grab place-items-center rounded-md bg-white/90 text-slate-500 backdrop-blur active:cursor-grabbing"
        >
          <GripVertical size={15} />
        </span>
      </div>

      <div className="flex items-center gap-2 border-t border-slate-100 p-3">
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
          {isActive ? 'On the homepage' : 'Not on the homepage'}
        </span>

        {/* `hideLabel` keeps the switch's accessible name without putting the
            words in the row twice — the span above is the visible copy. */}
        <Toggle
          checked={isActive}
          onCheckedChange={() => onToggleLive(banner)}
          disabled={isPending}
          hideLabel
          className="shrink-0"
        />

        {/* No touch equivalent of HTML5 drag, so this is the phone's path. */}
        <div className="flex shrink-0 gap-1 md:hidden">
          <button
            type="button"
            onClick={() => onMove(banner.id, -1)}
            disabled={isFirst || isPending}
            aria-label={`Move banner ${banner.order} earlier`}
            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-30"
          >
            <ChevronUp size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onMove(banner.id, 1)}
            disabled={isLast || isPending}
            aria-label={`Move banner ${banner.order} later`}
            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-30"
          >
            <ChevronDown size={15} aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => onDelete(banner.id)}
          disabled={isPending}
          aria-label={`Delete banner ${banner.order}`}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
        >
          <Trash2 size={15} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

export const BannerCard = memo(BannerCardComponent);