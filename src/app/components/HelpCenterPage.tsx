import { useState } from "react";
import {
  Search,
  X,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  LifeBuoy,
  UserCircle,
  FileText,
  Wallet,
  Shield,
  ShieldCheck,
  Rocket,
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  BookOpen,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { useLang, useT } from "../i18n";
import type { Lang } from "../i18n";
import { content } from "../api/endpoints";
import { useDebounced, useMutation, useQuery } from "../api/hooks";
import { text } from "../api/types";
import { tabHref } from "../routes";

const PER_PAGE = 10;

const L = (lang: Lang, en: string, lo: string) => (lang === "lo" ? lo : en);

/** The API sends an icon name; this maps the ones it uses onto lucide icons. */
const ICONS: Record<string, typeof UserCircle> = {
  Rocket,
  FileText,
  Wallet,
  Shield,
  ShieldCheck,
  UserCircle,
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  BookOpen,
  LifeBuoy,
};

function icon(name: string | undefined, fallback: typeof UserCircle = FileText) {
  return (name && ICONS[name]) || fallback;
}

/* The palette stays in the UI: the categories are data, their colours are design. */
const PALETTE = [
  { color: "#344EAD", bg: "#EEF2FF" },
  { color: "#B45309", bg: "#FEF3C7" },
  { color: "#15803D", bg: "#DCFCE7" },
  { color: "#6366F1", bg: "#E0E7FF" },
];
const swatch = (i: number) => PALETTE[i % PALETTE.length];

/** A help category that names an app tab gets a deep link on its answers. */
const CATEGORY_TAB: Record<string, string> = {
  services: "service",
  payments: "wallet",
  account: "account",
};

function ErrorBlock({ message, onRetry, lang }: { message: string; onRetry: () => void; lang: Lang }) {
  return (
    <div className="text-center py-10">
      <p className="text-gray-800 font-semibold text-sm">{message}</p>
      <button
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90"
        style={{ backgroundColor: "#344EAD" }}
      >
        {L(lang, "Try again", "ລອງໃໝ່")}
      </button>
    </div>
  );
}

export function HelpCenterPage({ onTabChange }: { onTabChange: (tab: string) => void }) {
  const t = useT("help");
  const { lang } = useLang();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<string | null>(null);
  const [openGuide, setOpenGuide] = useState<string | null>(null);
  const [voted, setVoted] = useState<Record<string, boolean>>({});

  const search = useDebounced(query.trim(), 350);

  const categories = useQuery((signal) => content.helpCategories(signal), []);

  // The question list is searched, filtered and paged on the server.
  const faqs = useQuery(
    (signal) =>
      content.faqs(
        { page, per_page: PER_PAGE, category: cat === "all" ? undefined : cat, search: search || undefined },
        signal,
      ),
    [page, cat, search],
  );

  const guides = useQuery((signal) => content.helpArticles(signal), []);
  const guide = useQuery((signal) => content.helpArticle(openGuide as string, signal), [openGuide], {
    enabled: Boolean(openGuide),
  });
  const channels = useQuery((signal) => content.supportChannels(signal), []);

  const feedback = useMutation(({ id, helpful }: { id: string; helpful: boolean }) =>
    content.faqFeedback(id, helpful),
  );

  const items = faqs.data?.data ?? [];
  const meta = faqs.data?.meta;
  const total = meta?.total ?? items.length;
  const searching = query.trim().length > 0;

  /** Position and icon of a category, so a question wears its topic's colour. */
  const catMeta = (code: string) => {
    const list = categories.data ?? [];
    const index = list.findIndex((c) => c.code === code);
    return { index: index < 0 ? 0 : index, icon: icon(list[index]?.icon) };
  };

  const vote = async (id: string, helpful: boolean) => {
    setVoted((prev) => ({ ...prev, [id]: helpful }));
    try {
      await feedback.run({ id, helpful });
    } catch {
      // A failed vote is not worth interrupting the reader; leave the thanks in
      // place rather than flipping the row back under their finger.
    }
  };

  return (
    <div className="min-h-full">
      {/* Header band */}
      <div
        className="relative overflow-hidden px-4 lg:px-8 pt-10 pb-12 text-white"
        style={{ background: "linear-gradient(135deg, #344EAD 0%, #1a2d7a 100%)" }}
      >
        <div
          className="pointer-events-none absolute -top-16 -right-10 w-64 h-64 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(245,158,11,0.28) 0%, transparent 70%)" }}
        />
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center mx-auto mb-4">
            <LifeBuoy className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-bold text-2xl lg:text-3xl">{t("title")}</h1>
          <p className="text-white/75 text-sm mt-2">{t("subtitle")}</p>

          {/* Search */}
          <div className="mt-6 flex items-center gap-2 bg-white rounded-2xl p-1.5 shadow-lg">
            <Search className="w-5 h-5 text-gray-400 ml-3 flex-shrink-0" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              aria-label={t("searchLabel")}
              placeholder={t("searchPlaceholder")}
              className="flex-1 min-w-0 bg-transparent outline-none text-gray-800 text-sm py-2.5 placeholder:text-gray-400"
            />
            {searching && (
              <button
                onClick={() => {
                  setQuery("");
                  setPage(1);
                }}
                aria-label={t("clearSearch")}
                className="w-8 h-8 mr-1 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-8 py-8 max-w-3xl mx-auto">
        {/* Topic filter */}
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => {
              setCat("all");
              setPage(1);
            }}
            aria-pressed={cat === "all"}
            className="px-4 py-2 rounded-full text-sm font-medium border transition-colors"
            style={
              cat === "all"
                ? { backgroundColor: "#344EAD", borderColor: "#344EAD", color: "white" }
                : { backgroundColor: "white", borderColor: "#E5E7EB", color: "#4B5563" }
            }
          >
            {t("allTopics")}
          </button>
          {(categories.data ?? []).map((c, i) => {
            const active = cat === c.code;
            const Icon = icon(c.icon);
            return (
              <button
                key={c.id}
                onClick={() => {
                  setCat(c.code);
                  setPage(1);
                }}
                aria-pressed={active}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-colors"
                style={
                  active
                    ? { backgroundColor: "#344EAD", borderColor: "#344EAD", color: "white" }
                    : { backgroundColor: "white", borderColor: "#E5E7EB", color: "#4B5563" }
                }
              >
                <Icon className="w-4 h-4" style={{ color: active ? "white" : swatch(i).color }} />
                {text(c.name, lang)}
              </button>
            );
          })}
        </div>

        {/* Result count */}
        {!faqs.loading && !faqs.error && (
          <p className="text-center text-gray-500 text-xs mt-5" aria-live="polite">
            {total === 1 ? t("resultsOne") : t("resultsMany", { count: total })}
          </p>
        )}

        {/* Questions */}
        {faqs.loading ? (
          <div className="mt-6 space-y-3" aria-busy="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 animate-pulse flex-shrink-0" />
                <div className="h-4 flex-1 rounded bg-gray-100 animate-pulse" />
              </div>
            ))}
          </div>
        ) : faqs.error ? (
          <ErrorBlock message={faqs.error.message} onRetry={faqs.refetch} lang={lang} />
        ) : items.length === 0 ? (
          <div className="text-center py-14">
            <p className="text-gray-800 font-semibold">{t("noResults")}</p>
            <p className="text-gray-500 text-sm mt-1.5">{t("noResultsDesc")}</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {items.map((a) => {
              const isOpen = open === a.id;
              const topic = catMeta(a.category);
              const s = swatch(topic.index);
              const Icon = topic.icon;
              const relatedTab = CATEGORY_TAB[a.category];
              const myVote = voted[a.id];
              return (
                <div key={a.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => setOpen(isOpen ? null : a.id)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-3 p-4 text-left"
                  >
                    <span className="flex items-start gap-3 min-w-0">
                      <span
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: s.bg }}
                      >
                        <Icon className="w-4 h-4" style={{ color: s.color }} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-gray-800 font-semibold text-base leading-snug">
                          {text(a.question, lang)}
                        </span>
                        {a.helpful >= 5 && !searching && (
                          <span className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: "#EEF2FF", color: "#344EAD" }}>
                            {t("popular")}
                          </span>
                        )}
                      </span>
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      aria-hidden
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pl-15">
                      <p className="text-gray-500 text-sm leading-relaxed">{text(a.answer, lang)}</p>
                      {relatedTab && (
                        <button
                          onClick={() => onTabChange(relatedTab)}
                          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold"
                          style={{ color: "#344EAD" }}
                        >
                          {t("relatedService")}
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                      {/* Was this helpful? */}
                      <div className="mt-4 flex items-center gap-2">
                        {myVote === undefined ? (
                          <>
                            <span className="text-gray-400 text-xs mr-1">
                              {L(lang, "Was this helpful?", "ຄຳຕອບນີ້ຊ່ວຍໄດ້ບໍ?")}
                            </span>
                            <button
                              onClick={() => vote(a.id, true)}
                              aria-label={L(lang, "Yes, this helped", "ແມ່ນ, ຊ່ວຍໄດ້")}
                              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors"
                            >
                              <ThumbsUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => vote(a.id, false)}
                              aria-label={L(lang, "No, this did not help", "ບໍ່, ຍັງບໍ່ຊ່ວຍ")}
                              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors"
                            >
                              <ThumbsDown className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <span className="text-xs font-medium" style={{ color: "#15803D" }}>
                            {L(lang, "Thanks for the feedback", "ຂອບໃຈສຳລັບຄຳຄິດເຫັນ")}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pager */}
        {meta && meta.total_pages > 1 && !faqs.loading && !faqs.error && (
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

        {/* Step-by-step guides */}
        <div className="mt-10">
          <h2 className="text-gray-900 font-bold text-lg mb-4">{L(lang, "Step-by-step guides", "ຄູ່ມືເທື່ອລະຂັ້ນຕອນ")}</h2>
          {guides.loading ? (
            <div className="space-y-3" aria-busy="true">
              {[0, 1].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 animate-pulse flex-shrink-0" />
                  <div className="h-4 flex-1 rounded bg-gray-100 animate-pulse" />
                </div>
              ))}
            </div>
          ) : guides.error ? (
            <ErrorBlock message={guides.error.message} onRetry={guides.refetch} lang={lang} />
          ) : (guides.data ?? []).length === 0 ? (
            <p className="text-gray-500 text-sm">
              {L(lang, "No guides have been published yet.", "ຍັງບໍ່ມີຄູ່ມືທີ່ເຜີຍແຜ່.")}
            </p>
          ) : (
            <div className="space-y-3">
              {(guides.data ?? []).map((g) => {
                const isOpen = openGuide === g.slug;
                return (
                  <div key={g.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <button
                      onClick={() => setOpenGuide(isOpen ? null : g.slug)}
                      aria-expanded={isOpen}
                      className="w-full flex items-center justify-between gap-3 p-4 text-left"
                    >
                      <span className="flex items-start gap-3 min-w-0">
                        <span
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: "#EEF2FF" }}
                        >
                          <BookOpen className="w-4 h-4" style={{ color: "#344EAD" }} />
                        </span>
                        <span className="block text-gray-800 font-semibold text-base leading-snug min-w-0">
                          {text(g.title, lang)}
                        </span>
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                        aria-hidden
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pl-15">
                        {guide.error ? (
                          <ErrorBlock message={guide.error.message} onRetry={guide.refetch} lang={lang} />
                        ) : guide.data?.slug === g.slug ? (
                          // The body only comes with the single-article endpoint.
                          <p className="text-gray-500 text-sm leading-relaxed whitespace-pre-line">
                            {text(guide.data.body, lang)}
                          </p>
                        ) : (
                          <div className="space-y-2" aria-busy="true">
                            {[0, 1, 2].map((i) => (
                              <div key={i} className="h-3 w-full rounded bg-gray-100 animate-pulse" />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Still stuck */}
        <div className="mt-10 rounded-2xl border border-gray-100 bg-white p-6 text-center">
          <p className="text-gray-800 font-semibold">{t("stillStuck")}</p>
          <p className="text-gray-500 text-sm mt-1.5 max-w-md mx-auto leading-relaxed">
            {t("stillStuckDesc")}
          </p>

          {channels.loading ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2" aria-busy="true">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : channels.error ? (
            <ErrorBlock message={channels.error.message} onRetry={channels.refetch} lang={lang} />
          ) : (channels.data ?? []).length === 0 ? (
            <a
              href={tabHref("account")}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#344EAD" }}
            >
              {t("contactSupport")}
              <ChevronRight className="w-4 h-4" />
            </a>
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 text-left">
              {(channels.data ?? []).map((ch) => {
                const Icon = icon(ch.icon, MessageCircle);
                const href =
                  ch.kind === "phone"
                    ? `tel:${ch.value.replace(/\s+/g, "")}`
                    : ch.kind === "email"
                      ? `mailto:${ch.value}`
                      : undefined;
                const body = (
                  <>
                    <span
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "#EEF2FF" }}
                    >
                      <Icon className="w-4 h-4" style={{ color: "#344EAD" }} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-gray-800 text-sm font-semibold truncate">
                        {text(ch.label, lang)}
                      </span>
                      <span className="block text-gray-500 text-xs truncate">{ch.value}</span>
                      <span className="block text-gray-400 text-[11px] mt-0.5">{text(ch.hours, lang)}</span>
                    </span>
                  </>
                );
                return href ? (
                  <a
                    key={ch.id}
                    href={href}
                    className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 hover:border-gray-200 hover:shadow-sm transition-all"
                  >
                    {body}
                  </a>
                ) : (
                  <div key={ch.id} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3">
                    {body}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
