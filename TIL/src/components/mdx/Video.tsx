interface Props {
  src: string
  poster?: string
}

export function Video({ src, poster }: Props) {
  return (
    <div className="video-local">
      <video controls preload="metadata" poster={poster}>
        <source src={src} />
        Your browser does not support the video tag.
      </video>
    </div>
  )
}
