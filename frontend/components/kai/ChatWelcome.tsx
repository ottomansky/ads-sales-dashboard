'use client'

import { useKaiChat } from '@/lib/kai-context'
import { Sparkles } from 'lucide-react'

const STARTER_PROMPTS = [
  "What's our total revenue this month?",
  "Compare Google vs Meta ad performance",
  "Which products generate the most revenue?",
]

export default function ChatWelcome() {
  const { sendMessage } = useKaiChat()
  return (
    <div className="flex flex-col items-center px-4 py-8 text-center">
      <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center mb-4">
        <Sparkles size={22} className="text-brand-primary" />
      </div>
      <h3 className="text-sm font-semibold text-brand-secondary mb-1">KAI Assistant</h3>
      <p className="text-xs text-slate-500 mb-6 max-w-[240px]">
        Ask questions about your ads, sales, and customer data.
      </p>
      <div className="w-full space-y-2">
        {STARTER_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => sendMessage(prompt)}
            className="w-full text-left px-3 py-2.5 rounded-lg border border-border text-xs text-brand-secondary
              hover:border-brand-primary/40 hover:bg-brand-primary/5 hover:text-brand-primary
              transition-all duration-150"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )
}
