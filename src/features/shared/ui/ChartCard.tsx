/**
 * Chart primitives shared by every admin surface.
 *
 * The dashboard carried its own copy of this chrome — `ChartCard`,
 * `EmptyChart` and four byte-identical tooltip `contentStyle` objects pasted
 * into four chart blocks. Any change to the tooltip meant four edits, and the
 * copies had already begun to drift.
 *
 * These live in shared/ui because every admin page that plots something
 * (orders, revenue, products) needs the same panel and the same empty state;
 * a page-specific version guarantees they slowly stop matching.
 *
 * Deliberately NOT a card. No border, no shadow, no rounded box. A screen of
 * bordered panels reads as a stack of unrelated objects and flattens the
 * hierarchy — every element shouts at the same volume. Structure comes from
 * whitespace and a single hairline under the heading instead.
 */

import type { ReactNode } from 'react'
import { chartHeight, chartTooltipStyle } from '../../../theme/adminTheme'

interface ChartCardProps {
  title: string
  subtitle?: string
  /** Controls or a legend placed on the right of the header. */
  actions?: ReactNode
  children: ReactNode
}

export function ChartCard({ title, subtitle, actions, children }: ChartCardProps) {
  return (
    <section className="flex flex-col" aria-label={title}>
      <header className="flex items-start justify-between gap-3 pb-3">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </header>

      {children}
    </section>
  )
}

/**
 * Empty state for a chart.
 *
 * Kept at the standard chart height so the layout does not collapse and then
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
 * Spreading this onto `<Tooltip>` is what removes the four duplicate
 * `contentStyle` blocks. `formatter` stays at the call site because each chart
 * labels its own series differently.
 */
export const sharedTooltipProps = {
  contentStyle: chartTooltipStyle,
  cursor: { fill: 'var(--color-slate-50)' },
} as const