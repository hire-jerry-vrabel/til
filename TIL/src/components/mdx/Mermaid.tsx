import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../../context/ThemeContext'

interface MermaidProps {
  chart: string
  caption?: string
}

let mermaidLoadPromise: Promise<typeof import('mermaid')> | null = null

function loadMermaid() {
  if (!mermaidLoadPromise) {
    mermaidLoadPromise = import('mermaid')
  }
  return mermaidLoadPromise
}

let idCounter = 0

export function Mermaid({ chart, caption }: MermaidProps) {
  const { isDark } = useTheme()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string>('')
  const idRef = useRef<string>(`mermaid-${++idCounter}`)

  useEffect(() => {
    let cancelled = false

    async function render() {
      setSvg('')
      setError('')

      try {
        const { default: mermaid } = await loadMermaid()

        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? 'dark' : 'default',
          securityLevel: 'loose',
          fontFamily: 'inherit',
        })

        const { svg: renderedSvg } = await mermaid.render(
          idRef.current,
          chart.trim()
        )

        if (!cancelled) setSvg(renderedSvg)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err))
        }
      }
    }

    render()
    return () => { cancelled = true }
  }, [chart, isDark])

  return (
    <figure className="mermaid-diagram">
      {error ? (
        <div className="mermaid-diagram__error">
          <span className="mermaid-diagram__error-icon">⚠</span>
          <pre>{error}</pre>
        </div>
      ) : svg ? (
        <div
          ref={containerRef}
          className="mermaid-diagram__svg"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div className="mermaid-diagram__loading">
          <span className="mermaid-diagram__spinner" />
          Rendering diagram…
        </div>
      )}
      {caption && (
        <figcaption className="mermaid-diagram__caption">{caption}</figcaption>
      )}
    </figure>
  )
}
