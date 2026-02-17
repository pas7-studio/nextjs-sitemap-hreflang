export type TrailingSlashPolicy = "preserve" | "always" | "never";

export function normalizeUrl(url: string, trailingSlash: TrailingSlashPolicy): string {
  const u = new URL(url);
  if (trailingSlash === "preserve") return u.toString();
  if (trailingSlash === "always") {
    if (!u.pathname.endsWith("/")) u.pathname = `${u.pathname}/`;
    return u.toString();
  }
  if (u.pathname !== "/" && u.pathname.endsWith("/")) u.pathname = u.pathname.slice(0, -1);
  return u.toString();
}

export function resolveAbsoluteUrl(input: string, baseUrl: string): string {
  if (input.startsWith("http://") || input.startsWith("https://")) return input;
  return new URL(input.startsWith("/") ? input : `/${input}`, baseUrl).toString();
}

export function getOriginFromAbsoluteUrl(absoluteUrl: string): string {
  const u = new URL(absoluteUrl);
  return `${u.protocol}//${u.host}`;
}
