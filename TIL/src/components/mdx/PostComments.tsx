import Giscus from "@giscus/react"
import { useTheme } from "../../context/ThemeContext"

interface Props {
  slug: string
}

export function PostComments({ slug }: Props) {
  const { isDark } = useTheme()
  const theme = isDark ? "dark" : "light"

  return (
    <div className="post-comments">
      <h2 className="post-comments-title">Reactions & Discussion</h2>
      <Giscus
        key={`${slug}-${theme}`}
        id={`comments-${slug}`}
        repo="hire-jerry-vrabel/til"
        repoId="R_kgDORp1kRw"
        category="Announcements"
        categoryId="DIC_kwDORp1kR84C5S2z"
        mapping="pathname"
        strict="0"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme={theme}
        lang="en"
        loading="lazy"
      />
    </div>
  )
}
