import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts'
import { useTheme } from '../../../context/ThemeContext'
import { WEATHER_CODES, WEATHER_EMOJI } from '../hooks/useWeather'
import type { WeatherData } from '../types'

interface WeatherCardProps {
  weather: WeatherData | null
}

export function WeatherCard({ weather }: WeatherCardProps) {
  const { isDark } = useTheme()
  const chartColor = isDark ? '#6366f1' : '#3178c6'
  const gridColor = isDark ? '#1e293b' : '#f1f5f9'
  const textColor = isDark ? '#94a3b8' : '#64748b'

  return (
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
  )
}
