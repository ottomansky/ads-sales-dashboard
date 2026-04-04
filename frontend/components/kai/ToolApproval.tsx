'use client'

import { useKaiChat } from '@/lib/kai-context'
import { Wrench, Check, X } from 'lucide-react'

interface ToolApprovalProps {
  chatId: string
  approvalId: string
  toolName: string
}

export default function ToolApproval({ chatId, approvalId, toolName }: ToolApprovalProps) {
  const { approveToolCall, denyToolCall } = useKaiChat()
  return (
    <div className="border border-warning/30 bg-warning/5 rounded-lg p-3 my-2">
      <div className="flex items-center gap-2 mb-2">
        <Wrench size={13} className="text-warning" />
        <span className="text-xs font-semibold text-brand-secondary">Tool call requires approval</span>
      </div>
      <p className="text-xs text-slate-500 mb-3">
        KAI wants to run: <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">{toolName}</code>
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => approveToolCall(chatId, approvalId)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md
            bg-brand-accent text-white text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          <Check size={12} /> Approve
        </button>
        <button
          onClick={() => denyToolCall(chatId, approvalId)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md
            bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 transition-colors"
        >
          <X size={12} /> Deny
        </button>
      </div>
    </div>
  )
}
