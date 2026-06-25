import { useState } from "react";
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
import { useT } from "../i18n";

interface TutorialStep {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  badge: string;
  title: string;
  description: string;
  visual: React.ReactNode;
}

type T = ReturnType<typeof useT<"tutorial">>;

function buildSteps(t: T): TutorialStep[] {
  return [
    {
      icon: Sparkles,
      iconBg: "#EEF2FF",
      iconColor: "#344EAD",
      badge: t("badgeWelcome"),
      title: t("step1Title"),
      description: t("step1Desc"),
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
              { label: t("statServicesLabel"), sub: t("statServicesSub") },
              { label: t("statSupportLabel"), sub: t("statSupportSub") },
              { label: t("statOnlineLabel"), sub: t("statOnlineSub") },
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
      badge: t("badgeStep1"),
      title: t("step2Title"),
      description: t("step2Desc"),
      visual: (
        <div className="rounded-2xl overflow-hidden shadow-md border border-gray-100">
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ backgroundColor: "#344EAD" }}
          >
            <p className="text-white text-xs opacity-70">{t("greeting")}</p>
            <Bell className="w-4 h-4 text-white opacity-70" />
          </div>
          <div className="p-3 bg-white">
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 border-2 border-amber-300">
                <Search className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <span className="text-xs text-gray-400">
                  {t("searchPlaceholder")}
                </span>
              </div>
              <div
                className="px-4 py-2.5 rounded-xl text-white text-xs font-medium"
                style={{ backgroundColor: "#F59E0B" }}
              >
                {t("searchButton")}
              </div>
            </div>
            <div className="mt-2 bg-gray-50 rounded-xl p-2">
              {[t("svcBirth"), t("svcResident")].map((s) => (
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
      badge: t("badgeStep2"),
      title: t("step3Title"),
      description: t("step3Desc"),
      visual: (
        <div className="space-y-2.5">
          <div className="flex gap-1.5 overflow-hidden">
            {[t("catAll"), t("catHousing"), t("catIdentity"), t("catFamily")].map(
              (c, i) => (
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
              )
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: t("svcResident"), icon: Home },
              { label: t("svcBiography"), icon: UserCircle },
              { label: t("svcBirth"), icon: FileText },
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
      badge: t("badgeStep3"),
      title: t("step4Title"),
      description: t("step4Desc"),
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
                  {t("svcResident")}
                </p>
                <p className="text-xs text-gray-400">{t("requestRenew")}</p>
              </div>
            </div>
          </div>
          <div className="p-3 space-y-2">
            {[
              {
                label: t("processingTimeLabel"),
                value: t("processingTimeValue"),
              },
              {
                label: t("requiredDocsLabel"),
                value: t("requiredDocsValue"),
              },
              { label: t("serviceFeeLabel"), value: t("serviceFeeValue") },
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
              {t("applyNow")}
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: History,
      iconBg: "#F3E8FF",
      iconColor: "#9333EA",
      badge: t("badgeStep4"),
      title: t("step5Title"),
      description: t("step5Desc"),
      visual: (
        <div className="space-y-2">
          {[
            {
              name: t("svcResident"),
              date: "12 Apr 2026",
              status: t("statusApproved"),
              color: "#16A34A",
              bg: "#DCFCE7",
            },
            {
              name: t("svcBiography"),
              date: "08 Apr 2026",
              status: t("statusPending"),
              color: "#D97706",
              bg: "#FEF3C7",
            },
            {
              name: t("svcGeneral"),
              date: "01 Apr 2026",
              status: t("statusRejected"),
              color: "#DC2626",
              bg: "#FEE2E2",
            },
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
      badge: t("badgeReady"),
      title: t("step6Title"),
      description: t("step6Desc"),
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
                {t("newsTitle")}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {t("newsDesc")}
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
            {t("chatSupportNote")}
          </p>
        </div>
      ),
    },
  ];
}

interface TutorialOverlayProps {
  onDone: () => void;
}

export function TutorialOverlay({ onDone }: TutorialOverlayProps) {
  const t = useT("tutorial");
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);

  const steps = buildSteps(t);
  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

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
                  {t("back")}
                </button>
              ) : (
                <div />
              )}
            </div>

            {/* Progress dots — always centered */}
            <div className="flex items-center gap-1.5 px-4">
              {steps.map((_, i) => (
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
                {isLast ? t("getStarted") : t("next")}
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
                {t("skipTutorial")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
