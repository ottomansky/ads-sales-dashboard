'use client'

import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table'
import { useOrders } from '@/lib/api'
import { formatCurrency } from '@/lib/constants'
import type { Order } from '@/lib/types'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'

const STATUS_OPTIONS = ['', 'Vybavena', 'Vyzdvihnutá', 'Čaká na platbu', 'Stornovaná']
const PAYMENT_OPTIONS = ['', 'Card', 'Cash', 'Bank Transfer', 'PayPal']

const columnHelper = createColumnHelper<Order>()

const STATUS_COLORS: Record<string, string> = {
  'Vybavena': 'bg-green-100 text-green-700',
  'Vyzdvihnutá': 'bg-blue-100 text-blue-700',
  'Čaká na platbu': 'bg-yellow-100 text-yellow-700',
  'Stornovaná': 'bg-red-100 text-red-700',
}

export default function OrdersPage() {
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [status, setStatus] = useState('')
  const [payment, setPayment] = useState('')
  const [page, setPage] = useState(1)
  const [sorting, setSorting] = useState<SortingState>([])

  const { data, isLoading } = useOrders({
    search,
    status,
    payment,
    page,
    limit: 20,
  })

  const columns = useMemo(() => [
    columnHelper.accessor('code', {
      header: 'Order Code',
      cell: (info) => <span className="font-mono text-xs">{info.getValue()}</span>,
    }),
    columnHelper.accessor('date', {
      header: 'Date',
      cell: (info) => <span className="text-slate-600">{info.getValue()}</span>,
    }),
    columnHelper.accessor('itemName', {
      header: 'Item',
      cell: (info) => <span className="max-w-[200px] block truncate">{info.getValue()}</span>,
    }),
    columnHelper.accessor('totalPriceWithVat', {
      header: 'Total',
      cell: (info) => <span className="font-mono font-medium">{formatCurrency(info.getValue())}</span>,
    }),
    columnHelper.accessor('statusName', {
      header: 'Status',
      cell: (info) => {
        const val = info.getValue()
        const cls = STATUS_COLORS[val] ?? 'bg-slate-100 text-slate-600'
        return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{val}</span>
      },
    }),
    columnHelper.accessor('paymentForm', {
      header: 'Payment',
      cell: (info) => <span className="text-slate-600 text-xs">{info.getValue()}</span>,
    }),
    columnHelper.accessor('deliveryCity', {
      header: 'City',
      cell: (info) => <span className="text-slate-600">{info.getValue()}</span>,
    }),
  ], [])

  const orders = data?.orders ?? []

  const table = useReactTable({
    data: orders,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
  })

  const totalPages = data?.pages ?? 1

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-secondary">Orders</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {data?.total != null ? `${data.total.toLocaleString()} total orders` : 'Browse all orders'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search orders…"
              className="pl-8 pr-3 py-2 text-sm rounded-lg border border-border bg-white
                focus:outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/20
                w-52 transition-all duration-150"
            />
          </div>
          <button type="submit" className="px-3 py-2 text-sm font-semibold rounded-lg
            bg-brand-secondary text-white hover:bg-brand-secondary/90 transition-colors">
            Search
          </button>
        </form>

        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="px-3 py-2 text-sm rounded-lg border border-border bg-white
            focus:outline-none focus:border-brand-primary/50 cursor-pointer text-brand-secondary"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={payment}
          onChange={(e) => { setPayment(e.target.value); setPage(1) }}
          className="px-3 py-2 text-sm rounded-lg border border-border bg-white
            focus:outline-none focus:border-brand-primary/50 cursor-pointer text-brand-secondary"
        >
          <option value="">All Payments</option>
          {PAYMENT_OPTIONS.filter(Boolean).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        {(search || status || payment) && (
          <button
            onClick={() => { setSearch(''); setSearchInput(''); setStatus(''); setPayment(''); setPage(1) }}
            className="px-3 py-2 text-sm text-slate-500 hover:text-brand-secondary transition-colors underline underline-offset-2"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/80">
                {table.getFlatHeaders().map((h) => (
                  <th
                    key={h.id}
                    onClick={h.column.getCanSort() ? h.column.getToggleSortingHandler() : undefined}
                    className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider
                      transition-colors duration-150
                      ${h.column.getIsSorted()
                        ? 'text-brand-primary'
                        : h.column.getCanSort()
                          ? 'text-brand-secondary/55 hover:text-brand-primary cursor-pointer'
                          : 'text-brand-secondary'
                      }`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {h.column.getIsSorted() === 'asc' && <span className="text-brand-primary">▲</span>}
                      {h.column.getIsSorted() === 'desc' && <span className="text-brand-primary">▼</span>}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/60">
                    {columns.map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="skeleton h-4 rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-16 text-center text-slate-400 text-sm">
                    No orders found for the current filters.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/60 hover:bg-brand-primary/[0.02] transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 text-brand-secondary">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface/50">
            <span className="text-xs text-slate-500">
              Page {page} of {totalPages}
              {data?.total != null && ` · ${data.total.toLocaleString()} total`}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
