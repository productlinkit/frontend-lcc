import { Megaphone, ChevronRight } from "lucide-react";
import { useT } from "../i18n";
import type { Namespaces } from "../i18n/dict";

type NewsKey = keyof Namespaces["news"]["en"];

const NEWS = [
  {
    id: 1,
    date: "10 Apr 2026",
    categoryKey: "catSystemUpdate" as NewsKey,
    categoryColor: "#344EAD",
    categoryBg: "#EEF2FF",
    titleKey: "news1Title" as NewsKey,
    descKey: "news1Desc" as NewsKey,
    isNew: true,
  },
  {
    id: 2,
    date: "08 Apr 2026",
    categoryKey: "catServices" as NewsKey,
    categoryColor: "#16A34A",
    categoryBg: "#DCFCE7",
    titleKey: "news2Title" as NewsKey,
    descKey: "news2Desc" as NewsKey,
    isNew: true,
  },
  {
    id: 3,
    date: "05 Apr 2026",
    categoryKey: "catMaintenance" as NewsKey,
    categoryColor: "#D97706",
    categoryBg: "#FEF3C7",
    titleKey: "news3Title" as NewsKey,
    descKey: "news3Desc" as NewsKey,
    isNew: false,
  },
  {
    id: 4,
    date: "01 Apr 2026",
    categoryKey: "catPolicy" as NewsKey,
    categoryColor: "#9333EA",
    categoryBg: "#F3E8FF",
    titleKey: "news4Title" as NewsKey,
    descKey: "news4Desc" as NewsKey,
    isNew: false,
  },
  {
    id: 5,
    date: "28 Mar 2026",
    categoryKey: "catServices" as NewsKey,
    categoryColor: "#16A34A",
    categoryBg: "#DCFCE7",
    titleKey: "news5Title" as NewsKey,
    descKey: "news5Desc" as NewsKey,
    isNew: false,
  },
];

export function NewsPage() {
  const t = useT("news");
  return (
    <div className="min-h-full">
      {/* Header */}
      <div
        className="relative px-4 pt-6 pb-6 lg:px-8"
        style={{
          background: "linear-gradient(135deg, #1A2D6B 0%, #344EAD 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <p className="text-white/70 text-sm mb-1">{t("subtitle")}</p>
            <h1 className="text-2xl text-white">{t("title")}</h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/15 border border-white/20 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-8 py-6 max-w-2xl space-y-4">
        {NEWS.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{
                    backgroundColor: item.categoryBg,
                    color: item.categoryColor,
                  }}
                >
                  {t(item.categoryKey)}
                </span>
                {item.isNew && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-500 font-medium">
                    {t("new")}
                  </span>
                )}
              </div>
              <span className="text-gray-400 text-xs">{item.date}</span>
            </div>

            <h3 className="text-gray-800 text-sm font-medium leading-snug mb-2">
              {t(item.titleKey)}
            </h3>
            <p className="text-gray-400 text-xs leading-relaxed">{t(item.descKey)}</p>

            <button
              className="mt-3 flex items-center gap-1 text-xs font-medium"
              style={{ color: "#344EAD" }}
            >
              {t("readMore")} <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        ))}

        <div className="h-4" />
      </div>
    </div>
  );
}
