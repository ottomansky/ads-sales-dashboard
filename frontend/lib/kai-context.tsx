'use client'

import { createContext, useContext, useState, useCallback, useRef } from 'react'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
  toolApproval?: {
    approvalId: string
    toolName: string
  }
}

export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
}

interface KaiChatContextType {
  conversations: Map<string, Conversation>
  activeConversationId: string | null
  isOpen: boolean
  isStreaming: boolean
  setOpen: (open: boolean) => void
  sendMessage: (text: string) => Promise<void>
  newConversation: () => void
  approveToolCall: (chatId: string, approvalId: string) => Promise<void>
  denyToolCall: (chatId: string, approvalId: string) => Promise<void>
}

const KaiChatContext = createContext<KaiChatContextType | null>(null)

export function useKaiChat() {
  const ctx = useContext(KaiChatContext)
  if (!ctx) throw new Error('useKaiChat must be used within KaiChatProvider')
  return ctx
}

function buildSystemContext(): string {
  return `You are KAI, AI assistant for the Ads & Sales Dashboard. Tables: marketing_metrics (out.c-marketing_metrics.marketing_metrics) with columns date, orders, revenue, ad_costs, google_costs, meta_costs, cac, mer, roi, aov; orders (in.c-Shoptet-01K4YFRJC6VFPXWJW1WRJS98S0.orders) with columns code, date, itemName, totalPriceWithVat, statusName, paymentForm, deliveryCity; ga4_analytics with campaigns; meta_insights with ad names and spend. KPIs: Revenue=SUM(revenue), Orders=SUM(orders), Ad Costs=SUM(ad_costs), CAC=AVG(cac), ROI=AVG(roi), AOV=AVG(aov). Statuses: Vybavena, Vyzdvihnutá, Čaká na platbu, Stornovaná. Cities: Bratislava, Košice, Banská Bystrica, Prešov, Žilina, Trenčín, Trnava, Nitra.`
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function KaiChatProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Map<string, Conversation>>(new Map())
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setOpen = useCallback((open: boolean) => setIsOpen(open), [])

  const newConversation = useCallback(() => {
    const id = generateId()
    const conv: Conversation = { id, title: 'New conversation', messages: [] }
    setConversations((prev) => new Map(prev).set(id, conv))
    setActiveConversationId(id)
  }, [])

  const updateMessage = useCallback((convId: string, msgId: string, updates: Partial<ChatMessage>) => {
    setConversations((prev) => {
      const next = new Map(prev)
      const conv = next.get(convId)
      if (!conv) return prev
      const msgs = conv.messages.map((m) => m.id === msgId ? { ...m, ...updates } : m)
      next.set(convId, { ...conv, messages: msgs })
      return next
    })
  }, [])

  const addMessage = useCallback((convId: string, msg: ChatMessage) => {
    setConversations((prev) => {
      const next = new Map(prev)
      const conv = next.get(convId)
      if (!conv) return prev
      const title = conv.messages.length === 0 && msg.role === 'user'
        ? msg.content.slice(0, 40) + (msg.content.length > 40 ? '…' : '')
        : conv.title
      next.set(convId, { ...conv, title, messages: [...conv.messages, msg] })
      return next
    })
  }, [])

  const pollStream = useCallback(async (streamId: string, convId: string, assistantMsgId: string) => {
    let cursor = 0
    let done = false

    const poll = async () => {
      try {
        const res = await fetch(`/api/chat/${streamId}/poll?cursor=${cursor}`)
        if (!res.ok) throw new Error(`Poll error ${res.status}`)
        const body = await res.json()
        const events: string[] = body.events ?? []
        cursor = body.cursor ?? cursor

        for (const rawEvent of events) {
          const stripped = rawEvent.startsWith('data: ') ? rawEvent.slice(6) : rawEvent
          try {
            const parsed = JSON.parse(stripped)
            if (parsed.type === 'text' && parsed.text) {
              setConversations((prev) => {
                const next = new Map(prev)
                const conv = next.get(convId)
                if (!conv) return prev
                const msgs = conv.messages.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, content: m.content + parsed.text, isStreaming: true }
                    : m
                )
                next.set(convId, { ...conv, messages: msgs })
                return next
              })
            } else if (parsed.type === 'tool-approval-request') {
              updateMessage(convId, assistantMsgId, {
                isStreaming: false,
                toolApproval: {
                  approvalId: parsed.approval_id ?? parsed.approvalId,
                  toolName: parsed.tool_name ?? parsed.toolName ?? 'tool',
                },
              })
            } else if (parsed.type === 'finish' || parsed.type === 'error') {
              done = true
            }
          } catch {
            // not JSON, skip
          }
        }

        if (body.done || done) {
          updateMessage(convId, assistantMsgId, { isStreaming: false })
          setIsStreaming(false)
          return
        }

        pollingRef.current = setTimeout(poll, 800)
      } catch {
        updateMessage(convId, assistantMsgId, { isStreaming: false, content: '(Connection error)' })
        setIsStreaming(false)
      }
    }

    pollingRef.current = setTimeout(poll, 400)
  }, [updateMessage])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return

    let convId = activeConversationId
    if (!convId) {
      convId = generateId()
      const conv: Conversation = {
        id: convId,
        title: text.slice(0, 40) + (text.length > 40 ? '…' : ''),
        messages: [],
      }
      setConversations((prev) => new Map(prev).set(convId!, conv))
      setActiveConversationId(convId)
    }

    const userMsgId = generateId()
    const userMsg: ChatMessage = { id: userMsgId, role: 'user', content: text }
    addMessage(convId, userMsg)

    const assistantMsgId = generateId()
    const assistantMsg: ChatMessage = { id: assistantMsgId, role: 'assistant', content: '', isStreaming: true }
    addMessage(convId, assistantMsg)

    setIsStreaming(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: convId,
          message: {
            id: userMsgId,
            role: 'user',
            parts: [{ type: 'text', text }],
          },
          selectedChatModel: 'chat-model',
          selectedVisibilityType: 'private',
          systemContext: buildSystemContext(),
        }),
      })

      if (!res.ok) throw new Error(`Chat error ${res.status}`)
      const { stream_id } = await res.json()
      await pollStream(stream_id, convId, assistantMsgId)
    } catch {
      updateMessage(convId, assistantMsgId, {
        isStreaming: false,
        content: 'Sorry, I encountered an error. Please try again.',
      })
      setIsStreaming(false)
    }
  }, [activeConversationId, isStreaming, addMessage, pollStream, updateMessage])

  const approveToolCall = useCallback(async (chatId: string, approvalId: string) => {
    const convId = activeConversationId ?? chatId
    const assistantMsgId = generateId()
    addMessage(convId, { id: assistantMsgId, role: 'assistant', content: '', isStreaming: true })
    setIsStreaming(true)
    try {
      const res = await fetch(`/api/chat/${chatId}/approve/${approvalId}`, { method: 'POST' })
      if (!res.ok) throw new Error(`Approve error ${res.status}`)
      const { stream_id } = await res.json()
      await pollStream(stream_id, convId, assistantMsgId)
    } catch {
      updateMessage(convId, assistantMsgId, { isStreaming: false, content: '(Error approving tool call)' })
      setIsStreaming(false)
    }
  }, [activeConversationId, addMessage, pollStream, updateMessage])

  const denyToolCall = useCallback(async (chatId: string, approvalId: string) => {
    try {
      await fetch(`/api/chat/${chatId}/deny/${approvalId}`, { method: 'POST' })
    } catch { /* ignore */ }
  }, [])

  return (
    <KaiChatContext.Provider value={{
      conversations,
      activeConversationId,
      isOpen,
      isStreaming,
      setOpen,
      sendMessage,
      newConversation,
      approveToolCall,
      denyToolCall,
    }}>
      {children}
    </KaiChatContext.Provider>
  )
}
