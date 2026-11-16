const BASE_URL = "https://gdnstore.com.br";

/**
 * Head metadata for static/institutional pages: title, description,
 * Open Graph/Twitter social preview and a self-referencing canonical.
 */
export function pageHead(path: string, title: string, description: string) {
  const url = `${BASE_URL}${path}`;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

/**
 * Head metadata for private pages that should never be indexed.
 * Social tags stay page-specific so shared links never fall back to the
 * generic store preview.
 */
export function privateHead(title: string, description: string) {
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex,nofollow" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
  };
}
