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

interface Bill {
  id: string;
  name: string;
  desc: string;
  amount: number;
  due: string;
  status: "overdue" | "due-soon" | "upcoming";
  icon: React.ElementType;
  color: string;
  bg: string;
}

interface Transaction {
  id: string;
  name: string;
  desc: string;
  amount: number;
  date: string;
  type: "out" | "in";
  icon: React.ElementType;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}

const BILLS: Bill[] = [
  {
    id: "elec",
    name: "Electricity Bill",
    desc: "EDL — April 2026",
    amount: 285000,
    due: "Due in 3 days",
    status: "due-soon",
    icon: Zap,
    color: "#F59E0B",
    bg: "#FEF3C7",
  },
  {
    id: "water",
    name: "Water Bill",
    desc: "Nampapa Lao — April",
    amount: 92000,
    due: "Overdue 2 days",
    status: "overdue",
    icon: Droplet,
    color: "#DC2626",
    bg: "#FEE2E2",
  },
  {
    id: "internet",
    name: "Internet",
    desc: "Lao Telecom Fiber",
    amount: 220000,
    due: "Due in 9 days",
    status: "upcoming",
    icon: Wifi,
    color: "#0EA5E9",
    bg: "#E0F2FE",
  },
  {
    id: "fine",
    name: "Traffic Fine",
    desc: "Reference TF-22841",
    amount: 150000,
    due: "Due in 5 days",
    status: "due-soon",
    icon: AlertOctagon,
    color: "#EA580C",
    bg: "#FFEDD5",
  },
];

const TRANSACTIONS: Transaction[] = [
  {
    id: "t1",
    name: "Tax Payment",
    desc: "Personal income tax",
    amount: -480000,
    date: "Today, 09:24",
    type: "out",
    icon: Receipt,
  },
  {
    id: "t2",
    name: "Top up",
    desc: "From BCEL Bank",
    amount: 1000000,
    date: "Yesterday",
    type: "in",
    icon: ArrowDownLeft,
  },
  {
    id: "t3",
    name: "Driver's License Fee",
    desc: "Renewal payment",
    amount: -60000,
    date: "06 Jun 2026",
    type: "out",
    icon: CreditCard,
  },
  {
    id: "t4",
    name: "Electricity Bill",
    desc: "EDL — March",
    amount: -270000,
    date: "02 Jun 2026",
    type: "out",
    icon: Zap,
  },
  {
    id: "t5",
    name: "Refund",
    desc: "Cancelled appointment",
    amount: 25000,
    date: "30 May 2026",
    type: "in",
    icon: ArrowDownLeft,
  },
];

const QUICK_ACTIONS: QuickAction[] = [
  { id: "topup", label: "Top up", icon: Plus, color: "#16A34A", bg: "#DCFCE7" },
  { id: "transfer", label: "Transfer", icon: Send, color: "#344EAD", bg: "#EEF2FF" },
  { id: "scan", label: "Scan & Pay", icon: QrCode, color: "#7C3AED", bg: "#EDE9FE" },
  { id: "mobile", label: "Mobile Top-up", icon: Smartphone, color: "#0EA5E9", bg: "#E0F2FE" },
  { id: "electricity", label: "Electricity", icon: Zap, color: "#F59E0B", bg: "#FEF3C7" },
  { id: "water", label: "Water", icon: Droplet, color: "#0891B2", bg: "#CFFAFE" },
  { id: "internet", label: "Internet", icon: Wifi, color: "#DB2777", bg: "#FCE7F3" },
  { id: "fines", label: "Fines", icon: AlertOctagon, color: "#DC2626", bg: "#FEE2E2" },
];

function formatKip(amount: number) {
  const abs = Math.abs(amount);
  return `${amount < 0 ? "-" : ""}${abs.toLocaleString("en-US")} ₭`;
}

export function WalletPage() {
  const [showBalance, setShowBalance] = useState(true);
  const balance = 2_485_000;
  const totalDue = BILLS.reduce((sum, b) => sum + b.amount, 0);

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
          <h1 className="text-white">My Wallet</h1>
          <p className="text-white/70 text-sm mt-1">
            Manage your bills, payments, and balance
          </p>

          {/* Balance card */}
          <div className="mt-5 bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <p className="text-white/70 text-xs uppercase tracking-wider">
                Available balance
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
              {showBalance ? formatKip(balance) : "•••••• ₭"}
            </p>
            <div className="flex gap-2 mt-4">
              <button
                className="flex-1 py-2.5 rounded-xl bg-white text-sm font-semibold flex items-center justify-center gap-1.5 shadow-md hover:opacity-90 transition-opacity"
                style={{ color: "#344EAD" }}
              >
                <Plus className="w-4 h-4" />
                Top up
              </button>
              <button className="flex-1 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors">
                <Send className="w-4 h-4" />
                Transfer
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
            <h2 className="text-gray-800">Quick payment</h2>
            <button
              className="text-xs font-medium flex items-center gap-1"
              style={{ color: "#344EAD" }}
            >
              See all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-4 lg:grid-cols-8 gap-3">
            {QUICK_ACTIONS.map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.id}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:-translate-y-0.5 group-hover:shadow-md"
                    style={{ backgroundColor: a.bg }}
                  >
                    <Icon className="w-5 h-5" style={{ color: a.color }} />
                  </div>
                  <span className="text-xs text-gray-600 text-center leading-tight">
                    {a.label}
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
              <h2 className="text-gray-800">Bills due</h2>
              <p className="text-gray-500 text-xs mt-0.5">
                Total {formatKip(totalDue)} across {BILLS.length} bills
              </p>
            </div>
            <button
              className="text-xs font-medium flex items-center gap-1"
              style={{ color: "#344EAD" }}
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {BILLS.map((b) => {
              const Icon = b.icon;
              const statusStyle =
                b.status === "overdue"
                  ? { color: "#DC2626", bg: "#FEE2E2", label: b.due }
                  : b.status === "due-soon"
                  ? { color: "#D97706", bg: "#FEF3C7", label: b.due }
                  : { color: "#6B7280", bg: "#F3F4F6", label: b.due };

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
                      {b.name}
                    </p>
                    <p className="text-xs text-gray-400 leading-relaxed truncate">
                      {b.desc}
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
                      {formatKip(b.amount)}
                    </p>
                    <button
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: "#344EAD" }}
                    >
                      Pay
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-gray-800">Recent transactions</h2>
            <button
              className="text-xs font-medium flex items-center gap-1"
              style={{ color: "#344EAD" }}
            >
              History <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
            {TRANSACTIONS.map((t) => {
              const Icon = t.icon;
              const isIn = t.type === "in";
              return (
                <div
                  key={t.id}
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
                      {t.name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{t.desc}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p
                      className="text-sm font-semibold"
                      style={{ color: isIn ? "#16A34A" : "#1F2937" }}
                    >
                      {isIn ? "+" : ""}
                      {formatKip(t.amount)}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5 flex items-center justify-end gap-1">
                      <CheckCircle2 className="w-3 h-3" style={{ color: "#16A34A" }} />
                      {t.date}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
}
