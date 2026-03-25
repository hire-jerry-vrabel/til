import { useRef, useCallback } from "react"

interface SwipeHandlers {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeDown?: () => void
  onSwipeUp?: () => void
}

interface SwipeOptions {
  threshold?: number
  preventDefault?: boolean
}

export function useSwipe(
  handlers: SwipeHandlers,
  options: SwipeOptions = {}
) {
  const { threshold = 50, preventDefault = false } = options
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const touchEnd = useRef<{ x: number; y: number } | null>(null)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    }
    touchEnd.current = null
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (preventDefault) e.preventDefault()
    touchEnd.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    }
  }, [preventDefault])

  const onTouchEnd = useCallback(() => {
    if (!touchStart.current || !touchEnd.current) return

    const deltaX = touchStart.current.x - touchEnd.current.x
    const deltaY = touchStart.current.y - touchEnd.current.y
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    // Horizontal swipe — must be dominant axis
    if (absX > absY && absX > threshold) {
      if (deltaX > 0) handlers.onSwipeLeft?.()
      else handlers.onSwipeRight?.()
    }

    // Vertical swipe — must be dominant axis
    if (absY > absX && absY > threshold) {
      if (deltaY > 0) handlers.onSwipeUp?.()
      else handlers.onSwipeDown?.()
    }

    touchStart.current = null
    touchEnd.current = null
  }, [handlers, threshold])

  return { onTouchStart, onTouchMove, onTouchEnd }
}
