import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"

// GitHub Pages SPA redirect handler
const params = new URLSearchParams(window.location.search)
const redirect = params.get("redirect")
if (redirect) {
  const url = new URL(window.location.href)
  url.pathname = "/til" + redirect
  url.searchParams.delete("redirect")
  window.history.replaceState(null, "", url.pathname + url.search + url.hash)
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
