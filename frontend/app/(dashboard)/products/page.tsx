'use client'

import { useState, useRef, useEffect } from 'react'
import ReactECharts from 'echarts-for-react'
import { useProducts } from '@/lib/api'
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

export default function ProductsPage() {
  const [period, setPeriod] = useState('L6M')
  const { data, isLoading } = useProducts(period)
  const chartRef = useRef<any>(null)

  useEffect(() => {
    const h = () => chartRef.current?.getEchartsInstance?.()?.resize?.()
    window.addEventListener('resize', h); return () => window.removeEventListener('resize', h)
  }, [])

  const top5 = (data ?? []).slice(0, 5)

  const chartOption = {
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
    grid: { left: '3%', right: '8%', bottom: '3%', top: 16, containLabel: true },
    xAxis: {
      type: 'value', scale: false,
      axisLabel: { formatter: (v: number) => formatCompact(v), fontSize: 10 },
      splitLine: { lineStyle: { color: COLORS.border } },
    },
    yAxis: {
      type: 'category',
      data: top5.map((p) => p.itemName.length > 32 ? p.itemName.slice(0, 32) + '…' : p.itemName).reverse(),
      axisLabel: { fontSize: 11, color: '#334155' },
    },
    series: [
      {
        name: 'Revenue',
        type: 'bar',
        data: top5.map((p) => p.total_revenue).reverse(),
        itemStyle: {
          borderRadius: [0, 6, 6, 0],
          color: {
            type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: COLORS.chart[0] + 'cc' },
              { offset: 1, color: COLORS.chart[0] },
            ],
          },
        },
        barMaxWidth: 32,
        label: {
          show: true,
          position: 'right',
          formatter: (p: any) => formatCompact(p.value),
          fontSize: 10,
          color: '#64748b',
        },
      },
    ],
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-secondary">Products</h1>
        <p className="text-sm text-slate-500 mt-0.5">Top products by revenue</p>
      </div>

      <FilterBar period={period} onChange={setPeriod} />

      {/* Top 5 chart */}
      <div className="bg-white rounded-xl border border-border shadow-sm p-6 mb-6">
        <h3 className="text-sm font-semibold text-brand-secondary mb-4">Top 5 Products by Revenue</h3>
        {isLoading ? (
          <div className="skeleton h-56 rounded-lg" />
        ) : (
          <div className="h-[200px] md:h-[240px]">
            <ReactECharts
              ref={(e) => { chartRef.current = e }}
              option={chartOption}
              style={{ height: '100%', width: '100%' }}
              opts={{ renderer: 'canvas' }}
            />
          </div>
        )}
      </div>

      {/* Full product table */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-brand-secondary">All Products</h3>
          <span className="text-xs text-slate-400">{(data ?? []).length} products</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/80">
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-brand-secondary/70">#</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-brand-secondary/70">Product</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-brand-secondary/70">Orders</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-brand-secondary/70">Revenue</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-brand-secondary/70">Avg. Order</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/60">
                    {[1, 2, 3, 4, 5].map((j) => (
                      <td key={j} className="px-4 py-3"><div className="skeleton h-4 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : (data ?? []).map((product, i) => (
                <tr key={product.itemName} className="border-b border-border/60 hover:bg-brand-primary/[0.02] transition-colors">
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-brand-secondary max-w-[280px] truncate">
                    {product.itemName}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600">{formatCount(product.order_count)}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-brand-secondary">
                    {formatCurrency(product.total_revenue)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600">
                    {product.order_count > 0 ? formatCurrency(product.total_revenue / product.order_count) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
