import os

files = sorted(os.listdir('public/images/bash'), key=lambda f: int(f.replace('bash-','').split('.')[0]))
images = ',\n  '.join([f'{{ src: "/til/images/bash/{f}", alt: "Bash" }}' for f in files])

content = f'''import {{ useState }} from 'react'
import {{ Gallery }} from '../components/mdx/Gallery'
import Lightbox from 'yet-another-react-lightbox'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails'
import Slideshow from 'yet-another-react-lightbox/plugins/slideshow'
import Counter from 'yet-another-react-lightbox/plugins/counter'
import 'yet-another-react-lightbox/styles.css'
import 'yet-another-react-lightbox/plugins/thumbnails.css'
import 'yet-another-react-lightbox/plugins/counter.css'

const images = [
  {images}
]

const slides = images.map(img => ({{ src: img.src, alt: img.alt }}))

export function Bash() {{
  const [lightboxIndex, setLightboxIndex] = useState(0)

  return (
    <main className="bash-page">
      <div className="bash-page__hero">
        <h1 className="bash-page__title">Bash 🐾</h1>
        <p className="bash-page__subtitle">
          Good boy. Senior software engineer in training. {len(files)} photos and counting.
        </p>
      </div>
      <Gallery
        images={{images}}
        showThumbs
        fullBleed
      />
      <Lightbox
        open={{lightboxIndex >= 0}}
        close={{() => setLightboxIndex(-1)}}
        index={{lightboxIndex}}
        slides={{slides}}
        plugins={{[Zoom, Thumbnails, Slideshow, Counter]}}
        zoom={{{{ maxZoomPixelRatio: 4 }}}}
        carousel={{{{ finite: false }}}}
        counter={{{{ container: {{ style: {{ top: 0, bottom: "unset" }} }} }}}}
        thumbnails={{{{ position: "bottom", width: 80, height: 60, gap: 4 }}}}
        slideshow={{{{ autoplay: false, delay: 3000 }}}}
      />
    </main>
  )
}}
'''

with open('src/pages/Bash.tsx', 'w') as f:
    f.write(content)
print(f'Bash.tsx updated with {len(files)} images')
