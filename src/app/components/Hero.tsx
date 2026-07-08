import { useState } from "react";
import { ShieldCheck, BadgeCheck, QrCode, X } from "lucide-react";
import heroBg from "../../imports/hero.png";
import mohaLogo from "../../imports/moha.png";
import mopsLogo from "../../imports/mops.png";
import citizenPhoto from "../../imports/user-photo.png";
import { useT, useLang } from "../i18n";

interface HeroProps {
  greeting: string;
  name?: string;
  authenticated?: boolean;
  onSignIn?: () => void;
  children?: React.ReactNode;
}

export function Hero({ greeting, name, authenticated, onSignIn, children }: HeroProps) {
  const t = useT("hero");

  return (
    <div className="relative w-full overflow-hidden">
      {/* Background */}
      <img
        src={heroBg}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Dark gradient overlay for legibility */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(20,35,90,0.60) 0%, rgba(20,35,90,0.72) 60%, rgba(20,35,90,0.82) 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 px-6 lg:px-10 py-8 lg:py-10">
        <div className="max-w-screen-xl mx-auto flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-12">
          {/* Left: brand + message + search */}
          <div className="flex-1 min-w-0 flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="flex items-center justify-center gap-6 mb-4">
              <img src={mohaLogo} alt="Ministry of Home Affairs" className="h-16 sm:h-20 w-auto object-contain" />
              <img src={mopsLogo} alt="Ministry of Public Security" className="h-16 sm:h-20 w-auto object-contain" />
            </div>
            <span
              className="inline-block text-xs px-3 py-1 rounded-full mb-3 font-medium border border-white/30"
              style={{ backgroundColor: "rgba(244,163,0,0.25)", color: "#F9D97A" }}
            >
              {t("tag")}
            </span>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-white/70 text-sm">{name ? `${greeting},` : greeting}</p>
              {name && <p className="text-white text-sm font-semibold">{name}</p>}
            </div>
            <h2 className="text-white max-w-lg leading-snug font-semibold" style={{ fontSize: "1.9rem" }}>
              {t("title")}
            </h2>
            <p className="text-white/75 text-sm mt-2 max-w-md leading-relaxed">
              {t("subtitle")}
            </p>

            {/* search + service badges */}
            <div className="w-full max-w-2xl mt-6 space-y-3">{children}</div>
          </div>

          {/* Right: Digital ID quick-card */}
          <div className="w-full lg:w-[440px] flex justify-center lg:justify-end flex-shrink-0">
            <LaoIdCard authenticated={Boolean(authenticated)} name={name} onSignIn={onSignIn} />
          </div>
        </div>
      </div>
    </div>
  );
}

function LaoIdCard({
  authenticated,
  name,
  onSignIn,
}: {
  authenticated: boolean;
  name?: string;
  onSignIn?: () => void;
}) {
  const t = useT("hero");
  const { lang } = useLang();
  const [showQr, setShowQr] = useState(false);

  // Logged-in shows the real user; logged-out shows a dummy specimen card.
  const displayName = authenticated
    ? name || "—"
    : lang === "lo"
    ? "ບຸນມີ ສີສະຫວັດ"
    : "Bounmy Sisavath";
  const uin = authenticated ? "1-2540-•••••-15" : "1-2540-08842-15";
  const initial = displayName.trim().charAt(0).toUpperCase();

  return (
    <div className="w-full max-w-[440px]">
      {/* ID card */}
      <div className="relative rounded-3xl p-6 shadow-2xl overflow-hidden bg-white border border-gray-100">
        {/* aurora glows — brand blue + amber, like the Services section */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-8 -left-6 w-40 h-40 rounded-full blur-3xl" style={{ background: "rgba(96,165,250,0.38)" }} />
          <div className="absolute -top-6 -right-8 w-40 h-40 rounded-full blur-3xl" style={{ background: "rgba(245,158,11,0.30)" }} />
          <div className="absolute -bottom-12 left-1/3 w-56 h-40 rounded-full blur-3xl" style={{ background: "rgba(52,78,173,0.18)" }} />
        </div>

        {/* header */}
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#344EAD" }}>
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div className="leading-none">
              <p className="text-gray-900 text-sm font-bold">{t("idCardBrand")}</p>
              <p className="text-gray-400 text-[11px] mt-1">{t("idCardSub")}</p>
            </div>
          </div>
          {/* verified badge */}
          <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <BadgeCheck className="w-3.5 h-3.5" /> {t("idVerified")}
          </span>
        </div>

        {/* identity */}
        <div className="relative flex items-center gap-4 mt-5">
          {authenticated ? (
            <img
              src={citizenPhoto}
              alt={displayName}
              className="w-20 h-24 rounded-xl object-cover flex-shrink-0 border border-gray-200"
            />
          ) : (
            <div
              className="w-20 h-24 rounded-xl flex items-center justify-center text-white text-3xl font-bold flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #6366F1 0%, #344EAD 100%)" }}
            >
              {initial}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-gray-400 text-[11px] uppercase tracking-wide">{t("idName")}</p>
            <p className="text-gray-900 font-semibold text-lg leading-tight truncate">{displayName}</p>
            <p className="text-gray-400 text-[11px] uppercase tracking-wide mt-2">{t("idUin")}</p>
            <p className="text-gray-700 text-sm font-mono tracking-wider">{uin}</p>
          </div>
        </div>

        {/* footer: nationality + tappable QR */}
        <div className="relative flex items-end justify-between mt-5">
          <div>
            <p className="text-gray-400 text-[11px] uppercase tracking-wide">{t("idNationality")}</p>
            <p className="text-gray-800 text-sm font-medium">{t("idNationalityValue")}</p>
          </div>
          <button
            onClick={() => setShowQr(true)}
            aria-label={t("idTapVerify")}
            className="w-16 h-16 rounded-xl flex items-center justify-center shadow-md hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "#344EAD" }}
          >
            <QrCode className="w-11 h-11 text-white" />
          </button>
        </div>
      </div>

      {/* sign-in hint (logged out) */}
      {!authenticated && (
        <button
          onClick={onSignIn}
          className="mt-3 w-full text-center text-white/80 hover:text-white text-sm font-medium underline underline-offset-2"
        >
          {t("idSignIn")}
        </button>
      )}

      {/* QR verification modal */}
      {showQr && (
        <div
          className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-6"
          onClick={() => setShowQr(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 w-full max-w-xs text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQr(false)}
              aria-label="Close"
              className="ml-auto flex w-8 h-8 rounded-full bg-gray-100 items-center justify-center text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-48 h-48 mx-auto rounded-2xl border border-gray-200 flex items-center justify-center">
              <QrCode className="w-40 h-40 text-gray-900" />
            </div>
            <p className="text-gray-900 font-semibold mt-4">{t("idVerifyTitle")}</p>
            <p className="text-gray-500 text-sm mt-1.5 leading-relaxed">{t("idVerifyDesc")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
