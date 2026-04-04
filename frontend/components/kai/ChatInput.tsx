'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { useKaiChat } from '@/lib/kai-context'
import { Send } from 'lucide-react'

export default function ChatInput() {
  const { sendMessage, isStreaming } = useKaiChat()
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = () => {
    const trimmed = text.trim()
    if (!trimmed || isStreaming) return
    sendMessage(trimmed)
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleInput = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`
  }

  return (
    <div className="flex items-end gap-2 p-3 border-t border-border bg-white">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        placeholder={isStreaming ? 'KAI is thinking…' : 'Ask KAI anything…'}
        disabled={isStreaming}
        rows={1}
        className="flex-1 resize-none rounded-xl border border-border bg-surface px-3 py-2
          text-sm text-brand-secondary placeholder:text-slate-400
          focus:outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/20
          disabled:opacity-60 disabled:cursor-not-allowed
          transition-all duration-150"
        style={{ minHeight: 38, maxHeight: 140 }}
      />
      <button
        onClick={handleSubmit}
        disabled={!text.trim() || isStreaming}
        className="w-9 h-9 flex items-center justify-center rounded-xl
          bg-brand-primary text-white
          disabled:opacity-40 disabled:cursor-not-allowed
          hover:bg-brand-secondary transition-colors duration-150 shrink-0"
        title="Send (Enter)"
      >
        <Send size={15} />
      </button>
    </div>
  )
}
