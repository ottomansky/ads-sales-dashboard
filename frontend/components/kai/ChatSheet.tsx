'use client'

import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, MessageCircle } from 'lucide-react'
import { useKaiChat } from '@/lib/kai-context'
import MessageBubble from './MessageBubble'
import ChatWelcome from './ChatWelcome'
import ChatInput from './ChatInput'

export default function ChatSheet() {
  const { isOpen, setOpen, conversations, activeConversationId, newConversation } = useKaiChat()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeConversation = activeConversationId
    ? conversations.get(activeConversationId)
    : null
  const messages = activeConversation?.messages ?? []

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length, messages[messages.length - 1]?.content])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop (mobile) */}
          <motion.div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <motion.div
            className="fixed top-0 right-0 bottom-0 bg-white border-l border-border shadow-2xl z-50 flex flex-col"
            style={{ width: 420 }}
            initial={{ x: 420 }}
            animate={{ x: 0 }}
            exit={{ x: 420 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-white shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                  <MessageCircle size={14} className="text-brand-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-brand-secondary leading-tight">KAI Assistant</h2>
                  {activeConversation?.title && activeConversation.messages.length > 0 && (
                    <p className="text-xs text-slate-400 truncate max-w-[220px]">{activeConversation.title}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={newConversation}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400
                    hover:text-brand-primary hover:bg-brand-primary/10 transition-colors"
                  title="New conversation"
                >
                  <Plus size={15} />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400
                    hover:text-brand-secondary hover:bg-slate-100 transition-colors"
                  title="Close"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {messages.length === 0 ? (
                <ChatWelcome />
              ) : (
                <>
                  {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <ChatInput />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
