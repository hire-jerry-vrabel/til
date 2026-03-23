const WORDS_PER_MINUTE = 200

export function readingTime(content: string): number {
  const words = content.trim().split(/\s+/).length
  return Math.ceil(words / WORDS_PER_MINUTE)
}

export function formatReadingTime(minutes: number): string {
  return minutes <= 1 ? '1 min read' : `${minutes} min read`
}
