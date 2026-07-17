import { useMemo, useState } from "react";
import {
  Search,
  X,
  ChevronDown,
  ChevronRight,
  LifeBuoy,
  UserCircle,
  FileText,
  Wallet,
  ShieldCheck,
} from "lucide-react";
import { useLang, useT } from "../i18n";
import { tabHref } from "../routes";

type HelpCat = "account" | "services" | "payments" | "privacy";

interface Article {
  id: string;
  cat: HelpCat;
  /** Optional deep link to the service this article is about. */
  service?: string;
  popular?: boolean;
  en: { q: string; a: string; tags: string };
  lo: { q: string; a: string; tags: string };
}

const CATS: { id: HelpCat; key: "catAccount"; icon: typeof UserCircle; color: string; bg: string }[] = [
  { id: "account", key: "catAccount" as const, icon: UserCircle, color: "#344EAD", bg: "#EEF2FF" },
  { id: "services", key: "catServices" as never, icon: FileText, color: "#B45309", bg: "#FEF3C7" },
  { id: "payments", key: "catPayments" as never, icon: Wallet, color: "#15803D", bg: "#DCFCE7" },
  { id: "privacy", key: "catPrivacy" as never, icon: ShieldCheck, color: "#6366F1", bg: "#E0E7FF" },
];

const ARTICLES: Article[] = [
  {
    id: "what-is-laoid",
    cat: "account",
    popular: true,
    en: {
      q: "What is LaoID and why do I need it?",
      a: "LaoID is your national digital identity. It links your citizen record to this platform so you can request documents without visiting an office first. Once verified, your name, UIN and nationality are filled in automatically on every application form.",
      tags: "laoid digital identity uin verify account",
    },
    lo: {
      q: "LaoID ແມ່ນຫຍັງ ແລະ ເປັນຫຍັງຈຶ່ງຕ້ອງມີ?",
      a: "LaoID ແມ່ນເອກະລັກດິຈິຕອນແຫ່ງຊາດຂອງທ່ານ. ມັນເຊື່ອມຕໍ່ຂໍ້ມູນພົນລະເມືອງຂອງທ່ານກັບແພລດຟອມນີ້ ເພື່ອໃຫ້ທ່ານຮ້ອງຂໍເອກະສານໄດ້ໂດຍບໍ່ຕ້ອງໄປຫ້ອງການກ່ອນ. ເມື່ອຢືນຢັນແລ້ວ, ຊື່, UIN ແລະ ສັນຊາດຂອງທ່ານຈະຖືກຕື່ມໃສ່ແບບຟອມອັດຕະໂນມັດ.",
      tags: "laoid ເອກະລັກ ດິຈິຕອນ uin ຢືນຢັນ ບັນຊີ",
    },
  },
  {
    id: "hide-uin",
    cat: "account",
    en: {
      q: "How do I hide my UIN on screen?",
      a: "Your UIN is masked by default on the home card. Tap the eye icon next to it to reveal it, and tap again to hide. When you are signed out the card only ever shows masked sample data.",
      tags: "uin mask hide show privacy card",
    },
    lo: {
      q: "ຈະເຊື່ອງ UIN ຢູ່ໜ້າຈໍໄດ້ແນວໃດ?",
      a: "UIN ຂອງທ່ານຖືກເຊື່ອງໄວ້ເປັນຄ່າເລີ່ມຕົ້ນຢູ່ບັດໜ້າຫຼັກ. ແຕະໄອຄອນຮູບຕາຢູ່ຂ້າງມັນເພື່ອສະແດງ, ແລະ ແຕະອີກຄັ້ງເພື່ອເຊື່ອງ. ເມື່ອທ່ານຍັງບໍ່ໄດ້ເຂົ້າສູ່ລະບົບ, ບັດຈະສະແດງພຽງຂໍ້ມູນຕົວຢ່າງທີ່ຖືກເຊື່ອງເທົ່ານັ້ນ.",
      tags: "uin ເຊື່ອງ ສະແດງ ຄວາມເປັນສ່ວນຕົວ ບັດ",
    },
  },
  {
    id: "forgot-password",
    cat: "account",
    en: {
      q: "I forgot my password — how do I get back in?",
      a: "On the sign-in screen choose “Forgot password?”. We send a 6-digit OTP to your registered phone number. Enter it and you can set a new password straight away. If your number has changed, visit any district office with your ID card.",
      tags: "password forgot reset otp recover login",
    },
    lo: {
      q: "ລືມລະຫັດຜ່ານ — ຈະເຂົ້າລະບົບຄືນໄດ້ແນວໃດ?",
      a: "ຢູ່ໜ້າເຂົ້າສູ່ລະບົບ ເລືອກ “ລືມລະຫັດຜ່ານ?”. ພວກເຮົາຈະສົ່ງລະຫັດ OTP 6 ຕົວເລກໄປຫາເບີໂທທີ່ລົງທະບຽນໄວ້. ປ້ອນລະຫັດນັ້ນ ແລ້ວທ່ານສາມາດຕັ້ງລະຫັດຜ່ານໃໝ່ໄດ້ທັນທີ. ຫາກເບີໂທຂອງທ່ານປ່ຽນແລ້ວ, ໃຫ້ໄປທີ່ຫ້ອງການເມືອງໃດກໍໄດ້ພ້ອມບັດປະຈຳຕົວ.",
      tags: "ລະຫັດຜ່ານ ລືມ otp ກູ້ຄືນ ເຂົ້າສູ່ລະບົບ",
    },
  },
  {
    id: "residence-certificate",
    cat: "services",
    service: "resident-certificate",
    popular: true,
    en: {
      q: "How do I request a Residence Certificate?",
      a: "Open the service, check the required documents and fee shown before you start, then fill the form and submit. Processing usually takes 3 working days. You will get a notification when it is approved, and can download the PDF from your Account page.",
      tags: "residence certificate request apply document rc",
    },
    lo: {
      q: "ຈະຮ້ອງຂໍໃບຢັ້ງຢືນທີ່ຢູ່ອາໄສໄດ້ແນວໃດ?",
      a: "ເປີດບໍລິການ, ກວດເບິ່ງເອກະສານທີ່ຕ້ອງການ ແລະ ຄ່າທຳນຽມທີ່ສະແດງກ່ອນເລີ່ມ, ຈາກນັ້ນຕື່ມແບບຟອມ ແລະ ສົ່ງ. ປົກກະຕິໃຊ້ເວລາ 3 ວັນລັດຖະການ. ທ່ານຈະໄດ້ຮັບການແຈ້ງເຕືອນເມື່ອອະນຸມັດແລ້ວ ແລະ ສາມາດດາວໂຫຼດ PDF ຈາກໜ້າບັນຊີຂອງທ່ານ.",
      tags: "ໃບຢັ້ງຢືນ ທີ່ຢູ່ອາໄສ ຮ້ອງຂໍ ເອກະສານ",
    },
  },
  {
    id: "track-application",
    cat: "services",
    service: "history",
    popular: true,
    en: {
      q: "How do I track an application I already submitted?",
      a: "Every submission appears under History with a live status: pending, approved or rejected. Open any entry to see the step-by-step tracker, the office handling it, and any note from the reviewing officer.",
      tags: "track status history pending approved rejected progress",
    },
    lo: {
      q: "ຈະຕິດຕາມຄຳຮ້ອງທີ່ສົ່ງໄປແລ້ວໄດ້ແນວໃດ?",
      a: "ທຸກຄຳຮ້ອງທີ່ສົ່ງໄປຈະປາກົດຢູ່ໃນ ປະຫວັດ ພ້ອມສະຖານະປັດຈຸບັນ: ກຳລັງດຳເນີນການ, ອະນຸມັດແລ້ວ ຫຼື ຖືກປະຕິເສດ. ເປີດລາຍການໃດກໍໄດ້ເພື່ອເບິ່ງຂັ້ນຕອນ, ຫ້ອງການທີ່ຮັບຜິດຊອບ ແລະ ໝາຍເຫດຈາກເຈົ້າໜ້າທີ່.",
      tags: "ຕິດຕາມ ສະຖານະ ປະຫວັດ ອະນຸມັດ ປະຕິເສດ",
    },
  },
  {
    id: "documents-needed",
    cat: "services",
    service: "service",
    en: {
      q: "How do I know which documents to bring?",
      a: "Tap any service card and the detail view lists the required documents, the processing time and the exact fee before you commit to applying. Nothing is hidden until the end.",
      tags: "documents required fee processing time before apply",
    },
    lo: {
      q: "ຈະຮູ້ໄດ້ແນວໃດວ່າຕ້ອງກຽມເອກະສານໃດແດ່?",
      a: "ແຕະບັດບໍລິການໃດກໍໄດ້ ແລ້ວໜ້າລາຍລະອຽດຈະສະແດງເອກະສານທີ່ຕ້ອງການ, ໄລຍະເວລາດຳເນີນການ ແລະ ຄ່າທຳນຽມທີ່ແນ່ນອນ ກ່ອນທີ່ທ່ານຈະຕັດສິນໃຈຍື່ນຄຳຮ້ອງ. ບໍ່ມີຫຍັງຖືກເຊື່ອງໄວ້ຈົນເຖິງຕອນທ້າຍ.",
      tags: "ເອກະສານ ຄ່າທຳນຽມ ໄລຍະເວລາ ກ່ອນຍື່ນ",
    },
  },
  {
    id: "rejected",
    cat: "services",
    en: {
      q: "My application was rejected. What now?",
      a: "Open the entry in History — the reviewing officer's reason is shown there. Most rejections are due to a missing or unclear document. Fix the issue and submit a new application; you are not charged twice for a rejected request.",
      tags: "rejected declined refused reason resubmit fix error",
    },
    lo: {
      q: "ຄຳຮ້ອງຂອງຂ້ອຍຖືກປະຕິເສດ. ຕ້ອງເຮັດແນວໃດ?",
      a: "ເປີດລາຍການໃນ ປະຫວັດ — ເຫດຜົນຈາກເຈົ້າໜ້າທີ່ຈະສະແດງຢູ່ທີ່ນັ້ນ. ສ່ວນຫຼາຍການປະຕິເສດເກີດຈາກເອກະສານຂາດ ຫຼື ບໍ່ຊັດເຈນ. ແກ້ໄຂບັນຫາ ແລ້ວສົ່ງຄຳຮ້ອງໃໝ່; ທ່ານຈະບໍ່ຖືກເກັບຄ່າທຳນຽມສອງເທື່ອສຳລັບຄຳຮ້ອງທີ່ຖືກປະຕິເສດ.",
      tags: "ປະຕິເສດ ເຫດຜົນ ສົ່ງໃໝ່ ແກ້ໄຂ",
    },
  },
  {
    id: "pay-fees",
    cat: "payments",
    service: "wallet",
    popular: true,
    en: {
      q: "Which payment methods can I use?",
      a: "You can pay service fees from your wallet balance, or with BCEL One, LDB, and JDB transfers. Electricity (EDL) and water (Nampapa) bills can also be paid from the Wallet tab.",
      tags: "payment method wallet bcel ldb jdb transfer bill pay fee",
    },
    lo: {
      q: "ສາມາດຊຳລະດ້ວຍວິທີໃດແດ່?",
      a: "ທ່ານສາມາດຊຳລະຄ່າທຳນຽມຈາກຍອດເງິນໃນກະເປົາ, ຫຼື ໂອນຜ່ານ BCEL One, LDB ແລະ JDB. ຄ່າໄຟຟ້າ (EDL) ແລະ ຄ່ານ້ຳປະປາ (ນ້ຳປະປາ) ກໍສາມາດຊຳລະໄດ້ຈາກແຖບ ກະເປົາເງິນ.",
      tags: "ຊຳລະ ກະເປົາເງິນ bcel ldb jdb ໂອນ ໃບບິນ ຄ່າທຳນຽມ",
    },
  },
  {
    id: "free-services",
    cat: "payments",
    en: {
      q: "Are any services free?",
      a: "Yes. Services marked “Free” in green carry no fee at all — for example birth and death declarations. Every other service shows its exact price in LAK on the card before you apply.",
      tags: "free cost price fee lak charge birth death",
    },
    lo: {
      q: "ມີບໍລິການໃດທີ່ບໍ່ເສຍຄ່າບໍ?",
      a: "ມີ. ບໍລິການທີ່ໝາຍວ່າ “ຟຣີ” ດ້ວຍສີຂຽວແມ່ນບໍ່ເສຍຄ່າໃດໆເລີຍ — ຕົວຢ່າງ ການແຈ້ງເກີດ ແລະ ການແຈ້ງເສຍຊີວິດ. ບໍລິການອື່ນໆຈະສະແດງລາຄາເປັນກີບຢູ່ບັດກ່ອນທີ່ທ່ານຈະຍື່ນຄຳຮ້ອງ.",
      tags: "ຟຣີ ລາຄາ ຄ່າທຳນຽມ ກີບ ແຈ້ງເກີດ",
    },
  },
  {
    id: "refund",
    cat: "payments",
    en: {
      q: "Can I get a refund if I paid by mistake?",
      a: "Yes. Contact support within 14 days with the transaction reference from your Wallet history. Approved refunds return to the original payment method within 5 to 7 working days.",
      tags: "refund money back mistake reverse transaction wrong payment",
    },
    lo: {
      q: "ຖ້າຊຳລະຜິດພາດ ຈະຂໍເງິນຄືນໄດ້ບໍ?",
      a: "ໄດ້. ຕິດຕໍ່ຝ່າຍຊ່ວຍເຫຼືອພາຍໃນ 14 ວັນ ພ້ອມເລກອ້າງອີງທຸລະກຳຈາກປະຫວັດກະເປົາເງິນຂອງທ່ານ. ການຄືນເງິນທີ່ໄດ້ຮັບອະນຸມັດຈະສົ່ງກັບຄືນຫາຊ່ອງທາງຊຳລະເດີມພາຍໃນ 5 ຫາ 7 ວັນລັດຖະການ.",
      tags: "ຄືນເງິນ ຜິດພາດ ທຸລະກຳ ຊຳລະຜິດ",
    },
  },
  {
    id: "data-secure",
    cat: "privacy",
    popular: true,
    en: {
      q: "Is my personal data secure?",
      a: "Your data is encrypted in transit and at rest, and is only shared with the government office handling your specific request. We never sell data or share it with third parties. You can see exactly which office received each application in History.",
      tags: "secure security data privacy encrypted safe share third party",
    },
    lo: {
      q: "ຂໍ້ມູນສ່ວນຕົວຂອງຂ້ອຍປອດໄພບໍ?",
      a: "ຂໍ້ມູນຂອງທ່ານຖືກເຂົ້າລະຫັດທັງໃນລະຫວ່າງການສົ່ງ ແລະ ໃນການຈັດເກັບ, ແລະ ຖືກແບ່ງປັນສະເພາະກັບຫ້ອງການລັດທີ່ຮັບຜິດຊອບຄຳຮ້ອງຂອງທ່ານເທົ່ານັ້ນ. ພວກເຮົາບໍ່ເຄີຍຂາຍຂໍ້ມູນ ຫຼື ແບ່ງປັນໃຫ້ບຸກຄົນທີສາມ. ທ່ານສາມາດເບິ່ງໄດ້ວ່າຫ້ອງການໃດໄດ້ຮັບແຕ່ລະຄຳຮ້ອງໃນ ປະຫວັດ.",
      tags: "ປອດໄພ ຄວາມປອດໄພ ຂໍ້ມູນ ຄວາມເປັນສ່ວນຕົວ ເຂົ້າລະຫັດ ບຸກຄົນທີສາມ",
    },
  },
  {
    id: "delete-account",
    cat: "privacy",
    en: {
      q: "Can I delete my account and data?",
      a: "You can request deletion from Account → Privacy & Security. Civil registration records themselves are kept by law, but your platform profile, saved preferences and payment history are removed within 30 days.",
      tags: "delete account remove data erase close gdpr",
    },
    lo: {
      q: "ຂ້ອຍສາມາດລຶບບັນຊີ ແລະ ຂໍ້ມູນໄດ້ບໍ?",
      a: "ທ່ານສາມາດຮ້ອງຂໍການລຶບໄດ້ຈາກ ບັນຊີ → ຄວາມເປັນສ່ວນຕົວ ແລະ ຄວາມປອດໄພ. ບັນທຶກທະບຽນພົນລະເມືອງເອງຈະຖືກເກັບຮັກສາໄວ້ຕາມກົດໝາຍ, ແຕ່ໂປຣໄຟລ໌, ການຕັ້ງຄ່າ ແລະ ປະຫວັດການຊຳລະຂອງທ່ານຈະຖືກລຶບພາຍໃນ 30 ວັນ.",
      tags: "ລຶບ ບັນຊີ ຂໍ້ມູນ ປິດບັນຊີ",
    },
  },
];

export function HelpCenterPage({ onTabChange }: { onTabChange: (tab: string) => void }) {
  const t = useT("help");
  const { lang } = useLang();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<HelpCat | "all">("all");
  const [open, setOpen] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ARTICLES.filter((a) => {
      if (cat !== "all" && a.cat !== cat) return false;
      if (!q) return true;
      // Match against BOTH languages: Lao users routinely search English service
      // terms ("OTP", "BCEL", "LaoID", "refund"), and vice versa. Results are
      // still rendered in the active language.
      const haystack = `${a.en.q} ${a.en.a} ${a.en.tags} ${a.lo.q} ${a.lo.a} ${a.lo.tags}`;
      return haystack.toLowerCase().includes(q);
    });
  }, [query, cat]);

  const searching = query.trim().length > 0;

  return (
    <div className="min-h-full">
      {/* Header band */}
      <div
        className="relative overflow-hidden px-4 lg:px-8 pt-10 pb-12 text-white"
        style={{ background: "linear-gradient(135deg, #344EAD 0%, #1a2d7a 100%)" }}
      >
        <div
          className="pointer-events-none absolute -top-16 -right-10 w-64 h-64 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(245,158,11,0.28) 0%, transparent 70%)" }}
        />
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center mx-auto mb-4">
            <LifeBuoy className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-bold text-2xl lg:text-3xl">{t("title")}</h1>
          <p className="text-white/75 text-sm mt-2">{t("subtitle")}</p>

          {/* Search */}
          <div className="mt-6 flex items-center gap-2 bg-white rounded-2xl p-1.5 shadow-lg">
            <Search className="w-5 h-5 text-gray-400 ml-3 flex-shrink-0" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={t("searchLabel")}
              placeholder={t("searchPlaceholder")}
              className="flex-1 min-w-0 bg-transparent outline-none text-gray-800 text-sm py-2.5 placeholder:text-gray-400"
            />
            {searching && (
              <button
                onClick={() => setQuery("")}
                aria-label={t("clearSearch")}
                className="w-8 h-8 mr-1 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-8 py-8 max-w-3xl mx-auto">
        {/* Topic filter */}
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => setCat("all")}
            aria-pressed={cat === "all"}
            className="px-4 py-2 rounded-full text-sm font-medium border transition-colors"
            style={
              cat === "all"
                ? { backgroundColor: "#344EAD", borderColor: "#344EAD", color: "white" }
                : { backgroundColor: "white", borderColor: "#E5E7EB", color: "#4B5563" }
            }
          >
            {t("allTopics")}
          </button>
          {CATS.map((c) => {
            const active = cat === c.id;
            const Icon = c.icon;
            return (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                aria-pressed={active}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-colors"
                style={
                  active
                    ? { backgroundColor: "#344EAD", borderColor: "#344EAD", color: "white" }
                    : { backgroundColor: "white", borderColor: "#E5E7EB", color: "#4B5563" }
                }
              >
                <Icon className="w-4 h-4" style={{ color: active ? "white" : c.color }} />
                {t(c.key)}
              </button>
            );
          })}
        </div>

        {/* Result count */}
        <p className="text-center text-gray-500 text-xs mt-5" aria-live="polite">
          {results.length === 1
            ? t("resultsOne")
            : t("resultsMany", { count: results.length })}
        </p>

        {/* Articles */}
        {results.length === 0 ? (
          <div className="text-center py-14">
            <p className="text-gray-800 font-semibold">{t("noResults")}</p>
            <p className="text-gray-500 text-sm mt-1.5">{t("noResultsDesc")}</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {results.map((a) => {
              const c = a[lang];
              const isOpen = open === a.id;
              const meta = CATS.find((x) => x.id === a.cat)!;
              return (
                <div key={a.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => setOpen(isOpen ? null : a.id)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-3 p-4 text-left"
                  >
                    <span className="flex items-start gap-3 min-w-0">
                      <span
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: meta.bg }}
                      >
                        <meta.icon className="w-4 h-4" style={{ color: meta.color }} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-gray-800 font-semibold text-base leading-snug">
                          {c.q}
                        </span>
                        {a.popular && !searching && (
                          <span className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: "#EEF2FF", color: "#344EAD" }}>
                            {t("popular")}
                          </span>
                        )}
                      </span>
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      aria-hidden
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pl-15">
                      <p className="text-gray-500 text-sm leading-relaxed">{c.a}</p>
                      {a.service && (
                        <button
                          onClick={() => onTabChange(a.service!)}
                          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold"
                          style={{ color: "#344EAD" }}
                        >
                          {t("relatedService")}
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Still stuck */}
        <div className="mt-10 rounded-2xl border border-gray-100 bg-white p-6 text-center">
          <p className="text-gray-800 font-semibold">{t("stillStuck")}</p>
          <p className="text-gray-500 text-sm mt-1.5 max-w-md mx-auto leading-relaxed">
            {t("stillStuckDesc")}
          </p>
          <a
            href={tabHref("account")}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#344EAD" }}
          >
            {t("contactSupport")}
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
