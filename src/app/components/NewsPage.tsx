import { useState } from "react";
import { ChevronLeft, ChevronRight, Megaphone } from "lucide-react";
import { useLang, useT } from "../i18n";
import type { Lang } from "../i18n";
import { content } from "../api/endpoints";
import { useQuery } from "../api/hooks";
import { text } from "../api/types";
import { newsCatalogue, newsRouteId } from "../data/newsData";
import { newsHref } from "../routes";

const PER_PAGE = 6;

/** Pick the language side of a short chrome string the dictionaries do not carry. */
const L = (lang: Lang, en: string, lo: string) => (lang === "lo" ? lo : en);

/** "2026-08-06" → "06 Aug 2026". */
function day(value: string | undefined, lang: Lang): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(lang === "lo" ? "lo-LA" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** A category colour at ~10% opacity, for the badge tint. */
function tint(color: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(color) ? `${color}1A` : "#EEF2FF";
}

export function NewsPage({ onBack }: { onBack: () => void }) {
  const t = useT("news");
  const { lang } = useLang();
  const [filter, setFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const categories = useQuery((signal) => content.newsCategories(signal), []);

  // Server-side filtering and paging: the category chip and the pager are both
  // query parameters, so the browser never holds more than one page of rows.
  const list = useQuery(
    (signal) =>
      content.news({ page, per_page: PER_PAGE, category: filter === "all" ? undefined : filter }, signal),
    [page, filter],
  );

  // The hash route is numeric, so an article's link needs its position in the
  // unfiltered catalogue — see the route bridge in data/newsData.ts.
  const catalogue = useQuery((signal) => newsCatalogue(signal), []);

  const items = list.data?.data ?? [];
  const meta = list.data?.meta;

  const pick = (c: string) => {
    setFilter(c);
    setPage(1);
  };

  return (
    <div className="min-h-full bg-[#F0F2F8]">
      {/* Header */}
      <div
        className="relative px-4 pt-5 pb-6 lg:px-8"
        style={{ background: "linear-gradient(135deg, #1A2D6B 0%, #344EAD 100%)" }}
      >
        <div className="max-w-2xl mx-auto">
          <button
            onClick={onBack}
            aria-label={t("back")}
            className="w-9 h-9 -ml-1 rounded-xl flex items-center justify-center text-white/90 hover:bg-white/15 transition-colors focus-ring-on-dark"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-start justify-between mt-2">
            <div>
              <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
              <p className="text-white/75 text-sm mt-1">{t("subtitle")}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0">
              <Megaphone className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 lg:px-8 py-6">
        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => pick("all")}
            aria-pressed={filter === "all"}
            className="px-4 py-2 rounded-full text-sm font-medium border transition-colors"
            style={
              filter === "all"
                ? { backgroundColor: "#344EAD", borderColor: "#344EAD", color: "white" }
                : { backgroundColor: "white", borderColor: "#E5E7EB", color: "#4B5563" }
            }
          >
            {t("allCategories")}
          </button>
          {(categories.data ?? []).map((c) => {
            const active = filter === c.code;
            return (
              <button
                key={c.id}
                onClick={() => pick(c.code)}
                aria-pressed={active}
                className="px-4 py-2 rounded-full text-sm font-medium border transition-colors"
                style={
                  active
                    ? { backgroundColor: c.color, borderColor: c.color, color: "white" }
                    : { backgroundColor: "white", borderColor: "#E5E7EB", color: "#4B5563" }
                }
              >
                {text(c.name, lang)}
              </button>
            );
          })}
        </div>

        {/* Article list */}
        {/* The catalogue is waited on too: every card's href is a position in it. */}
        {list.loading || catalogue.loading ? (
          <div className="space-y-4" aria-busy="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 bg-white rounded-2xl border border-gray-100 p-3">
                <div className="w-28 h-28 sm:w-36 rounded-xl bg-gray-100 animate-pulse flex-shrink-0" />
                <div className="min-w-0 flex-1 space-y-2 py-1">
                  <div className="h-4 w-24 rounded-full bg-gray-100 animate-pulse" />
                  <div className="h-4 w-full rounded bg-gray-100 animate-pulse" />
                  <div className="h-3 w-5/6 rounded bg-gray-100 animate-pulse" />
                  <div className="h-3 w-2/3 rounded bg-gray-100 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : list.error ? (
          <div className="text-center py-12">
            <p className="text-gray-800 font-semibold text-sm">{list.error.message}</p>
            <button
              onClick={list.refetch}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#344EAD" }}
            >
              {L(lang, "Try again", "ລອງໃໝ່")}
            </button>
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-12">{t("empty")}</p>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <a
                key={item.id}
                href={newsHref(newsRouteId(catalogue.data, item.slug))}
                className="flex gap-4 bg-white rounded-2xl border border-gray-100 overflow-hidden p-3 hover:border-gray-200 hover:shadow-sm transition-all"
              >
                <div className="relative w-28 h-28 sm:w-36 rounded-xl overflow-hidden flex-shrink-0">
                  <div
                    className="absolute inset-0"
                    style={{ background: `linear-gradient(135deg, ${item.category_color} 0%, #17235c 100%)` }}
                  />
                  {item.cover_url && (
                    <img
                      src={item.cover_url}
                      alt=""
                      aria-hidden
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1 flex flex-col">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: tint(item.category_color), color: item.category_color }}
                    >
                      {text(item.category_name, lang)}
                    </span>
                    <span className="text-gray-500 text-xs">{day(item.published_date, lang)}</span>
                  </div>
                  <p className="text-gray-800 text-sm font-semibold leading-snug mt-2 line-clamp-2">
                    {text(item.title, lang)}
                  </p>
                  <p className="text-gray-500 text-xs leading-relaxed mt-1 line-clamp-2 flex-1">
                    {text(item.excerpt, lang)}
                  </p>
                  <span
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold self-start"
                    style={{ color: "#344EAD" }}
                  >
                    {t("readMore")}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Pager — the list is paged on the server, so this moves the query */}
        {meta && meta.total_pages > 1 && !list.loading && !list.error && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!meta.has_prev}
              aria-label={L(lang, "Previous page", "ໜ້າກ່ອນ")}
              className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-300 transition-colors disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-gray-500 text-xs">
              {meta.page} / {meta.total_pages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!meta.has_next}
              aria-label={L(lang, "Next page", "ໜ້າຕໍ່ໄປ")}
              className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-300 transition-colors disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
