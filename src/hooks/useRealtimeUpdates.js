import { useEffect, useRef, useState } from 'react'

export function useRealtimeUpdates(eventHandlers = {}) {
  const [isConnected, setIsConnected] = useState(false)
  const eventSourceRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)
  const eventHandlersRef = useRef(eventHandlers)

  useEffect(() => {
    eventHandlersRef.current = eventHandlers
  }, [eventHandlers])

  useEffect(() => {
    let isMounted = true

    const connect = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }

      const eventSource = new EventSource('/api/events')
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        if (isMounted) {
          console.log('SSE Connected')
          setIsConnected(true)
          reconnectAttemptsRef.current = 0
        }
      }

      eventSource.onmessage = (event) => {
        if (!isMounted) return

        try {
          const data = JSON.parse(event.data)
          
          // Handle connection message
          if (data.type === 'connected') {
            console.log('Real-time updates active:', data.message)
            return
          }

          // Call specific handler for this event type
          const handler = eventHandlersRef.current[data.type]
          if (handler && typeof handler === 'function') {
            handler(data.data, data.timestamp)
          }

          // Call generic onUpdate handler
          if (eventHandlersRef.current.onUpdate && typeof eventHandlersRef.current.onUpdate === 'function') {
            eventHandlersRef.current.onUpdate(data)
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error)
        }
      }

      eventSource.onerror = (error) => {
        console.error('SSE Error:', error)
        eventSource.close()
        
        if (isMounted) {
          setIsConnected(false)
          
          // Exponential backoff for reconnection
          const maxAttempts = 10
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
          
          if (reconnectAttemptsRef.current < maxAttempts) {
            reconnectAttemptsRef.current += 1
            console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`)
            
            reconnectTimeoutRef.current = setTimeout(() => {
              if (isMounted) {
                connect()
              }
            }, delay)
          } else {
            console.error('Max reconnection attempts reached')
            if (eventHandlersRef.current.onMaxReconnectAttempts) {
              eventHandlersRef.current.onMaxReconnectAttempts()
            }
          }
        }
      }
    }

    connect()

    return () => {
      isMounted = false
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [])

  return { isConnected }
}
