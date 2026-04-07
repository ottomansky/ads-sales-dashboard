'use client'

import { useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import Header from '@/components/layout/Header'
import NavTabs from '@/components/layout/NavTabs'
import { Chat } from '@/components/kai/Chat'
import { useKaiChat } from '@/lib/kai-context'
import { SidePanelProvider, useSidePanel } from '@/lib/side-panel-context'
import ChartBuilderSidebar from './custom/ChartBuilderSidebar'
import { getActiveDashboardId } from '@/lib/dashboard-storage'

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isOpen: kaiIsOpen, closeChat } = useKaiChat()
  const { chartBuilderOpen, chartBuilderMode, editingConfigId, closeChartBuilder, switchChartBuilderMode, openChartBuilder } = useSidePanel()

  const showChartBuilder = chartBuilderOpen && pathname === '/custom'

  const handleClickOutside = useCallback(() => {
    if (kaiIsOpen) closeChat()
    if (chartBuilderOpen) closeChartBuilder()
  }, [kaiIsOpen, closeChat, chartBuilderOpen, closeChartBuilder])

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header />
      <NavTabs />
      <div className="flex flex-1 overflow-hidden">
        <main
          className="flex-1 min-w-0 overflow-y-auto"
          onMouseDown={(kaiIsOpen || showChartBuilder) ? handleClickOutside : undefined}
        >
          {children}
        </main>

        <AnimatePresence>
          {showChartBuilder && (
            <ChartBuilderSidebar
              mode={chartBuilderMode}
              editingConfigId={editingConfigId}
              activeId={getActiveDashboardId()}
              onClose={closeChartBuilder}
              onSwitchMode={switchChartBuilderMode}
              onEditConfig={(configId) => openChartBuilder('edit', configId)}
            />
          )}
        </AnimatePresence>

        {kaiIsOpen && <Chat />}
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidePanelProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </SidePanelProvider>
  )
}
