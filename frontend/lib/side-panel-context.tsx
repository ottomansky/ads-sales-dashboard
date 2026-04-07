'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import type { SidebarMode } from '@/app/(dashboard)/custom/ChartBuilderSidebar'

export type ChartBuilderState = {
  chartBuilderOpen: boolean
  chartBuilderMode: SidebarMode
  editingConfigId: string | null
  selectedCanvasChartId: string | null
  openChartBuilder: (mode: SidebarMode, editingId?: string) => void
  closeChartBuilder: () => void
  switchChartBuilderMode: (mode: SidebarMode) => void
  setSelectedCanvasChartId: (id: string | null) => void
}

const SidePanelContext = createContext<ChartBuilderState | null>(null)

export function SidePanelProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [chartBuilderMode, setChartBuilderMode] = useState<SidebarMode | 'closed'>('closed')
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null)
  const [selectedCanvasChartId, setSelectedCanvasChartId] = useState<string | null>(null)

  const chartBuilderOpen = chartBuilderMode !== 'closed'

  // Auto-close chart builder when navigating away from /custom
  useEffect(() => {
    if (pathname !== '/custom') {
      setChartBuilderMode('closed')
      setEditingConfigId(null)
      setSelectedCanvasChartId(null)
    }
  }, [pathname])

  const openChartBuilder = useCallback((mode: SidebarMode, editingId?: string) => {
    setChartBuilderMode(mode)
    setEditingConfigId(editingId ?? null)
    if (mode !== 'edit') setSelectedCanvasChartId(null)
  }, [])

  const closeChartBuilder = useCallback(() => {
    setChartBuilderMode('closed')
    setEditingConfigId(null)
    setSelectedCanvasChartId(null)
  }, [])

  const switchChartBuilderMode = useCallback((mode: SidebarMode) => {
    setChartBuilderMode(mode)
    if (mode !== 'edit') setEditingConfigId(null)
  }, [])

  return (
    <SidePanelContext.Provider
      value={{
        chartBuilderOpen,
        chartBuilderMode: chartBuilderOpen ? (chartBuilderMode as SidebarMode) : 'new',
        editingConfigId,
        selectedCanvasChartId,
        openChartBuilder,
        closeChartBuilder,
        switchChartBuilderMode,
        setSelectedCanvasChartId,
      }}
    >
      {children}
    </SidePanelContext.Provider>
  )
}

export function useSidePanel(): ChartBuilderState {
  const ctx = useContext(SidePanelContext)
  if (!ctx) throw new Error('useSidePanel must be used within SidePanelProvider')
  return ctx
}
