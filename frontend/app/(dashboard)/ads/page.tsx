'use client'

import { useState, useRef, useEffect } from 'react'
import ReactECharts from 'echarts-for-react'
import { useAds } from '@/lib/api'
import { formatCurrency, formatCount, formatCompact, COLORS } from '@/lib/constants'
import type { GoogleCampaign, MetaAd } from '@/lib/types'

const PERIODS = ['L3M', 'L6M', 'YTD', '12M']

function FilterBar({ period, onChange }: { period: string; onChange: (p: string) => void }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {PERIODS.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          aria-label={`Filter by ${p} period`}
          aria-pressed={period === p}
          className={`px-3 py-1.5 text-[0.82rem] font-semibold rounded-md transition-all duration-150 cursor-pointer
            ${period === p
              ? 'bg-brand-secondary text-white shadow-sm'
              : 'bg-transparent text-brand-secondary/70 border border-border hover:bg-brand-secondary/5 hover:text-brand-secondary'
            }`}
        >
          {p}
        </button>
      ))}
    </div>
  )
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-border shadow-sm p-4"
      style={{ borderLeftWidth: 3, borderLeftStyle: 'solid', borderLeftColor: color }}>
      <p className="text-xs text-slate-500 font-medium mb-1">{label}</p>
      <p className="text-2xl font-semibold font-mono text-brand-secondary">{formatCurrency(value)}</p>
    </div>
  )
}

function GoogleChart({ campaigns }: { campaigns: GoogleCampaign[] }) {
  const chartRef = useRef<any>(null)
  useEffect(() => {
    const h = () => chartRef.current?.getEchartsInstance?.()?.resize?.()
    window.addEventListener('resize', h); return () => window.removeEventListener('resize', h)
  }, [])

  const top = campaigns.slice(0, 8)
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
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
    legend: { top: 8, textStyle: { fontSize: 11 } },
    grid: { left: '3%', right: '4%', bottom: '3%', top: 48, containLabel: true },
    xAxis: {
      type: 'value', scale: false,
      axisLabel: { formatter: (v: number) => formatCompact(v), fontSize: 10 },
      splitLine: { lineStyle: { color: COLORS.border } },
    },
    yAxis: {
      type: 'category',
      data: top.map((c) => c.campaign.length > 24 ? c.campaign.slice(0, 24) + '…' : c.campaign).reverse(),
      axisLabel: { fontSize: 10, color: '#64748b' },
    },
    series: [
      {
        name: 'Cost',
        type: 'bar',
        data: top.map((c) => c.cost).reverse(),
        itemStyle: { color: COLORS.chart[0], borderRadius: [0, 4, 4, 0] },
        barMaxWidth: 28,
      },
    ],
    color: COLORS.chart,
  }

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm p-6">
      <h3 className="text-sm font-semibold text-brand-secondary mb-4">Google Campaigns — Cost</h3>
      <div className="h-[240px] md:h-[300px]">
        <ReactECharts ref={(e) => { chartRef.current = e }} option={option}
          style={{ height: '100%', width: '100%' }} opts={{ renderer: 'canvas' }} />
      </div>
    </div>
  )
}

function MetaChart({ ads }: { ads: MetaAd[] }) {
  const chartRef = useRef<any>(null)
  useEffect(() => {
    const h = () => chartRef.current?.getEchartsInstance?.()?.resize?.()
    window.addEventListener('resize', h); return () => window.removeEventListener('resize', h)
  }, [])

  const top = ads.slice(0, 8)
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
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
    grid: { left: '3%', right: '4%', bottom: '3%', top: 24, containLabel: true },
    xAxis: {
      type: 'value', scale: false,
      axisLabel: { formatter: (v: number) => formatCompact(v), fontSize: 10 },
      splitLine: { lineStyle: { color: COLORS.border } },
    },
    yAxis: {
      type: 'category',
      data: top.map((a) => a.ad_name.length > 24 ? a.ad_name.slice(0, 24) + '…' : a.ad_name).reverse(),
      axisLabel: { fontSize: 10, color: '#64748b' },
    },
    series: [
      {
        name: 'Spend',
        type: 'bar',
        data: top.map((a) => a.spend).reverse(),
        itemStyle: { color: COLORS.chart[2], borderRadius: [0, 4, 4, 0] },
        barMaxWidth: 28,
      },
    ],
    color: COLORS.chart,
  }

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm p-6">
      <h3 className="text-sm font-semibold text-brand-secondary mb-4">Meta Ads — Spend</h3>
      <div className="h-[240px] md:h-[300px]">
        <ReactECharts ref={(e) => { chartRef.current = e }} option={option}
          style={{ height: '100%', width: '100%' }} opts={{ renderer: 'canvas' }} />
      </div>
    </div>
  )
}

function CampaignTable({ campaigns }: { campaigns: GoogleCampaign[] }) {
  return (
    <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-sm font-semibold text-brand-secondary">Google Campaigns</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface/80">
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-brand-secondary/70">Campaign</th>
              <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-brand-secondary/70">Clicks</th>
              <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-brand-secondary/70">Impressions</th>
              <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-brand-secondary/70">Cost</th>
              <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-brand-secondary/70">Conversions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c, i) => (
              <tr key={i} className="border-b border-border/60 hover:bg-brand-primary/[0.02] transition-colors">
                <td className="px-4 py-3 text-brand-secondary font-medium max-w-[280px] truncate">{c.campaign}</td>
                <td className="px-4 py-3 text-right font-mono text-slate-600">{formatCount(c.clicks)}</td>
                <td className="px-4 py-3 text-right font-mono text-slate-600">{formatCount(c.impressions)}</td>
                <td className="px-4 py-3 text-right font-mono font-medium text-brand-secondary">{formatCurrency(c.cost)}</td>
                <td className="px-4 py-3 text-right font-mono text-slate-600">{formatCount(c.conversions)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MetaTable({ ads }: { ads: MetaAd[] }) {
  return (
    <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-sm font-semibold text-brand-secondary">Meta Ads</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface/80">
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-brand-secondary/70">Ad Name</th>
              <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-brand-secondary/70">Clicks</th>
              <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-brand-secondary/70">Impressions</th>
              <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-brand-secondary/70">Spend</th>
            </tr>
          </thead>
          <tbody>
            {ads.map((a, i) => (
              <tr key={i} className="border-b border-border/60 hover:bg-brand-primary/[0.02] transition-colors">
                <td className="px-4 py-3 text-brand-secondary font-medium max-w-[280px] truncate">{a.ad_name}</td>
                <td className="px-4 py-3 text-right font-mono text-slate-600">{formatCount(a.clicks)}</td>
                <td className="px-4 py-3 text-right font-mono text-slate-600">{formatCount(a.impressions)}</td>
                <td className="px-4 py-3 text-right font-mono font-medium text-brand-secondary">{formatCurrency(a.spend)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function AdsPage() {
  const [period, setPeriod] = useState('L6M')
  const { data, isLoading } = useAds(period)

  if (isLoading) {
    return (
      <>
        <div className="mb-6"><h1 className="text-2xl font-bold text-brand-secondary">Ad Performance</h1></div>
        <FilterBar period={period} onChange={setPeriod} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="skeleton h-24 rounded-xl" />
          <div className="skeleton h-24 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="skeleton h-80 rounded-xl" />
          <div className="skeleton h-80 rounded-xl" />
        </div>
      </>
    )
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-secondary">Ad Performance</h1>
        <p className="text-sm text-slate-500 mt-0.5">Google Ads vs Meta Ads comparison</p>
      </div>

      <FilterBar period={period} onChange={setPeriod} />

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <SummaryCard label="Google Total Spend" value={data?.summary.google_total ?? 0} color={COLORS.chart[0]} />
        <SummaryCard label="Meta Total Spend" value={data?.summary.meta_total ?? 0} color={COLORS.chart[2]} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <GoogleChart campaigns={data?.google ?? []} />
        <MetaChart ads={data?.meta ?? []} />
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CampaignTable campaigns={data?.google ?? []} />
        <MetaTable ads={data?.meta ?? []} />
      </div>
    </>
  )
}
