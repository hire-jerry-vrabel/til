interface Props {
  id: string
  title?: string
}

export function YouTube({ id, title = "YouTube video" }: Props) {
  return (
    <div className="video-embed video-youtube">
      <iframe
        src={`https://www.youtube.com/embed/${id}`}
        title={title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}
