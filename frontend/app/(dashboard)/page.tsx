'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import ReactECharts from 'echarts-for-react'
import { Info } from 'lucide-react'
import { useKpis, useOverviewChart } from '@/lib/api'
import { formatCurrency, formatPercent, formatDelta, formatCompact, COLORS } from '@/lib/constants'
import type { KpiItem } from '@/lib/types'

const PERIODS = [
  { label: 'L3M', value: 'L3M' },
  { label: 'L6M', value: 'L6M' },
  { label: 'YTD', value: 'YTD' },
  { label: '12M', value: '12M' },
]

// ─── InfoPopover ─────────────────────────────────────────────────────────────

interface InfoPopoverProps {
  title: string
  description: string
  formula?: string
  sources?: string[]
}

function InfoPopover({ title, description, formula, sources }: InfoPopoverProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-xs
          transition-all duration-150
          ${open
            ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/30'
            : 'bg-gray-100 text-gray-400 border border-transparent hover:bg-brand-primary/5 hover:text-brand-primary'
          }`}
        aria-label={`How ${title} is calculated`}
      >
        <Info size={12} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-border rounded-xl shadow-2xl z-50 text-left overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-border/50">
            <h4 className="text-sm font-semibold text-brand-secondary">{title}</h4>
            <p className="text-xs text-gray-400 mt-0.5">{description}</p>
          </div>
          <div className="px-4 py-3 space-y-3">
            {formula && (
              <div>
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Formula</div>
                <div className="bg-brand-secondary/[0.03] border border-brand-secondary/10 rounded-lg px-3 py-2">
                  <code className="text-xs font-mono text-brand-secondary leading-relaxed break-all">{formula}</code>
                </div>
              </div>
            )}
            {sources && sources.length > 0 && (
              <div>
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Data Sources</div>
                <ul className="space-y-1">
                  {sources.map((s, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0" />
                      <span className="font-mono text-[11px]">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="px-4 py-2 bg-surface/50 border-t border-border/50">
            <span className="text-[10px] text-gray-400">Data refreshed on deploy</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (!values || values.length < 2) return null
  const w = 80, h = 28
  const min = Math.min(...values), max = Math.max(...values)
  const range = max - min || 1
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 2) - 1
    return `${x},${y}`
  }).join(' ')
  const gradId = `spark-${color.replace('#', '')}`
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#${gradId})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

// ─── DeltaBadge ──────────────────────────────────────────────────────────────

function DeltaBadge({ value }: { value: number }) {
  const isPos = value >= 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${isPos ? 'text-positive' : 'text-negative'}`}>
      {isPos ? '▲' : '▼'} {formatDelta(value)}
    </span>
  )
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

function formatKpiValue(kpi: KpiItem): string {
  const lbl = kpi.label.toLowerCase()
  if (lbl.includes('revenue') || lbl.includes('cost') || lbl.includes('aov') || lbl.includes('cac') || lbl.includes('mer')) {
    return formatCurrency(kpi.value)
  }
  if (lbl.includes('roi') || lbl.includes('rate') || lbl.includes('%')) {
    return formatPercent(kpi.value)
  }
  return kpi.value.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function KpiCard({ kpi, index }: { kpi: KpiItem; index: number }) {
  const color = COLORS.chart[index % COLORS.chart.length]
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.35 }}
      className="bg-white rounded-xl border border-border shadow-sm p-4 h-full min-h-[120px] flex flex-col justify-between
        hover:shadow-md transition-shadow duration-200"
      style={{ borderLeftWidth: 3, borderLeftStyle: 'solid', borderLeftColor: color }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 font-medium truncate max-w-[20ch]">{kpi.label}</span>
        <InfoPopover
          title={kpi.label}
          description={kpi.description}
          formula={kpi.formula}
          sources={kpi.sources}
        />
      </div>
      <div className="flex items-end justify-between mt-auto pt-2">
        <div className="min-w-0">
          <div className="text-2xl font-semibold font-mono truncate">{formatKpiValue(kpi)}</div>
          <DeltaBadge value={kpi.delta} />
        </div>
        <Sparkline values={[]} color={color} />
      </div>
    </motion.div>
  )
}

// ─── FilterBar ───────────────────────────────────────────────────────────────

function FilterBar({ period, onChange }: { period: string; onChange: (p: string) => void }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          aria-label={`Filter by ${p.label} period`}
          aria-pressed={period === p.value}
          className={`px-3 py-1.5 text-[0.82rem] font-semibold rounded-md
            transition-all duration-150 ease-in-out cursor-pointer
            ${period === p.value
              ? 'bg-brand-secondary text-white shadow-sm'
              : 'bg-transparent text-brand-secondary/70 border border-border hover:bg-brand-secondary/5 hover:text-brand-secondary'
            }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}

// ─── Overview Chart ───────────────────────────────────────────────────────────

function OverviewChart({ period }: { period: string }) {
  const { data, isLoading } = useOverviewChart(period)
  const chartRef = useRef<any>(null)

  useEffect(() => {
    const handleResize = () => chartRef.current?.getEchartsInstance?.()?.resize?.()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (isLoading || !data) {
    return (
      <div className="bg-white rounded-xl border border-border shadow-sm p-6">
        <div className="h-[240px] md:h-[320px] lg:h-[380px] skeleton rounded-lg" />
      </div>
    )
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross', lineStyle: { color: '#cbd5e1', type: 'dashed' } },
      formatter: (params: any[]) => {
        const header = `<div style="font-weight:600;margin-bottom:4px">${params[0]?.axisValueLabel ?? ''}</div>`
        const rows = params.map((p) =>
          `<div style="display:flex;align-items:center;gap:6px;margin:2px 0">
            <span style="width:8px;height:8px;border-radius:50%;background:${p.color};display:inline-block"></span>
            <span style="color:#64748b">${p.seriesName}:</span>
            <span style="font-weight:600;font-family:'JetBrains Mono',monospace">${formatCompact(p.value)}</span>
          </div>`
        ).join('')
        return header + rows
      },
    },
    legend: {
      data: ['Revenue', 'Ad Costs'],
      top: 8,
      textStyle: { fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', fontSize: 12 },
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: 48, containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.date),
      axisLabel: { fontSize: 11, color: '#64748b' },
      axisLine: { lineStyle: { color: COLORS.border } },
    },
    yAxis: {
      type: 'value',
      scale: false,
      axisLabel: { formatter: (v: number) => formatCompact(v), fontSize: 11, color: '#64748b' },
      splitLine: { lineStyle: { color: COLORS.border } },
    },
    series: [
      {
        name: 'Revenue',
        type: 'line',
        smooth: true,
        data: data.map((d) => d.revenue),
        lineStyle: { width: 2, color: COLORS.chart[0] },
        itemStyle: { color: COLORS.chart[0] },
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: COLORS.chart[0] + '30' }, { offset: 1, color: COLORS.chart[0] + '00' }] },
        },
      },
      {
        name: 'Ad Costs',
        type: 'line',
        smooth: true,
        data: data.map((d) => d.ad_costs),
        lineStyle: { width: 2, color: COLORS.chart[1] },
        itemStyle: { color: COLORS.chart[1] },
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: COLORS.chart[1] + '30' }, { offset: 1, color: COLORS.chart[1] + '00' }] },
        },
      },
    ],
  }

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm p-6">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-brand-secondary">Revenue & Ad Costs Trend</h2>
        <p className="text-xs text-slate-400 mt-0.5">Daily performance over selected period</p>
      </div>
      <div className="h-[240px] md:h-[320px] lg:h-[380px]">
        <ReactECharts
          ref={(e) => { chartRef.current = e }}
          option={option}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'canvas' }}
        />
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OverviewPage() {
  const [period, setPeriod] = useState('L6M')
  const { data: kpis, isLoading } = useKpis(period)

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-secondary">Overview</h1>
        <p className="text-sm text-slate-500 mt-0.5">Ads & Sales performance summary</p>
      </div>

      <FilterBar period={period} onChange={setPeriod} />

      {/* KPI grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-border p-4 min-h-[120px] skeleton" />
          ))
          : (kpis ?? []).map((kpi, i) => (
            <KpiCard key={kpi.label} kpi={kpi} index={i} />
          ))
        }
      </div>

      {/* Trend chart */}
      <OverviewChart period={period} />
    </>
  )
}
