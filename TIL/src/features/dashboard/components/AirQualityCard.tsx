import type { AirQualityData } from '../types'

interface AirQualityCardProps {
  airQuality: AirQualityData | null
}

export function AirQualityCard({ airQuality }: AirQualityCardProps) {
  return (
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
  )
}
