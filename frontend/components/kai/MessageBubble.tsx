'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ChatMessage } from '@/lib/kai-context'
import ToolApproval from './ToolApproval'
import { useKaiChat } from '@/lib/kai-context'

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
}

interface MessageBubbleProps {
  message: ChatMessage
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const { activeConversationId } = useKaiChat()
  const isUser = message.role === 'user'
  const isStreaming = message.isStreaming
  const hasContent = message.content.length > 0

  if (isUser) {
    return (
      <div className="flex justify-end mb-3">
        <div className="max-w-[85%] bg-brand-primary text-white rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-sm leading-relaxed">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start mb-3">
      <div className="max-w-[90%] bg-slate-50 border border-border rounded-2xl rounded-tl-sm px-3.5 py-2.5">
        {message.toolApproval && activeConversationId && (
          <ToolApproval
            chatId={activeConversationId}
            approvalId={message.toolApproval.approvalId}
            toolName={message.toolApproval.toolName}
          />
        )}
        {isStreaming && !hasContent ? (
          <TypingIndicator />
        ) : (
          <div className="text-sm text-brand-secondary leading-relaxed prose prose-sm max-w-none
            prose-headings:text-brand-secondary prose-a:text-brand-primary
            prose-code:bg-slate-100 prose-code:px-1 prose-code:rounded prose-code:text-xs
            prose-table:text-xs prose-th:bg-slate-100 prose-td:border-border prose-th:border-border">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
            {isStreaming && <span className="inline-block w-0.5 h-4 bg-brand-primary animate-pulse ml-0.5 align-middle" />}
          </div>
        )}
      </div>
    </div>
  )
}
