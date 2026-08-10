import { useEffect, useState } from "react";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  ChevronLeft,
  Search,
  Filter,
  RefreshCw,
  AlertOctagon,
  Timer,
} from "lucide-react";
import {
  HistoryDetailPage,
  PIPELINE,
  bucketOf,
  formatDate,
  paymentChipStyle,
  paymentLabel,
  progressOf,
  type StatusBucket,
} from "./HistoryDetailPage";
import { useT, useLang } from "../i18n";
import { useDebounced, useQuery } from "../api/hooks";
import { applications } from "../api/endpoints";
import { useSession } from "../api/session";
import { text, type ApplicationRow, type CaseStatus } from "../api/types";

/*
 * Every case the citizen has opened, straight from /applications.
 *
 * Filtering, searching and paging all happen server-side: the chip sets the
 * `status` values, the search box sets `search`, and the page number rides
 * along, so what is on screen is what the API returned rather than a slice of
 * a list held in the browser.
 */

const PER_PAGE = 10;

const STATUS_CONFIG: Record<StatusBucket, { bg: string; text: string; ring: string; icon: React.ElementType }> = {
  approved: { bg: "#DCFCE7", text: "#15803D", ring: "#86EFAC", icon: CheckCircle },
  rejected: { bg: "#FEE2E2", text: "#DC2626", ring: "#FCA5A5", icon: XCircle },
  pending: { bg: "#FEF3C7", text: "#D97706", ring: "#FCD34D", icon: Clock },
};

/** Chip id → the backend statuses it stands for. */
const FILTER_STATUSES: Record<string, CaseStatus[] | undefined> = {
  all: undefined,
  pending: ["draft", "submitted", "certified", "under-review"],
  approved: ["registered", "issued"],
  rejected: ["returned", "rejected", "revoked"],
};

const FILTERS = [
  { id: "all", labelKey: "filterAll" },
  { id: "pending", labelKey: "filterInReview" },
  { id: "approved", labelKey: "filterApproved" },
  { id: "rejected", labelKey: "filterRejected" },
] as const;

export function HistoryPage() {
  const t = useT("history");
  const tc = useT("common");
  const { lang } = useLang();
  const { isAuthenticated } = useSession();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const search = useDebounced(query.trim(), 350);

  // A new filter or search term starts again from the first page.
  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  const list = useQuery(
    (signal) =>
      applications.list(
        {
          page,
          per_page: PER_PAGE,
          status: FILTER_STATUSES[filter],
          search: search || undefined,
        },
        signal,
      ),
    [page, filter, search],
    { enabled: isAuthenticated },
  );

  // The four stat tiles are counts, so each asks for a single row and reads the
  // total out of the pagination block.
  const counts = useQuery(
    async (signal) => {
      const ask = (status?: CaseStatus[]) =>
        applications.list({ page: 1, per_page: 1, status }, signal).then((p) => p.meta.total);
      const [total, approved, pending, rejected] = await Promise.all([
        ask(),
        ask(FILTER_STATUSES.approved),
        ask(FILTER_STATUSES.pending),
        ask(FILTER_STATUSES.rejected),
      ]);
      return { total, approved, pending, rejected };
    },
    [],
    { enabled: isAuthenticated },
  );

  if (selectedId) {
    return (
      <HistoryDetailPage
        applicationId={selectedId}
        onBack={() => {
          setSelectedId(null);
          list.refetch();
          counts.refetch();
        }}
      />
    );
  }

  const rows = list.data?.data ?? [];
  const meta = list.data?.meta;
  const tiles = counts.data ?? { total: 0, approved: 0, pending: 0, rejected: 0 };

  return (
    <div className="min-h-full">
      {/* Header — matching other pages */}
      <div
        className="px-4 lg:px-8 pt-6 pb-8 text-white"
        style={{
          background:
            "linear-gradient(135deg, #344EAD 0%, #2A3F99 60%, #1E3070 100%)",
        }}
      >
        <div className="max-w-screen-xl mx-auto">
          <h1 className="text-white">{t("title")}</h1>
          <p className="text-white/70 text-sm mt-1">{t("subtitle")}</p>

          {/* Search */}
          <div className="mt-5 flex items-center gap-2 bg-white rounded-xl px-4 py-3 shadow-md">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-gray-700 text-sm placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Content — full width */}
      <div className="px-4 lg:px-8 py-6 max-w-screen-xl mx-auto -mt-4 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: t("statTotal"), value: tiles.total, color: "#344EAD", bg: "#EEF2FF" },
            { label: t("statApproved"), value: tiles.approved, color: "#16A34A", bg: "#DCFCE7" },
            { label: t("statInReview"), value: tiles.pending, color: "#D97706", bg: "#FEF3C7" },
            { label: t("statRejected"), value: tiles.rejected, color: "#DC2626", bg: "#FEE2E2" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">{s.label}</p>
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
              </div>
              <p
                className="mt-1"
                style={{ color: s.color, fontSize: "22px", fontWeight: 600 }}
              >
                {counts.loading ? "—" : s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
          {FILTERS.map((f) => {
            const isActive = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all"
                style={
                  isActive
                    ? {
                        backgroundColor: "#344EAD",
                        color: "white",
                        borderColor: "#344EAD",
                      }
                    : {
                        backgroundColor: "white",
                        color: "#6B7280",
                        borderColor: "#E5E7EB",
                      }
                }
              >
                {t(f.labelKey)}
              </button>
            );
          })}
        </div>

        {/* List */}
        {!isAuthenticated ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-700 text-sm font-medium">{t("emptyTitle")}</p>
            <p className="text-gray-400 text-xs mt-1">
              {lang === "lo"
                ? "ເຂົ້າສູ່ລະບົບເພື່ອເບິ່ງຄຳຮ້ອງຂອງທ່ານ"
                : "Sign in to see the applications you have submitted"}
            </p>
          </div>
        ) : list.loading && rows.length === 0 ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="h-3.5 w-2/5 bg-gray-200 rounded" />
                    <div className="h-3 w-1/4 bg-gray-100 rounded" />
                    <div className="h-1.5 w-full bg-gray-100 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : list.error ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-3">
              <AlertOctagon className="w-6 h-6" style={{ color: "#DC2626" }} />
            </div>
            <p className="text-gray-700 text-sm font-medium">{list.error.message}</p>
            <button
              onClick={list.refetch}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
              style={{ backgroundColor: "#344EAD" }}
            >
              <RefreshCw className="w-4 h-4" />
              {lang === "lo" ? "ລອງໃໝ່" : "Try again"}
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-700 text-sm font-medium">{t("emptyTitle")}</p>
            <p className="text-gray-400 text-xs mt-1">
              {search || filter !== "all"
                ? t("emptySubtitle")
                : lang === "lo"
                ? "ເມື່ອທ່ານຍື່ນຄຳຮ້ອງ ມັນຈະປາກົດຢູ່ບ່ອນນີ້."
                : "Once you submit a request it will show up here."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((item: ApplicationRow) => {
              const bucket = bucketOf(item.status);
              const config = STATUS_CONFIG[bucket];
              const StatusIcon = config.icon;
              const stage = PIPELINE.indexOf(item.status);
              const progressPct = progressOf(item.status);

              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className="w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200 text-left group"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon with status ring */}
                    <div className="relative flex-shrink-0">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{ backgroundColor: "#EEF2FF" }}
                      >
                        <FileText className="w-5 h-5" style={{ color: "#344EAD" }} />
                      </div>
                      <div
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white"
                        style={{ backgroundColor: config.bg }}
                      >
                        <StatusIcon className="w-3 h-3" style={{ color: config.text }} />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-gray-800 text-sm font-semibold leading-snug">
                            {text(item.service_name, lang)}
                          </p>
                          <p className="text-gray-400 text-xs mt-0.5">
                            {t("ref")} · {item.reference_no}
                          </p>
                        </div>
                        <span
                          className="flex-shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide"
                          style={{ backgroundColor: config.bg, color: config.text }}
                        >
                          {text(item.status_label, lang)}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1.5">
                          <span>
                            {t("stepProgress", {
                              current: Math.max(1, stage + 1),
                              total: PIPELINE.length,
                              label: text(item.status_label, lang),
                            })}
                          </span>
                          <span>{progressPct}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${progressPct}%`,
                              backgroundColor:
                                bucket === "rejected"
                                  ? "#DC2626"
                                  : bucket === "approved"
                                  ? "#16A34A"
                                  : "#344EAD",
                            }}
                          />
                        </div>
                      </div>

                      {/* Payment + SLA */}
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={paymentChipStyle(item.payment_state)}
                        >
                          {paymentLabel(item.payment_state, lang)}
                        </span>
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                          style={
                            item.is_overdue
                              ? { backgroundColor: "#FEE2E2", color: "#DC2626" }
                              : { backgroundColor: "#F3F4F6", color: "#6B7280" }
                          }
                        >
                          <Timer className="w-3 h-3" />
                          {item.is_overdue
                            ? lang === "lo"
                              ? `ເກີນກຳນົດ ${item.days_overdue} ມື້`
                              : `${item.days_overdue} days overdue`
                            : lang === "lo"
                            ? `ລໍຖ້າ ${item.days_waiting}/${item.sla_days} ມື້`
                            : `${item.days_waiting}/${item.sla_days} days`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <p className="text-[11px] text-gray-400">
                          {t("submittedOn", {
                            date: formatDate(item.submitted_at ?? item.created_at, lang),
                          })}
                        </p>
                        <span
                          className="flex items-center gap-1 text-xs font-medium group-hover:gap-1.5 transition-all"
                          style={{ color: "#344EAD" }}
                        >
                          {t("viewDetails")}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Paging */}
        {meta && meta.total_pages > 1 && (
          <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!meta.has_prev || list.loading}
              className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              {tc("back")}
            </button>
            <p className="text-xs text-gray-500">
              {meta.page} / {meta.total_pages} · {meta.total}
            </p>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!meta.has_next || list.loading}
              className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 disabled:opacity-40"
            >
              {tc("next")}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}
