import { useState, useEffect, useRef } from "react"

interface Props {
  code: string
  language?: string
  speed?: number
  loop?: boolean
}

export function TypeWriter({ code, language = "typescript", speed = 40, loop = false }: Props) {
  const [displayed, setDisplayed] = useState("")
  const [cursor, setCursor] = useState(true)
  const [done, setDone] = useState(false)
  const indexRef = useRef(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    indexRef.current = 0
    setDisplayed("")
    setDone(false)

    const type = () => {
      if (indexRef.current < code.length) {
        setDisplayed(code.slice(0, indexRef.current + 1))
        indexRef.current++
        timeoutRef.current = setTimeout(type, speed)
      } else {
        setDone(true)
        if (loop) {
          timeoutRef.current = setTimeout(() => {
            indexRef.current = 0
            setDisplayed("")
            setDone(false)
            type()
          }, 2000)
        }
      }
    }

    timeoutRef.current = setTimeout(type, 500)
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [code, speed, loop])

  useEffect(() => {
    if (done && !loop) return
    const interval = setInterval(() => setCursor(c => !c), 530)
    return () => clearInterval(interval)
  }, [done, loop])

  return (
    <div className="typewriter-wrapper">
      <div className="typewriter-header">
        <span className="typewriter-dot" style={{ background: "#ff5f57" }} />
        <span className="typewriter-dot" style={{ background: "#febc2e" }} />
        <span className="typewriter-dot" style={{ background: "#28c840" }} />
        <span className="typewriter-lang">{language}</span>
      </div>
      <pre className="typewriter-code">
        <code>
          {displayed}
          <span className="typewriter-cursor" style={{ opacity: cursor ? 1 : 0 }}>▊</span>
        </code>
      </pre>
    </div>
  )
}
