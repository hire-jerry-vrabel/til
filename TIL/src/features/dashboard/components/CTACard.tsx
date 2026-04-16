import { useTheme } from '../../../context/ThemeContext'
import { CTAMap } from './CTAMap'
import { getCTATravelConditions } from '../hooks/useCTA'
import type { CTAStation, CTAMapTrain } from '../types'

interface CTACardProps {
  cta: CTAStation[]
  mapTrains: CTAMapTrain[]
}

export function CTACard({ cta, mapTrains }: CTACardProps) {
  const { isDark } = useTheme()

  return (
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
  )
}
