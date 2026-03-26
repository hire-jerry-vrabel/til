import { useState, useEffect } from "react"

interface MLBGame {
  gamePk: number
  gameDate: string
  status: { abstractGameState: string; detailedState: string }
  teams: {
    home: { team: { id: number; name: string }; score?: number; isWinner?: boolean }
    away: { team: { id: number; name: string }; score?: number; isWinner?: boolean }
  }
  venue: { name: string }
}

interface CubsData {
  wins: number
  losses: number
  lastGame: MLBGame | null
  nextGame: MLBGame | null
  wonLast: boolean | null
  streak: { type: "W" | "L"; count: number } | null
  openingDay: boolean
}

const CUBS_ID = 112
const SEASON = 2026

function isCubsHome(game: MLBGame) {
  return game.teams.home.team.id === CUBS_ID
}

function getCubsScore(game: MLBGame) {
  return isCubsHome(game) ? game.teams.home.score ?? 0 : game.teams.away.score ?? 0
}

function getOppScore(game: MLBGame) {
  return isCubsHome(game) ? game.teams.away.score ?? 0 : game.teams.home.score ?? 0
}

function getOppName(game: MLBGame) {
  return isCubsHome(game) ? game.teams.away.team.name : game.teams.home.team.name
}

function formatGameDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit", timeZoneName: "short",
    timeZone: "America/Chicago"
  })
}

async function fetchCubsData(): Promise<CubsData> {
  const url = `https://statsapi.mlb.com/api/v1/schedule?teamId=${CUBS_ID}&season=${SEASON}&gameType=R&sportId=1&hydrate=team,linescore`
  const res = await fetch(url)
  const json = await res.json()

  const allGames: MLBGame[] = []
  for (const date of json.dates || []) {
    for (const game of date.games || []) {
      allGames.push(game)
    }
  }

  const completed = allGames.filter(g =>
    g.status.abstractGameState === "Final" ||
    g.status.detailedState === "Final"
  )

  const upcoming = allGames.filter(g =>
    g.status.abstractGameState === "Preview" ||
    g.status.abstractGameState === "Scheduled" ||
    g.status.detailedState === "Scheduled"
  )

  let wins = 0
  let losses = 0
  completed.forEach(g => {
    if (getCubsScore(g) > getOppScore(g)) wins++
    else losses++
  })

  const lastGame = completed[completed.length - 1] || null
  const nextGame = upcoming[0] || null

  let wonLast: boolean | null = null
  if (lastGame) {
    wonLast = getCubsScore(lastGame) > getOppScore(lastGame)
  }

  // Streak
  let streak: { type: "W" | "L"; count: number } | null = null
  if (completed.length > 0) {
    const results = completed.map(g =>
      getCubsScore(g) > getOppScore(g) ? "W" as const : "L" as const
    )
    const lastResult = results[results.length - 1]
    let count = 0
    for (let i = results.length - 1; i >= 0; i--) {
      if (results[i] === lastResult) count++
      else break
    }
    streak = { type: lastResult, count }
  }

  const openingDay = completed.length === 0 && upcoming.length > 0

  return { wins, losses, lastGame, nextGame, wonLast, streak, openingDay }
}

function WFlag() {
  return (
    <div className="cubs-flag cubs-flag--w cubs-flag--wave">
      <div className="cubs-flag-pole" />
      <div className="cubs-flag-cloth cubs-flag-cloth--w">
        <span className="cubs-flag-letter">W</span>
      </div>
    </div>
  )
}

function LFlag() {
  return (
    <div className="cubs-flag cubs-flag--l">
      <div className="cubs-flag-pole" />
      <div className="cubs-flag-cloth cubs-flag-cloth--l cubs-flag-cloth--droop">
        <span className="cubs-flag-letter cubs-flag-letter--l">L</span>
      </div>
    </div>
  )
}

function OpeningDayFlag() {
  return (
    <div className="cubs-flag cubs-flag--w cubs-flag--wave">
      <div className="cubs-flag-pole" />
      <div className="cubs-flag-cloth cubs-flag-cloth--opening">
        <span className="cubs-flag-letter" style={{ fontSize: "36px" }}>⚾</span>
      </div>
    </div>
  )
}

function ScoreBug({ game }: { game: MLBGame }) {
  const cubsScore = getCubsScore(game)
  const oppScore = getOppScore(game)
  const oppName = getOppName(game)
  const won = cubsScore > oppScore
  const oppAbbr = oppName.split(" ").pop() || "OPP"

  return (
    <div className="cubs-scorebug">
      <div className={`cubs-scorebug-team ${won ? "cubs-scorebug-team--winner" : ""}`}>
        <span className="cubs-scorebug-abbr">CHC</span>
        <span className="cubs-scorebug-score">{cubsScore}</span>
      </div>
      <span className="cubs-scorebug-vs">FINAL</span>
      <div className={`cubs-scorebug-team ${!won ? "cubs-scorebug-team--winner" : ""}`}>
        <span className="cubs-scorebug-abbr">{oppAbbr}</span>
        <span className="cubs-scorebug-score">{oppScore}</span>
      </div>
    </div>
  )
}

export function CubsWTracker() {
  const [data, setData] = useState<CubsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    fetchCubsData()
      .then(d => {
        setData(d)
        if (d.wonLast) setTimeout(() => setShowConfetti(true), 500)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="cubs-loading">Loading Cubs data... ⚾</div>
  if (error || !data) return <div className="cubs-error">Could not load Cubs data — try again later.</div>

  const { wins, losses, lastGame, nextGame, wonLast, streak, openingDay } = data
  const winPct = wins + losses > 0
    ? (wins / (wins + losses)).toFixed(3).replace(/^0/, "")
    : ".000"

  return (
    <div className="cubs-tracker">
      {showConfetti && wonLast && (
        <div className="cubs-confetti">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="cubs-confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                background: ["#0E3386", "#CC3433", "#ffffff"][i % 3]
              }}
            />
          ))}
        </div>
      )}

      <div className="cubs-header">
        <div className="cubs-logo">
          <svg viewBox="0 0 60 60" width="56" height="56">
            <circle cx="30" cy="30" r="28" fill="#0E3386" stroke="#CC3433" strokeWidth="3"/>
            <text x="30" y="38" textAnchor="middle" fill="white"
              fontSize="22" fontWeight="bold" fontFamily="Arial">Cubs</text>
          </svg>
        </div>
        <div className="cubs-header-info">
          <h2 className="cubs-team-name">Chicago Cubs</h2>
          <div className="cubs-record">
            <span className="cubs-wins">{wins}W</span>
            <span className="cubs-dash">-</span>
            <span className="cubs-losses">{losses}L</span>
            {wins + losses > 0 && <span className="cubs-pct">{winPct}</span>}
          </div>
          {streak && (
            <div className={`cubs-streak cubs-streak--${streak.type.toLowerCase()}`}>
              {streak.type === "W" ? "🔥" : "❄️"} {streak.count} {streak.type} Streak
            </div>
          )}
        </div>
      </div>

      <div className="cubs-flag-section">
        {openingDay && (
          <>
            <OpeningDayFlag />
            <div className="cubs-flag-message">
              <span className="cubs-flag-headline" style={{ color: "#60a5fa" }}>
                Opening Day! 🎉
              </span>
              <span className="cubs-flag-sub">Season starts today. Let's Go Cubs!</span>
            </div>
          </>
        )}
        {!openingDay && wonLast === true && (
          <>
            <WFlag />
            <div className="cubs-flag-message cubs-flag-message--w">
              <span className="cubs-flag-headline">FLY THE W!</span>
              <span className="cubs-flag-sub">Cubs Win! {wins}-{losses}</span>
            </div>
          </>
        )}
        {!openingDay && wonLast === false && (
          <>
            <LFlag />
            <div className="cubs-flag-message cubs-flag-message--l">
              <span className="cubs-flag-headline">Fly the L</span>
              <span className="cubs-flag-sub">We'll get 'em tomorrow. {wins}-{losses}</span>
            </div>
          </>
        )}
        {!openingDay && wonLast === null && (
          <div className="cubs-flag-message">
            <span className="cubs-flag-headline" style={{ color: "#60a5fa" }}>⚾ Season Underway</span>
            <span className="cubs-flag-sub">No results yet</span>
          </div>
        )}
      </div>

      {!openingDay && lastGame && (
        <div className="cubs-section">
          <div className="cubs-section-label">Last Game · vs {getOppName(lastGame)}</div>
          <div className="cubs-section-date">{formatGameDate(lastGame.gameDate)}</div>
          <ScoreBug game={lastGame} />
        </div>
      )}

      {nextGame && (
        <div className="cubs-section cubs-section--next">
          <div className="cubs-section-label">
            {openingDay ? "Today's Game — Opening Day!" : "Next Game"}
          </div>
          <div className="cubs-next-game">
            <span className="cubs-next-opponent">
              {isCubsHome(nextGame) ? "vs" : "@"} {getOppName(nextGame)}
              {isCubsHome(nextGame) ? " · Wrigley Field" : ""}
            </span>
            <span className="cubs-next-time">{formatGameDate(nextGame.gameDate)}</span>
          </div>
        </div>
      )}

      <div className="cubs-footer">
        {SEASON} MLB Season · Live data via MLB Stats API · Let's Go Cubs! 🐻⚾
      </div>
    </div>
  )
}
