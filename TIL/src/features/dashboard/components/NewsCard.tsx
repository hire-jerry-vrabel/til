import { useTheme } from '../../../context/ThemeContext'
import type { NewsItem } from '../types'

interface NewsCardProps {
  news: NewsItem[]
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return ''
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMin = Math.floor((now - then) / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
}

const SOURCE_EMOJI: Record<string, string> = {
  'Google News': '🔍',
  'Block Club Chicago': '🏘️',
  'WTTW': '📺',
  'Chicago Sun-Times': '📰',
  'Chicago Reader': '📖',
}

export function NewsCard({ news }: NewsCardProps) {
  const { isDark } = useTheme()
  const neighborhoodColor = isDark ? '#34d399' : '#059669'
  const cityColor = isDark ? '#60a5fa' : '#2563eb'

  return (
    <div className="dashboard__card dashboard__card--news">
      <div className="dashboard__card-header">
        <span className="dashboard__card-icon">📰</span>
        <h2 className="dashboard__card-title">Chicago News</h2>
        <span className="dashboard__card-sub">Rogers Park &amp; Chicago</span>
      </div>
      {news.length > 0 ? (
        <div className="dashboard__news-list">
          {news.map((item, i) => (
            <a 
              key={i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="dashboard__news-row"
            >
              <div className="dashboard__news-headline">
                <span className="dashboard__news-title">{item.title}</span>
                <div className="dashboard__news-meta">
                  <span
                    className="dashboard__news-locality"
                    style={{ color: item.locality === 'neighborhood' ? neighborhoodColor : cityColor }}
                  >
                    {item.locality === 'neighborhood' ? '📍 Local' : '🏙️ Chicago'}
                  </span>
                  <span className="dashboard__news-source">
                    {SOURCE_EMOJI[item.source] ?? '📰'} {item.source}
                  </span>
                  {item.publishedAt && (
                    <span className="dashboard__news-time">{timeAgo(item.publishedAt)}</span>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="dashboard__skeleton" />
      )}
    </div>
  )
}
