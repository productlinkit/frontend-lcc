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
  Eye,
  MessageSquare,
  Paperclip,
  ShieldCheck,
  QrCode,
  CreditCard,
  User,
} from "lucide-react";
import { useState } from "react";
import { useT, useLang } from "../i18n";
import { DocumentViewer } from "./DocumentViewer";
import { PaymentSection } from "./PaymentSection";
import { docSpecFromApplication } from "../data/documents";
import { generateDocumentPdf } from "../lib/document";
import { formatLak } from "../serviceConfig";
import { useQuery } from "../api/hooks";
import { applications, me } from "../api/endpoints";
import { text, type CaseStatus, type Lang, type PaymentState } from "../api/types";

/*
 * One case, read from the API: /applications/{id} for the case itself,
 * /applications/{id}/timeline for the trail of who did what, and — once the
 * case is issued — the certificate behind /me/certificates.
 */

export type StatusBucket = "approved" | "rejected" | "pending";

/** The stages a citizen sees a case move through, in order. */
export const PIPELINE: CaseStatus[] = ["submitted", "certified", "under-review", "registered", "issued"];

/** Nine backend statuses collapse into the three the citizen UI paints. */
export function bucketOf(status: CaseStatus): StatusBucket {
  if (status === "issued" || status === "registered") return "approved";
  if (status === "rejected" || status === "revoked" || status === "returned") return "rejected";
  return "pending";
}

/** How far along the pipeline the case is, as a 0–100 percentage. */
export function progressOf(status: CaseStatus): number {
  if (bucketOf(status) === "rejected") return 100;
  const stage = PIPELINE.indexOf(status);
  if (stage < 0) return 8; // draft — opened, not yet submitted
  return Math.round(((stage + 1) / PIPELINE.length) * 100);
}

/** Payment state as a word rather than a wire value. */
export function paymentLabel(state: PaymentState, lang: Lang): string {
  const table: Record<PaymentState, [string, string]> = {
    paid: ["Paid", "ຈ່າຍແລ້ວ"],
    pending: ["Unpaid", "ຍັງບໍ່ໄດ້ຈ່າຍ"],
    failed: ["Payment failed", "ຈ່າຍບໍ່ສຳເລັດ"],
    refunded: ["Refunded", "ຄືນເງິນແລ້ວ"],
    free: ["No fee", "ບໍ່ມີຄ່າທຳນຽມ"],
  };
  const pair = table[state] ?? ["—", "—"];
  return lang === "lo" ? pair[1] : pair[0];
}

/** Chip colours for a payment state, matching the status palette. */
export function paymentChipStyle(state: PaymentState): { backgroundColor: string; color: string } {
  if (state === "paid") return { backgroundColor: "#DCFCE7", color: "#15803D" };
  if (state === "pending") return { backgroundColor: "#FEF3C7", color: "#B45309" };
  if (state === "failed") return { backgroundColor: "#FEE2E2", color: "#DC2626" };
  return { backgroundColor: "#F3F4F6", color: "#6B7280" };
}

export function formatDate(value: string | undefined, lang: Lang): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(lang === "lo" ? "lo-LA" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value: string | undefined, lang: Lang): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${formatDate(value, lang)}, ${d.toLocaleTimeString(lang === "lo" ? "lo-LA" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

interface HistoryDetailPageProps {
  applicationId: string;
  onBack: () => void;
}

const STATUS_THEME = {
  approved: {
    color: "#16A34A",
    bg: "#DCFCE7",
    headlineKey: "approvedHeadline",
    subKey: "approvedSub",
    icon: CheckCircle2,
  },
  rejected: {
    color: "#DC2626",
    bg: "#FEE2E2",
    headlineKey: "rejectedHeadline",
    subKey: "rejectedSub",
    icon: XCircle,
  },
  pending: {
    color: "#D97706",
    bg: "#FEF3C7",
    headlineKey: "pendingHeadline",
    subKey: "pendingSub",
    icon: Clock,
  },
} as const;

export function HistoryDetailPage({ applicationId, onBack }: HistoryDetailPageProps) {
  const t = useT("history");
  const tc = useT("common");
  const { lang } = useLang();
  const [viewing, setViewing] = useState(false);
  const [paying, setPaying] = useState(false);

  const detailQuery = useQuery((signal) => applications.get(applicationId, signal), [applicationId]);
  const detail = detailQuery.data;

  const timelineQuery = useQuery((signal) => applications.timeline(applicationId, signal), [applicationId]);

  // The certificate only exists once the case is issued.
  const isIssued = detail?.status === "issued";
  const certListQuery = useQuery((signal) => me.certificates(signal), [], { enabled: Boolean(isIssued) });
  const certFromList = (certListQuery.data ?? []).find(
    (c) =>
      c.application_id === applicationId ||
      (detail?.certificate_id && c.id === detail.certificate_id) ||
      (detail?.reference_no && c.reference_no === detail.reference_no),
  );
  const certId = detail?.certificate_id;
  const certOneQuery = useQuery((signal) => me.certificate(certId as string, signal), [certId], {
    enabled: Boolean(isIssued && certId && !certFromList && !certListQuery.loading),
  });
  const certificate = certFromList ?? certOneQuery.data;

  const refresh = () => {
    detailQuery.refetch();
    timelineQuery.refetch();
    certListQuery.refetch();
  };

  /* ── Loading / error ─────────────────────────────────────────────────── */

  if (detailQuery.loading && !detail) {
    return (
      <div className="min-h-full">
        <div
          className="px-4 lg:px-8 pt-5 pb-8 text-white"
          style={{ background: "linear-gradient(135deg, #344EAD 0%, #2A3F99 60%, #1E3070 100%)" }}
        >
          <div className="max-w-screen-xl mx-auto">
            <button onClick={onBack} className="flex items-center gap-1 text-white/80 hover:text-white text-sm">
              <ChevronLeft className="w-4 h-4" />
              {t("backToHistory")}
            </button>
            <div className="mt-6 h-6 w-2/3 bg-white/20 rounded animate-pulse" />
            <div className="mt-2 h-4 w-1/3 bg-white/10 rounded animate-pulse" />
          </div>
        </div>
        <div className="px-4 lg:px-8 py-6 max-w-screen-xl mx-auto -mt-4 space-y-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-pulse space-y-3">
              <div className="h-4 w-1/3 bg-gray-200 rounded" />
              <div className="h-3 w-2/3 bg-gray-100 rounded" />
              <div className="h-3 w-1/2 bg-gray-100 rounded" />
            </div>
          ))}
          <p className="text-center text-xs text-gray-400">{tc("loading")}</p>
        </div>
      </div>
    );
  }

  if (!detail) {
    const message = detailQuery.error?.isNotFound
      ? lang === "lo"
        ? "ບໍ່ພົບຄຳຮ້ອງນີ້."
        : "This application could not be found."
      : detailQuery.error?.message ??
        (lang === "lo" ? "ບໍ່ສາມາດໂຫຼດຄຳຮ້ອງໄດ້." : "This application could not be loaded.");
    return (
      <div className="min-h-full">
        <div
          className="px-4 lg:px-8 pt-5 pb-8 text-white"
          style={{ background: "linear-gradient(135deg, #344EAD 0%, #2A3F99 60%, #1E3070 100%)" }}
        >
          <div className="max-w-screen-xl mx-auto">
            <button onClick={onBack} className="flex items-center gap-1 text-white/80 hover:text-white text-sm">
              <ChevronLeft className="w-4 h-4" />
              {t("backToHistory")}
            </button>
          </div>
        </div>
        <div className="px-4 lg:px-8 py-6 max-w-screen-xl mx-auto -mt-4">
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <AlertOctagon className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-700 text-sm">{message}</p>
            <button
              onClick={detailQuery.refetch}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
              style={{ backgroundColor: "#344EAD" }}
            >
              <RefreshCw className="w-4 h-4" />
              {lang === "lo" ? "ລອງໃໝ່" : "Try again"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Content ─────────────────────────────────────────────────────────── */

  const bucket = bucketOf(detail.status);
  const theme = STATUS_THEME[bucket];
  const StatusIcon = theme.icon;
  const serviceName = text(detail.service_name, lang);
  const docTitle = `${serviceName} · ${detail.reference_no}`;
  const spec = docSpecFromApplication(detail, certificate, lang);
  const progressPct = progressOf(detail.status);
  const events = timelineQuery.data?.events ?? detail.timeline ?? [];
  const attachments = detail.attachments ?? [];
  const canPay = detail.payment_state === "pending" && detail.fee_lak > 0;
  const office =
    [detail.jurisdiction?.district_name, detail.jurisdiction?.province_name].filter(Boolean).join(" · ") || "—";

  const handleDownload = () => {
    const href = URL.createObjectURL(generateDocumentPdf(spec));
    const a = document.createElement("a");
    a.href = href;
    a.download = `${detail.reference_no}.pdf`;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(href), 4000);
  };

  return (
    <div className="min-h-full">
      {/* Header */}
      <div
        className="px-4 lg:px-8 pt-5 pb-8 text-white"
        style={{
          background: "linear-gradient(135deg, #344EAD 0%, #2A3F99 60%, #1E3070 100%)",
        }}
      >
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-white/80 hover:text-white text-sm transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              {t("backToHistory")}
            </button>
            <span
              className="flex-shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-full uppercase tracking-wide"
              style={{ backgroundColor: theme.bg, color: theme.color }}
            >
              {text(detail.status_label, lang)}
            </span>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/70 text-xs uppercase tracking-wider">{t("applicationLabel")}</p>
              <h1 className="text-white leading-tight">{serviceName}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Hash className="w-3 h-3 text-white/60" />
                <p className="text-white/70 text-sm">{detail.reference_no}</p>
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
              <p className="text-sm font-semibold" style={{ color: theme.color }}>
                {t(theme.headlineKey)}
              </p>
              <p className="text-gray-500 text-xs mt-0.5">{t(theme.subKey)}</p>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1.5">
                  <span>{t("overallProgress")}</span>
                  <span>{progressPct}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${progressPct}%`, backgroundColor: theme.color }}
                  />
                </div>
              </div>

              {/* Payment + SLA chips */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span
                  className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                  style={paymentChipStyle(detail.payment_state)}
                >
                  {paymentLabel(detail.payment_state, lang)} · {formatLak(detail.fee_lak, lang)}
                </span>
                {detail.is_overdue ? (
                  <span
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}
                  >
                    {lang === "lo"
                      ? `ເກີນກຳນົດ ${detail.days_overdue} ມື້`
                      : `${detail.days_overdue} days overdue`}
                  </span>
                ) : (
                  <span
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: "#EEF2FF", color: "#344EAD" }}
                  >
                    {lang === "lo"
                      ? `ລໍຖ້າ ${detail.days_waiting} ມື້ / SLA ${detail.sla_days}`
                      : `${detail.days_waiting} of ${detail.sla_days} SLA days`}
                  </span>
                )}
                {detail.assigned_officer && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-gray-500">
                    <User className="w-3 h-3" />
                    {detail.assigned_officer}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action row */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 mt-5 pt-5 border-t border-gray-100">
            {isIssued && (
              <>
                <button
                  onClick={() => setViewing(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: "#344EAD" }}
                >
                  <Eye className="w-4 h-4" />
                  {t("viewDocument")}
                </button>
                <button
                  onClick={handleDownload}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {t("downloadDocument")}
                </button>
              </>
            )}
            {canPay && (
              <button
                onClick={() => setPaying((p) => !p)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#D97706" }}
              >
                <CreditCard className="w-4 h-4" />
                {lang === "lo"
                  ? `ຈ່າຍ ${formatLak(detail.fee_lak, lang)}`
                  : `Pay ${formatLak(detail.fee_lak, lang)}`}
              </button>
            )}
            <button
              onClick={refresh}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${detailQuery.refreshing ? "animate-spin" : ""}`} />
              {t("refreshStatus")}
            </button>
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors">
              <MessageSquare className="w-4 h-4" />
              {t("contactOfficer")}
            </button>
          </div>
        </div>

        {/* Payment panel */}
        {canPay && paying && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <PaymentSection
              amount={detail.fee_lak}
              serviceName={serviceName}
              reference={detail.reference_no}
              applicationId={detail.id}
              onPaid={() => {
                detailQuery.refetch();
                timelineQuery.refetch();
              }}
            />
          </div>
        )}

        {/* Why it came back */}
        {bucket === "rejected" && detail.reason_note && (
          <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
            <div className="px-5 py-3 flex items-center gap-2" style={{ backgroundColor: "#FEF2F2" }}>
              <AlertOctagon className="w-4 h-4" style={{ color: "#DC2626" }} />
              <p className="text-sm font-semibold" style={{ color: "#DC2626" }}>
                {t("whyRejected")}
              </p>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-700 leading-relaxed">{detail.reason_note}</p>
            </div>
          </div>
        )}

        {/* Certificate */}
        {isIssued && (certificate || detail.certificate_no) && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4" style={{ color: "#16A34A" }} />
              <p className="text-sm font-semibold text-gray-800">
                {lang === "lo" ? "ໃບຢັ້ງຢືນທີ່ອອກແລ້ວ" : "Issued certificate"}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow
                icon={Hash}
                label={lang === "lo" ? "ເລກໃບຢັ້ງຢືນ" : "Certificate number"}
                value={certificate?.certificate_no ?? detail.certificate_no ?? "—"}
              />
              <InfoRow
                icon={Calendar}
                label={lang === "lo" ? "ວັນທີອອກ" : "Issued on"}
                value={formatDate(certificate?.issued_at ?? detail.issued_at, lang)}
              />
              {certificate?.verify_code && (
                <InfoRow
                  icon={ShieldCheck}
                  label={lang === "lo" ? "ລະຫັດກວດສອບ" : "Verification code"}
                  value={certificate.verify_code}
                />
              )}
              {certificate?.qr_payload && (
                <InfoRow icon={QrCode} label={lang === "lo" ? "QR" : "QR payload"} value={certificate.qr_payload} />
              )}
            </div>
            {!certificate && !certListQuery.loading && (
              <p className="text-xs text-gray-400 mt-3">
                {lang === "lo"
                  ? "ຍັງບໍ່ສາມາດອ່ານລະຫັດກວດສອບຂອງໃບຢັ້ງຢືນນີ້ໄດ້ໃນຂະນະນີ້."
                  : "The verification code for this certificate is not available yet."}
              </p>
            )}
          </div>
        )}

        {/* Application progress timeline */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm font-semibold text-gray-800">{t("applicationProgress")}</p>
            {detail.due_at && bucket === "pending" && (
              <span
                className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                style={{ backgroundColor: "#FEF3C7", color: "#D97706" }}
              >
                {t("eta", { value: formatDate(detail.due_at, lang) })}
              </span>
            )}
          </div>

          {timelineQuery.loading && events.length === 0 ? (
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-6 h-6 rounded-full bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/3 bg-gray-200 rounded" />
                    <div className="h-2.5 w-1/4 bg-gray-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : timelineQuery.error && events.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600">{timelineQuery.error.message}</p>
              <button
                onClick={timelineQuery.refetch}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
                style={{ backgroundColor: "#344EAD" }}
              >
                <RefreshCw className="w-4 h-4" />
                {lang === "lo" ? "ລອງໃໝ່" : "Try again"}
              </button>
            </div>
          ) : events.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">
              {lang === "lo"
                ? "ຍັງບໍ່ມີການເຄື່ອນໄຫວໃນຄຳຮ້ອງນີ້ເທື່ອ."
                : "Nothing has happened on this case yet."}
            </p>
          ) : (
            <ol className="relative">
              {events.map((event, idx) => {
                const isLast = idx === events.length - 1;
                const isError = bucketOf(event.to_status) === "rejected";
                const isCurrent = isLast && !isError;
                const dotColor = isError ? "#DC2626" : "#16A34A";
                const lineColor = isError ? "#E5E7EB" : "#16A34A";

                return (
                  <li key={event.id} className="relative pl-9 pb-5 last:pb-0">
                    {!isLast && (
                      <span className="absolute left-3 top-6 bottom-0 w-0.5" style={{ backgroundColor: lineColor }} />
                    )}
                    <span
                      className="absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: isError ? "#FEE2E2" : "#DCFCE7",
                        boxShadow: isCurrent ? `0 0 0 4px rgba(52,78,173,0.15)` : undefined,
                      }}
                    >
                      {isError ? (
                        <XCircle className="w-4 h-4" style={{ color: dotColor }} />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" style={{ color: dotColor }} />
                      )}
                    </span>
                    <div>
                      <p
                        className="text-sm font-medium"
                        style={{ color: isError ? "#DC2626" : "#1F2937" }}
                      >
                        {text(event.status_label, lang) || event.to_status}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(event.occurred_at, lang)}</p>
                      {(event.actor_name || event.note) && (
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                          {[event.actor_name, event.note].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* Attachments */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Paperclip className="w-4 h-4" style={{ color: "#344EAD" }} />
            <p className="text-sm font-semibold text-gray-800">
              {lang === "lo" ? "ເອກະສານແນບ" : "Attachments"}
            </p>
          </div>
          {attachments.length === 0 ? (
            <p className="text-sm text-gray-400">
              {lang === "lo" ? "ບໍ່ມີເອກະສານແນບໃນຄຳຮ້ອງນີ້." : "No files are attached to this case."}
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {attachments.map((a) => (
                <a
                  key={a.id}
                  href={a.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:bg-gray-50 transition-colors -mx-2 px-2 rounded-xl"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#EEF2FF" }}
                  >
                    <FileText className="w-4 h-4" style={{ color: "#344EAD" }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-800 font-medium truncate">{a.label || a.file_name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {a.slot} · {Math.max(1, Math.round(a.size_bytes / 1024))} KB ·{" "}
                      {formatDate(a.uploaded_at, lang)}
                    </p>
                  </div>
                  <Download className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Application info */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm font-semibold text-gray-800 mb-4">{t("applicationInfo")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow icon={Hash} label={t("referenceNumber")} value={detail.reference_no} />
            <InfoRow
              icon={Calendar}
              label={t("submitted")}
              value={formatDateTime(detail.submitted_at ?? detail.created_at, lang)}
            />
            <InfoRow icon={Building2} label={t("processingOffice")} value={office} />
            <InfoRow icon={Coins} label={t("serviceFee")} value={formatLak(detail.fee_lak, lang)} />
          </div>
        </div>

        <div className="h-4" />
      </div>

      {viewing && (
        <DocumentViewer
          title={docTitle}
          spec={spec}
          downloadName={`${detail.reference_no}.pdf`}
          verifyCode={certificate?.verify_code}
          qrPayload={certificate?.qr_payload}
          onClose={() => setViewing(false)}
        />
      )}
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
        <p className="text-sm text-gray-800 font-medium leading-snug break-all">{value}</p>
      </div>
    </div>
  );
}
