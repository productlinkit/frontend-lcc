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

/** Current tab derived from window.location.hash. Unknown paths fall back home. */
export function tabFromHash(): string {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  // Parameterised route: #/news/<id> renders the detail page.
  if (/^\/news\/\d+$/.test(raw)) return "news-detail";
  return PATH_TO_TAB[raw] ?? "home";
}

/** href for a specific news article's detail page. */
export function newsHref(id: number | string): string {
  return `#/news/${id}`;
}

/** Article id when on a #/news/<id> route, else null. */
export function newsIdFromHash(): number | null {
  const m = window.location.hash.match(/^#\/news\/(\d+)$/);
  return m ? Number(m[1]) : null;
}

/** Navigate by writing the hash; the app's hashchange listener applies it. */
export function navigateTo(tab: string) {
  const next = tabHref(tab);
  if (window.location.hash !== next) window.location.hash = TAB_TO_PATH[tab] ?? "/";
}
