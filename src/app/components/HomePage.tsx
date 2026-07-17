import { useState, useEffect, useRef } from "react";
import {
  Search,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  X,
  AlertCircle,
  HelpCircle,
  LayoutGrid,
  Settings2,
  Check,
  ChevronDown,
} from "lucide-react";
import { Hero } from "./Hero";
import { DialogShell } from "./DialogShell";
import { TutorialOverlay } from "./TutorialOverlay";
import { SERVICES, CATEGORIES, type ServiceItem } from "./ServicePage";
import { getServiceConfig, formatLak } from "../serviceConfig";
import { GlassIcon } from "./GlassIcon";
import { ServiceCard } from "./ServiceCard";
import { useT, useLang } from "../i18n";
import laoFlag from "../../imports/lao-flag.png";
import bgCta from "../../imports/bg-cta.png";
import civilPopulationImg from "../../imports/civil-population.png";
import immigrationImg from "../../imports/immigration.png";
import taxPaymentImg from "../../imports/tax-payment.png";
import landPropertyImg from "../../imports/land-property.png";
import transportImg from "../../imports/transport.png";
import socialProtectionImg from "../../imports/social-protection.png";
import educationImg from "../../imports/education.png";
import healthImg from "../../imports/health.png";

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

const newsThumb = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=520&q=70`;

const NEWS_ITEMS = [
  {
    id: 1,
    thumb: newsThumb("1486406146926-c627a92ad1ab"),
    cat: { en: "System Update", lo: "ອັບເດດລະບົບ" },
    color: "#344EAD",
    bg: "#EEF2FF",
    date: { en: "10 Apr 2026", lo: "10 ເມສາ 2026" },
    en: {
      title: "New Digital Identity System launching August 2026",
      desc: "A comprehensive LaoID framework rolls out nationwide with faster verification.",
    },
    lo: {
      title: "ລະບົບເອກະລັກດິຈິຕອນໃໝ່ ເລີ່ມໃຊ້ ສິງຫາ 2026",
      desc: "ກອບ LaoID ແບບຄົບວົງຈອນ ເລີ່ມໃຊ້ທົ່ວປະເທດ ພ້ອມການຢືນຢັນທີ່ໄວຂຶ້ນ.",
    },
  },
  {
    id: 2,
    thumb: newsThumb("1454165804606-c3d57bc86b40"),
    cat: { en: "Regulation", lo: "ລະບຽບການ" },
    color: "#7C3AED",
    bg: "#EDE9FE",
    date: { en: "08 Apr 2026", lo: "08 ເມສາ 2026" },
    en: {
      title: "Updated Family Registration Law now in effect",
      desc: "Civil registration procedures are simplified under the revised regulation.",
    },
    lo: {
      title: "ກົດໝາຍທະບຽນຄອບຄົວສະບັບປັບປຸງ ມີຜົນບັງຄັບໃຊ້ແລ້ວ",
      desc: "ຂັ້ນຕອນການທະບຽນພົນລະເມືອງ ຖືກເຮັດໃຫ້ງ່າຍຂຶ້ນ ຕາມລະບຽບໃໝ່.",
    },
  },
  {
    id: 3,
    thumb: newsThumb("1497366754035-f200968a6e72"),
    cat: { en: "Announcement", lo: "ປະກາດ" },
    color: "#F59E0B",
    bg: "#FEF3C7",
    date: { en: "05 Apr 2026", lo: "05 ເມສາ 2026" },
    en: {
      title: "Scheduled maintenance for the e-Governance Portal",
      desc: "The portal will be briefly unavailable on Sunday, 12 April for upgrades.",
    },
    lo: {
      title: "ການບຳລຸງຮັກສາລະບົບ e-Governance Portal",
      desc: "ລະບົບຈະບໍ່ສາມາດໃຊ້ໄດ້ຊົ່ວຄາວ ໃນວັນອາທິດທີ 12 ເມສາ ເພື່ອປັບປຸງ.",
    },
  },
  {
    id: 4,
    thumb: newsThumb("1519494026892-80bbd2d6fd0d"),
    cat: { en: "Service", lo: "ບໍລິການ" },
    color: "#16A34A",
    bg: "#DCFCE7",
    date: { en: "02 Apr 2026", lo: "02 ເມສາ 2026" },
    en: {
      title: "Residence Certificates now fully online",
      desc: "Apply, pay and receive your certificate without visiting an office.",
    },
    lo: {
      title: "ໃບຢັ້ງຢືນທີ່ຢູ່ ສາມາດຂໍອອນລາຍໄດ້ທັງໝົດແລ້ວ",
      desc: "ຍື່ນຂໍ, ຊຳລະ ແລະ ຮັບໃບຢັ້ງຢືນ ໂດຍບໍ່ຕ້ອງໄປຫ້ອງການ.",
    },
  },
  {
    id: 5,
    thumb: newsThumb("1487958449943-2429e8be8625"),
    cat: { en: "Security", lo: "ຄວາມປອດໄພ" },
    color: "#DC2626",
    bg: "#FEE2E2",
    date: { en: "28 Mar 2026", lo: "28 ມີນາ 2026" },
    en: {
      title: "Enable two-factor authentication for your account",
      desc: "Add an extra layer of protection to keep your identity safe.",
    },
    lo: {
      title: "ເປີດໃຊ້ການຢືນຢັນສອງຊັ້ນ ສຳລັບບັນຊີຂອງທ່ານ",
      desc: "ເພີ່ມການປົກປ້ອງອີກຊັ້ນ ເພື່ອຮັກສາຄວາມປອດໄພຂອງຕົວຕົນ.",
    },
  },
  {
    id: 6,
    thumb: newsThumb("1541339907198-e08756dedf3f"),
    cat: { en: "Event", lo: "ກິດຈະກຳ" },
    color: "#0EA5E9",
    bg: "#E0F2FE",
    date: { en: "24 Mar 2026", lo: "24 ມີນາ 2026" },
    en: {
      title: "Digital Government Week 2026 opens in Vientiane",
      desc: "Join workshops and demos showcasing new public digital services.",
    },
    lo: {
      title: "ອາທິດລັດຖະບານດິຈິຕອນ 2026 ເປີດຂຶ້ນທີ່ ວຽງຈັນ",
      desc: "ຮ່ວມເຝິກອົບຮົມ ແລະ ການສາທິດ ການບໍລິການສາທາລະນະດິຈິຕອນໃໝ່.",
    },
  },
] as const;

// Quantitative highlights shown below the service list
const STATS = [
  { value: `${SERVICES.length}+`, label: { en: "Digital services", lo: "ບໍລິການດິຈິຕອນ" } },
  { value: "18", label: { en: "Provinces covered", lo: "ແຂວງທົ່ວປະເທດ" } },
  { value: "24/7", label: { en: "Online access", lo: "ເຂົ້າໃຊ້ອອນລາຍ" } },
  { value: "100%", label: { en: "Paperless & digital", lo: "ບໍ່ໃຊ້ເຈ້ຍ ທັງໝົດ" } },
] as const;

// Category slider — image cards (local photo bg + title + benefit line); a color
// gradient shows underneath as a fallback while the image loads.
const CATEGORY_SLIDES = [
  { id: "civil", img: civilPopulationImg, en: "Register births, IDs, certificates and family records — all in one place.", lo: "ຂຶ້ນທະບຽນການເກີດ, ບັດປະຈຳຕົວ, ໃບຢັ້ງຢືນ ແລະ ຂໍ້ມູນຄອບຄົວ ໃນບ່ອນດຽວ." },
  { id: "immigration", img: immigrationImg, en: "Passports, visas and travel documents, handled fully online.", lo: "ໜັງສືຜ່ານແດນ, ວີຊາ ແລະ ເອກະສານເດີນທາງ ຈັດການອອນລາຍທັງໝົດ." },
  { id: "finance", img: taxPaymentImg, en: "Pay taxes, bills and government fees quickly and securely.", lo: "ຊຳລະອາກອນ, ໃບບິນ ແລະ ຄ່າທຳນຽມລັດ ຢ່າງໄວ ແລະ ປອດໄພ." },
  { id: "housing", img: landPropertyImg, en: "Land titles, property and building permits made simple and clear.", lo: "ໃບຕາດິນ, ຊັບສິນ ແລະ ໃບອະນຸຍາດກໍ່ສ້າງ ທີ່ງ່າຍ ແລະ ຊັດເຈນ." },
  { id: "transport", img: transportImg, en: "Driving licences and vehicle registration without the queues.", lo: "ໃບຂັບຂີ່ ແລະ ການຂຶ້ນທະບຽນຍານພາຫະນະ ໂດຍບໍ່ຕ້ອງຕໍ່ຄິວ." },
  { id: "welfare", img: socialProtectionImg, en: "Social assistance, benefits and support for those who need it.", lo: "ການຊ່ວຍເຫຼືອສັງຄົມ, ສະຫວັດດີການ ແລະ ການສະໜັບສະໜູນ ສຳລັບຜູ້ທີ່ຕ້ອງການ." },
  { id: "education", img: educationImg, en: "Schools, scholarships and student services for every stage.", lo: "ໂຮງຮຽນ, ທຶນການສຶກສາ ແລະ ການບໍລິການນັກຮຽນ ໃນທຸກຂັ້ນ." },
  { id: "health", img: healthImg, en: "Access healthcare, insurance and medical services near you.", lo: "ເຂົ້າເຖິງການດູແລສຸຂະພາບ, ປະກັນໄພ ແລະ ການບໍລິການທາງການແພດ." },
] as const;

// "Services for Everyone" slider — featured services with the responsible entity
const EVERYONE_SERVICES = [
  {
    id: "resident",
    dept: { en: "District Administration Office", lo: "ຫ້ອງການປົກຄອງເມືອງ" },
    en: "Request an official certificate proving your current residential address.",
    lo: "ຂໍໃບຢັ້ງຢືນທາງການ ເພື່ອຢືນຢັນທີ່ຢູ່ອາໄສປັດຈຸບັນຂອງທ່ານ.",
  },
  {
    id: "birth",
    dept: { en: "Family Registration Office", lo: "ຫ້ອງການທະບຽນຄອບຄົວ" },
    en: "Register a new birth and receive the official birth certificate.",
    lo: "ຂຶ້ນທະບຽນການເກີດ ແລະ ຮັບໃບຢັ້ງຢືນການເກີດທາງການ.",
  },
  {
    id: "marriage",
    dept: { en: "Family Registration Office", lo: "ຫ້ອງການທະບຽນຄອບຄົວ" },
    en: "Register your marriage and obtain an official marriage certificate.",
    lo: "ຂຶ້ນທະບຽນການແຕ່ງດອງ ແລະ ຮັບໃບຢັ້ງຢືນການແຕ່ງດອງທາງການ.",
  },
  {
    id: "family-book",
    dept: { en: "Ministry of Home Affairs", lo: "ກະຊວງພາຍໃນ" },
    en: "Create or update your household registration book online.",
    lo: "ສ້າງ ຫຼື ອັບເດດປຶ້ມສຳມະໂນຄົວຂອງທ່ານແບບອອນລາຍ.",
  },
  {
    id: "death",
    dept: { en: "Family Registration Office", lo: "ຫ້ອງການທະບຽນຄອບຄົວ" },
    en: "Register a death and receive the official record.",
    lo: "ຂຶ້ນທະບຽນການເສຍຊີວິດ ແລະ ຮັບເອກະສານທາງການ.",
  },
  {
    id: "divorce",
    dept: { en: "People's Court", lo: "ສານປະຊາຊົນ" },
    en: "Register a divorce and obtain the legal certificate.",
    lo: "ຂຶ້ນທະບຽນການຢ່າຮ້າງ ແລະ ຮັບໃບຢັ້ງຢືນຕາມກົດໝາຍ.",
  },
] as const;

// Consistent, centered section heading (matches the "Services for Everyone" style)
function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="text-center mb-8 max-w-lg mx-auto px-4">
      <h2 className="text-gray-900 font-bold text-2xl lg:text-3xl leading-tight">{title}</h2>
      {subtitle && (
        <p className="text-gray-500 text-sm lg:text-base mt-2 leading-relaxed">{subtitle}</p>
      )}
    </div>
  );
}

// FAQ — bilingual accordion content
const FAQ_ITEMS = [
  {
    en: { q: "Do I need an account to use the services?", a: "You can browse all services freely. To apply, pay or track a request, sign in with your LaoID." },
    lo: { q: "ຂ້ອຍຕ້ອງມີບັນຊີເພື່ອໃຊ້ການບໍລິການບໍ່?", a: "ທ່ານສາມາດເບິ່ງການບໍລິການທັງໝົດໄດ້ຢ່າງອິດສະຫຼະ. ເພື່ອຍື່ນຂໍ, ຊຳລະ ຫຼື ຕິດຕາມ ໃຫ້ເຂົ້າສູ່ລະບົບດ້ວຍ LaoID." },
  },
  {
    en: { q: "How long does processing take?", a: "Most civil registration services are completed within a few working days. Each service shows its own estimate." },
    lo: { q: "ການດຳເນີນການໃຊ້ເວລາດົນປານໃດ?", a: "ການບໍລິການທະບຽນພົນລະເມືອງສ່ວນຫຼາຍ ສຳເລັດພາຍໃນສອງສາມວັນລັດຖະການ. ແຕ່ລະການບໍລິການຈະສະແດງເວລາຄາດໝາຍຂອງມັນ." },
  },
  {
    en: { q: "Is my personal data secure?", a: "Yes. Your information is protected with government-grade security and encryption." },
    lo: { q: "ຂໍ້ມູນສ່ວນຕົວຂອງຂ້ອຍປອດໄພບໍ່?", a: "ແມ່ນແລ້ວ. ຂໍ້ມູນຂອງທ່ານຖືກປົກປ້ອງດ້ວຍຄວາມປອດໄພ ແລະ ການເຂົ້າລະຫັດລະດັບລັດຖະບານ." },
  },
  {
    en: { q: "Can I pay service fees online?", a: "Yes. Paid services support QR, bank transfer and card payments." },
    lo: { q: "ຂ້ອຍສາມາດຊຳລະຄ່າທຳນຽມອອນລາຍໄດ້ບໍ່?", a: "ໄດ້. ການບໍລິການທີ່ເສຍຄ່າ ຮອງຮັບການຊຳລະຜ່ານ QR, ໂອນທະນາຄານ ແລະ ບັດ." },
  },
  {
    en: { q: "Which languages are supported?", a: "The platform is fully available in Lao and English." },
    lo: { q: "ຮອງຮັບພາສາໃດແດ່?", a: "ແພລດຟອມມີໃຫ້ບໍລິການເຕັມຮູບແບບໃນພາສາລາວ ແລະ ອັງກິດ." },
  },
] as const;

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

  // Horizontal sliders (category + featured services)
  const categoryRef = useRef<HTMLDivElement>(null);
  const everyoneRef = useRef<HTMLDivElement>(null);
  const newsRef = useRef<HTMLDivElement>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const slideBy = (ref: React.RefObject<HTMLDivElement | null>, dir: number) =>
    ref.current?.scrollBy({ left: dir * 300, behavior: "smooth" });

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
      <Hero
        greeting={t("greeting")}
        name={isAuthenticated ? (lang === "lo" ? "ສົມໄຊ" : "Somchai") : ""}
        authenticated={isAuthenticated}
        onSignIn={() => onTabChange("account")}
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

        {/* Service badges — quick access to the Phase-1 services */}
        <div className="flex flex-wrap items-center justify-start gap-2">
          {homeServices.slice(0, 5).map((s) => (
            <button
              key={s.id}
              onClick={() => s.tab && onTabChange(s.tab)}
              className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-medium backdrop-blur-sm transition-colors whitespace-nowrap"
            >
              {lang === "lo" ? s.nameLo : s.name}
            </button>
          ))}
        </div>
      </Hero>

      {/* Content */}
      <div className="px-4 lg:px-8 py-6 space-y-10 max-w-screen-xl mx-auto">

        {/* Action Banner — only when signed in */}
        {isAuthenticated && showBanner && (
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

        {/* Explore by category — image-style slider (hidden while searching) */}
        {!searchQuery.trim() && (
          <div className="pt-4">
            <SectionHeader title={t("categoriesTitle")} subtitle={t("categoriesSubtitle")} />
            <div
              ref={categoryRef}
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1 [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: "none" }}
            >
              {CATEGORY_SLIDES.map((slide) => {
                const cat = CATEGORIES.find((c) => c.id === slide.id);
                if (!cat) return null;
                return (
                  <div
                    key={slide.id}
                    onClick={() => onTabChange("service")}
                    className="group relative flex-shrink-0 w-[72%] sm:w-[46%] lg:w-[calc((100%-3rem)/4)] h-[360px] rounded-3xl overflow-hidden snap-start text-left cursor-pointer"
                  >
                    {/* color gradient fallback */}
                    <div
                      className="absolute inset-0"
                      style={{ background: `linear-gradient(155deg, ${cat.color} 0%, #17235c 100%)` }}
                    />
                    {/* photo */}
                    <img
                      src={slide.img}
                      alt=""
                      aria-hidden
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    {/* legibility scrim — same blue wash as the hero overlay */}
                    <div
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(to top, rgba(18,31,80,0.82) 0%, rgba(18,31,80,0.62) 55%, rgba(18,31,80,0.45) 100%)" }}
                    />
                    {/* content */}
                    <div className="absolute inset-x-0 bottom-0 p-6">
                      <h3 className="text-white text-xl font-semibold leading-tight">
                        {lang === "lo" ? cat.labelLo : cat.label}
                      </h3>
                      <p className="text-white/80 text-sm mt-2 leading-relaxed">
                        {slide[lang]}
                      </p>
                      <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold px-3.5 py-2 rounded-full bg-white text-gray-900">
                        {t("seeService")}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => slideBy(categoryRef, -1)}
                aria-label="Previous"
                className="w-10 h-10 rounded-full border flex items-center justify-center transition-colors hover:bg-blue-50"
                style={{ borderColor: "#344EAD", color: "#344EAD" }}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => slideBy(categoryRef, 1)}
                aria-label="Next"
                className="w-10 h-10 rounded-full border flex items-center justify-center text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#344EAD", borderColor: "#344EAD" }}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Services Section */}
        <div>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3 mb-6">
            <div className="min-w-0">
              <h2 className="text-gray-900 font-bold text-2xl lg:text-3xl leading-tight">
                {t("whatDoYouNeed")}
              </h2>
              <p className="text-gray-500 text-sm lg:text-base mt-2 leading-relaxed">
                {t("whatDoYouNeedSub")}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {displayedServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onClick={() => setSelectedService(service)}
              />
            ))}

            {/* "More" tile — only when not searching */}
            {!searchQuery.trim() && (
              <button
                onClick={() => onTabChange("service")}
                onMouseEnter={() => setHoveredService("__more__")}
                onMouseLeave={() => setHoveredService(null)}
                className="rounded-2xl p-5 text-left shadow-sm hover:shadow-lg transition-all duration-200 border border-dashed"
                style={{
                  backgroundColor:
                    hoveredService === "__more__" ? "#344EAD" : "#F8FAFF",
                  borderColor: "#C7D2FE",
                }}
              >
                <div className="mb-4">
                  <GlassIcon icon={LayoutGrid} color="#344EAD" size={56} />
                </div>
                <p
                  className="text-base font-semibold leading-snug"
                  style={{
                    color: hoveredService === "__more__" ? "white" : "#1F2937",
                  }}
                >
                  {t("more")}
                </p>
                <p
                  className="text-sm mt-1 leading-snug"
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

        {/* Marketing sections — hidden while searching */}
        {!searchQuery.trim() && (
          <div className="pt-4">
            {/* Quantitative highlights — full-bleed band */}
            <div
              className="relative left-1/2 -translate-x-1/2 w-screen overflow-hidden px-6 py-9 lg:px-10 text-white"
              style={{ background: "linear-gradient(135deg, #344EAD 0%, #1a2d7a 100%)" }}
            >
              {/* decorative glows */}
              <div
                className="pointer-events-none absolute -top-16 -right-12 w-56 h-56 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(245,158,11,0.28) 0%, transparent 70%)" }}
              />
              <div
                className="pointer-events-none absolute -bottom-24 -left-16 w-64 h-64 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)" }}
              />
              {/* Lao flag — decorative accent, right side */}
              <img
                src={laoFlag}
                alt=""
                aria-hidden
                className="pointer-events-none absolute -right-6 top-1/2 -translate-y-1/2 h-[115%] lg:h-[165%] w-auto object-contain opacity-[0.14] lg:opacity-25"
              />
              <div className="relative max-w-screen-xl mx-auto">
                <p className="text-center text-white/60 text-xs font-medium tracking-[0.15em] uppercase mb-7">
                  {t("statsTitle")}
                </p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-7">
                  {STATS.map((s, i) => (
                    <div
                      key={s.label.en}
                      className={`text-center ${i > 0 ? "lg:border-l lg:border-white/15" : ""}`}
                    >
                      <p className="text-3xl lg:text-[2.5rem] font-bold leading-none tracking-tight">
                        {s.value}
                      </p>
                      <p className="text-white/65 text-xs mt-2.5 leading-snug px-2">
                        {s.label[lang]}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Services for Everyone — full-bleed aurora background + featured slider */}
            <div className="relative left-1/2 -translate-x-1/2 w-screen overflow-hidden bg-white py-12 lg:py-16">
              {/* aurora glows — brand blue + amber */}
              <div className="pointer-events-none absolute inset-0">
                <div
                  className="absolute -top-10 left-[18%] w-80 h-80 rounded-full blur-3xl"
                  style={{ background: "rgba(96,165,250,0.32)" }}
                />
                <div
                  className="absolute -top-6 right-[18%] w-80 h-80 rounded-full blur-3xl"
                  style={{ background: "rgba(245,158,11,0.22)" }}
                />
                <div
                  className="absolute bottom-0 left-[35%] w-[28rem] h-72 rounded-full blur-3xl"
                  style={{ background: "rgba(52,78,173,0.16)" }}
                />
              </div>

              <div className="relative max-w-screen-xl mx-auto">
                <SectionHeader title={t("everyoneTitle")} subtitle={t("everyoneSubtitle")} />

                <div className="px-4 lg:px-8">
                <div
                  ref={everyoneRef}
                  className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 [&::-webkit-scrollbar]:hidden"
                  style={{ scrollbarWidth: "none" }}
                >
                  {EVERYONE_SERVICES.map((item) => {
                    const svc = SERVICES.find((s) => s.id === item.id);
                    if (!svc) return null;
                    return (
                      <button
                        key={item.id}
                        onClick={() => svc.tab && onTabChange(svc.tab)}
                        className="flex-shrink-0 w-[80%] sm:w-[46%] lg:w-[300px] snap-start bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-left flex flex-col"
                      >
                        <h3 className="text-gray-900 font-semibold text-lg leading-snug">
                          {lang === "lo" ? svc.nameLo : svc.name}
                        </h3>
                        <p className="text-gray-500 text-sm mt-2.5 leading-relaxed flex-1">
                          {item[lang]}
                        </p>
                        <span
                          className="mt-5 self-start text-xs font-medium px-3 py-1.5 rounded-full leading-snug"
                          style={{ backgroundColor: "#EAF1FF", color: "#344EAD" }}
                        >
                          {item.dept[lang]}
                        </span>
                      </button>
                    );
                  })}
                </div>
                </div>

                {/* slider controls */}
                <div className="flex items-center justify-center gap-3 mt-7">
                  <button
                    onClick={() => slideBy(everyoneRef, -1)}
                    aria-label="Previous"
                    className="w-10 h-10 rounded-full border flex items-center justify-center transition-colors hover:bg-blue-50"
                    style={{ borderColor: "#344EAD", color: "#344EAD" }}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => slideBy(everyoneRef, 1)}
                    aria-label="Next"
                    className="w-10 h-10 rounded-full border flex items-center justify-center text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "#344EAD", borderColor: "#344EAD" }}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Latest Updates — news slider (3 in view) */}
        <div>
          <SectionHeader title={t("latestUpdates")} subtitle={t("latestUpdatesSub")} />

          <div
            ref={newsRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: "none" }}
          >
            {NEWS_ITEMS.map((item) => (
              <div
                key={item.id}
                className="flex-shrink-0 w-[82%] sm:w-[46%] lg:w-[calc((100%-2rem)/3)] snap-start bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col"
              >
                {/* thumbnail */}
                <div className="relative h-40 w-full overflow-hidden">
                  <div
                    className="absolute inset-0"
                    style={{ background: `linear-gradient(135deg, ${item.color} 0%, #17235c 100%)` }}
                  />
                  <img
                    src={item.thumb}
                    alt=""
                    aria-hidden
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <span
                    className="absolute top-3 left-3 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: item.bg, color: item.color }}
                  >
                    {item.cat[lang]}
                  </span>
                </div>
                {/* body */}
                <div className="p-4 flex flex-col flex-1">
                  <p className="text-gray-400 text-xs">{item.date[lang]}</p>
                  <p className="text-gray-800 text-base font-semibold leading-snug mt-1">
                    {item[lang].title}
                  </p>
                  <p className="text-gray-400 text-sm mt-1.5 leading-relaxed flex-1">
                    {item[lang].desc}
                  </p>
                  <button
                    className="mt-4 self-start inline-flex items-center gap-1 text-sm font-semibold"
                    style={{ color: "#344EAD" }}
                  >
                    {t("readMore")}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* slider controls */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => slideBy(newsRef, -1)}
              aria-label="Previous"
              className="w-10 h-10 rounded-full border flex items-center justify-center transition-colors hover:bg-blue-50"
              style={{ borderColor: "#344EAD", color: "#344EAD" }}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => slideBy(newsRef, 1)}
              aria-label="Next"
              className="w-10 h-10 rounded-full border flex items-center justify-center text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#344EAD", borderColor: "#344EAD" }}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CTA band — full-bleed, only for guests */}
        {!isAuthenticated && (
          <div
            className="relative left-1/2 -translate-x-1/2 w-screen overflow-hidden"
            style={{ background: "linear-gradient(135deg, #344EAD 0%, #1a2d7a 100%)" }}
          >
            {/* photo backdrop */}
            <img
              src={bgCta}
              alt=""
              aria-hidden
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* blue overlay — translucent take on the brand gradient */}
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(135deg, rgba(52,78,173,0.72) 0%, rgba(26,45,122,0.80) 100%)" }}
            />
            {/* decorative glows */}
            <div
              className="pointer-events-none absolute -top-16 -right-10 w-64 h-64 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(245,158,11,0.28) 0%, transparent 70%)" }}
            />
            <div
              className="pointer-events-none absolute -bottom-20 -left-16 w-72 h-72 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)" }}
            />
            <div className="relative max-w-screen-xl mx-auto px-6 lg:px-10 py-12 lg:py-16 text-center text-white">
              <h2 className="font-bold text-2xl lg:text-3xl leading-tight max-w-2xl mx-auto">
                {t("ctaTitle")}
              </h2>
              <p className="text-white/75 text-sm lg:text-base mt-3 max-w-xl mx-auto leading-relaxed">
                {t("ctaDesc")}
              </p>
              <button
                onClick={() => onTabChange("account")}
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm shadow-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#F59E0B", color: "white" }}
              >
                {t("ctaButton")}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* FAQ */}
        <div>
          <SectionHeader title={t("faqTitle")} subtitle={t("faqSubtitle")} />
          <div className="max-w-3xl mx-auto space-y-3">
            {FAQ_ITEMS.map((item, i) => {
              const open = openFaq === i;
              return (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="w-full flex items-center justify-between gap-3 p-4 text-left"
                  >
                    <span className="text-gray-800 font-semibold text-base leading-snug">
                      {item[lang].q}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                    />
                  </button>
                  {open && (
                    <div className="px-4 pb-4 -mt-1 text-gray-500 text-sm leading-relaxed">
                      {item[lang].a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="h-4" />
      </div>

      {/* Tutorial Overlay */}
      {showTutorial && <TutorialOverlay onDone={handleTutorialDone} />}

      {/* Dismiss Confirmation Modal */}
      {showDismissConfirm && (
        <DialogShell
          onClose={() => setShowDismissConfirm(false)}
          overlayClassName="fixed inset-0 bg-black/40 z-[70] flex items-center justify-center px-6"
          dialogClassName="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
          label={t("dismissTitle")}
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
        </DialogShell>
      )}

      {/* Service Modal */}
      {selectedService && (
        <DialogShell
          onClose={() => setSelectedService(null)}
          overlayClassName="fixed inset-0 bg-black/50 z-[70] flex items-end lg:items-center justify-center p-0 lg:p-6"
          dialogClassName="bg-white w-full lg:max-w-md rounded-t-3xl lg:rounded-3xl p-6 shadow-2xl"
          label={lang === "lo" ? selectedService.nameLo : selectedService.name}
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
        </DialogShell>
      )}

      {/* Customize Home Services Modal */}
      {showCustomize && (
        <DialogShell
          onClose={() => setShowCustomize(false)}
          overlayClassName="fixed inset-0 bg-black/50 z-[70] flex items-end lg:items-center justify-center p-0 lg:p-6"
          dialogClassName="bg-white w-full lg:max-w-2xl rounded-t-3xl lg:rounded-3xl shadow-2xl flex flex-col max-h-[85vh]"
          label={t("customizeTitle")}
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
        </DialogShell>
      )}
    </div>
  );
}