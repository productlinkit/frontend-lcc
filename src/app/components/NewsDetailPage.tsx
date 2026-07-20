import { useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar, ArrowRight } from "lucide-react";
import { useLang, useT } from "../i18n";
import {
  NEWS_ITEMS,
  NEWS_CATEGORIES,
  getNewsItem,
  newsImage,
} from "../data/newsData";
import { newsHref } from "../routes";

function CategoryBadge({ category }: { category: keyof typeof NEWS_CATEGORIES }) {
  const { lang } = useLang();
  const meta = NEWS_CATEGORIES[category];
  return (
    <span
      className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full"
      style={{ backgroundColor: meta.bg, color: meta.color }}
    >
      {meta[lang]}
    </span>
  );
}

export function NewsDetailPage({
  id,
  onBack,
  onOpenTab,
}: {
  id: number | null;
  onBack: () => void;
  onOpenTab: (tab: string) => void;
}) {
  const t = useT("news");
  const { lang } = useLang();
  const article = id != null ? getNewsItem(id) : undefined;

  // Navigating between articles keeps the same route, so reset the scroll here.
  useEffect(() => {
    document.querySelector("main")?.scrollTo({ top: 0 });
  }, [id]);

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

  const copy = article[lang];
  const meta = NEWS_CATEGORIES[article.category];
  const related = article.relatedTab;
  const more = NEWS_ITEMS.filter((n) => n.id !== article.id).slice(0, 3);

  return (
    <div className="min-h-full bg-[#F0F2F8]">
      {/* Sub-header (non-sticky: a sticky bar would obscure focused controls, WCAG 2.4.11) */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-screen-sm mx-auto px-4 py-3 flex items-center gap-3">
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

      <article className="max-w-screen-sm mx-auto px-4 py-6">
        {/* Hero image */}
        <div className="relative rounded-3xl overflow-hidden h-52 sm:h-64">
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, ${meta.color} 0%, #17235c 100%)` }}
          />
          <img
            src={newsImage(article.img, 1080)}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 mt-5">
          <CategoryBadge category={article.category} />
          <span className="flex items-center gap-1.5 text-gray-500 text-xs">
            <Calendar className="w-3.5 h-3.5" aria-hidden />
            {article.date[lang]}
          </span>
        </div>

        {/* Title + body */}
        <h1 className="text-gray-900 font-bold text-2xl leading-snug mt-3">{copy.title}</h1>
        <div className="mt-4 space-y-4">
          {copy.body.map((para, i) => (
            <p key={i} className="text-gray-600 text-[15px] leading-relaxed">
              {para}
            </p>
          ))}
        </div>

        {/* Related service */}
        {related && (
          <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: meta.color }}>
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
        <div className="mt-10">
          <h2 className="text-gray-900 font-bold text-lg mb-4">{t("moreNews")}</h2>
          <div className="space-y-3">
            {more.map((n) => (
              <a
                key={n.id}
                href={newsHref(n.id)}
                className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 overflow-hidden p-2.5 hover:border-gray-200 transition-colors"
              >
                <div className="relative w-24 h-20 rounded-xl overflow-hidden flex-shrink-0">
                  <div
                    className="absolute inset-0"
                    style={{ background: `linear-gradient(135deg, ${NEWS_CATEGORIES[n.category].color} 0%, #17235c 100%)` }}
                  />
                  <img
                    src={newsImage(n.img, 240)}
                    alt=""
                    aria-hidden
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <CategoryBadge category={n.category} />
                  <p className="text-gray-800 text-sm font-semibold leading-snug mt-1.5 line-clamp-2">
                    {n[lang].title}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" aria-hidden />
              </a>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}
