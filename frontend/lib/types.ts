/*
 * API RESPONSE TYPES
 *
 * One interface per endpoint response. Keep in sync with backend.
 */

export interface HealthResponse {
  status: string
  tables_loaded: number
  tables: Array<{
    short_name: string
    row_count: number
    table_id: string
    loaded_at: string
  }>
}

export interface PlatformInfo {
  connection_url: string | null
  project_id: string | null
}

export interface UserMeResponse {
  email: string
  name?: string
  role?: string
  is_authenticated?: boolean
}

// KPI types
export interface KpiItem {
  label: string
  value: number
  delta: number
  description: string
  formula?: string
  sources?: string[]
}

export type KpisResponse = KpiItem[]

// Overview chart
export interface OverviewChartPoint {
  date: string
  revenue: number
  ad_costs: number
}

export type OverviewChartResponse = OverviewChartPoint[]

// Ads performance
export interface GoogleCampaign {
  campaign: string
  clicks: number
  impressions: number
  cost: number
  sessions: number
  conversions: number
}

export interface MetaAd {
  ad_name: string
  clicks: number
  impressions: number
  spend: number
}

export interface AdsResponse {
  google: GoogleCampaign[]
  meta: MetaAd[]
  summary: {
    google_total: number
    meta_total: number
  }
}

// Orders
export interface Order {
  code: string
  date: string
  itemName: string
  totalPriceWithVat: number
  statusName: string
  paymentForm: string
  deliveryCity: string
  deliveryCountryName: string
}

export interface OrdersResponse {
  orders: Order[]
  total: number
  page: number
  pages: number
}

// Products
export interface ProductItem {
  itemName: string
  order_count: number
  total_revenue: number
}

export type ProductsResponse = ProductItem[]

// Customers
export interface CityData {
  city: string
  country: string
  order_count: number
  revenue: number
}

export interface PaymentData {
  payment: string
  order_count: number
  revenue: number
}

export interface CustomersResponse {
  by_city: CityData[]
  by_payment: PaymentData[]
}

// Data schema (for My Dashboards chart builder)
export interface DataSchemaSource {
  id: string
  label: string
  supports_period: boolean
  dimensions: Array<{ column: string; label: string; is_date?: boolean }>
  measures: Array<{ column: string; label: string }>
}

export interface DataSchemaResponse {
  sources: DataSchemaSource[]
}

export interface QueryDataResponse {
  headers: string[]
  rows: string[][]
}
