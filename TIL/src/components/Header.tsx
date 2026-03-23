import { Link } from "react-router-dom"
import { DarkModeToggle } from "./DarkModeToggle"

export function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="header-logo">
          <span className="header-logo-til">TIL</span>
          <span className="header-logo-sub">Today I Learned</span>
        </Link>
        <nav className="header-nav">
          <Link to="/">Posts</Link>
          <a
            href="/til/feed.xml"
            target="_blank"
            rel="noopener noreferrer"
            title="RSS Feed"
          >
            RSS
          </a>
          <a
            href="https://github.com/hire-jerry-vrabel"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <DarkModeToggle />
        </nav>
      </div>
    </header>
  )
}
