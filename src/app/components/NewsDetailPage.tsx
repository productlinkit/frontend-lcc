import { useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar, ArrowRight, Clock, Eye } from "lucide-react";
import { useLang, useT } from "../i18n";
import type { Lang } from "../i18n";
import { content } from "../api/endpoints";
import { useQuery } from "../api/hooks";
import { text, type Bilingual } from "../api/types";
import { newsCatalogue, newsRouteId, newsSlugAt } from "../data/newsData";
import { newsHref, TAB_TO_PATH } from "../routes";

/*
 * Resolving the route id.
 *
 * The hash route is #/news/<n> with a numeric segment, while the API keys an
 * article by slug. Of the two options, this page takes the slug lookup and
 * keeps the numeric form working on top of it: the unfiltered catalogue (one
 * request, shared with the list page) is fetched once and the number is read as
 * a 1-based position in it, which yields the slug. A non-numeric segment is
 * treated as the slug directly, so the page already works if the route is ever
 * widened. Either way the article itself comes from GET /news/<slug>, which is
 * what increments view_count — the catalogue is only a lookup table.
 */

const L = (lang: Lang, en: string, lo: string) => (lang === "lo" ? lo : en);

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

function tint(color: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(color) ? `${color}1A` : "#EEF2FF";
}

function CategoryBadge({ label, color }: { label: Bilingual; color: string }) {
  const { lang } = useLang();
  return (
    <span
      className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full"
      style={{ backgroundColor: tint(color), color }}
    >
      {text(label, lang)}
    </span>
  );
}

export function NewsDetailPage({
  id,
  onBack,
  onOpenTab,
}: {
  /** Position in the catalogue (#/news/3) or an article slug. */
  id: number | string | null;
  onBack: () => void;
  onOpenTab: (tab: string) => void;
}) {
  const t = useT("news");
  const { lang } = useLang();

  const position = typeof id === "number" ? id : typeof id === "string" && /^\d+$/.test(id) ? Number(id) : null;
  const slugFromRoute = position === null && typeof id === "string" && id !== "" ? id : undefined;

  // Also the source for "More news" and for every outgoing article link.
  const catalogue = useQuery((signal) => newsCatalogue(signal), []);
  const slug = slugFromRoute ?? (position !== null ? newsSlugAt(catalogue.data, position) : undefined);

  const detail = useQuery((signal) => content.newsArticle(slug as string, signal), [slug], {
    enabled: Boolean(slug),
  });
  // While a new slug is in flight the previous article is still in the query
  // state; ignore it so the reader never sees the wrong headline.
  const article = detail.data?.slug === slug ? detail.data : undefined;

  // Navigating between articles keeps the same route, so reset the scroll here.
  useEffect(() => {
    document.querySelector("main")?.scrollTo({ top: 0 });
  }, [id]);

  const resolving = catalogue.loading || detail.loading || (Boolean(slug) && !article && !detail.error);
  const loadError = detail.error ?? catalogue.error;

  if (resolving) {
    return (
      <div className="min-h-full bg-[#F0F2F8]" aria-busy="true">
        <div className="bg-white border-b border-gray-100">
          <div className="w-full px-4 lg:px-8 py-3 flex items-center gap-3">
            <button
              onClick={onBack}
              aria-label={t("backToNews")}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <p className="text-sm font-semibold text-gray-800 truncate">{t("title")}</p>
          </div>
        </div>
        <div className="w-full px-4 lg:px-8 py-6">
          <div className="rounded-3xl h-52 sm:h-64 bg-gray-200 animate-pulse" />
          <div className="h-4 w-32 rounded-full bg-gray-200 animate-pulse mt-5" />
          <div className="h-6 w-3/4 rounded bg-gray-200 animate-pulse mt-4" />
          <div className="space-y-3 mt-5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-3 w-full rounded bg-gray-200 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (loadError && !loadError.isNotFound) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center p-8 text-center">
        <p className="text-gray-800 font-semibold text-sm">{loadError.message}</p>
        <button
          onClick={() => (detail.error ? detail.refetch() : catalogue.refetch())}
          className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#344EAD" }}
        >
          {L(lang, "Try again", "ລອງໃໝ່")}
        </button>
        <button
          onClick={onBack}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold"
          style={{ color: "#344EAD" }}
        >
          <ChevronLeft className="w-4 h-4" />
          {t("backToNews")}
        </button>
      </div>
    );
  }

  // Unknown / missing id — send the reader back to the list.
  if (!article) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center p-8 text-center">
        <p className="text-gray-500 text-sm">{t("empty")}</p>
        <button
          onClick={onBack}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold"
          style={{ color: "#344EAD" }}
        >
          <ChevronLeft className="w-4 h-4" />
          {t("backToNews")}
        </button>
      </div>
    );
  }

  const color = article.category_color;
  const paragraphs = text(article.body, lang)
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);

  // The API has no "related tab" field; a tag that names a real tab is used as
  // the deep link, and a service update otherwise points at the service list.
  const related =
    article.tags?.find((tag) => tag in TAB_TO_PATH) ??
    (article.category === "service" ? "service" : undefined);

  const more = (catalogue.data ?? []).filter((n) => n.slug !== article.slug).slice(0, 3);

  return (
    <div className="min-h-full bg-[#F0F2F8]">
      {/* Sub-header (non-sticky: a sticky bar would obscure focused controls, WCAG 2.4.11) */}
      <div className="bg-white border-b border-gray-100">
        <div className="w-full px-4 lg:px-8 py-3 flex items-center gap-3">
          <button
            onClick={onBack}
            aria-label={t("backToNews")}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <p className="text-sm font-semibold text-gray-800 truncate">{t("title")}</p>
        </div>
      </div>

      <article className="w-full px-4 lg:px-8 py-6">
        {/* Hero image */}
        <div className="relative rounded-3xl overflow-hidden h-52 sm:h-64">
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, ${color} 0%, #17235c 100%)` }}
          />
          {article.cover_url && (
            <img
              src={article.cover_url}
              alt=""
              aria-hidden
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
        </div>

        {/* Meta */}
        <div className="flex items-center flex-wrap gap-3 mt-5">
          <CategoryBadge label={article.category_name} color={color} />
          <span className="flex items-center gap-1.5 text-gray-500 text-xs">
            <Calendar className="w-3.5 h-3.5" aria-hidden />
            {day(article.published_date, lang)}
          </span>
          {article.read_minutes > 0 && (
            <span className="flex items-center gap-1.5 text-gray-500 text-xs">
              <Clock className="w-3.5 h-3.5" aria-hidden />
              {L(lang, `${article.read_minutes} min read`, `ອ່ານ ${article.read_minutes} ນາທີ`)}
            </span>
          )}
          {article.view_count > 0 && (
            <span className="flex items-center gap-1.5 text-gray-500 text-xs">
              <Eye className="w-3.5 h-3.5" aria-hidden />
              {article.view_count}
            </span>
          )}
        </div>

        {/* Title + body */}
        <h1 className="text-gray-900 font-bold text-2xl leading-snug mt-3">{text(article.title, lang)}</h1>
        <div className="mt-4 space-y-4">
          {(paragraphs.length > 0 ? paragraphs : [text(article.excerpt, lang)]).map((para, i) => (
            <p key={i} className="text-gray-600 text-[15px] leading-relaxed">
              {para}
            </p>
          ))}
        </div>

        {/* Related service */}
        {related && (
          <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color }}>
              {t("relatedTitle")}
            </p>
            <p className="text-gray-500 text-sm mt-1.5">{t("relatedDesc")}</p>
            <button
              onClick={() => onOpenTab(related)}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#344EAD" }}
            >
              {t("openService")}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* More news */}
        {more.length > 0 && (
          <div className="mt-10">
            <h2 className="text-gray-900 font-bold text-lg mb-4">{t("moreNews")}</h2>
            <div className="space-y-3">
              {more.map((n) => (
                <a
                  key={n.id}
                  href={newsHref(newsRouteId(catalogue.data, n.slug))}
                  className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 overflow-hidden p-2.5 hover:border-gray-200 transition-colors"
                >
                  <div className="relative w-24 h-20 rounded-xl overflow-hidden flex-shrink-0">
                    <div
                      className="absolute inset-0"
                      style={{ background: `linear-gradient(135deg, ${n.category_color} 0%, #17235c 100%)` }}
                    />
                    {n.cover_url && (
                      <img
                        src={n.cover_url}
                        alt=""
                        aria-hidden
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <CategoryBadge label={n.category_name} color={n.category_color} />
                    <p className="text-gray-800 text-sm font-semibold leading-snug mt-1.5 line-clamp-2">
                      {text(n.title, lang)}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" aria-hidden />
                </a>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
