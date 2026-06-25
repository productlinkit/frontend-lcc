import { useState, useEffect } from "react";
import {
  Search,
  AlertTriangle,
  ChevronRight,
  X,
  AlertCircle,
  HelpCircle,
  LayoutGrid,
  Settings2,
  Check,
} from "lucide-react";
import { HeroSlider } from "./HeroSlider";
import { TutorialOverlay } from "./TutorialOverlay";
import { SERVICES, CATEGORIES, type ServiceItem } from "./ServicePage";
import { getServiceConfig, formatLak } from "../serviceConfig";
import { useT, useLang } from "../i18n";

// Civil Registration — Phase 1 services (per PRD), shown as the default Quick Actions
const DEFAULT_HOME_SERVICES = [
  "resident", // Residence Certificate
  "birth", // Birth Declaration
  "death", // Death Declaration
  "marriage", // Marriage Certificate
  "divorce", // Divorce Certificate
  "family-book", // Family Book (Household Registration)
];

const STORAGE_KEY = "lcc_home_services";

const NEWS = {
  en: [
    {
      id: 1,
      date: "10 Apr 2026",
      title: "New Digital Identity System launching August 2026",
      desc: "The government announced a new comprehensive digital identity framework",
    },
    {
      id: 2,
      date: "08 Apr 2026",
      title: "Simplified process for Resident Certificate applications",
      desc: "Starting this month, certificates can be fully processed online",
    },
    {
      id: 3,
      date: "05 Apr 2026",
      title: "Scheduled maintenance for e-Governance Portal",
      desc: "The portal will undergo maintenance on Sunday, 12 April",
    },
  ],
  lo: [
    {
      id: 1,
      date: "10 ເມສາ 2026",
      title: "ລະບົບເອກະລັກດິຈິຕອນໃໝ່ ເລີ່ມໃຊ້ ສິງຫາ 2026",
      desc: "ລັດຖະບານປະກາດກອບເອກະລັກດິຈິຕອນແບບຄົບວົງຈອນ",
    },
    {
      id: 2,
      date: "08 ເມສາ 2026",
      title: "ຂັ້ນຕອນໃໝ່ສຳລັບການຂໍໃບຢັ້ງຢືນທີ່ຢູ່",
      desc: "ເລີ່ມເດືອນນີ້, ໃບຢັ້ງຢືນສາມາດດຳເນີນການອອນລາຍໄດ້ທັງໝົດ",
    },
    {
      id: 3,
      date: "05 ເມສາ 2026",
      title: "ບຳລຸງຮັກສາລະບົບ e-Governance Portal",
      desc: "ລະບົບຈະບຳລຸງຮັກສາໃນວັນອາທິດທີ 12 ເມສາ",
    },
  ],
} as const;

interface HomePageProps {
  onTabChange: (tab: string) => void;
  isAuthenticated?: boolean;
}

export function HomePage({ onTabChange, isAuthenticated }: HomePageProps) {
  const t = useT("home");
  const { lang } = useLang();
  const [searchQuery, setSearchQuery] = useState("");
  const [showBanner, setShowBanner] = useState(true);
  const [showDismissConfirm, setShowDismissConfirm] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [hoveredService, setHoveredService] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [homeServiceIds, setHomeServiceIds] = useState<string[]>(DEFAULT_HOME_SERVICES);
  const [showCustomize, setShowCustomize] = useState(false);
  const [draftIds, setDraftIds] = useState<string[]>(DEFAULT_HOME_SERVICES);

  useEffect(() => {
    const seen = localStorage.getItem("lcc_tutorial_seen");
    if (!seen) setShowTutorial(true);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as string[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHomeServiceIds(parsed.slice(0, 7));
        }
      } catch {
        // ignore
      }
    }
  }, []);

  const handleTutorialDone = () => {
    localStorage.setItem("lcc_tutorial_seen", "1");
    setShowTutorial(false);
  };

  const openCustomize = () => {
    setDraftIds(homeServiceIds);
    setShowCustomize(true);
  };

  const toggleDraft = (id: string) => {
    setDraftIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 7) return prev;
      return [...prev, id];
    });
  };

  const saveCustomize = () => {
    setHomeServiceIds(draftIds);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draftIds));
    setShowCustomize(false);
  };

  const homeServices = homeServiceIds
    .map((id) => SERVICES.find((s) => s.id === id))
    .filter((s): s is ServiceItem => Boolean(s));

  const displayedServices = searchQuery.trim()
    ? SERVICES.filter((s) =>
        (lang === "lo" ? s.nameLo : s.name)
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      ).slice(0, 7)
    : homeServices;

  return (
    <div className="min-h-full">
      {/* Hero Slider */}
      <HeroSlider
        greeting={t("greeting")}
        name={isAuthenticated ? (lang === "lo" ? "ສົມໄຊ" : "Somchai") : ""}
        lang={lang}
      >
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-white rounded-xl px-4 py-3 shadow-md">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-gray-700 text-sm placeholder:text-gray-400"
            />
          </div>
          <button
            className="px-5 py-3 rounded-xl text-white text-sm shadow-md flex-shrink-0 font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "#F59E0B" }}
          >
            {t("search")}
          </button>
        </div>
      </HeroSlider>

      {/* Content */}
      <div className="px-4 lg:px-8 py-6 space-y-6 max-w-screen-xl mx-auto">

        {/* Action Banner */}
        {showBanner && (
          <div className="relative flex items-start gap-3 p-4 rounded-2xl border border-amber-200 bg-amber-50">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-amber-800 text-sm font-semibold leading-snug">
                {t("actionRequiredTitle")}
              </p>
              <p className="text-amber-700 text-xs mt-1 leading-relaxed">
                {t("actionRequiredDesc")}
              </p>
              <button
                className="mt-2 text-xs font-semibold flex items-center gap-1"
                style={{ color: "#D97706" }}
              >
                {t("updateDocument")} <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <button
              onClick={() => setShowDismissConfirm(true)}
              className="flex-shrink-0 text-amber-400 hover:text-amber-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Services Section */}
        <div>
          <div className="flex items-center justify-between mb-4 gap-2">
            <h2 className="text-gray-800">{t("whatDoYouNeed")}</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={openCustomize}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors hover:opacity-80"
                style={{ color: "#344EAD", borderColor: "#C7D2FE", backgroundColor: "white" }}
              >
                <Settings2 className="w-3.5 h-3.5" />
                {t("customize")}
              </button>
              <button
                onClick={() => setShowTutorial(true)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors hover:opacity-80"
                style={{ color: "#344EAD", borderColor: "#C7D2FE", backgroundColor: "#EEF2FF" }}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                {t("howItWorks")}
              </button>
            </div>
          </div>

          {/* Service Grid: 7 services + More */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3">
            {displayedServices.map((service) => {
              const Icon = service.icon;
              const cat = CATEGORIES.find((c) => c.id === service.category)!;
              const isHovered = hoveredService === service.id;
              return (
                <button
                  key={service.id}
                  onClick={() => setSelectedService(service)}
                  onMouseEnter={() => setHoveredService(service.id)}
                  onMouseLeave={() => setHoveredService(null)}
                  className="rounded-2xl p-4 text-left shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 border"
                  style={{
                    backgroundColor: isHovered ? "#344EAD" : "white",
                    borderColor: isHovered ? "#2A3F99" : "#F3F4F6",
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-all duration-200"
                    style={{
                      backgroundColor: isHovered
                        ? "rgba(255,255,255,0.2)"
                        : cat.bg,
                    }}
                  >
                    <Icon
                      className="w-5 h-5 transition-all duration-200"
                      style={{ color: isHovered ? "white" : cat.color }}
                    />
                  </div>
                  <p
                    className="text-sm font-medium leading-snug transition-all duration-200"
                    style={{ color: isHovered ? "white" : "#1F2937" }}
                  >
                    {lang === "lo" ? service.nameLo : service.name}
                  </p>
                  <p
                    className="text-xs mt-0.5 transition-all duration-200"
                    style={{
                      color: isHovered ? "rgba(255,255,255,0.65)" : "#9CA3AF",
                    }}
                  >
                    {lang === "lo" ? service.descLo : service.desc}
                  </p>
                </button>
              );
            })}

            {/* "More" tile — only when not searching */}
            {!searchQuery.trim() && (
              <button
                onClick={() => onTabChange("service")}
                onMouseEnter={() => setHoveredService("__more__")}
                onMouseLeave={() => setHoveredService(null)}
                className="rounded-2xl p-4 text-left shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 border border-dashed"
                style={{
                  backgroundColor:
                    hoveredService === "__more__" ? "#344EAD" : "#F8FAFF",
                  borderColor: "#C7D2FE",
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-all duration-200"
                  style={{
                    backgroundColor:
                      hoveredService === "__more__"
                        ? "rgba(255,255,255,0.2)"
                        : "#EEF2FF",
                  }}
                >
                  <LayoutGrid
                    className="w-5 h-5"
                    style={{
                      color:
                        hoveredService === "__more__" ? "white" : "#344EAD",
                    }}
                  />
                </div>
                <p
                  className="text-sm font-medium leading-snug"
                  style={{
                    color: hoveredService === "__more__" ? "white" : "#1F2937",
                  }}
                >
                  {t("more")}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{
                    color:
                      hoveredService === "__more__"
                        ? "rgba(255,255,255,0.65)"
                        : "#9CA3AF",
                  }}
                >
                  {t("browseAll")}
                </p>
              </button>
            )}
          </div>

          {searchQuery.trim() && displayedServices.length === 0 && (
            <div className="text-center py-10">
              <p className="text-gray-400 text-sm">{t("noServicesFound")}</p>
            </div>
          )}
        </div>

        {/* Latest Updates */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-gray-800">{t("latestUpdates")}</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {NEWS[lang].map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-4 items-start hover:shadow-md transition-shadow cursor-pointer"
              >
                <div
                  className="flex-shrink-0 text-xs font-medium px-2 py-1.5 rounded-lg text-center min-w-[52px] leading-tight"
                  style={{ backgroundColor: "#EEF2FF", color: "#344EAD" }}
                >
                  {item.date.split(" ")[0]}
                  <br />
                  {item.date.split(" ")[1]}
                </div>
                <div className="min-w-0">
                  <p className="text-gray-800 text-sm font-medium leading-snug">
                    {item.title}
                  </p>
                  <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="h-4" />
      </div>

      {/* Tutorial Overlay */}
      {showTutorial && <TutorialOverlay onDone={handleTutorialDone} />}

      {/* Dismiss Confirmation Modal */}
      {showDismissConfirm && (
        <div
          className="fixed inset-0 bg-black/40 z-[70] flex items-center justify-center px-6"
          onClick={() => setShowDismissConfirm(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-red-500" />
              </div>
              <div>
                <h3 className="text-gray-800 mb-1">{t("dismissTitle")}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {t("dismissDesc")}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDismissConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                {t("keepIt")}
              </button>
              <button
                onClick={() => {
                  setShowBanner(false);
                  setShowDismissConfirm(false);
                }}
                className="flex-1 py-3 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#DC2626" }}
              >
                {t("yesDismiss")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service Modal */}
      {selectedService && (
        <div
          className="fixed inset-0 bg-black/50 z-[70] flex items-end lg:items-center justify-center p-0 lg:p-6"
          onClick={() => setSelectedService(null)}
        >
          <div
            className="bg-white w-full lg:max-w-md rounded-t-3xl lg:rounded-3xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {(() => {
                  const cat = CATEGORIES.find((c) => c.id === selectedService.category)!;
                  const Icon = selectedService.icon;
                  return (
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: cat.bg }}
                    >
                      <Icon className="w-6 h-6" style={{ color: cat.color }} />
                    </div>
                  );
                })()}
                <div>
                  <h3 className="text-gray-800">
                    {lang === "lo" ? selectedService.nameLo : selectedService.name}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {lang === "lo" ? selectedService.descLo : selectedService.desc}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedService(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {(() => {
              const cfg = getServiceConfig(selectedService.id);
              return (
                <div className="space-y-3 mb-6">
                  <div className="p-4 rounded-xl bg-gray-50">
                    <p className="text-xs text-gray-500 mb-1">{t("processingTime")}</p>
                    <p className="text-sm text-gray-700">{cfg.processingTime[lang]}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50">
                    <p className="text-xs text-gray-500 mb-1.5">{t("requiredDocs")}</p>
                    <ul className="space-y-1">
                      {cfg.requiredDocs.map((doc) => (
                        <li key={doc[lang]} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                          {doc[lang]}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 flex items-center justify-between">
                    <p className="text-xs text-gray-500">{t("serviceFee")}</p>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: cfg.fee === 0 ? "#16A34A" : "#344EAD" }}
                    >
                      {formatLak(cfg.fee, lang)}
                    </p>
                  </div>
                </div>
              );
            })()}

            <button
              className="w-full py-4 rounded-2xl text-white text-sm font-medium shadow-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#344EAD" }}
              onClick={() => {
                const tab = selectedService?.tab;
                setSelectedService(null);
                if (tab) onTabChange(tab);
              }}
            >
              {t("applyNow")}
            </button>
          </div>
        </div>
      )}

      {/* Customize Home Services Modal */}
      {showCustomize && (
        <div
          className="fixed inset-0 bg-black/50 z-[70] flex items-end lg:items-center justify-center p-0 lg:p-6"
          onClick={() => setShowCustomize(false)}
        >
          <div
            className="bg-white w-full lg:max-w-2xl rounded-t-3xl lg:rounded-3xl shadow-2xl flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-gray-800">{t("customizeTitle")}</h3>
                  <p className="text-gray-500 text-xs mt-1">
                    {t("customizeDesc")}
                  </p>
                </div>
                <button
                  onClick={() => setShowCustomize(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-200"
                    style={{
                      width: `${(draftIds.length / 7) * 100}%`,
                      backgroundColor: "#344EAD",
                    }}
                  />
                </div>
                <span
                  className="text-xs font-medium"
                  style={{ color: "#344EAD" }}
                >
                  {draftIds.length}/7
                </span>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {CATEGORIES.map((cat) => {
                const items = SERVICES.filter((s) => s.category === cat.id);
                if (items.length === 0) return null;
                return (
                  <div key={cat.id}>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
                      {lang === "lo" ? cat.labelLo : cat.label}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {items.map((s) => {
                        const Icon = s.icon;
                        const selected = draftIds.includes(s.id);
                        const disabled = !selected && draftIds.length >= 7;
                        return (
                          <button
                            key={s.id}
                            onClick={() => toggleDraft(s.id)}
                            disabled={disabled}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-150 text-left ${
                              selected
                                ? "shadow-sm"
                                : disabled
                                ? "opacity-40 cursor-not-allowed"
                                : "hover:border-gray-300"
                            }`}
                            style={{
                              backgroundColor: selected ? "#EEF2FF" : "white",
                              borderColor: selected ? "#344EAD" : "#E5E7EB",
                            }}
                          >
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: cat.bg }}
                            >
                              <Icon
                                className="w-4 h-4"
                                style={{ color: cat.color }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 leading-snug truncate">
                                {lang === "lo" ? s.nameLo : s.name}
                              </p>
                              <p className="text-xs text-gray-400 truncate">
                                {lang === "lo" ? s.descLo : s.desc}
                              </p>
                            </div>
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border-2"
                              style={{
                                backgroundColor: selected
                                  ? "#344EAD"
                                  : "transparent",
                                borderColor: selected ? "#344EAD" : "#D1D5DB",
                              }}
                            >
                              {selected && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => setDraftIds(DEFAULT_HOME_SERVICES)}
                className="text-sm font-medium text-gray-500 hover:text-gray-700 px-3 py-2"
              >
                {t("reset")}
              </button>
              <button
                onClick={saveCustomize}
                disabled={draftIds.length === 0}
                className="flex-1 py-3 rounded-xl text-white text-sm font-medium shadow-md transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#344EAD" }}
              >
                {t("save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}