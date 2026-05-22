const apiUrl = import.meta.env.VITE_API_URL;

function apiOrigin() {
  try {
    return new URL(apiUrl).origin;
  } catch {
    return "";
  }
}

export function mediaUrl(path?: string) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }

  return `${apiOrigin()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function cssUrl(path?: string) {
  const url = mediaUrl(path);
  return url ? `url("${url}") center/cover no-repeat` : "";
}
