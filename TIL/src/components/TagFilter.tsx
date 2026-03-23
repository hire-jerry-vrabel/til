interface Props {
  tags: string[]
  activeTag: string | null
  onTagClick: (tag: string | null) => void
}

export function TagFilter({ tags, activeTag, onTagClick }: Props) {
  return (
    <div className="tag-filter">
      <button
        className={`tag ${activeTag === null ? 'tag-active' : ''}`}
        onClick={() => onTagClick(null)}
      >
        All
      </button>
      {tags.map(tag => (
        <button
          key={tag}
          className={`tag ${activeTag === tag ? 'tag-active' : ''}`}
          onClick={() => onTagClick(activeTag === tag ? null : tag)}
        >
          {tag}
        </button>
      ))}
    </div>
  )
}
