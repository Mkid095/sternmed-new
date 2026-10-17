/**
 * Admin visual tokens.
 *
 * The dashboard previously hardcoded its palette inline: chart strokes were
 * literal hex (`#2596be`, `#f59e0b`, `#6b9080`), the grid was `#e2e8f0`, and
 * four charts each carried a byte-identical `contentStyle` for their tooltip.
 * Changing the brand therefore meant finding every occurrence by hand, and
 * nothing guaranteed the charts matched the rest of the UI.
 *
 * Everything here resolves from CSS custom properties that already exist in
 * index.css (`--color-primary-*`, `--color-accent-*`, `--color-secondary-*`,
 * `--color-slate-*`). That means the charts follow the brand automatically, and
 * if the site later gains a theme, only the variables change — not this file
 * and not the components consuming it.
 *
 * Note these are `var(--x)` strings, not resolved values. That is deliberate:
 * SVG `fill`/`stroke` accept custom-property references, so Recharts renders
 * them natively without needing a JS-side colour resolver.
 */

/**
 * Categorical series palette, in assignment order.
 *
 * Starts on the brand blue, then walks the accent, the sage secondary and a
 * set of distinguishable hues for charts with more series than the brand has
 * accents. Ordered so adjacent series never sit next to each other in a
 * stacked chart and never share a hue.
 */
export const chartSeries = [
  'var(--color-primary)',
  'var(--color-accent)',
  'var(--color-secondary)',
  'var(--color-primary-300)',
  'var(--color-accent-300)',
  'var(--color-secondary-300)',
  'var(--color-primary-700)',
  'var(--color-accent-700)',
] as const

/**
 * Chart furniture: grid lines, axes, tick labels.
 *
 * The grid is slate-300, not the slate-200 it was on a white background. The
 * charts now sit on a slate-50 panel, and a slate-200 rule against that tint is
 * almost invisible — the plot area loses its structure and the lines just read
 * as scattered marks.
 */
export const chartGrid = {
  grid: 'var(--color-slate-300)',
  axis: 'var(--color-slate-400)',
  tick: 'var(--color-slate-500)',
} as const

/**
 * Tooltip surface.
 *
 * One definition, applied to every chart. Previously this object was pasted
 * four times, so any change had to be made in four places and it silently
 * drifted.
 */
export const chartTooltipStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid var(--color-slate-200)',
  borderRadius: '10px',
  boxShadow: '0 4px 16px -2px rgb(15 23 42 / 0.12)',
  fontSize: '13px',
  padding: '8px 12px',
} as const

/**
 * Height for every chart, so panels keep a consistent rhythm.
 *
 * Was 288px, which on a laptop pushed the category ranking off the bottom of
 * the screen entirely — the dashboard needed scrolling to see what it sold. A
 * time series with six points needs far less vertical room than that to stay
 * readable, and the figures above it already occupy a lot of the fold.
 */
export const chartHeight = 208

/** Corner radii, mirroring the scale used across the site. */
export const radius = {
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '18px',
} as const

/**
 * Elevation.
 *
 * Two steps only. A flat card and a card that lifts on hover reads as
 * interactive; a dozen shadow weights just adds noise.
 */
export const shadow = {
  /** Resting surface — barely there. */
  card: '0 1px 2px rgb(15 23 42 / 0.04)',
  /** Hover — the card is selectable. */
  cardHover: '0 6px 20px -6px rgb(15 23 42 / 0.14)',
  /** Overlays and menus. */
  popover: '0 12px 32px -8px rgb(15 23 42 / 0.18)',
} as const

/**
 * Vertical rhythm.
 *
 * The dashboard mixed `space-y-4 sm:space-y-6` and `gap-3 sm:gap-4` freely, so
 * panels never lined up. These are the only three values used for separating
 * blocks on an admin screen.
 */
export const space = {
  tight: '12px',
  base: '20px',
  loose: '28px',
} as const

/**
 * Foreground/background pairs for figure tiles and status icons.
 *
 * These are VALUES, not a layout. Each admin page arranges its own figures
 * however suits its data — the orders page needs seven across, the dashboard
 * four — but they all pick colour from this map so a "pending" tile is the same
 * amber everywhere without the pages sharing a single component that forces
 * them into one shape.
 */
export const tone = {
  slate: { fg: 'text-slate-600', bg: 'bg-slate-100' },
  blue: { fg: 'text-primary-600', bg: 'bg-primary-50' },
  primary: { fg: 'text-primary-600', bg: 'bg-primary-50' },
  green: { fg: 'text-emerald-600', bg: 'bg-emerald-50' },
  emerald: { fg: 'text-emerald-600', bg: 'bg-emerald-50' },
  amber: { fg: 'text-amber-600', bg: 'bg-amber-50' },
  yellow: { fg: 'text-amber-600', bg: 'bg-amber-50' },
  red: { fg: 'text-red-600', bg: 'bg-red-50' },
  purple: { fg: 'text-purple-600', bg: 'bg-purple-50' },
  accent: { fg: 'text-accent-600', bg: 'bg-accent-50' },
  orange: { fg: 'text-accent-600', bg: 'bg-accent-50' },
} as const

export type ToneName = keyof typeof tone

/**
 * Status pill colours, shared so an order that is "pending" looks identical on
 * the list, the detail panel and the dashboard.
 *
 * These replace a local `STATUS_COLORS` map in orderFormatters that used
 * `-100`/`-800` shades while the dashboard stat row used `-50`/`-700`. The
 * same status was rendered in two different colours depending on which screen
 * you were on.
 */
export const statusTone: Record<string, { fg: string; bg: string }> = {
  pending: { fg: 'text-amber-700', bg: 'bg-amber-50' },
  processing: { fg: 'text-blue-700', bg: 'bg-blue-50' },
  shipped: { fg: 'text-purple-700', bg: 'bg-purple-50' },
  delivered: { fg: 'text-emerald-700', bg: 'bg-emerald-50' },
  cancelled: { fg: 'text-red-700', bg: 'bg-red-50' },
  paid: { fg: 'text-emerald-700', bg: 'bg-emerald-50' },
  unpaid: { fg: 'text-amber-700', bg: 'bg-amber-50' },
  failed: { fg: 'text-red-700', bg: 'bg-red-50' },
  refunded: { fg: 'text-slate-700', bg: 'bg-slate-100' },
}

/** Falls back to a neutral slate so an unexpected status is visibly unknown
    rather than silently rendering unstyled. */
export function getStatusTone(status: string): { fg: string; bg: string } {
  return statusTone[status] ?? { fg: 'text-slate-700', bg: 'bg-slate-100' }
}

/**
 * Money formatting for charts and tiles.
 *
 * The dashboard formatted revenue in four places with slightly different rules
 * — some rounded to whole thousands, some kept a decimal — so the same number
 * could read two ways on one screen.
 *
 * Thousands keep one decimal ONLY when the value is not a whole thousand.
 * Rounding everything to "2K" merged 1,500 and 2,000 into the same label, which
 * put two identically-worded ticks on one axis (0, 600, 1K, 2K, 2K) and turned a
 * real total of ~2,350 into a confident "Ksh 2K".
 */
function compactMagnitude(value: number): string {
  const sign = value < 0 ? '-' : ''
  const abs = Math.abs(value)

  if (abs >= 1_000_000) {
    const millions = abs / 1_000_000
    return `${sign}${Number.isInteger(millions) ? millions : millions.toFixed(1)}M`
  }

  if (abs >= 1_000) {
    const thousands = abs / 1_000
    return `${sign}${Number.isInteger(thousands) ? thousands : thousands.toFixed(1)}K`
  }

  return `${sign}${Math.round(abs)}`
}

/** Currency for headline figures, e.g. "Ksh 2.4K". */
export function formatCompactKsh(amount: number): string {
  if (!Number.isFinite(amount)) return 'Ksh 0'
  return `Ksh ${compactMagnitude(amount)}`
}

/**
 * Axis ticks stay short — "1.5K" rather than "Ksh 1,500,000" — and never collide
 * with a neighbour.
 */
export function formatAxisKsh(amount: number): string {
  return compactMagnitude(amount)
}