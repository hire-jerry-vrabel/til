import { useEffect } from "react"

interface KeyboardNavOptions {
  onLeft?: () => void
  onRight?: () => void
  enabled?: boolean
}

export function useKeyboardNav({
  onLeft,
  onRight,
  enabled = true,
}: KeyboardNavOptions) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't fire if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) return

      if (e.key === "ArrowLeft") onLeft?.()
      if (e.key === "ArrowRight") onRight?.()
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onLeft, onRight, enabled])
}
