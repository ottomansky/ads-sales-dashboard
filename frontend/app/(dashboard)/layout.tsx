import Header from '@/components/layout/Header'
import NavTabs from '@/components/layout/NavTabs'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <NavTabs />
      <main className="container-page py-6">
        {children}
      </main>
    </div>
  )
}
