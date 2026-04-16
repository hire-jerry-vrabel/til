import type { CTAMapTrain } from '../types'

interface CTAMapProps {
  trains: CTAMapTrain[]
  isDark: boolean
}

export function CTAMap({ trains, isDark }: CTAMapProps) {
  const W = 120
  const H = 200
  const TRACK_X = 40
  const PAD = 20

  const STOPS = [
    { name: 'Howard', lat: 42.01900 },
    { name: 'Jarvis', lat: 41.99751 },
    { name: 'Morse',  lat: 41.98521 },
    { name: 'Loyola', lat: 41.96980 },
  ]

  const MAX_LAT = STOPS[0].lat
  const MIN_LAT = STOPS[STOPS.length - 1].lat

  function latToY(lat: number): number {
    return PAD + ((MAX_LAT - lat) / (MAX_LAT - MIN_LAT)) * (H - PAD * 2)
  }

  const trackColor = '#c60c30'
  const bgColor = isDark ? '#0a0f1e' : '#f8fafc'
  const labelColor = isDark ? '#e2e8f0' : '#1e293b'
  const stationBg = isDark ? '#0a0f1e' : '#fff'

  const lineColor: Record<string, string> = {
    red: '#c60c30',
    p: '#522398',
    purple: '#522398',
    y: '#f9e300',
  }

  const visibleTrains = trains.filter(t =>
    t.lat >= MIN_LAT - 0.01 && t.lat <= MAX_LAT + 0.01
  )

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="dashboard__cta-map"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Red Line Rogers Park trains"
    >
      <rect width={W} height={H} fill={bgColor} rx="6" />
      <line
        x1={TRACK_X} y1={PAD}
        x2={TRACK_X} y2={H - PAD}
        stroke={trackColor}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {STOPS.map(stop => {
        const y = latToY(stop.lat)
        return (
          <g key={stop.name}>
            <circle cx={TRACK_X} cy={y} r={5} fill={trackColor} stroke={stationBg} strokeWidth="2" />
            <text x={TRACK_X + 12} y={y + 4} fontSize="11" fill={labelColor} fontWeight="600" fontFamily="sans-serif">
              {stop.name}
            </text>
          </g>
        )
      })}
      {visibleTrains.map((train, i) => {
        const y = latToY(train.lat)
        const color = lineColor[train.line] ?? '#c60c30'
        const label = train.line === 'red' ? 'R' : train.line === 'p' || train.line === 'purple' ? 'P' : 'Y'
        return (
          <g key={i}>
            <circle cx={TRACK_X} cy={y} r={10} fill={color} stroke={stationBg} strokeWidth="2" opacity="0.95" />
            <text x={TRACK_X} y={y + 4} fontSize="9" fill="#fff" textAnchor="middle" fontWeight="800" fontFamily="sans-serif">
              {label}
            </text>
          </g>
        )
      })}
      {visibleTrains.length === 0 && (
        <text x={TRACK_X + 14} y={H / 2} fontSize="9" fill={labelColor} fontFamily="sans-serif" opacity="0.6">
          No live data
        </text>
      )}
    </svg>
  )
}
