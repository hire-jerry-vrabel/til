import { useState, useCallback } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Thumbs, FreeMode } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'
import Lightbox from 'yet-another-react-lightbox'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails'
import Captions from 'yet-another-react-lightbox/plugins/captions'
import Slideshow from 'yet-another-react-lightbox/plugins/slideshow'
import Counter from 'yet-another-react-lightbox/plugins/counter'
import 'swiper/swiper-bundle.css'
import 'yet-another-react-lightbox/styles.css'
import 'yet-another-react-lightbox/plugins/thumbnails.css'
import 'yet-another-react-lightbox/plugins/captions.css'
import 'yet-another-react-lightbox/plugins/counter.css'

export interface GalleryImage {
  src: string
  alt: string
  caption?: string
}

interface GalleryProps {
  images: GalleryImage[]
  title?: string
  showThumbs?: boolean
  fullBleed?: boolean
}

export function Gallery({ images, title, showThumbs = true, fullBleed = false }: GalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null)

  const slides = images.map(img => ({
    src: img.src,
    alt: img.alt,
    title: img.caption,
  }))

  const handleClick = useCallback((swiper: SwiperType) => {
    setLightboxIndex(swiper.activeIndex)
  }, [])

  return (
    <div className={`gallery${fullBleed ? ' gallery--full-bleed' : ''}`}>
      {title && (
        <div className="gallery__header">
          <span className="gallery__icon">📷</span>
          <span className="gallery__title">{title}</span>
          <span className="gallery__count">{images.length} photos</span>
        </div>
      )}

      <Swiper
        modules={[Navigation, Pagination, Thumbs, FreeMode]}
        navigation
        pagination={{ clickable: true, dynamicBullets: true }}
        thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
        spaceBetween={0}
        slidesPerView={1}
        className="gallery__main-swiper"
        onClick={handleClick}
      >
        {images.map((img, i) => (
          <SwiperSlide key={i}>
            <div className="gallery__slide-inner">
              <img
                src={img.src}
                alt={img.alt}
                className="gallery__img"
              />
            </div>
            {img.caption && (
              <div className="gallery__caption">{img.caption}</div>
            )}
          </SwiperSlide>
        ))}
      </Swiper>

      {showThumbs && images.length > 1 && (
        <Swiper
          modules={[FreeMode, Thumbs]}
          onSwiper={setThumbsSwiper}
          spaceBetween={4}
          slidesPerView="auto"
          freeMode
          watchSlidesProgress
          className="gallery__thumbs-swiper"
        >
          {images.map((img, i) => (
            <SwiperSlide key={i} className="gallery__thumb-slide">
              <img
                src={img.src}
                alt={img.alt}
                className="gallery__thumb-img"
                loading="lazy"
              />
            </SwiperSlide>
          ))}
        </Swiper>
      )}

      <Lightbox
        open={lightboxIndex >= 0}
        close={() => setLightboxIndex(-1)}
        index={lightboxIndex}
        slides={slides}
        plugins={[Zoom, Thumbnails, Captions, Slideshow, Counter]}
        zoom={{ maxZoomPixelRatio: 4 }}
        carousel={{ finite: false }}
        counter={{ container: { style: { top: 0, bottom: 'unset' } } }}
        thumbnails={{ position: 'bottom', width: 80, height: 60, gap: 4 }}
        captions={{ showToggle: true }}
        slideshow={{ autoplay: false, delay: 3000 }}
      />
    </div>
  )
}
