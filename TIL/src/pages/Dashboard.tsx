import { useEffect, useState, useCallback } from 'react'
import { useTheme } from '../context/ThemeContext'
import {
  LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import type {
  WeatherData, AirQualityData, SportsTeam, GitHubData, AIInsight,
} from '../features/dashboard/types'
import { CTAMap } from '../features/dashboard/components/CTAMap'
import { useAirQuality } from '../features/dashboard/hooks/useAirQuality'
import { PROXY_URL } from '../features/dashboard/constants'
import { useWeather, WEATHER_CODES, } from '../features/dashboard/hooks/useWeather'
import { useGitHub } from '../features/dashboard/hooks/useGitHub'
import { useSports } from '../features/dashboard/hooks/useSports'
import { useCTA, getCTATravelConditions } from '../features/dashboard/hooks/useCTA'
import { AirQualityCard } from '../features/dashboard/components/AirQualityCard'
import { SportsCard } from '../features/dashboard/components/SportsCard'
import { WeatherCard } from '../features/dashboard/components/WeatherCard'

// ─── Dashboard ───────────────────────────────────────────────────────────────

export function Dashboard() {
  const { isDark } = useTheme()
  const { weather, fetchWeather } = useWeather()
  const { airQuality, fetchAirQuality } = useAirQuality()
  const { sports, fetchSports } = useSports()
  const { github, fetchGitHub } = useGitHub()
  const { cta, mapTrains, fetchCTA } = useCTA()
  const [insight, setInsight] = useState<AIInsight>({ text: '', loading: false })
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)


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
  }, [fetchWeather, fetchAirQuality, fetchSports, fetchGitHub, fetchCTA])

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
        <WeatherCard weather={weather} />

        {/* AirQuality */}
        <AirQualityCard airQuality={airQuality} />

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
        <SportsCard sports={sports} />

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
