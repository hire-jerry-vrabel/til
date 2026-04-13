import os

image_dir = 'public/images/bash'
valid_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}

# Get all image files
files = [f for f in os.listdir(image_dir) if os.path.splitext(f)[1].lower() in valid_extensions]

# Sort: existing bash-N files numerically first, then new files alphabetically at the end
def sort_key(f):
    name = os.path.splitext(f)[0]
    if name.startswith('bash-'):
        try:
            return (0, int(name.replace('bash-', '')))
        except ValueError:
            pass
    return (1, f)

files.sort(key=sort_key)

# Rename all files sequentially with lowercase extensions
renamed = []
for i, f in enumerate(files, start=1):
    ext = os.path.splitext(f)[1].lower()
    new_name = f'bash-{i}{ext}'
    src = os.path.join(image_dir, f)
    dst = os.path.join(image_dir, new_name)
    if src != dst:
        os.rename(src, dst)
        print(f'  {f} → {new_name}')
    renamed.append(new_name)

print(f'Renamed {len(renamed)} files')

# Generate Bash.tsx
images = ',\n  '.join([f'{{ src: "/til/images/bash/{f}", alt: "Bash" }}' for f in renamed])

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
          Good boy. Senior software engineer in training. {len(renamed)} photos and counting.
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
print(f'Bash.tsx updated with {len(renamed)} images')
