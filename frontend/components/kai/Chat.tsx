'use client'

/**
 * KAI Client — Chat
 * Source: keboola/kai-client/kai-nextjs/
 * Copy verbatim. Only modify lines marked // CUSTOMIZE:
 */

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useKaiChat } from '@/lib/kai-context'
import { SheetChatContent } from './SheetChatContent'

/**
 * Chat Sheet — renders as a flex child in sidebar mode (420px),
 * or as a full-viewport portal in fullscreen mode.
 */
export function Chat() {
  const { isOpen, layoutMode, closeChat } = useKaiChat()
  const isFullscreen = layoutMode === 'fullscreen'

  // Lock body scroll in fullscreen mode
  useEffect(() => {
    if (!isFullscreen || !isOpen) return
    document.body.style.overflow = 'hidden'
    document.documentElement.style.setProperty('scrollbar-gutter', 'stable')
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.removeProperty('scrollbar-gutter')
    }
  }, [isFullscreen, isOpen])

  if (!isOpen) return null

  // Fullscreen mode: portal to body with fixed positioning
  if (isFullscreen) {
    return createPortal(
      <>
        <div
          className="kai-sheet-overlay"
          data-state="open"
          onClick={closeChat}
        />
        <div
          className="kai-sheet flex flex-col"
          data-state="open"
          data-layout="fullscreen"
        >
          <SheetChatContent />
        </div>
      </>,
      document.body
    )
  }

  // Sidebar mode: normal flex child
  return (
    <div className="kai-sheet-inline flex flex-col">
      <SheetChatContent />
    </div>
  )
}
