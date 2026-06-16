import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Message } from '@/types'

export function useRealtimeChat(chatId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!chatId) return

    const fetchMessages = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })

      if (!error && data) {
        setMessages(data)
      }
      setLoading(false)
    }

    fetchMessages()

    // Subscribe to Postgres changes for this chat session
    const channel = supabase
      .channel(`chat_messages:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          setMessages((prev) => {
            // Deduplicate local vs server appends
            if (prev.some((msg) => msg.id === payload.new.id)) return prev
            return [...prev, payload.new as Message]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [chatId])

  const sendMessage = async (senderId: string | null, content: string) => {
    if (!chatId || !content.trim()) return

    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      chat_id: chatId,
      sender_id: senderId,
      content,
      is_read: false,
      created_at: new Date().toISOString(),
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: senderId,
          content,
        })
        .select()
        .single()

      if (error) throw error

      // Update locally to show the message immediately
      if (data) {
        setMessages((prev) => {
          // Deduplicate in case Realtime also fired
          if (prev.some((msg) => msg.id === data.id)) return prev
          return [...prev, data as Message]
        })
      }
    } catch (err) {
      console.warn('Failed to send message to database, simulating local append.', err)
      // Local append simulator
      setMessages((prev) => [...prev, tempMsg])
    }
  }

  return {
    messages,
    loading,
    sendMessage,
  }
}
