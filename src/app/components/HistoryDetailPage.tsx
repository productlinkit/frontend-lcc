import {
  ChevronLeft,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  AlertOctagon,
  Building2,
  Calendar,
  Coins,
  Hash,
  RefreshCw,
  Download,
  MessageSquare,
  Upload,
  ListChecks,
} from "lucide-react";

export interface HistoryStep {
  label: string;
  date: string;
  done: boolean;
  error?: boolean;
}

export interface HistoryItem {
  id: number;
  service: string;
  refNo: string;
  date: string;
  submittedAt: string;
  status: "approved" | "rejected" | "pending";
  statusLabel: string;
  fee: string;
  office: string;
  steps: HistoryStep[];
  currentStep: number;
  rejectionReason?: string;
  fixSteps?: string[];
  estimatedCompletion?: string;
}

interface HistoryDetailPageProps {
  item: HistoryItem;
  onBack: () => void;
}

const STATUS_THEME = {
  approved: {
    color: "#16A34A",
    bg: "#DCFCE7",
    headline: "Application approved",
    sub: "Your document is ready to download.",
    icon: CheckCircle2,
  },
  rejected: {
    color: "#DC2626",
    bg: "#FEE2E2",
    headline: "Application rejected",
    sub: "Please review the reason below and resubmit.",
    icon: XCircle,
  },
  pending: {
    color: "#D97706",
    bg: "#FEF3C7",
    headline: "Application in review",
    sub: "Officials are currently processing your request.",
    icon: Clock,
  },
} as const;

export function HistoryDetailPage({ item, onBack }: HistoryDetailPageProps) {
  const theme = STATUS_THEME[item.status];
  const StatusIcon = theme.icon;

  const progressPct = Math.round(
    ((item.currentStep + 1) / item.steps.length) * 100
  );

  return (
    <div className="min-h-full">
      {/* Header */}
      <div
        className="px-4 lg:px-8 pt-5 pb-8 text-white"
        style={{
          background:
            "linear-gradient(135deg, #344EAD 0%, #2A3F99 60%, #1E3070 100%)",
        }}
      >
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-white/80 hover:text-white text-sm transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to history
            </button>
            <span
              className="flex-shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-full uppercase tracking-wide"
              style={{ backgroundColor: theme.bg, color: theme.color }}
            >
              {item.statusLabel}
            </span>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/70 text-xs uppercase tracking-wider">
                Application
              </p>
              <h1 className="text-white leading-tight">{item.service}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Hash className="w-3 h-3 text-white/60" />
                <p className="text-white/70 text-sm">{item.refNo}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 lg:px-8 py-6 max-w-screen-xl mx-auto -mt-4 space-y-5">
        {/* Status hero card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: theme.bg }}
            >
              <StatusIcon className="w-6 h-6" style={{ color: theme.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-semibold"
                style={{ color: theme.color }}
              >
                {theme.headline}
              </p>
              <p className="text-gray-500 text-xs mt-0.5">{theme.sub}</p>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1.5">
                  <span>Overall progress</span>
                  <span>{progressPct}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${progressPct}%`,
                      backgroundColor: theme.color,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action row */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 mt-5 pt-5 border-t border-gray-100">
            {item.status === "approved" && (
              <button
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#344EAD" }}
              >
                <Download className="w-4 h-4" />
                Download document
              </button>
            )}
            {item.status === "rejected" && (
              <button
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#344EAD" }}
              >
                <RefreshCw className="w-4 h-4" />
                Fix & resubmit
              </button>
            )}
            {item.status === "pending" && (
              <button
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#344EAD" }}
              >
                <RefreshCw className="w-4 h-4" />
                Refresh status
              </button>
            )}
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors">
              <MessageSquare className="w-4 h-4" />
              Contact officer
            </button>
          </div>
        </div>

        {/* Rejection reason — only for rejected */}
        {item.status === "rejected" && item.rejectionReason && (
          <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
            <div
              className="px-5 py-3 flex items-center gap-2"
              style={{ backgroundColor: "#FEF2F2" }}
            >
              <AlertOctagon className="w-4 h-4" style={{ color: "#DC2626" }} />
              <p className="text-sm font-semibold" style={{ color: "#DC2626" }}>
                Why was this rejected?
              </p>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-700 leading-relaxed">
                {item.rejectionReason}
              </p>

              {item.fixSteps && item.fixSteps.length > 0 && (
                <div className="mt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <ListChecks className="w-4 h-4" style={{ color: "#344EAD" }} />
                    <p className="text-sm font-semibold text-gray-800">
                      How to fix it
                    </p>
                  </div>
                  <ol className="space-y-2.5">
                    {item.fixSteps.map((s, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span
                          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
                          style={{
                            backgroundColor: "#EEF2FF",
                            color: "#344EAD",
                          }}
                        >
                          {i + 1}
                        </span>
                        <p className="text-sm text-gray-700 leading-relaxed pt-0.5">
                          {s}
                        </p>
                      </li>
                    ))}
                  </ol>

                  <button
                    className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: "#DC2626" }}
                  >
                    <Upload className="w-4 h-4" />
                    Re-upload document
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Application progress timeline */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm font-semibold text-gray-800">
              Application progress
            </p>
            {item.estimatedCompletion && (
              <span
                className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                style={{ backgroundColor: "#FEF3C7", color: "#D97706" }}
              >
                ETA {item.estimatedCompletion}
              </span>
            )}
          </div>

          <ol className="relative">
            {item.steps.map((step, idx) => {
              const isLast = idx === item.steps.length - 1;
              const isError = step.error;
              const isCurrent = idx === item.currentStep && !step.error;
              const dotColor = isError
                ? "#DC2626"
                : step.done
                ? "#16A34A"
                : "#D1D5DB";
              const lineColor = step.done && !isError ? "#16A34A" : "#E5E7EB";

              return (
                <li key={idx} className="relative pl-9 pb-5 last:pb-0">
                  {/* Connector line */}
                  {!isLast && (
                    <span
                      className="absolute left-3 top-6 bottom-0 w-0.5"
                      style={{ backgroundColor: lineColor }}
                    />
                  )}
                  {/* Dot */}
                  <span
                    className="absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: isError
                        ? "#FEE2E2"
                        : step.done
                        ? "#DCFCE7"
                        : "#F3F4F6",
                      boxShadow: isCurrent
                        ? `0 0 0 4px rgba(52,78,173,0.15)`
                        : undefined,
                    }}
                  >
                    {isError ? (
                      <XCircle className="w-4 h-4" style={{ color: dotColor }} />
                    ) : step.done ? (
                      <CheckCircle2
                        className="w-4 h-4"
                        style={{ color: dotColor }}
                      />
                    ) : (
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: dotColor }}
                      />
                    )}
                  </span>
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{
                        color: isError
                          ? "#DC2626"
                          : step.done
                          ? "#1F2937"
                          : "#9CA3AF",
                      }}
                    >
                      {step.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{step.date}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Application info */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm font-semibold text-gray-800 mb-4">
            Application info
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow
              icon={Hash}
              label="Reference number"
              value={item.refNo}
            />
            <InfoRow
              icon={Calendar}
              label="Submitted"
              value={item.submittedAt}
            />
            <InfoRow
              icon={Building2}
              label="Processing office"
              value={item.office}
            />
            <InfoRow icon={Coins} label="Service fee" value={item.fee} />
          </div>
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: "#EEF2FF" }}
      >
        <Icon className="w-4 h-4" style={{ color: "#344EAD" }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm text-gray-800 font-medium leading-snug">
          {value}
        </p>
      </div>
    </div>
  );
}
