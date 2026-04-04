'use client'

import type { Conversation } from './kai-context'

const STORAGE_KEY = 'ads-sales-conversations'

export function saveConversations(conversations: Map<string, Conversation>): void {
  if (typeof window === 'undefined') return
  try {
    const arr = Array.from(conversations.values())
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr))
  } catch { /* quota exceeded or unavailable */ }
}

export function loadConversations(): Map<string, Conversation> {
  if (typeof window === 'undefined') return new Map()
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return new Map()
    const arr: Conversation[] = JSON.parse(stored)
    if (!Array.isArray(arr)) return new Map()
    return new Map(arr.map((c) => [c.id, c]))
  } catch {
    return new Map()
  }
}

export function clearConversations(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
