import { formatReadingTime } from '../utils/readingTime'

interface Props {
  minutes: number
}

export function ReadingTime({ minutes }: Props) {
  return (
    <span className="reading-time">
      {formatReadingTime(minutes)}
    </span>
  )
}
