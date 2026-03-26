import { useEffect, useState } from "react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from "recharts"

interface DayData {
  timestamp: string
  count: number
  uniques: number
}

interface PathData {
  path: string
  title: string
  count: number
  uniques: number
}

interface ReferrerData {
  referrer: string
  count: number
  uniques: number
}

interface TrafficData {
  views: { count: number; uniques: number; views: DayData[] }
  clones: { count: number; uniques: number; clones: DayData[] }
  paths: PathData[]
  referrers: ReferrerData[]
  updated: string
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function formatPath(path: string) {
  return path.replace("/til/post/", "").replace("/til/", "home") || "home"
}

export function TrafficDashboard() {
  const [data, setData] = useState<TrafficData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/til/traffic.json")
      .then(r => {
        if (!r.ok) throw new Error("Traffic data not available yet")
        return r.json()
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="traffic-loading">Loading traffic data...</div>
  )

  if (error) return (
    <div className="traffic-error">
      {error} — data is fetched daily via GitHub Actions.
    </div>
  )

  if (!data) return null

  const viewsData = data.views.views.map(d => ({
    date: formatDate(d.timestamp),
    views: d.count,
    visitors: d.uniques,
  }))

  const topPaths = data.paths
    .slice(0, 8)
    .map(p => ({ name: formatPath(p.path), views: p.count, visitors: p.uniques }))

  const updatedAt = new Date(data.updated).toLocaleDateString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
  })

  return (
    <div className="traffic-dashboard">
      <div className="traffic-header">
        <div className="traffic-stats">
          <div className="traffic-stat">
            <span className="traffic-stat-num">{data.views.count.toLocaleString()}</span>
            <span className="traffic-stat-label">Total Views</span>
          </div>
          <div className="traffic-stat">
            <span className="traffic-stat-num">{data.views.uniques.toLocaleString()}</span>
            <span className="traffic-stat-label">Unique Visitors</span>
          </div>
          <div className="traffic-stat">
            <span className="traffic-stat-num">{data.clones.count.toLocaleString()}</span>
            <span className="traffic-stat-label">Repo Clones</span>
          </div>
        </div>
        <span className="traffic-updated">Updated {updatedAt}</span>
      </div>

      <div className="traffic-section">
        <h3 className="traffic-section-title">Views & Visitors (Last 14 Days)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={viewsData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="visitorsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
            <YAxis tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
            <Tooltip
              contentStyle={{
                background: "var(--color-bg-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "6px",
                fontSize: "12px",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Area type="monotone" dataKey="views" stroke="#3b82f6" fill="url(#viewsGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="visitors" stroke="#7c3aed" fill="url(#visitorsGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="traffic-section">
        <h3 className="traffic-section-title">Top Posts</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={topPaths} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} width={120} />
            <Tooltip
              contentStyle={{
                background: "var(--color-bg-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "6px",
                fontSize: "12px",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Bar dataKey="views" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            <Bar dataKey="visitors" fill="#7c3aed" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {data.referrers.length > 0 && (
        <div className="traffic-section">
          <h3 className="traffic-section-title">Top Referrers</h3>
          <div className="traffic-referrers">
            {data.referrers.slice(0, 6).map(r => (
              <div key={r.referrer} className="traffic-referrer">
                <span className="traffic-referrer-name">{r.referrer || "Direct"}</span>
                <span className="traffic-referrer-count">{r.count} views</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
