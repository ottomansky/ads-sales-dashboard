/*
 * COLOR TOKENS — mirrors globals.css @theme block.
 * Use COLORS for JS contexts (ECharts, inline styles, canvas).
 * Use Tailwind classes for CSS (bg-brand-primary, text-positive, etc.)
 *
 * TO REBRAND: Change here AND in globals.css @theme.
 */
export const COLORS = {
  brandPrimary:   '#097cf7',
  brandSecondary: '#0b1f3a',
  brandAccent:    '#22c55e',
  surface:        '#f8fafc',
  border:         '#e2e8f0',
  positive:       '#22c55e',
  negative:       '#ef4444',
  warning:        '#f59e0b',
  bgWhite:        '#ffffff',
  chart: ['#097cf7', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
} as const

/*
 * NUMBER FORMATTERS — consistent display across the app.
 * import { formatCurrency, formatPercent, formatDelta, formatCount, formatCompact } from '@/lib/constants'
 */

/**
 * Format currency — always 0 decimal places
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Format compact — for chart axes and tooltips ($1.2M, $890K, $42)
 */
export function formatCompact(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000)     return `$${(value / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000)          return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toFixed(0)}`
}

/**
 * Format percentage — always 1 decimal place
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

/**
 * Format delta — always signed, 1 decimal place
 */
export function formatDelta(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

/**
 * Format count — comma-separated, 0 decimals
 */
export function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n)
}
