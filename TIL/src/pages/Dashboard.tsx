import { useEffect, useState, useCallback } from 'react'
import { useTheme } from '../context/ThemeContext'
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'

// ─── Types ───────────────────────────────────────────────────────────────────

interface WeatherData {
  temp: number
  feelsLike: number
  windspeed: number
  weathercode: number
  hourly: { time: string; temp: number }[]
}

interface AirQualityData {
  aqi: number
  pm25: number
  pm10: number
  ozone: number
  label: string
  color: string
}

interface SportsTeam {
  name: string
  logo: string
  score?: string
  opponent?: string
  opponentLogo?: string
  opponentScore?: string
  status: string
  detail: string
  win?: boolean
}

interface GitHubData {
  commits: number
  repos: number
  streak: number
  activity: { date: string; count: number }[]
  latestRepo: string
}

interface CTATrain {
  line: string
  destination: string
  minutes: number | string
  delayed: boolean
  isApproaching: boolean
}
interface CTAStation {
  name: string
  trains: CTATrain[]
  hasDelays: boolean
  mapTrains: CTAMapTrain[]
}
interface CTATravelConditions {
  loopToHoward: number
  condition: 'normal' | 'rush' | 'delayed'
  label: string
}
interface CTAMapTrain {
  lat: number
  lon: number
  line: string
  destination: string
  heading: string | null
}
interface AIInsight {
  text: string
  loading: boolean
}

// ─── Constants ───────────────────────────────────────────────────────────────

const LAT = 41.9981
const LNG = -87.6673
const PROXY_URL = 'https://til-proxy.hire-jerry-vrabel.workers.dev'

const WEATHER_CODES: Record<number, string> = {
  0: 'Clear', 1: 'Mostly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Icy Fog', 51: 'Light Drizzle', 53: 'Drizzle',
  55: 'Heavy Drizzle', 61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain',
  71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow', 80: 'Showers',
  95: 'Thunderstorm', 99: 'Severe Thunderstorm',
}

const AQI_LEVELS = [
  { max: 50, label: 'Good', color: '#16a34a' },
  { max: 100, label: 'Moderate', color: '#d97706' },
  { max: 150, label: 'Unhealthy for Sensitive', color: '#ea580c' },
  { max: 200, label: 'Unhealthy', color: '#dc2626' },
  { max: 300, label: 'Very Unhealthy', color: '#9333ea' },
  { max: 500, label: 'Hazardous', color: '#7f1d1d' },
]

const CHICAGO_TEAMS = [
  { sport: 'baseball', league: 'mlb', name: 'Cubs', abbr: 'CHC', fallbackLogo: 'https://a.espncdn.com/i/teamlogos/mlb/500/chc.png' },
  { sport: 'football', league: 'nfl', name: 'Bears', abbr: 'CHI', fallbackLogo: 'https://a.espncdn.com/i/teamlogos/nfl/500/chi.png' },
  { sport: 'basketball', league: 'nba', name: 'Bulls', abbr: 'CHI', fallbackLogo: 'https://a.espncdn.com/i/teamlogos/nba/500/chi.png' },
  { sport: 'hockey', league: 'nhl', name: 'Blackhawks', abbr: 'CHI', fallbackLogo: 'https://a.espncdn.com/i/teamlogos/nhl/500/chic.png' },
  { sport: 'soccer', league: 'usa.1', name: 'Fire FC', abbr: 'CHI', fallbackLogo: 'https://a.espncdn.com/i/teamlogos/soccer/500/182.png' },
  { sport: 'soccer', league: 'usa.nwsl', name: 'Stars FC', abbr: 'CHI', fallbackLogo: 'https://a.espncdn.com/i/teamlogos/soccer/500/15360.png' },
  { sport: 'basketball', league: 'wnba', name: 'Sky', abbr: 'CHI', fallbackLogo: 'https://a.espncdn.com/i/teamlogos/wnba/500/chi.png' },
]

const CTA_STATIONS = [
  { id: '40900', name: 'Howard', direction: 'Loop' },
  { id: '41190', name: 'Jarvis', direction: 'Loop' },
  { id: '40100', name: 'Morse', direction: 'Loop' },
  { id: '41300', name: 'Loyola', direction: 'Loop' },
]

// Base Red Line travel time Howard ↔ Loop (minutes)
const BASE_LOOP_HOWARD = 48

function getCTATravelConditions(stations: CTAStation[]): CTATravelConditions {
  const now = new Date()
  const hour = now.getHours()
  const day = now.getDay() // 0=Sun, 6=Sat
  const isWeekend = day === 0 || day === 6
  const isRush = !isWeekend && ((hour >= 7 && hour < 9) || (hour >= 16 && hour < 19))
  const hasDelays = stations.some(s => s.hasDelays)

  let loopToHoward = BASE_LOOP_HOWARD
  let condition: 'normal' | 'rush' | 'delayed' = 'normal'
  let label = '✓ Normal service'

  if (hasDelays) {
    loopToHoward = BASE_LOOP_HOWARD + 8
    condition = 'delayed'
    label = '⚠ Delays reported'
  } else if (isRush) {
    loopToHoward = BASE_LOOP_HOWARD + 4
    condition = 'rush'
    label = `🕐 ${hour < 12 ? 'AM' : 'PM'} Rush hour`
  }

  return { loopToHoward, condition, label }
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function getAQILevel(aqi: number) {
  return AQI_LEVELS.find(l => aqi <= l.max) ?? AQI_LEVELS[AQI_LEVELS.length - 1]
}

// ─── CTA Map ─────────────────────────────────────────────────────────────────

function CTAMap({ trains, isDark }: { trains: CTAMapTrain[], isDark: boolean }) {
  const W = 120
  const H = 200
  const TRACK_X = 40  // x position of the track line
  const PAD = 20      // padding top/bottom

  // Rogers Park stations only, north to south
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

  // Filter trains to only those between Howard and ~1 mile south of Loyola
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
      {/* Background */}
      <rect width={W} height={H} fill={bgColor} rx="6" />

      {/* Track line */}
      <line
        x1={TRACK_X} y1={PAD}
        x2={TRACK_X} y2={H - PAD}
        stroke={trackColor}
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Station stops */}
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

      {/* Live train dots */}
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


// ─── Dashboard ───────────────────────────────────────────────────────────────

export function Dashboard() {
  const { isDark } = useTheme()
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null)
  const [sports, setSports] = useState<SportsTeam[]>([])
  const [github, setGithub] = useState<GitHubData | null>(null)
  const [cta, setCta] = useState<CTAStation[]>([])
  const [mapTrains, setMapTrains] = useState<CTAMapTrain[]>([])
  const [insight, setInsight] = useState<AIInsight>({ text: '', loading: false })
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchWeather = async () => {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LNG}&current=temperature_2m,apparent_temperature,wind_speed_10m,weather_code&hourly=temperature_2m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America/Chicago&forecast_days=1`
    )
    const data = await res.json()
    const hourly = data.hourly.time.slice(0, 24).map((t: string, i: number) => ({
      time: new Date(t).getHours() + ':00',
      temp: Math.round(data.hourly.temperature_2m[i]),
    }))
    setWeather({
      temp: Math.round(data.current.temperature_2m),
      feelsLike: Math.round(data.current.apparent_temperature),
      windspeed: Math.round(data.current.wind_speed_10m),
      weathercode: data.current.weather_code,
      hourly,
    })
  }

  const fetchAirQuality = async () => {
    const res = await fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${LAT}&longitude=${LNG}&current=us_aqi,pm2_5,pm10,ozone`
    )
    const data = await res.json()
    const aqi = Math.round(data.current.us_aqi)
    const level = getAQILevel(aqi)
    setAirQuality({
      aqi,
      pm25: Math.round(data.current.pm2_5 * 10) / 10,
      pm10: Math.round(data.current.pm10 * 10) / 10,
      ozone: Math.round(data.current.ozone * 10) / 10,
      label: level.label,
      color: level.color,
    })
  }

  const fetchSports = async () => {
    const results = await Promise.allSettled(
      CHICAGO_TEAMS.map(async team => {
        const res = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/${team.sport}/${team.league}/scoreboard`
        )
        const data = await res.json()
        const event = data.events?.find((e: any) =>
          e.competitions?.[0]?.competitors?.some((c: any) =>
            c.team.abbreviation === team.abbr
          )
        )
        if (!event) return { name: team.name, logo: team.fallbackLogo, status: 'No game scheduled', detail: '' }
        const comp = event.competitions[0]
        const home = comp.competitors.find((c: any) => c.homeAway === 'home')
        const away = comp.competitors.find((c: any) => c.homeAway === 'away')
        const isChicago = home?.team.abbreviation === team.abbr
        const chicago = isChicago ? home : away
        const opponent = isChicago ? away : home
        return {
          name: team.name,
          logo: chicago?.team.logo ?? '',
          score: chicago?.score,
          opponent: opponent?.team.displayName,
          opponentLogo: opponent?.team.logo,
          opponentScore: opponent?.score,
          status: comp.status.type.shortDetail?.replace('EDT', 'CDT').replace('EST', 'CST') ?? '',
          detail: isChicago ? 'vs' : '@',
          win: comp.status.type.completed
            ? parseInt(chicago?.score ?? '0') > parseInt(opponent?.score ?? '0')
            : undefined,
        }
      })
    )
    const mapped = results.map((r, i) =>
      r.status === 'fulfilled' ? r.value : { name: CHICAGO_TEAMS[i].name, logo: '', status: 'Unavailable', detail: '' }
    )
    // Sort: live games first, then upcoming by time, then completed, then no game/unavailable
    const sorted = mapped.sort((a, b) => {
      const priority = (t: SportsTeam) => {
        if (t.status === 'No game scheduled' || t.status === 'Unavailable') return 3
        if (t.score !== undefined && t.win === undefined) return 0 // live
        if (t.score !== undefined) return 2 // completed
        return 1 // upcoming
      }
      const pa = priority(a)
      const pb = priority(b)
      if (pa !== pb) return pa - pb
      return a.status.localeCompare(b.status)
    })
    setSports(sorted)
  }

  const fetchGitHub = async () => {
    const [userRes, eventsRes] = await Promise.all([
      fetch('https://api.github.com/users/hire-jerry-vrabel'),
      fetch('https://api.github.com/users/hire-jerry-vrabel/events/public?per_page=100'),
    ])
    const user = await userRes.json()
    const events = await eventsRes.json()

    // Build last 30 days activity
    const activity: Record<string, number> = {}
    const now = new Date()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      activity[d.toISOString().split('T')[0]] = 0
    }
    let commits = 0
    events.forEach((e: any) => {
      if (e.type === 'PushEvent') {
        const date = e.created_at.split('T')[0]
        if (activity[date] !== undefined) {
          activity[date] += e.payload.commits?.length ?? 1
          commits += e.payload.commits?.length ?? 1
        }
      }
    })

    // Calculate streak
    const days = Object.keys(activity).sort().reverse()
    let streak = 0
    for (const day of days) {
      if (activity[day] > 0) streak++
      else break
    }

    const latestPush = events.find((e: any) => e.type === 'PushEvent')
    setGithub({
      commits,
      repos: user.public_repos,
      streak,
      activity: Object.entries(activity).map(([date, count]) => ({
        date: date.slice(5),
        count,
      })),
      latestRepo: latestPush?.repo?.name?.replace('hire-jerry-vrabel/', '') ?? '',
    })
  }

  const fetchCTA = async () => {
    // Fetch station arrivals via proxy
    const results = await Promise.allSettled(
      CTA_STATIONS.map(async station => {
        const res = await fetch(
          `${PROXY_URL}/cta/arrivals?mapid=${station.id}`
        )
        const data = await res.json()
        const etas = data.ctatt?.eta ?? []
        const trains: CTATrain[] = etas.slice(0, 3).map((e: any) => {
          const arrT = new Date(e.arrT)
          const now = new Date()
          const mins = Math.round((arrT.getTime() - now.getTime()) / 60000)
          return {
            line: e.rt.toLowerCase(),
            destination: e.destNm,
            minutes: mins <= 1 ? 'Due' : mins,
            delayed: e.isDly === '1',
            isApproaching: e.isApp === '1',
          }
        })
        const hasDelays = trains.some(t => t.delayed)
        const mapTrains: CTAMapTrain[] = etas
          .filter((e: any) => {
            const lat = parseFloat(e.lat)
            const lon = parseFloat(e.lon)
            return e.lat && e.lon && !isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0
          })
          .map((e: any) => ({
            lat: parseFloat(e.lat),
            lon: parseFloat(e.lon),
            line: e.rt.toLowerCase(),
            destination: e.destNm,
            heading: e.heading,
          }))
        return { name: station.name, trains, hasDelays, mapTrains }
      })
    )
    const stations = results
      .map((r, i) => r.status === 'fulfilled' ? r.value : { name: CTA_STATIONS[i].name, trains: [], hasDelays: false, mapTrains: [] })
    setCta(stations)

    // Fetch live train positions via proxy
    try {
      const posRes = await fetch(
        `${PROXY_URL}/cta/positions?rt=red`
      )
      const posData = await posRes.json()
      const routes = posData.ctatt?.route ?? []
      const posTrains: CTAMapTrain[] = routes
        .flatMap((r: any) => r.train ?? [])
        .filter((t: any) => {
          const lat = parseFloat(t.lat)
          const lon = parseFloat(t.lon)
          return !isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0
        })
        .map((t: any) => ({
          lat: parseFloat(t.lat),
          lon: parseFloat(t.lon),
          line: 'red',
          destination: t.destNm ?? '',
          heading: t.heading ?? null,
        }))
      setMapTrains(posTrains)
    } catch {
      // Fall back to station-derived positions from arrivals data
      const allMapTrains = Array.from(
        new Map(
          stations
            .flatMap(s => s.mapTrains)
            .map(t => [`${t.lat}-${t.lon}`, t])
        ).values()
      )
      setMapTrains(allMapTrains)
    }
  }

  const fetchInsight = useCallback(async (
    w: WeatherData | null,
    aq: AirQualityData | null,
    s: SportsTeam[],
    g: GitHubData | null
  ) => {
    if (!w || !aq || !g) return
    setInsight({ text: '', loading: true })

    const context = `
      Weather in Rogers Park, Chicago: ${w.temp}°F, feels like ${w.feelsLike}°F, ${WEATHER_CODES[w.weathercode] ?? 'Unknown'}, wind ${w.windspeed}mph.
      Air quality: AQI ${aq.aqi} (${aq.label}), PM2.5: ${aq.pm25}, PM10: ${aq.pm10}.
      GitHub activity (last 30 days): ${g.commits} commits, ${g.streak} day streak, latest repo: ${g.latestRepo}.
      Chicago sports today: ${s.map(t => `${t.name}: ${t.status}`).join('; ')}.
    `.trim()

    try {
      const res = await fetch(`${PROXY_URL}/ai/insight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 150,
          system: 'You are a witty, concise data analyst. Generate exactly 2-3 sentences summarizing the data with a clever cross-domain observation. Be specific with numbers. Mention Rogers Park or Chicago naturally. Keep it under 60 words.',
          messages: [{ role: 'user', content: context }],
        }),
      })
      const data = await res.json()
      setInsight({ text: data.content?.[0]?.text ?? '', loading: false })
    } catch {
      setInsight({ text: '', loading: false })
    }
  }, [])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    await Promise.allSettled([
      fetchWeather(),
      fetchAirQuality(),
      fetchSports(),
      fetchGitHub(),
      fetchCTA(),
    ])
    setLastUpdated(new Date())
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchAll])

  // Fire AI insight after data loads
  useEffect(() => {
    if (!loading && weather && airQuality && github) {
      fetchInsight(weather, airQuality, sports, github)
    }
  }, [loading, weather, airQuality, github, sports, fetchInsight])

  const chartColor = isDark ? '#6366f1' : '#3178c6'
  const gridColor = isDark ? '#1e293b' : '#f1f5f9'
  const textColor = isDark ? '#94a3b8' : '#64748b'

  return (
    <main className="dashboard">
      <div className="dashboard__hero">
        <div>
          <h1 className="dashboard__title">Rogers Park Dashboard</h1>
          <p className="dashboard__subtitle">
            Live data from Rogers Park, Chicago · 60626
          </p>
        </div>
        <div className="dashboard__meta">
          <button className="dashboard__refresh" onClick={fetchAll} disabled={loading}>
            {loading ? '⟳' : '↺'} Refresh
          </button>
          {lastUpdated && (
            <span className="dashboard__updated">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* AI Insight */}
      {(insight.text || insight.loading) && (
        <div className="dashboard__insight">
          <span className="dashboard__insight-icon">🤖</span>
          {insight.loading ? (
            <span className="dashboard__insight-loading">Generating insight…</span>
          ) : (
            <p className="dashboard__insight-text">{insight.text}</p>
          )}
        </div>
      )}

      <div className="dashboard__grid">

        {/* Weather */}
        <div className="dashboard__card dashboard__card--weather">
          <div className="dashboard__card-header">
            <span className="dashboard__card-icon">🌤</span>
            <h2 className="dashboard__card-title">Weather</h2>
            <span className="dashboard__card-sub">Rogers Park</span>
          </div>
          {weather ? (
            <>
              <div className="dashboard__weather-main">
                <span className="dashboard__weather-temp">{weather.temp}°F</span>
                <div className="dashboard__weather-detail">
                  <span>{WEATHER_CODES[weather.weathercode] ?? 'Unknown'}</span>
                  <span>Feels like {weather.feelsLike}°F</span>
                  <span>Wind {weather.windspeed} mph</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={80}>
                <AreaChart data={weather.hourly} margin={{ top: 4, right: 4, left: -32, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: textColor }} interval={5} />
                  <YAxis tick={{ fontSize: 10, fill: textColor }} />
                  <Tooltip
                    contentStyle={{ background: isDark ? '#0f172a' : '#fff', border: 'none', fontSize: 12 }}
                    formatter={(v) => [`${(v as number)}°F`, "Temp"]}
                  />
                  <Area type="monotone" dataKey="temp" stroke={chartColor} fill="url(#tempGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </>
          ) : (
            <div className="dashboard__skeleton" />
          )}
        </div>

        {/* Air Quality */}
        <div className="dashboard__card dashboard__card--air">
          <div className="dashboard__card-header">
            <span className="dashboard__card-icon">💨</span>
            <h2 className="dashboard__card-title">Air Quality</h2>
            <span className="dashboard__card-sub">Rogers Park</span>
          </div>
          {airQuality ? (
            <>
              <div className="dashboard__aqi-main">
                <span className="dashboard__aqi-value" style={{ color: airQuality.color }}>
                  {airQuality.aqi}
                </span>
                <span className="dashboard__aqi-label" style={{ color: airQuality.color }}>
                  {airQuality.label}
                </span>
              </div>
              <div className="dashboard__aqi-details">
                <div className="dashboard__aqi-stat">
                  <span>PM2.5</span><strong>{airQuality.pm25}</strong>
                </div>
                <div className="dashboard__aqi-stat">
                  <span>PM10</span><strong>{airQuality.pm10}</strong>
                </div>
                <div className="dashboard__aqi-stat">
                  <span>Ozone</span><strong>{airQuality.ozone}</strong>
                </div>
              </div>
              <div className="dashboard__aqi-bar">
                <div
                  className="dashboard__aqi-bar-fill"
                  style={{
                    width: `${Math.min(airQuality.aqi / 300 * 100, 100)}%`,
                    background: airQuality.color,
                  }}
                />
              </div>
            </>
          ) : (
            <div className="dashboard__skeleton" />
          )}
        </div>

        {/* GitHub */}
        <div className="dashboard__card dashboard__card--github">
          <div className="dashboard__card-header">
            <span className="dashboard__card-icon">👨‍💻</span>
            <h2 className="dashboard__card-title">GitHub Activity</h2>
            <span className="dashboard__card-sub">hire-jerry-vrabel</span>
          </div>
          {github ? (
            <>
              <div className="dashboard__github-stats">
                <div className="dashboard__github-stat">
                  <strong>{github.commits}</strong>
                  <span>Commits (30d)</span>
                </div>
                <div className="dashboard__github-stat">
                  <strong>{github.streak}</strong>
                  <span>Day Streak</span>
                </div>
                <div className="dashboard__github-stat">
                  <strong>{github.repos}</strong>
                  <span>Public Repos</span>
                </div>
              </div>
              {github.latestRepo && (
                <div className="dashboard__github-latest">
                  Latest: <strong>{github.latestRepo}</strong>
                </div>
              )}
              <ResponsiveContainer width="100%" height={60}>
                <LineChart data={github.activity} margin={{ top: 4, right: 4, left: -32, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: textColor }} interval={6} />
                  <YAxis tick={{ fontSize: 9, fill: textColor }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: isDark ? '#0f172a' : '#fff', border: 'none', fontSize: 12 }}
                    formatter={(v) => [v as number, "Commits"]}
                  />
                  <Line type="monotone" dataKey="count" stroke={chartColor} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </>
          ) : (
            <div className="dashboard__skeleton" />
          )}
        </div>

        {/* Chicago Sports */}
        <div className="dashboard__card dashboard__card--sports">
          <div className="dashboard__card-header">
            <span className="dashboard__card-icon">🏆</span>
            <h2 className="dashboard__card-title">Chicago Sports</h2>
            <span className="dashboard__card-sub">Today</span>
          </div>
          {sports.length > 0 ? (
            <div className="dashboard__sports-list">
              {sports.map((team, i) => (
                <div key={i} className="dashboard__sport-row">
                  <div className="dashboard__sport-team">
                    {team.logo && <img src={team.logo} alt={team.name} className="dashboard__sport-logo" />}
                    <span className="dashboard__sport-name">{team.name}</span>
                  </div>
                  <div className="dashboard__sport-result">
                    {team.score !== undefined ? (
                      <span className={`dashboard__sport-score${team.win === true ? ' dashboard__sport-score--win' : team.win === false ? ' dashboard__sport-score--loss' : ''}`}>
                        {team.score} {team.detail} {team.opponentScore}
                      </span>
                    ) : null}
                    <span className="dashboard__sport-status">{team.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="dashboard__skeleton" />
          )}
        </div>

        {/* CTA Red Line */}
        <div className="dashboard__card dashboard__card--cta">
          <div className="dashboard__card-header">
            <span className="dashboard__card-icon">🚉</span>
            <h2 className="dashboard__card-title">Red Line</h2>
            <span className="dashboard__card-sub">{mapTrains.length > 0 ? `${mapTrains.length} trains live` : 'Rogers Park'}</span>
          </div>
          {cta.length > 0 ? (
            <>
              <div className="dashboard__cta-panel">
                <CTAMap trains={mapTrains} isDark={isDark} />
                <div className="dashboard__cta-panel-arrivals">
                  <div className="dashboard__cta-stations">
                    {cta.map((station, i) => (
                      <div key={i} className="dashboard__cta-station">
                        <div className="dashboard__cta-station-name">{station.name}</div>
                        {station.trains.length > 0 ? (
                          <div className="dashboard__cta-trains">
                            {station.trains.slice(0, 2).map((train, j) => (
                              <div key={j} className="dashboard__cta-train">
                                <span className={`dashboard__cta-line dashboard__cta-line--${train.line}`}>
                                  {train.line}
                                </span>
                                <span className="dashboard__cta-dest">{train.destination}</span>
                                <span className={`dashboard__cta-time${train.delayed ? ' dashboard__cta-time--delayed' : ''}${train.isApproaching ? ' dashboard__cta-time--approaching' : ''}`}>
                                  {train.minutes === 'Due' ? 'Due' : `${train.minutes}m`}
                                  {train.delayed && ' ⚠'}
                                  {train.isApproaching && !train.delayed && ' →'}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="dashboard__cta-trains">
                            <div className="dashboard__cta-train dashboard__cta-train--sched">
                              <span className="dashboard__cta-line dashboard__cta-line--red">Red</span>
                              <span className="dashboard__cta-dest">Scheduled</span>
                              <span className="dashboard__cta-time">~</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {(() => {
                const conditions = getCTATravelConditions(cta)
                return (
                  <div className={`dashboard__cta-travel-times dashboard__cta-travel-times--${conditions.condition}`}>
                    <div className="dashboard__cta-travel-time">
                      <span className="dashboard__cta-travel-label">Loop ↔ Howard</span>
                      <span className="dashboard__cta-travel-value">~{conditions.loopToHoward} min</span>
                    </div>
                    <div className="dashboard__cta-travel-divider" />
                    <div className="dashboard__cta-travel-condition">
                      <span className="dashboard__cta-condition-label">{conditions.label}</span>
                    </div>
                  </div>
                )
              })()}
            </>
          ) : (
            <div className="dashboard__skeleton" />
          )}
        </div>

      </div>
    </main>
  )
}
