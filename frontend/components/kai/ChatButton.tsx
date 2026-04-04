'use client'

import { MessageCircle } from 'lucide-react'
import { useKaiChat } from '@/lib/kai-context'

export default function ChatButton() {
  const { isOpen, setOpen, isStreaming } = useKaiChat()
  return (
    <button
      onClick={() => setOpen(!isOpen)}
      className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
        transition-all duration-150
        ${isOpen
          ? 'bg-brand-primary text-white shadow-sm'
          : 'bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20'
        }`}
      title="Open KAI Assistant"
    >
      <MessageCircle size={14} />
      <span className="hidden sm:inline">KAI</span>
      {isStreaming && (
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
      )}
    </button>
  )
}
