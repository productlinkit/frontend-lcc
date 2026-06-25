import { useState } from "react";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  History as HistoryIcon,
  Search,
  Filter,
} from "lucide-react";
import { HistoryDetailPage, type HistoryItem } from "./HistoryDetailPage";

const HISTORY: HistoryItem[] = [
  {
    id: 1,
    service: "Resident Certificate",
    refNo: "RC-2026-00341",
    date: "18 Apr 2026",
    submittedAt: "15 Apr 2026, 09:24",
    status: "approved",
    statusLabel: "Approved",
    fee: "20,000 ₭",
    office: "Vientiane Capital — District Office",
    steps: [
      { label: "Submitted", date: "15 Apr 2026, 09:24", done: true },
      { label: "Under Review", date: "16 Apr 2026, 11:05", done: true },
      { label: "Document Verified", date: "17 Apr 2026, 15:30", done: true },
      { label: "Approved", date: "18 Apr 2026, 10:12", done: true },
    ],
    currentStep: 3,
  },
  {
    id: 2,
    service: "Resident Certificate",
    refNo: "RC-2026-00289",
    date: "10 Apr 2026",
    submittedAt: "08 Apr 2026, 14:11",
    status: "rejected",
    statusLabel: "Rejected",
    fee: "20,000 ₭",
    office: "Vientiane Capital — District Office",
    rejectionReason:
      "The uploaded identity document is unclear and partly cropped. Officials cannot verify your full name and ID number.",
    fixSteps: [
      "Re-scan your National ID using good lighting, no shadows.",
      "Make sure all four corners of the card are visible.",
      "Use a resolution of at least 1080p (JPG or PDF, max 5MB).",
      "Re-upload the document and re-submit the application.",
    ],
    steps: [
      { label: "Submitted", date: "08 Apr 2026, 14:11", done: true },
      { label: "Under Review", date: "09 Apr 2026, 09:40", done: true },
      { label: "Rejected", date: "10 Apr 2026, 16:22", done: true, error: true },
    ],
    currentStep: 2,
  },
  {
    id: 3,
    service: "Biography / CV",
    refNo: "BCV-2026-00174",
    date: "02 Apr 2026",
    submittedAt: "02 Apr 2026, 08:50",
    status: "pending",
    statusLabel: "In Review",
    fee: "15,000 ₭",
    office: "Ministry of Labour",
    steps: [
      { label: "Submitted", date: "02 Apr 2026, 08:50", done: true },
      { label: "Under Review", date: "03 Apr 2026, 10:00", done: true },
      { label: "Document Verified", date: "Estimated 2 days", done: false },
      { label: "Approved", date: "—", done: false },
    ],
    currentStep: 1,
    estimatedCompletion: "2–3 business days",
  },
  {
    id: 4,
    service: "Birth Certificate",
    refNo: "BC-2026-00091",
    date: "20 Mar 2026",
    submittedAt: "16 Mar 2026, 11:30",
    status: "approved",
    statusLabel: "Approved",
    fee: "10,000 ₭",
    office: "Civil Registry — Vientiane",
    steps: [
      { label: "Submitted", date: "16 Mar 2026, 11:30", done: true },
      { label: "Under Review", date: "17 Mar 2026, 09:15", done: true },
      { label: "Document Verified", date: "19 Mar 2026, 14:20", done: true },
      { label: "Approved", date: "20 Mar 2026, 10:00", done: true },
    ],
    currentStep: 3,
  },
  {
    id: 5,
    service: "General Application",
    refNo: "GA-2026-00058",
    date: "10 Mar 2026",
    submittedAt: "07 Mar 2026, 16:00",
    status: "approved",
    statusLabel: "Approved",
    fee: "5,000 ₭",
    office: "District Administrative Office",
    steps: [
      { label: "Submitted", date: "07 Mar 2026, 16:00", done: true },
      { label: "Under Review", date: "08 Mar 2026, 09:20", done: true },
      { label: "Document Verified", date: "09 Mar 2026, 13:00", done: true },
      { label: "Approved", date: "10 Mar 2026, 11:45", done: true },
    ],
    currentStep: 3,
  },
];

const STATUS_CONFIG: Record<
  string,
  { bg: string; text: string; ring: string; icon: React.ElementType; label: string }
> = {
  approved: { bg: "#DCFCE7", text: "#16A34A", ring: "#86EFAC", icon: CheckCircle, label: "Approved" },
  rejected: { bg: "#FEE2E2", text: "#DC2626", ring: "#FCA5A5", icon: XCircle, label: "Rejected" },
  pending: { bg: "#FEF3C7", text: "#D97706", ring: "#FCD34D", icon: Clock, label: "In Review" },
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "pending", label: "In Review" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

export function HistoryPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [query, setQuery] = useState("");

  const selected = HISTORY.find((h) => h.id === selectedId) || null;

  if (selected) {
    return (
      <HistoryDetailPage
        item={selected}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  const filtered = HISTORY.filter((h) => {
    const matchesFilter = filter === "all" || h.status === filter;
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      h.service.toLowerCase().includes(q) ||
      h.refNo.toLowerCase().includes(q);
    return matchesFilter && matchesQuery;
  });

  const counts = {
    total: HISTORY.length,
    approved: HISTORY.filter((h) => h.status === "approved").length,
    pending: HISTORY.filter((h) => h.status === "pending").length,
    rejected: HISTORY.filter((h) => h.status === "rejected").length,
  };

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
          <h1 className="text-white">Application History</h1>
          <p className="text-white/70 text-sm mt-1">
            Track every request you've submitted
          </p>

          {/* Search */}
          <div className="mt-5 flex items-center gap-2 bg-white rounded-xl px-4 py-3 shadow-md">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by service or reference number..."
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
            { label: "Total", value: counts.total, color: "#344EAD", bg: "#EEF2FF" },
            { label: "Approved", value: counts.approved, color: "#16A34A", bg: "#DCFCE7" },
            { label: "In Review", value: counts.pending, color: "#D97706", bg: "#FEF3C7" },
            { label: "Rejected", value: counts.rejected, color: "#DC2626", bg: "#FEE2E2" },
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
                {s.value}
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
                {f.label}
              </button>
            );
          })}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-700 text-sm font-medium">No applications found</p>
            <p className="text-gray-400 text-xs mt-1">Try a different filter or search</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => {
              const config = STATUS_CONFIG[item.status];
              const StatusIcon = config.icon;
              const totalSteps = item.steps.length;
              const progressPct = Math.round(
                ((item.currentStep + 1) / totalSteps) * 100
              );

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
                            {item.service}
                          </p>
                          <p className="text-gray-400 text-xs mt-0.5">
                            Ref · {item.refNo}
                          </p>
                        </div>
                        <span
                          className="flex-shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide"
                          style={{ backgroundColor: config.bg, color: config.text }}
                        >
                          {item.statusLabel}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1.5">
                          <span>
                            Step {item.currentStep + 1} of {totalSteps} ·{" "}
                            {item.steps[item.currentStep].label}
                          </span>
                          <span>{progressPct}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${progressPct}%`,
                              backgroundColor:
                                item.status === "rejected"
                                  ? "#DC2626"
                                  : item.status === "approved"
                                  ? "#16A34A"
                                  : "#344EAD",
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <p className="text-[11px] text-gray-400">
                          Submitted {item.date}
                        </p>
                        <span
                          className="flex items-center gap-1 text-xs font-medium group-hover:gap-1.5 transition-all"
                          style={{ color: "#344EAD" }}
                        >
                          View details
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

        <div className="h-4" />
      </div>
    </div>
  );
}
