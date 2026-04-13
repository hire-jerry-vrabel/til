import { Gallery } from '../components/mdx/Gallery'

const TOTAL = 285

const images = Array.from({ length: TOTAL }, (_, i) => ({
  src: `/til/images/bash/bash-${i + 1}.jpg`,
  alt: `Bash photo ${i + 1}`,
}))

export function Bash() {
  return (
    <main className="bash-page">
      <div className="bash-page__hero">
        <h1 className="bash-page__title">Bash 🐾</h1>
        <p className="bash-page__subtitle">
          Good boy. Senior software engineer in training. {TOTAL} photos and counting.
        </p>
      </div>
      <Gallery
        images={images}
        showThumbs
        fullBleed
      />
    </main>
  )
}
