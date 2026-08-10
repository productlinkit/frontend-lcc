/*
 * Hash-based routing map.
 *
 * Every tab has a real URL (e.g. #/service), so primary nav can render as real
 * <a href> anchors. That gives bookmarking, cmd/ctrl+click "open in new tab",
 * and working browser Back/Forward — none of which <button> navigation allows.
 *
 * Hash routing (not history/pushState) because the app is served as a static
 * SPA with no server-side rewrite rules; a deep link like /service would 404.
 */

export const TAB_TO_PATH: Record<string, string> = {
  home: "/",
  service: "/service",
  history: "/history",
  wallet: "/wallet",
  account: "/account",
  help: "/help",
  news: "/news",
  auth: "/signin",
  "resident-certificate": "/service/resident-certificate",
  "birth-declaration": "/service/birth-declaration",
  "death-declaration": "/service/death-declaration",
  "marriage-certificate": "/service/marriage-certificate",
  "divorce-certificate": "/service/divorce-certificate",
  "family-book": "/service/family-book",
};

const PATH_TO_TAB: Record<string, string> = Object.fromEntries(
  Object.entries(TAB_TO_PATH).map(([tab, path]) => [path, tab])
);

/** href for a tab — use this on every primary nav anchor. */
export function tabHref(tab: string): string {
  return `#${TAB_TO_PATH[tab] ?? "/"}`;
}

// A news detail segment is either a numeric position (legacy links) or an
// article slug, so it matches any non-empty segment that is not itself a known
// sub-route. The API identifies an article by slug, so slug links are primary.
const NEWS_DETAIL = /^\/news\/([^/]+)$/;

/** Current tab derived from window.location.hash. Unknown paths fall back home. */
export function tabFromHash(): string {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  if (raw !== "/news" && NEWS_DETAIL.test(raw)) return "news-detail";
  return PATH_TO_TAB[raw] ?? "home";
}

/** href for a specific news article's detail page (by slug or numeric id). */
export function newsHref(id: number | string): string {
  return `#/news/${id}`;
}

/**
 * The news detail segment from the hash, or null. Returns the raw string so a
 * slug is preserved; NewsDetailPage accepts either a slug or a numeric position.
 */
export function newsIdFromHash(): string | null {
  const m = window.location.hash.match(new RegExp(`^#${NEWS_DETAIL.source}`));
  return m ? decodeURIComponent(m[1]) : null;
}

/** Navigate by writing the hash; the app's hashchange listener applies it. */
export function navigateTo(tab: string) {
  const next = tabHref(tab);
  if (window.location.hash !== next) window.location.hash = TAB_TO_PATH[tab] ?? "/";
}
