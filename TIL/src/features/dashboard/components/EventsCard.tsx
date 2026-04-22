import { useTheme } from '../../../context/ThemeContext'
import type { EventItem } from '../types'

interface EventsCardProps {
  events: EventItem[]
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const isToday = d.toDateString() === now.toDateString()
  const isTomorrow = d.toDateString() === tomorrow.toDateString()
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const showTime = time !== '12:00 AM'
  if (isToday) return showTime ? `Today ${time}` : 'Today'
  if (isTomorrow) return showTime ? `Tomorrow ${time}` : 'Tomorrow'
  const day = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  return showTime ? `${day} ${time}` : day
}

const CATEGORY_EMOJI: Record<string, string> = {
  'Baseball': '⚾',
  'Basketball': '🏀',
  'Football': '🏈',
  'Hockey': '🏒',
  'Soccer': '⚽',
  'Blues': '🎵',
  'Rock': '🎸',
  'Pop': '🎤',
  'Hip-Hop/Rap': '🎤',
  'R&B': '🎵',
  'Jazz': '🎷',
  'Country': '🤠',
  'Comedy': '😂',
  'Theatre': '🎭',
  'Classical': '🎻',
  'Athletics': '🏃',
  'Festival': '🎪',
  'Community': '🏘️',
  'Media': '📸',
  'Corporate': '🏢',
  'Promotion': '📢',
}

export function EventsCard({ events }: EventsCardProps) {
  const { isDark } = useTheme()
  const tmColor = isDark ? '#60a5fa' : '#2563eb'
  const parksColor = isDark ? '#34d399' : '#059669'

  return (
    <div className="dashboard__card dashboard__card--events">
      <div className="dashboard__card-header">
        <span className="dashboard__card-icon">🎟️</span>
        <h2 className="dashboard__card-title">Events</h2>
        {events.length > 0 && (
          <span className="dashboard__card-count">{events.length}</span>
        )}
      </div>
      {events.length > 0 ? (
        <div className="dashboard__card-body dashboard__card-body--scroll">
          <div className="dashboard__events-list">
            {events.map((item, i) => (
              <a              
                key={i}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="dashboard__events-row"
              >
                <div className="dashboard__events-info">
                  <span className="dashboard__events-category">
                    {CATEGORY_EMOJI[item.category] ?? '📅'}
                  </span>
                  <div className="dashboard__events-detail">
                    <span className="dashboard__events-title">{item.title}</span>
                    <div className="dashboard__events-meta">
                      {item.venue && (
                        <span className="dashboard__events-venue">{item.venue}</span>
                      )}
                      <span
                        className="dashboard__events-source"
                        style={{ color: item.source === 'Ticketmaster' ? tmColor : parksColor }}
                      >
                        {item.source}
                      </span>
                    </div>
                  </div>
                  <span className="dashboard__events-date">{formatDate(item.startDate)}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      ) : (
        <div className="dashboard__skeleton" />
      )}
    </div>
  )
}
