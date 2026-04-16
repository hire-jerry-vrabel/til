import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts'
import { useTheme } from '../../../context/ThemeContext'
import type { GitHubData } from '../types'

interface GitHubCardProps {
  github: GitHubData | null
}

export function GitHubCard({ github }: GitHubCardProps) {
  const { isDark } = useTheme()
  const chartColor = isDark ? '#6366f1' : '#3178c6'
  const gridColor = isDark ? '#1e293b' : '#f1f5f9'
  const textColor = isDark ? '#94a3b8' : '#64748b'

  return (
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
  )
}
