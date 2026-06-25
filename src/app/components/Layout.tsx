import React from "react";
import {
  Home,
  History,
  Wallet,
  User,
  Bell,
  LayoutGrid,
} from "lucide-react";
import type { Lang } from "../App";
import logoLcc from "../../imports/logo-lcc.png";
import { CustomerServiceChat } from "./CustomerServiceChat";

interface LayoutProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  children: React.ReactNode;
}

const NAV_LABELS: Record<Lang, Record<string, string>> = {
  en: {
    home: "Home",
    service: "Service",
    history: "History",
    wallet: "Wallet",
    account: "Account",
  },
  lo: {
    home: "ໜ້າຫຼັກ",
    service: "ບໍລິການ",
    history: "ປະຫວັດ",
    wallet: "ກະເປົາເງິນ",
    account: "ບັນຊີ",
  },
};

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

export function Layout({ activeTab, onTabChange, lang, onLangChange, children }: LayoutProps) {
  const isSubPage = !MAIN_TABS.has(activeTab);

  const toggleLang = () => onLangChange(lang === "en" ? "lo" : "en");

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
                LAO CITIZEN CENTER
              </p>
              <p className="text-white/60 text-xs leading-tight">
                ສູນພົນລະເມືອງລາວ
              </p>
            </div>
          </button>

          {/* Desktop Nav Links (centered) */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all duration-200 ${
                    isActive
                      ? "bg-white/20 text-white font-semibold"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {NAV_LABELS[lang][item.id]}
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
              title={lang === "en" ? "Switch to Lao" : "Switch to English"}
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
            <button className="relative w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center transition-all duration-200">
              <Bell className="w-4 h-4 text-white" />
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border border-white/50"
                style={{ backgroundColor: "#F59E0B" }}
              />
            </button>
          </div>
        </div>
      </header>

      {/* ── Page Content ── */}
      <main className={`flex-1 overflow-y-auto ${isSubPage ? "" : "pb-20 lg:pb-0"}`}>
        {children}
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
                className="flex flex-col items-center gap-1 px-3 py-1"
              >
                <Icon
                  className="w-5 h-5"
                  style={isActive ? { color: "#344EAD" } : { color: "#9CA3AF" }}
                />
                <span
                  className="text-xs"
                  style={
                    isActive
                      ? { color: "#344EAD", fontWeight: 600 }
                      : { color: "#9CA3AF" }
                  }
                >
                  {NAV_LABELS[lang][item.id]}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
