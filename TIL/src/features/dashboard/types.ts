// ─── Domain Types ────────────────────────────────────────────────────────────

export interface WeatherData {
  temp: number
  feelsLike: number
  windspeed: number
  weathercode: number
  sunrise: string
  sunset: string
  hourly: { time: string; temp: number }[]
}

export interface AirQualityData {
  aqi: number
  pm25: number
  pm10: number
  ozone: number
  label: string
  color: string
}

export interface SportsTeam {
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

export interface GitHubData {
  commits: number
  repos: number
  streak: number
  activity: { date: string; count: number }[]
  latestRepo: string
}

export interface CTATrain {
  line: string
  destination: string
  minutes: number | string
  delayed: boolean
  isApproaching: boolean
}

export interface CTAStation {
  name: string
  trains: CTATrain[]
  hasDelays: boolean
  mapTrains: CTAMapTrain[]
}

export interface CTATravelConditions {
  loopToHoward: number
  condition: 'normal' | 'rush' | 'delayed'
  label: string
}

export interface CTAMapTrain {
  lat: number
  lon: number
  line: string
  destination: string
  heading: string | null
}

export interface AIInsight {
  text: string
  loading: boolean
}

// ─── API Response Types ──────────────────────────────────────────────────────

export interface ESPNCompetitor {
  team: { abbreviation: string; displayName: string; logo: string }
  homeAway: string
  score?: string
}

export interface ESPNCompetition {
  competitors: ESPNCompetitor[]
  status: { type: { shortDetail?: string; completed: boolean } }
}

export interface ESPNEvent {
  competitions: ESPNCompetition[]
}

export interface GitHubEvent {
  type: string
  created_at: string
  repo?: { name: string }
  payload: { commits?: unknown[] }
}

export interface CTAEta {
  arrT: string
  rt: string
  destNm: string
  isDly: string
  isApp: string
  lat: string
  lon: string
  heading: string
}

export interface CTAPositionTrain {
  lat: string
  lon: string
  destNm?: string
  heading?: string
}
