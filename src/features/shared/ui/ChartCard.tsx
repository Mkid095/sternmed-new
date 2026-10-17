/**
 * Chart utilities.
 *
 * This file used to export a `ChartCard` panel that wrapped every plot on every
 * admin page. It was removed for the same reason as `StatCard`: one shared
 * panel shape could not suit both a full-width dashboard trend and a compact
 * side panel, so pages either stretched it or worked around it. Each page now
 * composes its own chrome from the `tint` value below.
 *
 * What remains is value-level — the tooltip appearance and an empty state —
 * which every page needs identically and which has no opinion about layout.
 */

import type { ReactNode } from 'react'
import { chartHeight, chartTooltipStyle } from '../../../theme/adminTheme'

/**
 * The surface a plot sits on.
 *
 * A light tint, deliberately not a bordered or shadowed card. On the white
 * admin canvas a chart with no surface at all is worse than a card: nothing
 * marks where one plot ends and the next begins, the pale gridlines read as
 * scattered marks, and two charts side by side look hectic. A tint defines the
 * area without the boxed-card look.
 */
export const tint = 'rounded-xl bg-slate-50 p-5'

/**
 * Empty state for a chart.
 *
 * Held at the standard chart height so the layout does not collapse and then
 * re-expand as data arrives — that jump is jarring on a dashboard that
 * refreshes.
 */
export function ChartEmpty({ message, hint }: { message: string; hint?: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 text-center"
      style={{ height: chartHeight }}
    >
      <div className="grid h-11 w-11 place-items-center rounded-full bg-slate-100">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M3 3v18h18M7 14l4-4 3 3 5-6"
            stroke="var(--color-slate-300)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p className="text-sm font-medium text-slate-600">{message}</p>
      {hint && <p className="max-w-[34ch] text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

/**
 * Shared Recharts tooltip props.
 *
 * The tooltip used to be a `contentStyle` object pasted into four separate
 * charts, which had already begun to drift. Spreading this keeps one appearance
 * everywhere. `formatter` stays at the call site because each chart labels its
 * own series differently.
 */
export const sharedTooltipProps = {
  contentStyle: chartTooltipStyle,
  cursor: { fill: 'var(--color-slate-100)' },
} as const