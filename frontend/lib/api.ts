'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import type {
  HealthResponse,
  PlatformInfo,
  UserMeResponse,
  KpisResponse,
  OverviewChartResponse,
  AdsResponse,
  OrdersResponse,
  ProductsResponse,
  CustomersResponse,
  DataSchemaResponse,
  QueryDataResponse,
} from './types'
import type { ChartConfig } from './chart-config-storage'

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000), ...options })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`API ${res.status}: ${url} — ${body}`)
  }
  return res.json()
}

// ─── Base hooks ─────────────────────────────────────────────────────────────

export function useHealthCheck() {
  return useQuery<HealthResponse>({
    queryKey: ['health'],
    queryFn: () => apiFetch('/api/health'),
    staleTime: 30_000,
  })
}

export function useCurrentUser() {
  return useQuery<UserMeResponse>({
    queryKey: ['me'],
    queryFn: () => apiFetch('/api/me'),
    staleTime: 10 * 60 * 1000,
  })
}

export function usePlatformInfo() {
  return useQuery<PlatformInfo>({
    queryKey: ['platform'],
    queryFn: () => apiFetch('/api/platform'),
    staleTime: 60 * 60 * 1000,
  })
}

// ─── Dashboard data hooks ────────────────────────────────────────────────────

export function useKpis(period: string) {
  return useQuery<KpisResponse>({
    queryKey: ['kpis', period],
    queryFn: () => apiFetch(`/api/kpis?period=${period}`),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  })
}

export function useOverviewChart(period: string) {
  return useQuery<OverviewChartResponse>({
    queryKey: ['overview-chart', period],
    queryFn: () => apiFetch(`/api/overview-chart?period=${period}`),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  })
}

export function useAds(period: string) {
  return useQuery<AdsResponse>({
    queryKey: ['ads', period],
    queryFn: () => apiFetch(`/api/ads?period=${period}`),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  })
}

export interface OrdersParams {
  status?: string
  payment?: string
  search?: string
  page?: number
  limit?: number
}

export function useOrders(params: OrdersParams) {
  const qs = new URLSearchParams()
  if (params.status) qs.set('status', params.status)
  if (params.payment) qs.set('payment', params.payment)
  if (params.search) qs.set('search', params.search)
  if (params.page) qs.set('page', String(params.page))
  if (params.limit) qs.set('limit', String(params.limit))
  return useQuery<OrdersResponse>({
    queryKey: ['orders', params],
    queryFn: () => apiFetch(`/api/orders?${qs}`),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  })
}

export function useProducts(period: string) {
  return useQuery<ProductsResponse>({
    queryKey: ['products', period],
    queryFn: () => apiFetch(`/api/products?period=${period}`),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCustomers(period: string) {
  return useQuery<CustomersResponse>({
    queryKey: ['customers', period],
    queryFn: () => apiFetch(`/api/customers?period=${period}`),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  })
}

// ─── My Dashboards hooks ─────────────────────────────────────────────────────

export function useDataSchema() {
  return useQuery<DataSchemaResponse>({
    queryKey: ['data-schema'],
    queryFn: () => apiFetch('/api/data-schema'),
    staleTime: Infinity,
  })
}

export function useQueryData(config: ChartConfig | null) {
  return useQuery<QueryDataResponse | null>({
    queryKey: ['query-data', config?.source, config?.dimension, config?.measures, config?.period],
    queryFn: () => {
      if (!config) return null
      const params = new URLSearchParams({
        source: config.source,
        dimension: config.dimension,
        measures: config.measures.join(','),
      })
      if (config.period) params.set('period', config.period)
      return apiFetch<QueryDataResponse>(`/api/query-data?${params}`)
    },
    enabled: !!config && !!config.dimension && config.measures.length > 0,
    staleTime: 5 * 60 * 1000,
  })
}
