const SITE_URL = "https://hire-jerry-vrabel.github.io/til"
const DEFAULT_IMAGE = `${SITE_URL}/images/og-default.png`
const SITE_NAME = "TIL — Jerry Vrabel"

interface OGTagOptions {
  title?: string
  description?: string
  image?: string | null
  url?: string
  type?: "website" | "article"
}

function setMeta(property: string, content: string, useProperty = true) {
  const attr = useProperty ? "property" : "name"
  let el = document.querySelector(`meta[${attr}="${property}"]`) as HTMLMetaElement
  if (!el) {
    el = document.createElement("meta")
    el.setAttribute(attr, property)
    document.head.appendChild(el)
  }
  el.setAttribute("content", content)
}

export function useOGTags({
  title,
  description,
  image,
  url,
  type = "website",
}: OGTagOptions) {
  const fullTitle = title ? `${title} — TIL` : "TIL — Today I Learned"
  const fullUrl = url ? `${SITE_URL}${url}` : SITE_URL
  const ogImage = image || DEFAULT_IMAGE
  const desc = description || "A daily log of things Jerry Vrabel learns as a Senior Web Application Developer."

  document.title = fullTitle
  setMeta("og:type", type)
  setMeta("og:site_name", SITE_NAME)
  setMeta("og:title", fullTitle)
  setMeta("og:description", desc)
  setMeta("og:url", fullUrl)
  setMeta("og:image", ogImage)
  setMeta("og:image:width", "1200")
  setMeta("og:image:height", "630")
  setMeta("description", desc, false)
}

export function resetOGTags() {
  document.title = "TIL — Today I Learned"
  setMeta("og:type", "website")
  setMeta("og:title", "TIL — Today I Learned")
  setMeta("og:description", "A daily log of things Jerry Vrabel learns as a Senior Web Application Developer.")
  setMeta("og:url", SITE_URL)
  setMeta("og:image", DEFAULT_IMAGE)
  setMeta("description", "A daily log of things Jerry Vrabel learns as a Senior Web Application Developer.", false)
}
