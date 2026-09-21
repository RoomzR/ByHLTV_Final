const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export function apiOrigin(): string {
  return API_URL.replace(/\/api\/v1\/?$/, "");
}

/** Resolve stored media paths (absolute or /uploads/…) for <img src>. */
export function mediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/uploads/")) return `${apiOrigin()}${url}`;
  return url;
}

export function isImageLogo(logo?: string | null): boolean {
  if (!logo) return false;
  return logo.startsWith("/uploads/") || /^https?:\/\//i.test(logo) || logo.includes("/");
}
