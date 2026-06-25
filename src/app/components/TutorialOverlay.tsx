import { useState, useEffect } from "react";
import {
  Search,
  LayoutGrid,
  FileText,
  History,
  Bell,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  Home,
  UserCircle,
} from "lucide-react";

interface TutorialStep {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  badge: string;
  title: string;
  description: string;
  visual: React.ReactNode;
}

const STEPS: TutorialStep[] = [
  {
    icon: Sparkles,
    iconBg: "#EEF2FF",
    iconColor: "#344EAD",
    badge: "Welcome",
    title: "Welcome to Lao Citizen Center",
    description:
      "Your all-in-one platform for government public services — apply for certificates, track applications, and stay informed, all from your phone.",
    visual: (
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg"
          style={{ backgroundColor: "#344EAD" }}
        >
          <Home className="w-10 h-10 text-white" />
        </div>
        <div className="flex gap-2 mt-1">
          {[
            { label: "7", sub: "Services" },
            { label: "24h", sub: "Support" },
            { label: "100%", sub: "Online" },
          ].map((stat) => (
            <div
              key={stat.sub}
              className="flex-1 rounded-2xl py-3 px-4 text-center"
              style={{ backgroundColor: "#EEF2FF" }}
            >
              <p className="text-base font-bold" style={{ color: "#344EAD" }}>
                {stat.label}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: Search,
    iconBg: "#FEF3C7",
    iconColor: "#D97706",
    badge: "Step 1",
    title: "Search for services quickly",
    description:
      "Use the search bar at the top of the home screen to instantly find any service by name — no need to scroll through the list.",
    visual: (
      <div className="rounded-2xl overflow-hidden shadow-md border border-gray-100">
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{ backgroundColor: "#344EAD" }}
        >
          <p className="text-white text-xs opacity-70">Good morning, Somchai</p>
          <Bell className="w-4 h-4 text-white opacity-70" />
        </div>
        <div className="p-3 bg-white">
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 border-2 border-amber-300">
              <Search className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <span className="text-xs text-gray-400">
                Search services...
              </span>
            </div>
            <div
              className="px-4 py-2.5 rounded-xl text-white text-xs font-medium"
              style={{ backgroundColor: "#F59E0B" }}
            >
              Search
            </div>
          </div>
          <div className="mt-2 bg-gray-50 rounded-xl p-2">
            {["Birth Certificate", "Resident Certificate"].map((s) => (
              <div
                key={s}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white"
              >
                <Search className="w-3 h-3 text-gray-300" />
                <span className="text-xs text-gray-500">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: LayoutGrid,
    iconBg: "#DCFCE7",
    iconColor: "#16A34A",
    badge: "Step 2",
    title: "Browse & filter by category",
    description:
      "Use the category tabs (Housing, Identity, Family, Documents) to narrow down the services, or view all at once.",
    visual: (
      <div className="space-y-2.5">
        <div className="flex gap-1.5 overflow-hidden">
          {["All services", "Housing", "Identity", "Family"].map((c, i) => (
            <div
              key={c}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium"
              style={
                i === 0
                  ? { backgroundColor: "#344EAD", color: "white" }
                  : {
                      backgroundColor: "white",
                      color: "#6B7280",
                      border: "1px solid #E5E7EB",
                    }
              }
            >
              {c}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Resident Certificate", icon: Home },
            { label: "Biography / CV", icon: UserCircle },
            { label: "Birth Certificate", icon: FileText },
          ].map(({ label, icon: Icon }) => (
            <div
              key={label}
              className="rounded-2xl p-3 bg-white border border-gray-100 shadow-sm"
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center mb-2"
                style={{ backgroundColor: "#EEF2FF" }}
              >
                <Icon className="w-4 h-4" style={{ color: "#344EAD" }} />
              </div>
              <p className="text-xs text-gray-700 leading-tight font-medium">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: FileText,
    iconBg: "#EEF2FF",
    iconColor: "#344EAD",
    badge: "Step 3",
    title: "Apply for a service online",
    description:
      "Tap any service card to see details: required documents, processing time, and fee. Then hit Apply Now to submit your request digitally.",
    visual: (
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "#EEF2FF" }}
            >
              <Home className="w-5 h-5" style={{ color: "#344EAD" }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Resident Certificate
              </p>
              <p className="text-xs text-gray-400">Request & renew</p>
            </div>
          </div>
        </div>
        <div className="p-3 space-y-2">
          {[
            { label: "Processing time", value: "3–5 business days" },
            { label: "Required documents", value: "National ID, Household book" },
            { label: "Service fee", value: "20,000 LAK" },
          ].map((row) => (
            <div key={row.label} className="bg-gray-50 rounded-xl px-3 py-2">
              <p className="text-xs text-gray-400">{row.label}</p>
              <p className="text-xs text-gray-700 mt-0.5 font-medium">
                {row.value}
              </p>
            </div>
          ))}
        </div>
        <div className="px-3 pb-3">
          <div
            className="w-full py-2.5 rounded-xl text-white text-xs font-medium text-center"
            style={{ backgroundColor: "#344EAD" }}
          >
            Apply Now
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: History,
    iconBg: "#F3E8FF",
    iconColor: "#9333EA",
    badge: "Step 4",
    title: "Track your applications",
    description:
      "Go to the History tab to monitor all submitted applications — see their status (Pending, Approved, Rejected) in real time.",
    visual: (
      <div className="space-y-2">
        {[
          { name: "Resident Certificate", date: "12 Apr 2026", status: "Approved", color: "#16A34A", bg: "#DCFCE7" },
          { name: "Biography / CV", date: "08 Apr 2026", status: "Pending", color: "#D97706", bg: "#FEF3C7" },
          { name: "General Application", date: "01 Apr 2026", status: "Rejected", color: "#DC2626", bg: "#FEE2E2" },
        ].map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-50"
          >
            <div>
              <p className="text-xs font-medium text-gray-700">{item.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.date}</p>
            </div>
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ backgroundColor: item.bg, color: item.color }}
            >
              {item.status}
            </span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Bell,
    iconBg: "#FEE2E2",
    iconColor: "#DC2626",
    badge: "You're ready!",
    title: "Stay informed & get help",
    description:
      "Check the News tab for government announcements, and use the chat button (bottom-right) to reach our support team anytime.",
    visual: (
      <div className="space-y-2.5">
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex gap-3">
          <div
            className="flex-shrink-0 text-xs font-bold px-2 py-1.5 rounded-lg text-center min-w-[44px] leading-tight"
            style={{ backgroundColor: "#EEF2FF", color: "#344EAD" }}
          >
            10<br/>Apr
          </div>
          <div>
            <p className="text-xs font-medium text-gray-800 leading-snug">
              New Digital Identity System launching
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Government announced new digital ID framework
            </p>
          </div>
        </div>
        <div className="flex items-end justify-end">
          <div className="relative">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
              style={{ backgroundColor: "#344EAD" }}
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
              </svg>
            </div>
            <div
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white flex items-center justify-center"
              style={{ backgroundColor: "#F59E0B", fontSize: "8px", fontWeight: "bold" }}
            >
              1
            </div>
          </div>
        </div>
        <p className="text-xs text-center text-gray-400">
          Chat support is available 24/7
        </p>
      </div>
    ),
  },
];

interface TutorialOverlayProps {
  onDone: () => void;
}

export function TutorialOverlay({ onDone }: TutorialOverlayProps) {
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  const handleClose = () => {
    setExiting(true);
    setTimeout(onDone, 300);
  };

  const handleNext = () => {
    if (isLast) {
      handleClose();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-end sm:items-center justify-center transition-opacity duration-300 ${
        exiting ? "opacity-0" : "opacity-100"
      }`}
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
    >
      <div
        className={`bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl transition-transform duration-300 ${
          exiting ? "translate-y-8" : "translate-y-0"
        }`}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: current.iconBg, color: current.iconColor }}
          >
            <Icon className="w-3 h-3" />
            {current.badge}
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Visual area */}
        <div className="px-5 pt-3 pb-4">
          <div
            className="rounded-2xl p-4 min-h-[160px] flex flex-col justify-center"
            style={{ backgroundColor: "#F8FAFF" }}
          >
            {current.visual}
          </div>
        </div>

        {/* Text */}
        <div className="px-5 pb-2">
          <h3 className="text-gray-900 mb-2" style={{ fontSize: "1.05rem" }}>
            {current.title}
          </h3>
          <p className="text-gray-500 text-sm leading-relaxed">
            {current.description}
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 pt-3 pb-6">
          {/* Navigation row: Back | Dots | Next — grid ensures dots are always perfectly centered */}
          <div className="grid items-center" style={{ gridTemplateColumns: "1fr auto 1fr" }}>
            {/* Back button — left-aligned */}
            <div className="flex justify-start">
              {step > 0 ? (
                <button
                  onClick={handlePrev}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              ) : (
                <div />
              )}
            </div>

            {/* Progress dots — always centered */}
            <div className="flex items-center gap-1.5 px-4">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className="rounded-full transition-all duration-200"
                  style={{
                    width: i === step ? "20px" : "6px",
                    height: "6px",
                    backgroundColor: i === step ? "#344EAD" : "#D1D5DB",
                  }}
                />
              ))}
            </div>

            {/* Next / Get started button — right-aligned */}
            <div className="flex justify-end">
              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90 shadow-md"
                style={{ backgroundColor: "#344EAD" }}
              >
                {isLast ? "Get started" : "Next"}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Skip tutorial — subtle link below, hidden on last step */}
          {!isLast && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={handleClose}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors py-1 px-3"
              >
                Skip tutorial
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
