import type { SportsTeam } from '../types'

interface SportsCardProps {
  sports: SportsTeam[]
}

export function SportsCard({ sports }: SportsCardProps) {
  return (
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
  )
}
