import { useState, useCallback } from 'react'
import type {
  CTAStation, CTATrain, CTAMapTrain, CTATravelConditions,
  CTAEta, CTAPositionTrain,
} from '../types'
import { PROXY_URL } from '../constants'

const CTA_STATIONS = [
  { id: '40900', name: 'Howard', direction: 'Loop' },
  { id: '41190', name: 'Jarvis', direction: 'Loop' },
  { id: '40100', name: 'Morse', direction: 'Loop' },
  { id: '41300', name: 'Loyola', direction: 'Loop' },
]

const BASE_LOOP_HOWARD = 48

export function getCTATravelConditions(stations: CTAStation[]): CTATravelConditions {
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

export function useCTA() {
  const [cta, setCta] = useState<CTAStation[]>([])
  const [mapTrains, setMapTrains] = useState<CTAMapTrain[]>([])

  const fetchCTA = useCallback(async () => {
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
  }, [])

  return { cta, mapTrains, fetchCTA }
}
