'use client'

import Image from 'next/image'
import { useCurrentUser, useHealthCheck, usePlatformInfo } from '@/lib/api'
import { useState, useRef, useEffect } from 'react'
import { ChatButton } from '@/components/kai/ChatButton'
import { Database, ExternalLink } from 'lucide-react'

function DataStatusBadge() {
  const { data } = useHealthCheck()
  const { data: platform } = usePlatformInfo()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const count = (data as any)?.tables_loaded ?? 0
  const tables: Array<{ short_name: string; row_count: number; table_id: string }> = (data as any)?.tables ?? []

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const storageBase = platform?.connection_url
    ? `${platform.connection_url}/admin/projects/${platform.project_id}/storage`
    : null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-slate-500 font-medium tabular-nums whitespace-nowrap hover:text-brand-primary transition-colors duration-150"
      >
        <Database size={12} className={count > 0 ? 'text-brand-accent' : 'text-slate-400'} />
        <span className="hidden sm:inline">{count} table{count !== 1 ? 's' : ''} loaded</span>
      </button>
      {open && tables.length > 0 && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50">
            <h4 className="text-xs font-semibold text-brand-secondary uppercase tracking-wider">Loaded Tables</h4>
          </div>
          <ul className="py-1">
            {tables.map((t) => (
              <li key={t.table_id}>
                {storageBase ? (
                  <a
                    href={(() => {
                      const i = t.table_id.lastIndexOf('.')
                      return `${storageBase}/${t.table_id.slice(0, i)}/overview/table/${t.table_id.slice(i + 1)}/overview`
                    })()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-4 py-2 hover:bg-surface transition-colors group"
                  >
                    <span className="text-xs font-medium text-brand-secondary group-hover:text-brand-primary">{t.short_name}</span>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      {t.row_count.toLocaleString()} rows
                      <ExternalLink size={10} className="opacity-0 group-hover:opacity-60" />
                    </span>
                  </a>
                ) : (
                  <div className="flex items-center justify-between px-4 py-2">
                    <span className="text-xs font-medium text-brand-secondary">{t.short_name}</span>
                    <span className="text-xs text-slate-400">{t.row_count.toLocaleString()} rows</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function PoweredByKeboola() {
  const { data: platform } = usePlatformInfo()
  const href = platform?.connection_url ?? '#'
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs opacity-40 hover:opacity-70 transition-opacity duration-150"
      title="Open Keboola platform"
    >
      <img src="/keboola-icon.svg" alt="Keboola" width={16} height={16} />
      <span className="hidden sm:inline">Powered by Keboola</span>
    </a>
  )
}

export default function Header() {
  const { data: user } = useCurrentUser()
  const { data: platform } = usePlatformInfo()
  const projectUrl = platform?.connection_url && platform?.project_id
    ? `${platform.connection_url}/admin/projects/${platform.project_id}`
    : '#'

  return (
    <header className="sticky top-0 w-full glass z-30" style={{ height: 56 }}>
      <div className="container-page h-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href={projectUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 group">
            <Image
              src="/keboola-icon.svg"
              alt="Ads & Sales Dashboard"
              width={28}
              height={28}
              priority
              className="group-hover:opacity-80 transition-opacity"
            />
          </a>
          <h1 className="text-base font-semibold text-brand-secondary leading-tight">
            Ads &amp; Sales Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <PoweredByKeboola />
          <DataStatusBadge />
          <ChatButton />
          {user?.email && (
            <span className="hidden md:block text-xs text-slate-400 max-w-[160px] truncate">{user.email}</span>
          )}
        </div>
      </div>
    </header>
  )
}
