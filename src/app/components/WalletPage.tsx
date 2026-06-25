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
} from "lucide-react";
import { useT, useLang } from "../i18n";

type WalletKey = Parameters<ReturnType<typeof useT<"wallet">>>[0];

interface Bill {
  id: string;
  nameKey: WalletKey;
  descKey: WalletKey;
  amount: number;
  dueKey: "dueInDays" | "overdueDays";
  dueDays: number;
  status: "overdue" | "due-soon" | "upcoming";
  icon: React.ElementType;
  color: string;
  bg: string;
}

interface Transaction {
  id: string;
  nameKey: WalletKey;
  descKey: WalletKey;
  amount: number;
  dateKey: WalletKey;
  type: "out" | "in";
  icon: React.ElementType;
}

interface QuickAction {
  id: string;
  labelKey: WalletKey;
  icon: React.ElementType;
  color: string;
  bg: string;
}

const BILLS: Bill[] = [
  {
    id: "elec",
    nameKey: "billElecName",
    descKey: "billElecDesc",
    amount: 285000,
    dueKey: "dueInDays",
    dueDays: 3,
    status: "due-soon",
    icon: Zap,
    color: "#F59E0B",
    bg: "#FEF3C7",
  },
  {
    id: "water",
    nameKey: "billWaterName",
    descKey: "billWaterDesc",
    amount: 92000,
    dueKey: "overdueDays",
    dueDays: 2,
    status: "overdue",
    icon: Droplet,
    color: "#DC2626",
    bg: "#FEE2E2",
  },
  {
    id: "internet",
    nameKey: "billInternetName",
    descKey: "billInternetDesc",
    amount: 220000,
    dueKey: "dueInDays",
    dueDays: 9,
    status: "upcoming",
    icon: Wifi,
    color: "#0EA5E9",
    bg: "#E0F2FE",
  },
  {
    id: "fine",
    nameKey: "billFineName",
    descKey: "billFineDesc",
    amount: 150000,
    dueKey: "dueInDays",
    dueDays: 5,
    status: "due-soon",
    icon: AlertOctagon,
    color: "#EA580C",
    bg: "#FFEDD5",
  },
];

const TRANSACTIONS: Transaction[] = [
  {
    id: "t1",
    nameKey: "txTaxName",
    descKey: "txTaxDesc",
    amount: -480000,
    dateKey: "dateToday",
    type: "out",
    icon: Receipt,
  },
  {
    id: "t2",
    nameKey: "txTopupName",
    descKey: "txTopupDesc",
    amount: 1000000,
    dateKey: "dateYesterday",
    type: "in",
    icon: ArrowDownLeft,
  },
  {
    id: "t3",
    nameKey: "txLicenseName",
    descKey: "txLicenseDesc",
    amount: -60000,
    dateKey: "date06Jun",
    type: "out",
    icon: CreditCard,
  },
  {
    id: "t4",
    nameKey: "txElecName",
    descKey: "txElecDesc",
    amount: -270000,
    dateKey: "date02Jun",
    type: "out",
    icon: Zap,
  },
  {
    id: "t5",
    nameKey: "txRefundName",
    descKey: "txRefundDesc",
    amount: 25000,
    dateKey: "date30May",
    type: "in",
    icon: ArrowDownLeft,
  },
];

const QUICK_ACTIONS: QuickAction[] = [
  { id: "topup", labelKey: "qaTopup", icon: Plus, color: "#16A34A", bg: "#DCFCE7" },
  { id: "transfer", labelKey: "qaTransfer", icon: Send, color: "#344EAD", bg: "#EEF2FF" },
  { id: "scan", labelKey: "qaScan", icon: QrCode, color: "#7C3AED", bg: "#EDE9FE" },
  { id: "mobile", labelKey: "qaMobile", icon: Smartphone, color: "#0EA5E9", bg: "#E0F2FE" },
  { id: "electricity", labelKey: "qaElectricity", icon: Zap, color: "#F59E0B", bg: "#FEF3C7" },
  { id: "water", labelKey: "qaWater", icon: Droplet, color: "#0891B2", bg: "#CFFAFE" },
  { id: "internet", labelKey: "qaInternet", icon: Wifi, color: "#DB2777", bg: "#FCE7F3" },
  { id: "fines", labelKey: "qaFines", icon: AlertOctagon, color: "#DC2626", bg: "#FEE2E2" },
];

function formatKip(amount: number, lang: "en" | "lo") {
  const abs = Math.abs(amount);
  return `${amount < 0 ? "-" : ""}${abs.toLocaleString(lang === "lo" ? "lo-LA" : "en-US")} ₭`;
}

interface WalletPageProps {
  isAuthenticated: boolean;
  onRequireAuth: () => void;
}

export function WalletPage({ isAuthenticated, onRequireAuth }: WalletPageProps) {
  const t = useT("wallet");
  const { lang } = useLang();
  const [showBalance, setShowBalance] = useState(true);

  // Before login: empty wallet. After login: demo data appears.
  const balance = isAuthenticated ? 2_485_000 : 0;
  const bills = isAuthenticated ? BILLS : [];
  const transactions = isAuthenticated ? TRANSACTIONS : [];
  const totalDue = bills.reduce((sum, b) => sum + b.amount, 0);

  // Any wallet action while logged out routes to login first.
  const act = () => {
    if (!isAuthenticated) onRequireAuth();
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
              {showBalance ? formatKip(balance, lang) : "•••••• ₭"}
            </p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={act}
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
                  onClick={act}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:-translate-y-0.5 group-hover:shadow-md"
                    style={{ backgroundColor: a.bg }}
                  >
                    <Icon className="w-5 h-5" style={{ color: a.color }} />
                  </div>
                  <span className="text-xs text-gray-600 text-center leading-tight">
                    {t(a.labelKey)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bills Due */}
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
              onClick={act}
              className="text-xs font-medium flex items-center gap-1"
              style={{ color: "#344EAD" }}
            >
              {t("viewAll")} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {bills.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Receipt className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">{t("noBillsDue")}</p>
              <p className="text-gray-400 text-xs mt-1">{t("signInBills")}</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {bills.map((b) => {
              const Icon = b.icon;
              const dueLabel = t(b.dueKey, { n: b.dueDays });
              const statusStyle =
                b.status === "overdue"
                  ? { color: "#DC2626", bg: "#FEE2E2", label: dueLabel }
                  : b.status === "due-soon"
                  ? { color: "#D97706", bg: "#FEF3C7", label: dueLabel }
                  : { color: "#6B7280", bg: "#F3F4F6", label: dueLabel };

              return (
                <div
                  key={b.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 hover:shadow-md transition-shadow"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: b.bg }}
                  >
                    <Icon className="w-5 h-5" style={{ color: b.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 leading-snug">
                      {t(b.nameKey)}
                    </p>
                    <p className="text-xs text-gray-400 leading-relaxed truncate">
                      {t(b.descKey)}
                    </p>
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full mt-1"
                      style={{
                        color: statusStyle.color,
                        backgroundColor: statusStyle.bg,
                      }}
                    >
                      <CalendarClock className="w-3 h-3" />
                      {statusStyle.label}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-800">
                      {formatKip(b.amount, lang)}
                    </p>
                    <button
                      onClick={act}
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

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-gray-800">{t("recentTransactions")}</h2>
            <button
              onClick={act}
              className="text-xs font-medium flex items-center gap-1"
              style={{ color: "#344EAD" }}
            >
              {t("history")} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {transactions.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <ArrowUpRight className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">{t("noRecentTransactions")}</p>
              <p className="text-gray-400 text-xs mt-1">{t("signInActivity")}</p>
            </div>
          ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
            {transactions.map((tx) => {
              const Icon = tx.icon;
              const isIn = tx.type === "in";
              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: isIn ? "#DCFCE7" : "#EEF2FF",
                    }}
                  >
                    {isIn ? (
                      <ArrowDownLeft className="w-5 h-5" style={{ color: "#16A34A" }} />
                    ) : (
                      <Icon className="w-5 h-5" style={{ color: "#344EAD" }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 leading-snug truncate">
                      {t(tx.nameKey)}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{t(tx.descKey)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p
                      className="text-sm font-semibold"
                      style={{ color: isIn ? "#16A34A" : "#1F2937" }}
                    >
                      {isIn ? "+" : ""}
                      {formatKip(tx.amount, lang)}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5 flex items-center justify-end gap-1">
                      <CheckCircle2 className="w-3 h-3" style={{ color: "#16A34A" }} />
                      {t(tx.dateKey)}
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
    </div>
  );
}
