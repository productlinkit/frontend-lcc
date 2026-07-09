import React, { useEffect, useRef, useState } from "react";
import {
  Home,
  History,
  Wallet,
  User,
  Bell,
  LayoutGrid,
  FileCheck2,
  CreditCard,
  Clock,
  Megaphone,
  LogIn,
} from "lucide-react";
import logoLcc from "../../imports/logo-lcc.png";
import { CustomerServiceChat } from "./CustomerServiceChat";
import { Footer } from "./Footer";
import { glassTile } from "../glass";
import { useLang, useT } from "../i18n";

interface LayoutProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isAuthenticated?: boolean;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { id: "home", icon: Home },
  { id: "service", icon: LayoutGrid },
  { id: "history", icon: History },
  { id: "wallet", icon: Wallet },
  { id: "account", icon: User },
];

const BOTTOM_NAV = NAV_ITEMS;

function UkFlag() {
  return (
    <svg viewBox="0 0 60 60" className="w-full h-full">
      <clipPath id="uk-clip">
        <circle cx="30" cy="30" r="30" />
      </clipPath>
      <g clipPath="url(#uk-clip)">
        <rect width="60" height="60" fill="#012169" />
        {/* White diagonals */}
        <path d="M0,0 L60,60 M60,0 L0,60" stroke="#fff" strokeWidth="12" />
        {/* Red diagonals (St Patrick) */}
        <path
          d="M0,0 L60,60 M60,0 L0,60"
          stroke="#C8102E"
          strokeWidth="5"
          strokeDasharray="60"
        />
        {/* White cross */}
        <path d="M30,0 V60 M0,30 H60" stroke="#fff" strokeWidth="14" />
        {/* Red cross */}
        <path d="M30,0 V60 M0,30 H60" stroke="#C8102E" strokeWidth="8" />
      </g>
    </svg>
  );
}

function LaoFlag() {
  return (
    <svg viewBox="0 0 60 60" className="w-full h-full">
      <clipPath id="lao-clip">
        <circle cx="30" cy="30" r="30" />
      </clipPath>
      <g clipPath="url(#lao-clip)">
        <rect width="60" height="15" fill="#CE1126" />
        <rect y="15" width="60" height="30" fill="#002868" />
        <rect y="45" width="60" height="15" fill="#CE1126" />
        <circle cx="30" cy="30" r="9" fill="#fff" />
      </g>
    </svg>
  );
}

const MAIN_TABS = new Set([
  "home",
  "service",
  "history",
  "wallet",
  "account",
]);

/** Header notification bell with a functioning status dropdown (WCAG-labelled). */
function NotificationMenu({
  isAuthenticated,
  onTabChange,
}: {
  isAuthenticated: boolean;
  onTabChange: (tab: string) => void;
}) {
  const t = useT("layout");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const items = isAuthenticated
    ? [
        { icon: FileCheck2, color: "#16A34A", bg: "#DCFCE7", title: t("notifItem1Title"), desc: t("notifItem1Desc"), time: t("notifItem1Time"), unread: true, tab: "account" },
        { icon: CreditCard, color: "#344EAD", bg: "#EEF2FF", title: t("notifItem2Title"), desc: t("notifItem2Desc"), time: t("notifItem2Time"), unread: true, tab: "wallet" },
        { icon: Clock, color: "#F59E0B", bg: "#FEF3C7", title: t("notifItem3Title"), desc: t("notifItem3Desc"), time: t("notifItem3Time"), unread: false, tab: "history" },
        { icon: Megaphone, color: "#6366F1", bg: "#E0E7FF", title: t("notifAnnounceTitle"), desc: t("notifAnnounceDesc"), time: t("notifAnnounceTime"), unread: false, tab: "service" },
      ]
    : [];
  const unreadCount = items.filter((i) => i.unread).length;

  // Close on outside click and Escape.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t("notifOpen")}
        aria-haspopup="menu"
        aria-expanded={open}
        className="relative w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center transition-all duration-200 focus-ring-on-dark"
      >
        <Bell className="w-4 h-4 text-white" />
        {(!isAuthenticated || unreadCount > 0) && (
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border border-white/50"
            style={{ backgroundColor: "#F59E0B" }}
          />
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label={t("notifications")}
          className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[60] lcc-dialog-in"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-800">{t("notifications")}</p>
            {isAuthenticated && unreadCount > 0 && (
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "#EEF2FF", color: "#344EAD" }}
              >
                {unreadCount}
              </span>
            )}
          </div>

          {!isAuthenticated ? (
            <div className="p-5 text-center">
              <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center mb-3" style={{ backgroundColor: "#EEF2FF" }}>
                <LogIn className="w-6 h-6" style={{ color: "#344EAD" }} />
              </div>
              <p className="text-sm font-semibold text-gray-800">{t("notifSignInTitle")}</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{t("notifSignInDesc")}</p>
              <button
                onClick={() => { setOpen(false); onTabChange("account"); }}
                className="mt-4 w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#344EAD" }}
              >
                {t("notifSignIn")}
              </button>
            </div>
          ) : (
            <>
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                {items.map((it, i) => {
                  const Icon = it.icon;
                  return (
                    <button
                      key={i}
                      role="menuitem"
                      onClick={() => { setOpen(false); onTabChange(it.tab); }}
                      className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: it.bg }}>
                        <Icon className="w-4.5 h-4.5" style={{ color: it.color, width: 18, height: 18 }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 leading-snug">{it.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-snug">{it.desc}</p>
                        <p className="text-[11px] text-gray-400 mt-1">{it.time}</p>
                      </div>
                      {it.unread && (
                        <span className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: "#344EAD" }} />
                      )}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => { setOpen(false); onTabChange("history"); }}
                className="w-full py-3 text-sm font-semibold border-t border-gray-100 transition-colors hover:bg-gray-50"
                style={{ color: "#344EAD" }}
              >
                {t("notifViewAll")}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function Layout({ activeTab, onTabChange, isAuthenticated = false, children }: LayoutProps) {
  const { lang, toggle } = useLang();
  const t = useT("layout");
  const isSubPage = !MAIN_TABS.has(activeTab);

  const toggleLang = toggle;

  return (
    <div className="flex flex-col h-screen w-full bg-[#F0F2F8] overflow-hidden">

      {/* ── Top Navbar ── */}
      <header
        className="flex-shrink-0 w-full z-50 shadow-md"
        style={{ backgroundColor: "#344EAD" }}
      >
        <div className="max-w-screen-xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between gap-3">

          {/* Left: Logo + Name */}
          <button
            className="flex items-center gap-3 flex-shrink-0"
            onClick={() => onTabChange("home")}
          >
            <img
              src={logoLcc}
              alt="Lao Citizen Center"
              className="h-10 w-10 object-contain rounded-lg bg-white p-0.5"
            />
            <div className="hidden sm:block text-left">
              <p className="text-white text-sm font-semibold leading-tight tracking-wide">
                {t("brand")}
              </p>
              <p className="text-white/60 text-xs leading-tight">
                {t("brandSub")}
              </p>
            </div>
          </button>

          {/* Desktop Nav Links (centered) */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center px-4 py-2 rounded-xl text-sm transition-all duration-200 focus-ring-on-dark ${
                    isActive
                      ? "bg-white/20 text-white font-semibold"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {t(item.id as "home")}
                </button>
              );
            })}
          </nav>

          {/* Right: Language + Notification */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Language toggle */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 transition-all duration-200"
              title={lang === "en" ? t("switchToLao") : t("switchToEnglish")}
            >
              <span
                className="w-5 h-5 rounded-full overflow-hidden ring-1 ring-white/40 flex-shrink-0"
                aria-hidden
              >
                {lang === "en" ? <UkFlag /> : <LaoFlag />}
              </span>
              <span className="text-white text-xs font-medium">
                {lang === "en" ? "EN" : "ລາວ"}
              </span>
            </button>

            {/* Notification */}
            <NotificationMenu isAuthenticated={isAuthenticated} onTabChange={onTabChange} />
          </div>
        </div>
      </header>

      {/* ── Page Content ── */}
      <main className={`flex-1 overflow-y-auto ${isSubPage ? "" : "pb-20 lg:pb-0"}`}>
        {children}
        <Footer onTabChange={onTabChange} />
      </main>

      {/* ── Customer Service Floating Chat (main tabs only) ── */}
      {!isSubPage && <CustomerServiceChat />}

      {/* ── Mobile Bottom Nav (main tabs only) ── */}
      <nav className={`lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg z-50 transition-transform duration-300 ${isSubPage ? "translate-y-full" : "translate-y-0"}`}>
        <div className="flex items-end justify-around px-2 py-2">
          {BOTTOM_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                aria-current={isActive ? "page" : undefined}
                aria-label={t(item.id as "home")}
                className="flex flex-col items-center gap-1 px-3 py-1"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center backdrop-blur-md transition-all duration-200"
                  style={isActive ? glassTile("#344EAD") : { border: "1px solid transparent" }}
                >
                  <Icon
                    className="w-5 h-5"
                    style={isActive ? { color: "#344EAD" } : { color: "#9CA3AF" }}
                  />
                </div>
                <span
                  className="text-xs"
                  style={
                    isActive
                      ? { color: "#344EAD", fontWeight: 600 }
                      : { color: "#9CA3AF" }
                  }
                >
                  {t(item.id as "home")}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
