interface Props {
  query: string
  onChange: (query: string) => void
}

export function SearchBar({ query, onChange }: Props) {
  return (
    <div className="search-bar">
      <span className="search-icon">🔍</span>
      <input
        type="text"
        className="search-input"
        placeholder="Search posts..."
        value={query}
        onChange={e => onChange(e.target.value)}
        aria-label="Search posts"
      />
      {query && (
        <button
          className="search-clear"
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  )
}
