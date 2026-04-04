'use client'

import { useState, useRef, useEffect } from 'react'
import ReactECharts from 'echarts-for-react'
import { useCustomers } from '@/lib/api'
import { formatCurrency, formatCount, formatCompact, COLORS } from '@/lib/constants'

const PERIODS = ['L3M', 'L6M', 'YTD', '12M']

function FilterBar({ period, onChange }: { period: string; onChange: (p: string) => void }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {PERIODS.map((p) => (
        <button key={p} onClick={() => onChange(p)}
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

export default function CustomersPage() {
  const [period, setPeriod] = useState('L6M')
  const { data, isLoading } = useCustomers(period)
  const cityChartRef = useRef<any>(null)
  const paymentChartRef = useRef<any>(null)

  useEffect(() => {
    const h = () => {
      cityChartRef.current?.getEchartsInstance?.()?.resize?.()
      paymentChartRef.current?.getEchartsInstance?.()?.resize?.()
    }
    window.addEventListener('resize', h); return () => window.removeEventListener('resize', h)
  }, [])

  const byCity = data?.by_city ?? []
  const byPayment = data?.by_payment ?? []

  const cityChartOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any[]) => {
        const p = params[0]
        return `<div style="font-weight:600;margin-bottom:4px">${p.axisValueLabel}</div>
          <div style="display:flex;align-items:center;gap:6px">
            <span style="width:8px;height:8px;border-radius:50%;background:${p.color};display:inline-block"></span>
            <span style="color:#64748b">Revenue:</span>
            <span style="font-weight:600;font-family:'JetBrains Mono',monospace">${formatCompact(p.value)}</span>
          </div>`
      },
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: 16, containLabel: true },
    xAxis: {
      type: 'category',
      data: byCity.map((c) => c.city),
      axisLabel: { fontSize: 11, color: '#64748b' },
      axisLine: { lineStyle: { color: COLORS.border } },
    },
    yAxis: {
      type: 'value', scale: false,
      axisLabel: { formatter: (v: number) => formatCompact(v), fontSize: 10, color: '#64748b' },
      splitLine: { lineStyle: { color: COLORS.border } },
    },
    series: [
      {
        name: 'Revenue',
        type: 'bar',
        data: byCity.map((c) => c.revenue),
        itemStyle: { color: COLORS.chart[0], borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 40,
      },
    ],
  }

  const paymentChartOption = {
    tooltip: {
      trigger: 'item',
      formatter: (p: any) => `<b>${p.name}</b><br/>Revenue: <b>${formatCompact(p.value)}</b> (${p.percent.toFixed(1)}%)`,
    },
    legend: {
      bottom: 0,
      textStyle: { fontSize: 11, fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
    },
    color: COLORS.chart,
    series: [
      {
        name: 'Payment',
        type: 'pie',
        radius: ['38%', '65%'],
        center: ['50%', '44%'],
        data: byPayment.map((p) => ({ name: p.payment, value: p.revenue })),
        label: { fontSize: 11, formatter: '{b}: {d}%' },
        itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
      },
    ],
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-secondary">Customers</h1>
        <p className="text-sm text-slate-500 mt-0.5">Geography and payment breakdown</p>
      </div>

      <FilterBar period={period} onChange={setPeriod} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-border shadow-sm p-6">
          <h3 className="text-sm font-semibold text-brand-secondary mb-4">Revenue by City</h3>
          {isLoading ? (
            <div className="skeleton h-56 rounded-lg" />
          ) : (
            <div className="h-[220px] md:h-[260px]">
              <ReactECharts
                ref={(e) => { cityChartRef.current = e }}
                option={cityChartOption}
                style={{ height: '100%', width: '100%' }}
                opts={{ renderer: 'canvas' }}
              />
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-border shadow-sm p-6">
          <h3 className="text-sm font-semibold text-brand-secondary mb-4">Payment Method Distribution</h3>
          {isLoading ? (
            <div className="skeleton h-56 rounded-lg" />
          ) : (
            <div className="h-[220px] md:h-[260px]">
              <ReactECharts
                ref={(e) => { paymentChartRef.current = e }}
                option={paymentChartOption}
                style={{ height: '100%', width: '100%' }}
                opts={{ renderer: 'canvas' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* City table */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-brand-secondary">Revenue by City</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/80">
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-brand-secondary/70">City</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-brand-secondary/70">Country</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-brand-secondary/70">Orders</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-brand-secondary/70">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/60">
                    {[1, 2, 3, 4].map((j) => (
                      <td key={j} className="px-4 py-3"><div className="skeleton h-4 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : byCity.map((c) => (
                <tr key={c.city} className="border-b border-border/60 hover:bg-brand-primary/[0.02] transition-colors">
                  <td className="px-4 py-3 font-medium text-brand-secondary">{c.city}</td>
                  <td className="px-4 py-3 text-slate-500">{c.country}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600">{formatCount(c.order_count)}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-brand-secondary">{formatCurrency(c.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
