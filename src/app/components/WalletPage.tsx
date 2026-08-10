import { useState } from "react";
import {
  Plus,
  Eye,
  EyeOff,
  ArrowDownLeft,
  ArrowUpRight,
  Zap,
  Droplet,
  Wifi,
  Receipt,
  AlertOctagon,
  ChevronRight,
  Smartphone,
  CreditCard,
  Send,
  QrCode,
  CalendarClock,
  CheckCircle2,
  RefreshCw,
  X,
  Wallet as WalletIcon,
} from "lucide-react";
import edlLogo from "../../imports/edl-logo.png";
import nampapaLogo from "../../imports/nampapa-logo.png";
import { useT, useLang } from "../i18n";
import { DialogShell } from "./DialogShell";
import { PaymentSection } from "./PaymentSection";
import { useMutation, useQuery } from "../api/hooks";
import { applications, me, payments } from "../api/endpoints";
import { text, type ApplicationRow, type Transaction, type WalletEntry } from "../api/types";

/*
 * The citizen's money: the wallet balance and its ledger (/me/wallet,
 * /me/wallet/entries), the receipts behind every payment (/me/transactions),
 * and the government fees still waiting to be paid — cases whose payment_state
 * is still "pending".
 */

type WalletKey = Parameters<ReturnType<typeof useT<"wallet">>>[0];

interface QuickAction {
  id: string;
  labelKey: WalletKey;
  icon: React.ElementType;
  logo?: string;
  color: string;
  bg: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: "topup", labelKey: "qaTopup", icon: Plus, color: "#16A34A", bg: "#DCFCE7" },
  { id: "transfer", labelKey: "qaTransfer", icon: Send, color: "#344EAD", bg: "#EEF2FF" },
  { id: "scan", labelKey: "qaScan", icon: QrCode, color: "#7C3AED", bg: "#EDE9FE" },
  { id: "mobile", labelKey: "qaMobile", icon: Smartphone, color: "#0EA5E9", bg: "#E0F2FE" },
  { id: "electricity", labelKey: "qaElectricity", icon: Zap, logo: edlLogo, color: "#F59E0B", bg: "#FEF3C7" },
  { id: "water", labelKey: "qaWater", icon: Droplet, logo: nampapaLogo, color: "#0891B2", bg: "#CFFAFE" },
  { id: "internet", labelKey: "qaInternet", icon: Wifi, color: "#DB2777", bg: "#FCE7F3" },
  { id: "fines", labelKey: "qaFines", icon: AlertOctagon, color: "#DC2626", bg: "#FEE2E2" },
];

function formatKip(amount: number, lang: "en" | "lo") {
  const abs = Math.abs(amount);
  return `${amount < 0 ? "-" : ""}${abs.toLocaleString(lang === "lo" ? "lo-LA" : "en-US")} ₭`;
}

function formatDay(value: string | undefined, lang: "en" | "lo") {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(lang === "lo" ? "lo-LA" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Whole days from now until `value`; negative once the date has passed. */
function daysUntil(value: string | undefined): number | null {
  if (!value) return null;
  const due = new Date(value).getTime();
  if (Number.isNaN(due)) return null;
  return Math.ceil((due - Date.now()) / 86_400_000);
}

interface WalletPageProps {
  isAuthenticated: boolean;
  onRequireAuth: () => void;
}

export function WalletPage({ isAuthenticated, onRequireAuth }: WalletPageProps) {
  const t = useT("wallet");
  const tc = useT("common");
  const { lang } = useLang();
  const [showBalance, setShowBalance] = useState(true);
  const [showLedger, setShowLedger] = useState(false);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [paying, setPaying] = useState<ApplicationRow | null>(null);

  const walletQuery = useQuery((signal) => me.wallet(signal), [], { enabled: isAuthenticated });
  const overview = walletQuery.data;

  const billsQuery = useQuery(
    (signal) => applications.list({ page: 1, per_page: 50 }, signal),
    [],
    { enabled: isAuthenticated },
  );

  const txQuery = useQuery(
    (signal) => me.transactions({ page: 1, per_page: 10 }, signal),
    [],
    { enabled: isAuthenticated },
  );

  const ledgerQuery = useQuery(
    (signal) => me.walletEntries({ page: ledgerPage, per_page: 10 }, signal),
    [ledgerPage],
    { enabled: isAuthenticated && showLedger },
  );

  const balance = overview?.wallet.balance_lak ?? 0;
  const bills = (billsQuery.data?.data ?? []).filter(
    (a) => a.payment_state === "pending" && a.fee_lak > 0,
  );
  const totalDue = bills.reduce((sum, b) => sum + b.fee_lak, 0);
  const receipts = txQuery.data?.data ?? [];
  // While page 1 of the ledger loads, the wallet overview already carries the
  // last few entries — show those rather than an empty panel.
  const entries: WalletEntry[] = ledgerQuery.data?.data ?? overview?.recent_entries ?? [];

  const refreshMoney = () => {
    walletQuery.refetch();
    billsQuery.refetch();
    txQuery.refetch();
    if (showLedger) ledgerQuery.refetch();
  };

  // Any wallet action while logged out routes to login first.
  const act = () => {
    if (!isAuthenticated) onRequireAuth();
  };

  const onQuickAction = (id: string) => {
    if (!isAuthenticated) return onRequireAuth();
    if (id === "topup") setTopUpOpen(true);
  };

  return (
    <div className="min-h-full">
      {/* Header / Balance card */}
      <div
        className="px-4 lg:px-8 pt-6 pb-10 text-white"
        style={{
          background:
            "linear-gradient(135deg, #344EAD 0%, #2A3F99 60%, #1E3070 100%)",
        }}
      >
        <div className="max-w-screen-xl mx-auto">
          <h1 className="text-white">{t("title")}</h1>
          <p className="text-white/70 text-sm mt-1">
            {t("subtitle")}
          </p>

          {/* Balance card */}
          <div className="mt-5 bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <p className="text-white/70 text-xs uppercase tracking-wider">
                {t("availableBalance")}
              </p>
              <button
                onClick={() => setShowBalance((s) => !s)}
                aria-label={showBalance ? t("hideBalance") : t("showBalance")}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
              >
                {showBalance ? (
                  <Eye className="w-4 h-4 text-white" />
                ) : (
                  <EyeOff className="w-4 h-4 text-white" />
                )}
              </button>
            </div>
            <p className="text-white mt-2" style={{ fontSize: "28px", fontWeight: 600 }}>
              {walletQuery.loading && !overview
                ? "…"
                : showBalance
                ? formatKip(balance, lang)
                : "•••••• ₭"}
            </p>
            {overview?.wallet.account_no && showBalance && (
              <p className="text-white/60 text-xs mt-1 font-mono">{overview.wallet.account_no}</p>
            )}
            {walletQuery.error && isAuthenticated && (
              <button
                onClick={walletQuery.refetch}
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-white/90 bg-white/15 border border-white/20 rounded-full px-3 py-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {lang === "lo" ? "ລອງໃໝ່" : "Try again"}
              </button>
            )}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => (isAuthenticated ? setTopUpOpen(true) : onRequireAuth())}
                className="flex-1 py-2.5 rounded-xl bg-white text-sm font-semibold flex items-center justify-center gap-1.5 shadow-md hover:opacity-90 transition-opacity"
                style={{ color: "#344EAD" }}
              >
                <Plus className="w-4 h-4" />
                {t("topUp")}
              </button>
              <button
                onClick={act}
                className="flex-1 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Send className="w-4 h-4" />
                {t("transfer")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 lg:px-8 pb-6 pt-10 -mt-4 space-y-6 max-w-screen-xl mx-auto">

        {/* Quick Payment */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-gray-800">{t("quickPayment")}</h2>
            <button
              onClick={act}
              className="text-xs font-medium flex items-center gap-1"
              style={{ color: "#344EAD" }}
            >
              {t("seeAll")} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-4 lg:grid-cols-8 gap-3">
            {QUICK_ACTIONS.map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.id}
                  onClick={() => onQuickAction(a.id)}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden transition-transform group-hover:-translate-y-0.5 group-hover:shadow-md"
                    style={{ backgroundColor: a.logo ? "white" : a.bg, border: a.logo ? "1px solid #F3F4F6" : undefined }}
                  >
                    {a.logo ? (
                      <img src={a.logo} alt="" className="w-full h-full object-contain p-1.5" />
                    ) : (
                      <Icon className="w-5 h-5" style={{ color: a.color }} />
                    )}
                  </div>
                  <span className="text-xs text-gray-600 text-center leading-tight">
                    {t(a.labelKey)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bills Due — government fees still waiting to be paid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-gray-800">{t("billsDue")}</h2>
              <p className="text-gray-500 text-xs mt-0.5">
                {bills.length > 0
                  ? t("billsSummary", {
                      total: formatKip(totalDue, lang),
                      count: bills.length,
                    })
                  : t("noBillsDue")}
              </p>
            </div>
            <button
              onClick={() => (isAuthenticated ? billsQuery.refetch() : onRequireAuth())}
              className="text-xs font-medium flex items-center gap-1"
              style={{ color: "#344EAD" }}
            >
              {t("viewAll")} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {isAuthenticated && billsQuery.loading && bills.length === 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {[0, 1].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/2 bg-gray-200 rounded" />
                    <div className="h-2.5 w-1/3 bg-gray-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : isAuthenticated && billsQuery.error ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
              <p className="text-gray-600 text-sm">{billsQuery.error.message}</p>
              <button
                onClick={billsQuery.refetch}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
                style={{ backgroundColor: "#344EAD" }}
              >
                <RefreshCw className="w-4 h-4" />
                {lang === "lo" ? "ລອງໃໝ່" : "Try again"}
              </button>
            </div>
          ) : bills.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Receipt className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">{t("noBillsDue")}</p>
              <p className="text-gray-400 text-xs mt-1">
                {isAuthenticated
                  ? lang === "lo"
                    ? "ຄ່າທຳນຽມທັງໝົດຂອງທ່ານຈ່າຍຄົບແລ້ວ."
                    : "Every fee on your cases has been paid."
                  : t("signInBills")}
              </p>
            </div>
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {bills.map((b) => {
              const days = daysUntil(b.due_at);
              const overdue = b.is_overdue || (days !== null && days < 0);
              const dueLabel =
                days === null
                  ? formatDay(b.due_at, lang)
                  : overdue
                  ? t("overdueDays", { n: Math.abs(days) })
                  : t("dueInDays", { n: days });
              const statusStyle = overdue
                ? { color: "#DC2626", bg: "#FEE2E2" }
                : days !== null && days <= 3
                ? { color: "#D97706", bg: "#FEF3C7" }
                : { color: "#6B7280", bg: "#F3F4F6" };

              return (
                <div
                  key={b.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 hover:shadow-md transition-shadow"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                    style={{ backgroundColor: "#EEF2FF" }}
                  >
                    <Receipt className="w-5 h-5" style={{ color: "#344EAD" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 leading-snug truncate">
                      {text(b.service_name, lang)}
                    </p>
                    <p className="text-xs text-gray-400 leading-relaxed truncate">
                      {b.reference_no}
                    </p>
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full mt-1"
                      style={{ color: statusStyle.color, backgroundColor: statusStyle.bg }}
                    >
                      <CalendarClock className="w-3 h-3" />
                      {dueLabel}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-800">
                      {formatKip(b.fee_lak, lang)}
                    </p>
                    <button
                      onClick={() => setPaying(b)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: "#344EAD" }}
                    >
                      {t("pay")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>

        {/* Recent transactions — receipts, or the full wallet ledger */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-gray-800">{t("recentTransactions")}</h2>
            <button
              onClick={() => {
                if (!isAuthenticated) return onRequireAuth();
                setLedgerPage(1);
                setShowLedger((s) => !s);
              }}
              className="text-xs font-medium flex items-center gap-1"
              style={{ color: "#344EAD" }}
            >
              {showLedger ? t("recentTransactions") : t("history")}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {!isAuthenticated ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <ArrowUpRight className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">{t("noRecentTransactions")}</p>
              <p className="text-gray-400 text-xs mt-1">{t("signInActivity")}</p>
            </div>
          ) : showLedger ? (
            <LedgerList
              entries={entries}
              loading={ledgerQuery.loading && entries.length === 0}
              errorMessage={ledgerQuery.error?.message}
              onRetry={ledgerQuery.refetch}
              page={ledgerQuery.data?.meta.page ?? ledgerPage}
              totalPages={ledgerQuery.data?.meta.total_pages ?? 1}
              onPage={setLedgerPage}
              lang={lang}
              emptyText={t("noRecentTransactions")}
              backLabel={tc("back")}
              nextLabel={tc("next")}
            />
          ) : txQuery.loading && receipts.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 p-4 animate-pulse">
                  <div className="w-10 h-10 rounded-xl bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/3 bg-gray-200 rounded" />
                    <div className="h-2.5 w-1/4 bg-gray-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : txQuery.error ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
              <p className="text-gray-600 text-sm">{txQuery.error.message}</p>
              <button
                onClick={txQuery.refetch}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
                style={{ backgroundColor: "#344EAD" }}
              >
                <RefreshCw className="w-4 h-4" />
                {lang === "lo" ? "ລອງໃໝ່" : "Try again"}
              </button>
            </div>
          ) : receipts.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <ArrowUpRight className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">{t("noRecentTransactions")}</p>
              <p className="text-gray-400 text-xs mt-1">
                {lang === "lo"
                  ? "ໃບຮັບເງິນຂອງທ່ານຈະປາກົດຢູ່ບ່ອນນີ້ຫຼັງຈາກຈ່າຍຄັ້ງທຳອິດ."
                  : "Your receipts will appear here after your first payment."}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
              {receipts.map((tx: Transaction) => {
                const isIn = tx.status === "refunded";
                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: isIn ? "#DCFCE7" : "#EEF2FF" }}
                    >
                      {isIn ? (
                        <ArrowDownLeft className="w-5 h-5" style={{ color: "#16A34A" }} />
                      ) : (
                        <Receipt className="w-5 h-5" style={{ color: "#344EAD" }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 leading-snug truncate">
                        {text(tx.service_name, lang) || tx.service_code || tx.kind}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {[tx.receipt_no, tx.reference_no, text(tx.method_label, lang) || tx.method_code]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p
                        className="text-sm font-semibold"
                        style={{ color: isIn ? "#16A34A" : "#1F2937" }}
                      >
                        {isIn ? "+" : ""}
                        {formatKip(tx.amount_lak, lang)}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5 flex items-center justify-end gap-1">
                        {tx.status === "paid" && (
                          <CheckCircle2 className="w-3 h-3" style={{ color: "#16A34A" }} />
                        )}
                        {formatDay(tx.paid_at ?? tx.date, lang)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="h-4" />
      </div>

      {/* Pay a case fee */}
      {paying && (
        <DialogShell
          onClose={() => setPaying(null)}
          overlayClassName="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-6"
          dialogClassName="bg-gray-50 w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-auto"
          label={text(paying.service_name, lang)}
        >
          <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-100 sticky top-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{paying.reference_no}</p>
            <button
              onClick={() => setPaying(null)}
              aria-label={tc("close")}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          <div className="p-5">
            <PaymentSection
              amount={paying.fee_lak}
              serviceName={text(paying.service_name, lang)}
              reference={paying.reference_no}
              applicationId={paying.id}
              onPaid={refreshMoney}
              onTopUp={() => {
                setPaying(null);
                setTopUpOpen(true);
              }}
            />
          </div>
        </DialogShell>
      )}

      {/* Top up */}
      {topUpOpen && (
        <TopUpDialog
          min={overview?.min_top_up_lak ?? 10000}
          max={overview?.max_top_up_lak ?? 50000000}
          onClose={() => setTopUpOpen(false)}
          onDone={() => {
            setTopUpOpen(false);
            refreshMoney();
          }}
        />
      )}
    </div>
  );
}

/* ── The wallet ledger ─────────────────────────────────────────────────── */

function LedgerList({
  entries,
  loading,
  errorMessage,
  onRetry,
  page,
  totalPages,
  onPage,
  lang,
  emptyText,
  backLabel,
  nextLabel,
}: {
  entries: WalletEntry[];
  loading: boolean;
  errorMessage?: string;
  onRetry: () => void;
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
  lang: "en" | "lo";
  emptyText: string;
  backLabel: string;
  nextLabel: string;
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 p-4 animate-pulse">
            <div className="w-10 h-10 rounded-xl bg-gray-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/3 bg-gray-200 rounded" />
              <div className="h-2.5 w-1/4 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
        <p className="text-gray-600 text-sm">{errorMessage}</p>
        <button
          onClick={onRetry}
          className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
          style={{ backgroundColor: "#344EAD" }}
        >
          <RefreshCw className="w-4 h-4" />
          {lang === "lo" ? "ລອງໃໝ່" : "Try again"}
        </button>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <WalletIcon className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-gray-500 text-sm">{emptyText}</p>
        <p className="text-gray-400 text-xs mt-1">
          {lang === "lo"
            ? "ຍັງບໍ່ມີການເຄື່ອນໄຫວໃນກະເປົາເງິນ."
            : "Nothing has moved through your wallet yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
        {entries.map((e) => {
          const isIn = e.direction === "credit";
          return (
            <div key={e.id} className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: isIn ? "#DCFCE7" : "#EEF2FF" }}
              >
                {isIn ? (
                  <ArrowDownLeft className="w-5 h-5" style={{ color: "#16A34A" }} />
                ) : (
                  <ArrowUpRight className="w-5 h-5" style={{ color: "#344EAD" }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 leading-snug truncate">
                  {text(e.description, lang) || e.kind}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {[e.reference_no, e.method_code].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold" style={{ color: isIn ? "#16A34A" : "#1F2937" }}>
                  {isIn ? "+" : "-"}
                  {formatKip(e.amount_lak, lang)}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {formatDay(e.occurred_at ?? e.date, lang)} · {formatKip(e.balance_after_lak, lang)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
          <button
            onClick={() => onPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="text-xs font-medium px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 disabled:opacity-40"
          >
            {backLabel}
          </button>
          <p className="text-xs text-gray-500">
            {page} / {totalPages}
          </p>
          <button
            onClick={() => onPage(page + 1)}
            disabled={page >= totalPages}
            className="text-xs font-medium px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 disabled:opacity-40"
          >
            {nextLabel}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Top-up ────────────────────────────────────────────────────────────── */

function TopUpDialog({
  min,
  max,
  onClose,
  onDone,
}: {
  min: number;
  max: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const t = useT("wallet");
  const tc = useT("common");
  const tp = useT("payment");
  const { lang } = useLang();

  const methods = useQuery((signal) => payments.methods(signal), []);
  // The wallet cannot top itself up; every other enabled method can.
  const options = (methods.data ?? []).filter((m) => m.enabled && m.code !== "wallet");
  const [picked, setPicked] = useState("");
  const [amount, setAmount] = useState<string>(String(min));
  const methodCode = picked || options[0]?.code || "";

  const topUp = useMutation((body: { amount_lak: number; method_code: string }) => me.topUpWallet(body));

  const value = Number(amount.replace(/[^\d]/g, "")) || 0;
  const tooSmall = value < min;
  const tooBig = value > max;
  const canSubmit = !tooSmall && !tooBig && Boolean(methodCode) && !topUp.pending;

  const submit = async () => {
    if (!canSubmit) return;
    try {
      await topUp.run({ amount_lak: value, method_code: methodCode });
      onDone();
    } catch {
      /* rendered from topUp.error */
    }
  };

  return (
    <DialogShell
      onClose={onClose}
      overlayClassName="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-6"
      dialogClassName="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-auto"
      label={t("topUp")}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
        <p className="text-sm font-semibold text-gray-800">{t("topUp")}</p>
        <button
          onClick={onClose}
          aria-label={tc("close")}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <div className="p-5 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
            {tp("amount")}
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
            className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#344EAD]/30"
          />
          <p className="text-xs text-gray-400 mt-1.5">
            {formatKip(min, lang)} – {formatKip(max, lang)}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {[50000, 100000, 200000, 500000]
              .filter((v) => v >= min && v <= max)
              .map((v) => (
                <button
                  key={v}
                  onClick={() => setAmount(String(v))}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                  style={
                    value === v
                      ? { backgroundColor: "#344EAD", color: "white", borderColor: "#344EAD" }
                      : { backgroundColor: "white", color: "#6B7280", borderColor: "#E5E7EB" }
                  }
                >
                  {formatKip(v, lang)}
                </button>
              ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
            {lang === "lo" ? "ຊ່ອງທາງຕື່ມເງິນ" : "Top-up method"}
          </label>
          {methods.loading ? (
            <div className="space-y-2">
              {[0, 1].map((i) => (
                <div key={i} className="h-14 rounded-2xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : methods.error ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600">{methods.error.message}</p>
              <button
                onClick={methods.refetch}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
                style={{ backgroundColor: "#344EAD" }}
              >
                <RefreshCw className="w-4 h-4" />
                {lang === "lo" ? "ລອງໃໝ່" : "Try again"}
              </button>
            </div>
          ) : options.length === 0 ? (
            <p className="text-sm text-gray-400">
              {lang === "lo"
                ? "ຍັງບໍ່ມີຊ່ອງທາງຕື່ມເງິນທີ່ເປີດໃຫ້ບໍລິການ."
                : "No top-up method is available right now."}
            </p>
          ) : (
            <div className="space-y-2">
              {options.map((m) => {
                const active = m.code === methodCode;
                return (
                  <button
                    key={m.code}
                    onClick={() => setPicked(m.code)}
                    className="w-full rounded-2xl p-3.5 border flex items-center gap-3 text-left transition-all"
                    style={{ borderColor: active ? "#344EAD" : "#E5E7EB" }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${m.color || "#344EAD"}1A` }}
                    >
                      <CreditCard className="w-4 h-4" style={{ color: m.color || "#344EAD" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{text(m.label, lang)}</p>
                      <p className="text-xs text-gray-400 truncate">{m.note}</p>
                    </div>
                    <span
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{ borderColor: active ? "#344EAD" : "#D1D5DB" }}
                    >
                      {active && <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#344EAD" }} />}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {(tooSmall || tooBig) && value > 0 && (
          <p className="text-sm" style={{ color: "#DC2626" }}>
            {lang === "lo"
              ? `ຈຳນວນເງິນຕ້ອງຢູ່ລະຫວ່າງ ${formatKip(min, lang)} ແລະ ${formatKip(max, lang)}.`
              : `Enter an amount between ${formatKip(min, lang)} and ${formatKip(max, lang)}.`}
          </p>
        )}
        {topUp.error && (
          <p className="text-sm" style={{ color: "#DC2626" }}>
            {topUp.error.message}
          </p>
        )}

        <button
          onClick={submit}
          disabled={!canSubmit}
          className="w-full py-3.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity disabled:opacity-60"
          style={{ backgroundColor: "#344EAD" }}
        >
          {topUp.pending
            ? lang === "lo"
              ? "ກຳລັງດຳເນີນການ…"
              : "Processing…"
            : `${t("topUp")} · ${formatKip(value, lang)}`}
        </button>
      </div>
    </DialogShell>
  );
}
