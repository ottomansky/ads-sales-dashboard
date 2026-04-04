'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Megaphone, ShoppingCart, Package, Users, LayoutGrid } from 'lucide-react'

const TABS = [
  { label: 'Overview', href: '/', icon: LayoutDashboard },
  { label: 'Ad Performance', href: '/ads', icon: Megaphone },
  { label: 'Orders', href: '/orders', icon: ShoppingCart },
  { label: 'Products', href: '/products', icon: Package },
  { label: 'Customers', href: '/customers', icon: Users },
  { label: 'My Dashboards', href: '/custom', icon: LayoutGrid },
]

export default function NavTabs() {
  const pathname = usePathname()

  return (
    <nav
      className="sticky top-[56px] z-20 glass"
      style={{ height: 44 }}
    >
      <div className="container-page h-full flex items-center gap-0.5 overflow-x-auto">
        {TABS.map((tab) => {
          const isActive = tab.href === '/'
            ? pathname === '/'
            : pathname.startsWith(tab.href)
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? 'page' : undefined}
              className={`
                inline-flex items-center gap-1.5 px-3 py-[5px] text-sm whitespace-nowrap
                transition-all duration-150 relative
                ${isActive
                  ? 'font-semibold text-brand-primary'
                  : 'font-medium text-brand-secondary/55 hover:text-brand-secondary hover:bg-brand-secondary/5 rounded-md'
                }
              `}
              style={isActive ? {
                borderBottomWidth: 2,
                borderBottomStyle: 'solid',
                borderBottomColor: '#097cf7',
              } : undefined}
            >
              <Icon size={13} />
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
