import { useState, useCallback } from 'react'
import type { AirQualityData } from '../types'
import { LAT, LNG } from '../constants'

const AQI_LEVELS = [
  { max: 50, label: 'Good', color: '#16a34a' },
  { max: 100, label: 'Moderate', color: '#d97706' },
  { max: 150, label: 'Unhealthy for Sensitive', color: '#ea580c' },
  { max: 200, label: 'Unhealthy', color: '#dc2626' },
  { max: 300, label: 'Very Unhealthy', color: '#9333ea' },
  { max: 500, label: 'Hazardous', color: '#7f1d1d' },
]

function getAQILevel(aqi: number) {
  return AQI_LEVELS.find(l => aqi <= l.max) ?? AQI_LEVELS[AQI_LEVELS.length - 1]
}

export function useAirQuality() {
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null)

  const fetchAirQuality = useCallback(async () => {
    const res = await fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${LAT}&longitude=${LNG}&current=us_aqi,pm2_5,pm10,ozone`
    )
    const data = await res.json()
    const aqi = Math.round(data.current.us_aqi)
    const level = getAQILevel(aqi)
    setAirQuality({
      aqi,
      pm25: Math.round(data.current.pm2_5 * 10) / 10,
      pm10: Math.round(data.current.pm10 * 10) / 10,
      ozone: Math.round(data.current.ozone * 10) / 10,
      label: level.label,
      color: level.color,
    })
  }, [])

  return { airQuality, fetchAirQuality }
}
