import { useState, useCallback } from 'react'
import type { WeatherData } from '../types'
import { LAT, LNG } from '../constants'

export const WEATHER_CODES: Record<number, string> = {
  0: 'Clear', 1: 'Mostly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Icy Fog', 51: 'Light Drizzle', 53: 'Drizzle',
  55: 'Heavy Drizzle', 61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain',
  71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow', 80: 'Showers',
  95: 'Thunderstorm', 99: 'Severe Thunderstorm',
}

export const WEATHER_EMOJI: Record<number, string> = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️',
  61: '🌦️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '❄️',
  80: '🌧️',
  95: '⛈️', 99: '⛈️',
}

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null)

  const fetchWeather = useCallback(async () => {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LNG}&current=temperature_2m,apparent_temperature,wind_speed_10m,weather_code&hourly=temperature_2m&daily=sunrise,sunset&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America/Chicago&forecast_days=1`
    )
    const data = await res.json()
    const hourly = data.hourly.time.slice(0, 24).map((t: string, i: number) => ({
      time: new Date(t).getHours() + ':00',
      temp: Math.round(data.hourly.temperature_2m[i]),
    }))
    setWeather({
      temp: Math.round(data.current.temperature_2m),
      feelsLike: Math.round(data.current.apparent_temperature),
      windspeed: Math.round(data.current.wind_speed_10m),
      weathercode: data.current.weather_code,
      sunrise: data.daily.sunrise[0],
      sunset: data.daily.sunset[0],
      hourly,
    })
  }, [])

  return { weather, fetchWeather }
}
