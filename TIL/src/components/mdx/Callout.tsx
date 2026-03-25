import type { ReactNode } from "react"

interface Props {
  type?: "info" | "warning" | "tip" | "danger"
  children: ReactNode
}

const icons = {
  info: "\u2139\ufe0f",
  warning: "\u26a0\ufe0f",
  tip: "\U0001f4a1",
  danger: "\U0001f6a8",
}

export function Callout({ type = "info", children }: Props) {
  return (
    <div className={`callout callout-${type}`}>
      <span className="callout-icon">{icons[type]}</span>
      <div className="callout-content">{children}</div>
    </div>
  )
}
