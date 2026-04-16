import { useEffect, useState, useCallback } from 'react'
import { useTheme } from '../context/ThemeContext'
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import type {
  WeatherData, AirQualityData, SportsTeam, GitHubData,
  CTATrain, CTAStation, CTATravelConditions, CTAMapTrain, AIInsight,
  ESPNCompetitor, ESPNEvent, CTAEta, CTAPositionTrain,
} from '../features/dashboard/types'
import { CTAMap } from '../features/dashboard/components/CTAMap'
import { useAirQuality } from '../features/dashboard/hooks/useAirQuality'
import { PROXY_URL } from '../features/dashboard/constants'
import { useWeather, WEATHER_CODES, WEATHER_EMOJI } from '../features/dashboard/hooks/useWeather'
import { useGitHub } from '../features/dashboard/hooks/useGitHub'

// ─── Constants ───────────────────────────────────────────────────────────────

const CHICAGO_TEAMS = [
  { sport: 'baseball', league: 'mlb', name: 'Cubs', abbr: 'CHC', fallbackLogo: 'https://a.espncdn.com/i/teamlogos/mlb/500/chc.png' },
  { sport: 'baseball', league: 'mlb', name: 'White Sox', abbr: 'CHW', fallbackLogo: 'https://a.espncdn.com/i/teamlogos/mlb/500/chw.png' },
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
  const day = now.getDay()
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


// ─── Dashboard ───────────────────────────────────────────────────────────────

export function Dashboard() {
  const { isDark } = useTheme()
  const { weather, fetchWeather } = useWeather()
  const { airQuality, fetchAirQuality } = useAirQuality()
  const [sports, setSports] = useState<SportsTeam[]>([])
  const { github, fetchGitHub } = useGitHub()
  const [cta, setCta] = useState<CTAStation[]>([])
  const [mapTrains, setMapTrains] = useState<CTAMapTrain[]>([])
  const [insight, setInsight] = useState<AIInsight>({ text: '', loading: false })
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)


  const fetchSports = async () => {
    const results = await Promise.allSettled(
      CHICAGO_TEAMS.map(async team => {
        const res = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/${team.sport}/${team.league}/scoreboard`
        )
        const data = await res.json() as { events?: ESPNEvent[] }
        const event = data.events?.find((e: ESPNEvent) =>
          e.competitions?.[0]?.competitors?.some((c: ESPNCompetitor) =>
            c.team.abbreviation === team.abbr
          )
        )
        if (!event) return { name: team.name, logo: team.fallbackLogo, status: 'No game scheduled', detail: '' }
        const comp = event.competitions[0]
        const home = comp.competitors.find((c: ESPNCompetitor) => c.homeAway === 'home')
        const away = comp.competitors.find((c: ESPNCompetitor) => c.homeAway === 'away')
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
    const sorted = mapped.sort((a, b) => {
      const priority = (t: SportsTeam) => {
        if (t.status === 'No game scheduled' || t.status === 'Unavailable') return 3
        // Live games have in-progress indicators like "Top 4th", "3rd Quarter", etc.
        const isLive = t.score !== undefined && !t.status.includes('/') && !t.status.includes('PM') && !t.status.includes('AM') && t.win === undefined
        if (isLive) return 0
        if (t.score !== undefined && t.win !== undefined) return 2 // completed
        return 1 // upcoming
      }
      const pa = priority(a)
      const pb = priority(b)
      if (pa !== pb) return pa - pb
      return a.status.localeCompare(b.status)
    })
    setSports(sorted)
  }

  const fetchCTA = async () => {
    const results = await Promise.allSettled(
      CTA_STATIONS.map(async station => {
        const res = await fetch(
          `${PROXY_URL}/cta/arrivals?mapid=${station.id}`
        )
        const data = await res.json() as { ctatt?: { eta?: CTAEta[] } }
        const etas = data.ctatt?.eta ?? []
        const trains: CTATrain[] = etas.slice(0, 3).map((e: CTAEta) => {
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
          .filter((e: CTAEta) => {
            const lat = parseFloat(e.lat)
            const lon = parseFloat(e.lon)
            return e.lat && e.lon && !isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0
          })
          .map((e: CTAEta) => ({
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

    try {
      const posRes = await fetch(
        `${PROXY_URL}/cta/positions?rt=red`
      )
      const posData = await posRes.json() as { ctatt?: { route?: { train?: CTAPositionTrain[] }[] } }
      const routes = posData.ctatt?.route ?? []
      const posTrains: CTAMapTrain[] = routes
        .flatMap((r: { train?: CTAPositionTrain[] }) => r.train ?? [])
        .filter((t: CTAPositionTrain) => {
          const lat = parseFloat(t.lat)
          const lon = parseFloat(t.lon)
          return !isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0
        })
        .map((t: CTAPositionTrain) => ({
          lat: parseFloat(t.lat),
          lon: parseFloat(t.lon),
          line: 'red',
          destination: t.destNm ?? '',
          heading: t.heading ?? null,
        }))
      setMapTrains(posTrains)
    } catch {
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
      const data = await res.json() as { content?: { text: string }[] }
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
                  <span>
                    <span className="dashboard__weather-emoji">{WEATHER_EMOJI[weather.weathercode] ?? '🌡️'}</span>
                    {' '}
                    {WEATHER_CODES[weather.weathercode] ?? 'Unknown'}
                  </span>
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
              <div className="dashboard__weather-sun">
                <span>🌅 {new Date(weather.sunrise).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                <span>🌇 {new Date(weather.sunset).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
              </div>
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
