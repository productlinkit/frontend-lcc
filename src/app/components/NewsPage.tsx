import { useState } from "react";
import { ChevronLeft, ChevronRight, Megaphone } from "lucide-react";
import { useLang, useT } from "../i18n";
import {
  NEWS_ITEMS,
  NEWS_CATEGORIES,
  newsImage,
  type NewsCategory,
} from "../data/newsData";
import { newsHref } from "../routes";

const CATEGORY_ORDER: NewsCategory[] = ["announcement", "service", "security", "event"];

export function NewsPage({ onBack }: { onBack: () => void }) {
  const t = useT("news");
  const { lang } = useLang();
  const [filter, setFilter] = useState<NewsCategory | "all">("all");

  const items = filter === "all" ? NEWS_ITEMS : NEWS_ITEMS.filter((n) => n.category === filter);

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
            onClick={() => setFilter("all")}
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
          {CATEGORY_ORDER.map((c) => {
            const active = filter === c;
            const meta = NEWS_CATEGORIES[c];
            return (
              <button
                key={c}
                onClick={() => setFilter(c)}
                aria-pressed={active}
                className="px-4 py-2 rounded-full text-sm font-medium border transition-colors"
                style={
                  active
                    ? { backgroundColor: meta.color, borderColor: meta.color, color: "white" }
                    : { backgroundColor: "white", borderColor: "#E5E7EB", color: "#4B5563" }
                }
              >
                {meta[lang]}
              </button>
            );
          })}
        </div>

        {/* Article list */}
        {items.length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-12">{t("empty")}</p>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const meta = NEWS_CATEGORIES[item.category];
              return (
                <a
                  key={item.id}
                  href={newsHref(item.id)}
                  className="flex gap-4 bg-white rounded-2xl border border-gray-100 overflow-hidden p-3 hover:border-gray-200 hover:shadow-sm transition-all"
                >
                  <div className="relative w-28 h-28 sm:w-36 rounded-xl overflow-hidden flex-shrink-0">
                    <div
                      className="absolute inset-0"
                      style={{ background: `linear-gradient(135deg, ${meta.color} 0%, #17235c 100%)` }}
                    />
                    <img
                      src={newsImage(item.img, 400)}
                      alt=""
                      aria-hidden
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: meta.bg, color: meta.color }}
                      >
                        {meta[lang]}
                      </span>
                      <span className="text-gray-500 text-xs">{item.date[lang]}</span>
                    </div>
                    <p className="text-gray-800 text-sm font-semibold leading-snug mt-2 line-clamp-2">
                      {item[lang].title}
                    </p>
                    <p className="text-gray-500 text-xs leading-relaxed mt-1 line-clamp-2 flex-1">
                      {item[lang].desc}
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
