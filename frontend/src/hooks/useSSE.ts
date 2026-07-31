import { useCallback, useEffect, useRef, useState } from 'react'

import { useAuthStore } from '@/store/authStore'
import type { TaskEvent } from '@/types/models'

interface UseSSEOptions {
  onMessage?: (event: TaskEvent) => void
  onError?: (error: Event) => void
  onComplete?: () => void
  maxRetries?: number
}

export function useSSE() {
  const [connected, setConnected] = useState(false)
  const [lastEventId, setLastEventId] = useState<string | undefined>()
  const eventSourceRef = useRef<EventSource | null>(null)
  const retriesRef = useRef(0)
  const token = useAuthStore((state) => state.token)

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setConnected(false)
  }, [])

  const connect = useCallback(
    (url: string, options: UseSSEOptions = {}) => {
      const { onMessage, onError, onComplete, maxRetries = 3 } = options

      disconnect()

      const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || ''
      let fullUrl = `${baseUrl}${url}`
      if (token) {
        const separator = fullUrl.includes('?') ? '&' : '?'
        fullUrl += `${separator}token=${token}`
      }

      const es = new EventSource(fullUrl)
      eventSourceRef.current = es

      es.onopen = () => {
        setConnected(true)
        retriesRef.current = 0
      }

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as TaskEvent
          setLastEventId(data.event_id)
          onMessage?.(data)

          const eventType = data.type || data.data?.type
          if (eventType === 'complete' || eventType === 'completed' || eventType === 'error' || eventType === 'failed') {
            onComplete?.()
            disconnect()
          }
        } catch (err) {
          console.warn('SSE message parse error:', err)
        }
      }

      es.onerror = (error) => {
        setConnected(false)
        onError?.(error)

        if (retriesRef.current < maxRetries) {
          retriesRef.current += 1
          disconnect()
          setTimeout(() => connect(url, options), 1000 * retriesRef.current)
        } else {
          disconnect()
        }
      }
    },
    [token, disconnect]
  )

  useEffect(() => {
    return () => disconnect()
  }, [disconnect])

  return { connect, disconnect, connected, lastEventId }
}
