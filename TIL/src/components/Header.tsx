import { useState } from 'react'
import { Link } from "react-router-dom"
import { DarkModeToggle } from "./DarkModeToggle"

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  
  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="header-logo" onClick={() => setMenuOpen(false)}>
          <span className="header-logo-til">TIL</span>
          <span className="header-logo-sub">Today I Learned</span>
        </Link>
        <button
          className={`header-hamburger${menuOpen ? ' header-hamburger--open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className="header-hamburger-line" />
          <span className="header-hamburger-line" />
          <span className="header-hamburger-line" />
        </button>
        <nav className={`header-nav${menuOpen ? ' header-nav--open' : ''}`}>
          <Link to="/" onClick={() => setMenuOpen(false)}>Posts</Link>
          <Link to="/bash" onClick={() => setMenuOpen(false)}>Bash 🐾</Link>
          <Link to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
          <a
            href="https://hire-jerry-vrabel.github.io/til/feed.xml"
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
