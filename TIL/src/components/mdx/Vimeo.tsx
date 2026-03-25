interface Props {
  id: string
  title?: string
}

export function Vimeo({ id, title = "Vimeo video" }: Props) {
  return (
    <div className="video-embed video-vimeo">
      <iframe
        src={`https://player.vimeo.com/video/${id}`}
        title={title}
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}
