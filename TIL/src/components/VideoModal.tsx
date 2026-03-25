import { useEffect, useCallback } from "react"
import { useSwipe } from "../hooks/useSwipe"

interface Props {
  src: string
  type: "youtube" | "vimeo" | "local"
  title: string
  onClose: () => void
}

export function VideoModal({ src, type, title, onClose }: Props) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose()
  }, [onClose])

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [handleKeyDown])

  const swipeHandlers = useSwipe({
    onSwipeDown: onClose,
  })

  const getEmbedUrl = () => {
    if (type === "youtube") {
      return `https://www.youtube.com/embed/${src}?autoplay=1&rel=0`
    }
    if (type === "vimeo") {
      return `https://player.vimeo.com/video/${src}?autoplay=1`
    }
    return src
  }

  return (
    <div
      className="video-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      {...swipeHandlers}
    >
      <div
        className="video-modal-container"
        onClick={e => e.stopPropagation()}
      >
        <button
          className="video-modal-close"
          onClick={onClose}
          aria-label="Close video"
        >
          ✕
        </button>
        <p className="video-modal-hint">Swipe down or press Esc to close</p>
        <div className="video-modal-player">
          {type === "local" ? (
            <video
              controls
              autoPlay
              className="video-modal-native"
            >
              <source src={src} />
              Your browser does not support the video tag.
            </video>
          ) : (
            <iframe
              src={getEmbedUrl()}
              title={title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>
      </div>
    </div>
  )
}
