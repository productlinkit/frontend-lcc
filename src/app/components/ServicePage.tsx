import { useMemo, useState, type ElementType } from "react";
import { useT, useLang } from "../i18n";
import { GlassIcon } from "./GlassIcon";
import { ServiceCard } from "./ServiceCard";
import { catalog } from "../api/endpoints";
import { useDebounced, useQuery } from "../api/hooks";
import { text, type Service, type ServiceCategory } from "../api/types";
import {
  Search,
  Users,
  Plane,
  Wallet,
  HeartPulse,
  Bus,
  Building2,
  GraduationCap,
  HandHeart,
  ChevronRight,
  ChevronLeft,
  Home,
  UserCircle,
  Shield,
  FileText,
  ClipboardList,
  Baby,
  BookOpen,
  IdCard,
  Users2,
  Tag,
  StickyNote,
  Globe2,
  Landmark,
  Receipt,
  Zap,
  AlertOctagon,
  Coins,
  HeartHandshake,
  Heart,
  HeartCrack,
  UserMinus,
  CalendarCheck,
  Syringe,
  Stethoscope,
  Car,
  CarFront,
  Route,
  Store,
  BadgeCheck,
  Building,
  ScrollText,
  MapPinned,
  Hammer,
  Map,
  Gavel,
  Siren,
  School,
  Award,
  GraduationCap as GradCap,
  Tractor,
  PiggyBank,
  HandCoins,
  Accessibility,
  Baby as BabyIcon,
  MessageCircle,
  MapPin,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface ServicePageProps {
  onTabChange: (tab: string) => void;
}

export interface Category {
  id: string;
  label: string;
  labelLo: string;
  desc: string;
  descLo: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  nameLo: string;
  desc: string;
  descLo: string;
  icon: React.ElementType;
  category: string;
  tab?: string; // route to navigate to
  /** Accent colour from the catalogue; falls back to the category colour. */
  color?: string;
}

/*
 * The catalogue sends an icon NAME ("Home", "Baby", "Users2"); this is the
 * lookup that turns it back into the lucide component. Anything unrecognised
 * falls back to a neutral document glyph rather than rendering nothing.
 */
const ICONS: Record<string, ElementType> = {
  Users, Plane, Wallet, HeartPulse, Bus, Building2, GraduationCap, HandHeart,
  Home, UserCircle, Shield, FileText, ClipboardList, Baby, BookOpen, IdCard,
  Users2, Tag, StickyNote, Globe2, Landmark, Receipt, Zap, AlertOctagon, Coins,
  HeartHandshake, Heart, HeartCrack, UserMinus, CalendarCheck, Syringe,
  Stethoscope, Car, CarFront, Route, Store, BadgeCheck, Building, ScrollText,
  MapPinned, Hammer, Map, Gavel, Siren, School, Award, Tractor, PiggyBank,
  HandCoins, Accessibility, MessageCircle, MapPin, Search, ChevronRight,
};

export function serviceIcon(name?: string): ElementType {
  return (name && ICONS[name]) || FileText;
}

/** "/service/resident-certificate" → "resident-certificate" (the App tab id). */
function routeToTab(routePath?: string): string | undefined {
  if (!routePath) return undefined;
  const last = routePath.split("/").filter(Boolean).pop();
  return last || undefined;
}

function toServiceItem(s: Service): ServiceItem {
  return {
    id: s.code,
    name: text(s.name, "en"),
    nameLo: text(s.name, "lo"),
    desc: text(s.description, "en"),
    descLo: text(s.description, "lo"),
    icon: serviceIcon(s.icon),
    category: s.category_code,
    tab: routeToTab(s.route_path),
    color: s.color || undefined,
  };
}

/*
 * The static tables below are no longer what this page renders — the catalogue
 * comes from /service-categories and /services. They stay exported because the
 * home page still reads them, and they double as the blurb + tint source for a
 * category (the API publishes a name, icon and colour but no description).
 */
export const CATEGORIES: Category[] = [
  { id: "civil", label: "Civil & Population", labelLo: "ພົນລະເມືອງ ແລະ ການທະບຽນ", desc: "ID, certificates & registration", descLo: "ບັດປະຈຳຕົວ, ໃບຢັ້ງຢືນ ແລະ ການຂຶ້ນທະບຽນ", icon: Users, color: "#344EAD", bg: "#EEF2FF" },
  { id: "immigration", label: "Immigration", labelLo: "ກວດຄົນເຂົ້າ-ອອກເມືອງ", desc: "Passport, visa & travel", descLo: "ໜັງສືຜ່ານແດນ, ວີຊາ ແລະ ການເດີນທາງ", icon: Plane, color: "#0EA5E9", bg: "#E0F2FE" },
  { id: "finance", label: "Tax & Payment", labelLo: "ອາກອນ ແລະ ການຊຳລະ", desc: "Tax, bills & payments", descLo: "ອາກອນ, ໃບບິນ ແລະ ການຊຳລະ", icon: Wallet, color: "#16A34A", bg: "#DCFCE7" },
  { id: "housing", label: "Land & Property", labelLo: "ທີ່ດິນ ແລະ ຊັບສິນ", desc: "Land, property & building", descLo: "ທີ່ດິນ, ຊັບສິນ ແລະ ການກໍ່ສ້າງ", icon: Building2, color: "#EA580C", bg: "#FFEDD5" },
  { id: "transport", label: "Transport", labelLo: "ການຂົນສົ່ງ", desc: "License & vehicle", descLo: "ໃບຂັບຂີ່ ແລະ ຍານພາຫະນະ", icon: Bus, color: "#F59E0B", bg: "#FEF3C7" },
  { id: "welfare", label: "Social Protection", labelLo: "ການປົກປ້ອງທາງສັງຄົມ", desc: "Aid, benefits & support", descLo: "ການຊ່ວຍເຫຼືອ ແລະ ສະຫວັດດີການ", icon: HandHeart, color: "#DB2777", bg: "#FCE7F3" },
  { id: "education", label: "Education", labelLo: "ການສຶກສາ", desc: "Schools & scholarships", descLo: "ໂຮງຮຽນ ແລະ ທຶນການສຶກສາ", icon: GraduationCap, color: "#2563EB", bg: "#DBEAFE" },
  { id: "health", label: "Health", labelLo: "ສາທາລະນະສຸກ", desc: "Healthcare & insurance", descLo: "ການດູແລສຸຂະພາບ ແລະ ປະກັນໄພ", icon: HeartPulse, color: "#DC2626", bg: "#FEE2E2" },
];

export const SERVICES: ServiceItem[] = [
  // Civil & Population — Civil Registration (Phase 1, per PRD)
  { id: "resident", name: "Residence Certificate", nameLo: "ໃບຢັ້ງຢືນທີ່ຢູ່", desc: "Proof of current address", descLo: "ຢັ້ງຢືນທີ່ຢູ່ປັດຈຸບັນ", icon: Home, category: "civil", tab: "resident-certificate" },
  { id: "birth", name: "Birth Declaration", nameLo: "ການແຈ້ງເກີດ", desc: "Register a birth", descLo: "ຂຶ້ນທະບຽນການເກີດ", icon: Baby, category: "civil", tab: "birth-declaration" },
  { id: "death", name: "Death Declaration", nameLo: "ການແຈ້ງເສຍຊີວິດ", desc: "Register a death", descLo: "ຂຶ້ນທະບຽນການເສຍຊີວິດ", icon: UserMinus, category: "civil", tab: "death-declaration" },
  { id: "marriage", name: "Marriage Certificate", nameLo: "ໃບຢັ້ງຢືນການແຕ່ງດອງ", desc: "Register a marriage", descLo: "ຂຶ້ນທະບຽນການແຕ່ງດອງ", icon: Heart, category: "civil", tab: "marriage-certificate" },
  { id: "divorce", name: "Divorce Certificate", nameLo: "ໃບຢັ້ງຢືນການຢ່າຮ້າງ", desc: "Register a divorce", descLo: "ຂຶ້ນທະບຽນການຢ່າຮ້າງ", icon: HeartCrack, category: "civil", tab: "divorce-certificate" },
  { id: "family-book", name: "Family Book", nameLo: "ປຶ້ມສຳມະໂນຄົວ", desc: "Household registration", descLo: "ການຂຶ້ນທະບຽນຄົວເຮືອນ", icon: Users2, category: "civil", tab: "family-book" },
  // Other civil services
  { id: "national-id", name: "National ID Card", nameLo: "ບັດປະຈຳຕົວປະຊາຊົນ", desc: "Apply or renew national ID", descLo: "ຍື່ນຂໍ ຫຼື ຕໍ່ບັດປະຈຳຕົວ", icon: IdCard, category: "civil" },
  { id: "name-change", name: "Name Change", nameLo: "ການປ່ຽນຊື່", desc: "Update your legal name", descLo: "ປ່ຽນແປງຊື່ຕາມກົດໝາຍ", icon: Tag, category: "civil" },

  // Immigration
  { id: "passport", name: "Passport", nameLo: "ໜັງສືຜ່ານແດນ", desc: "Apply or renew passport", descLo: "ຍື່ນຂໍ ຫຼື ຕໍ່ໜັງສືຜ່ານແດນ", icon: BookOpen, category: "immigration" },
  { id: "visa", name: "Visa Services", nameLo: "ບໍລິການວີຊາ", desc: "Visa application & status", descLo: "ການຍື່ນຂໍ ແລະ ສະຖານະວີຊາ", icon: StickyNote, category: "immigration" },
  { id: "travel-doc", name: "Travel Document", nameLo: "ເອກະສານເດີນທາງ", desc: "Emergency travel papers", descLo: "ເອກະສານເດີນທາງສຸກເສີນ", icon: Globe2, category: "immigration" },
  { id: "embassy", name: "Embassy Service", nameLo: "ບໍລິການສະຖານທູດ", desc: "Consular assistance abroad", descLo: "ການຊ່ວຍເຫຼືອກົງສຸນຢູ່ຕ່າງປະເທດ", icon: Landmark, category: "immigration" },

  // Finance & Tax
  { id: "tax-payment", name: "Tax Payment", nameLo: "ການຊຳລະອາກອນ", desc: "Pay personal income tax", descLo: "ຊຳລະອາກອນລາຍໄດ້ບຸກຄົນ", icon: Receipt, category: "finance" },
  { id: "utility", name: "Utility Bills", nameLo: "ຄ່າສາທາລະນຸປະໂພກ", desc: "Pay water & electricity", descLo: "ຊຳລະຄ່ານ້ຳ ແລະ ໄຟຟ້າ", icon: Zap, category: "finance" },
  { id: "fines", name: "Traffic Fines", nameLo: "ຄ່າປັບໃໝຈະລາຈອນ", desc: "Check & pay traffic fines", descLo: "ກວດ ແລະ ຊຳລະຄ່າປັບໃໝ", icon: AlertOctagon, category: "finance" },
  { id: "gov-fees", name: "Government Fees", nameLo: "ຄ່າທຳນຽມລັດຖະການ", desc: "Pay official service fees", descLo: "ຊຳລະຄ່າທຳນຽມບໍລິການ", icon: Coins, category: "finance" },

  // Health
  { id: "insurance", name: "Health Insurance", nameLo: "ປະກັນສຸຂະພາບ", desc: "Register & manage coverage", descLo: "ຂຶ້ນທະບຽນ ແລະ ຄຸ້ມຄອງປະກັນໄພ", icon: HeartHandshake, category: "health" },
  { id: "appointment", name: "Hospital Appointment", nameLo: "ການນັດໝາຍໂຮງໝໍ", desc: "Book a hospital visit", descLo: "ຈອງການນັດເຂົ້າພົບແພດ", icon: CalendarCheck, category: "health" },
  { id: "vaccination", name: "Vaccination Records", nameLo: "ບັນທຶກການສັກຢາ", desc: "View your immunization", descLo: "ກວດເບິ່ງປະຫວັດການສັກຢາ", icon: Syringe, category: "health" },
  { id: "medical-cert", name: "Medical Certificate", nameLo: "ໃບຢັ້ງຢືນແພດ", desc: "Request medical letter", descLo: "ຂໍໃບຢັ້ງຢືນທາງການແພດ", icon: Stethoscope, category: "health" },

  // Transport
  { id: "driver-license", name: "Driver's License", nameLo: "ໃບຂັບຂີ່", desc: "Apply or renew license", descLo: "ຍື່ນຂໍ ຫຼື ຕໍ່ໃບຂັບຂີ່", icon: Car, category: "transport" },
  { id: "vehicle-reg", name: "Vehicle Registration", nameLo: "ການຂຶ້ນທະບຽນລົດ", desc: "Register a vehicle", descLo: "ຂຶ້ນທະບຽນຍານພາຫະນະ", icon: CarFront, category: "transport" },
  { id: "road-tax", name: "Road Tax", nameLo: "ຄ່າທຳນຽມທາງ", desc: "Pay annual road tax", descLo: "ຊຳລະຄ່າທຳນຽມທາງປະຈຳປີ", icon: Route, category: "transport" },

  // Business
  { id: "biz-reg", name: "Business Registration", nameLo: "ການຂຶ້ນທະບຽນວິສາຫະກິດ", desc: "Register a new business", descLo: "ຂຶ້ນທະບຽນທຸລະກິດໃໝ່", icon: Store, category: "finance" },
  { id: "biz-permit", name: "Business Permit", nameLo: "ໃບອະນຸຍາດທຸລະກິດ", desc: "Apply for business permit", descLo: "ຍື່ນຂໍໃບອະນຸຍາດທຸລະກິດ", icon: BadgeCheck, category: "finance" },
  { id: "corp-tax", name: "Corporate Tax", nameLo: "ອາກອນວິສາຫະກິດ", desc: "File corporate taxes", descLo: "ແຈ້ງເສຍອາກອນວິສາຫະກິດ", icon: Building, category: "finance" },
  { id: "trade-license", name: "Trade License", nameLo: "ໃບອະນຸຍາດການຄ້າ", desc: "Apply for trade license", descLo: "ຍື່ນຂໍໃບອະນຸຍາດການຄ້າ", icon: ScrollText, category: "finance" },

  // Housing & Land
  { id: "property-reg", name: "Property Registration", nameLo: "ການຂຶ້ນທະບຽນຊັບສິນ", desc: "Register property ownership", descLo: "ຂຶ້ນທະບຽນກຳມະສິດຊັບສິນ", icon: MapPinned, category: "housing" },
  { id: "building-permit", name: "Building Permit", nameLo: "ໃບອະນຸຍາດກໍ່ສ້າງ", desc: "Construction approval", descLo: "ການອະນຸມັດການກໍ່ສ້າງ", icon: Hammer, category: "housing" },
  { id: "land-cert", name: "Land Certificate", nameLo: "ໃບຕາດິນ", desc: "Official land title", descLo: "ໃບຕາດິນທາງການ", icon: Map, category: "housing" },

  // Safety & Legal
  { id: "court", name: "Court Services", nameLo: "ບໍລິການສານ", desc: "Court schedules & filings", descLo: "ກຳນົດການ ແລະ ການຍື່ນຄະດີ", icon: Gavel, category: "civil" },
  { id: "police-report", name: "Police Report", nameLo: "ໃບແຈ້ງຄວາມ", desc: "File a police report", descLo: "ຍື່ນແຈ້ງຄວາມຕໍ່ຕຳຫຼວດ", icon: Siren, category: "civil" },
  { id: "legal-doc", name: "Legal Document", nameLo: "ເອກະສານກົດໝາຍ", desc: "Notarize legal papers", descLo: "ຮັບຮອງເອກະສານກົດໝາຍ", icon: FileText, category: "civil" },

  // Education
  { id: "enrollment", name: "School Enrollment", nameLo: "ການລົງທະບຽນຮຽນ", desc: "Enroll a student", descLo: "ລົງທະບຽນນັກຮຽນ", icon: School, category: "education" },
  { id: "cert-verify", name: "Certificate Verification", nameLo: "ການກວດສອບໃບປະກາສະນີຍະບັດ", desc: "Verify academic certificates", descLo: "ກວດສອບໃບປະກາສະນີຍະບັດການສຶກສາ", icon: Award, category: "education" },
  { id: "scholarship", name: "Scholarship Application", nameLo: "ການຍື່ນຂໍທຶນການສຶກສາ", desc: "Apply for scholarships", descLo: "ຍື່ນຂໍທຶນການສຶກສາ", icon: GradCap, category: "education" },

  // Agriculture
  { id: "farm-reg", name: "Farm Registration", nameLo: "ການຂຶ້ນທະບຽນຟາມ", desc: "Register agricultural land", descLo: "ຂຶ້ນທະບຽນທີ່ດິນກະສິກຳ", icon: Tractor, category: "housing" },
  { id: "subsidy", name: "Subsidy Application", nameLo: "ການຍື່ນຂໍເງິນອຸດໜູນ", desc: "Apply for farm subsidy", descLo: "ຍື່ນຂໍເງິນອຸດໜູນກະສິກຳ", icon: PiggyBank, category: "welfare" },

  // Welfare
  { id: "social-aid", name: "Social Assistance", nameLo: "ການຊ່ວຍເຫຼືອສັງຄົມ", desc: "Financial aid programs", descLo: "ໂຄງການຊ່ວຍເຫຼືອດ້ານການເງິນ", icon: HandCoins, category: "welfare" },
  { id: "disability", name: "Disability Support", nameLo: "ການຊ່ວຍເຫຼືອຄົນພິການ", desc: "Services for disabilities", descLo: "ບໍລິການສຳລັບຄົນພິການ", icon: Accessibility, category: "welfare" },
  { id: "child-support", name: "Child Support", nameLo: "ການຊ່ວຍເຫຼືອເດັກ", desc: "Support for families", descLo: "ການຊ່ວຍເຫຼືອສຳລັບຄອບຄົວ", icon: BabyIcon, category: "welfare" },

  // Community
  { id: "forums", name: "Community Forums", nameLo: "ກະດານສົນທະນາຊຸມຊົນ", desc: "Discuss with neighbors", descLo: "ສົນທະນາກັບເພື່ອນບ້ານ", icon: MessageCircle, category: "civil" },
  { id: "village", name: "Village Services", nameLo: "ບໍລິການບ້ານ", desc: "Local village requests", descLo: "ການຮ້ອງຂໍຂັ້ນບ້ານ", icon: MapPin, category: "civil" },
];

/* Wording the `service` dictionary does not carry; kept bilingual inline. */
const COPY = {
  categoriesError: { en: "Could not load the categories.", lo: "ບໍ່ສາມາດໂຫຼດໝວດໝູ່ໄດ້." },
  servicesError: { en: "Could not load the services.", lo: "ບໍ່ສາມາດໂຫຼດບໍລິການໄດ້." },
  errorHint: {
    en: "Check your connection and try again.",
    lo: "ກະລຸນາກວດສອບການເຊື່ອມຕໍ່ ແລະ ລອງໃໝ່ອີກຄັ້ງ.",
  },
  retry: { en: "Retry", lo: "ລອງໃໝ່" },
  noCategories: { en: "No categories are published yet.", lo: "ຍັງບໍ່ມີໝວດໝູ່ທີ່ເຜີຍແຜ່ເທື່ອ." },
} as const;

function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-pulse"
        >
          <div className="w-14 h-14 rounded-2xl bg-gray-200 mb-4" />
          <div className="h-4 rounded bg-gray-200 w-3/4" />
          <div className="h-3 rounded bg-gray-100 w-1/2 mt-2" />
          <div className="h-3 rounded bg-gray-100 w-1/3 mt-4" />
        </div>
      ))}
    </div>
  );
}

function ErrorPanel({
  message,
  hint,
  retryLabel,
  onRetry,
}: {
  message: string;
  hint: string;
  retryLabel: string;
  onRetry: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
      <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-3">
        <AlertCircle className="w-6 h-6" style={{ color: "#DC2626" }} />
      </div>
      <p className="text-gray-700 text-sm font-medium">{message}</p>
      <p className="text-gray-400 text-xs mt-1">{hint}</p>
      <button
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-full"
        style={{ color: "#344EAD", backgroundColor: "#EEF2FF" }}
      >
        <RefreshCw className="w-3.5 h-3.5" />
        {retryLabel}
      </button>
    </div>
  );
}

export function ServicePage({ onTabChange }: ServicePageProps) {
  const t = useT("service");
  const { lang } = useLang();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const query = searchQuery.trim();
  const debouncedQuery = useDebounced(query, 300);
  const typing = query !== debouncedQuery;

  const showCategoryView = !activeCategory && query === "";

  /* The chips, and the whole catalogue behind the per-category counts. */
  const categoriesQuery = useQuery<ServiceCategory[]>((signal) => catalog.categories(signal), []);
  const allServicesQuery = useQuery<Service[]>((signal) => catalog.services(undefined, signal), []);

  /* The cards — search and category are handed to the API, not filtered here. */
  const listQuery = useQuery<Service[]>(
    (signal) =>
      catalog.services(
        { search: debouncedQuery || undefined, category: activeCategory ?? undefined },
        signal,
      ),
    [debouncedQuery, activeCategory],
    { enabled: !showCategoryView },
  );

  const categories = useMemo<Category[]>(() => {
    const rows = categoriesQuery.data;
    if (!rows) return [];
    return rows.map((c) => {
      // The API publishes a name, icon and colour; the blurb and tint stay local.
      const seed = CATEGORIES.find((x) => x.id === c.code);
      return {
        id: c.code,
        label: text(c.name, "en"),
        labelLo: text(c.name, "lo"),
        desc: seed?.desc ?? "",
        descLo: seed?.descLo ?? "",
        icon: serviceIcon(c.icon) as React.ElementType,
        color: c.color || seed?.color || "#344EAD",
        bg: seed?.bg ?? "#F3F4F6",
      };
    });
  }, [categoriesQuery.data]);

  const counts = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const s of allServicesQuery.data ?? []) {
      totals[s.category_code] = (totals[s.category_code] ?? 0) + 1;
    }
    return totals;
  }, [allServicesQuery.data]);

  const services = useMemo<ServiceItem[]>(
    () => (listQuery.data ?? []).map(toServiceItem),
    [listQuery.data],
  );

  const currentCategory =
    categories.find((c) => c.id === activeCategory) ??
    CATEGORIES.find((c) => c.id === activeCategory);

  // `typing` covers the debounce window and `refreshing` the re-query after a
  // filter change, so the grid never shows rows from the previous search.
  const listLoading = listQuery.loading || listQuery.refreshing || typing;

  const retryCatalogue = () => {
    categoriesQuery.refetch();
    allServicesQuery.refetch();
  };

  return (
    <div className="min-h-full">
      {/* Header */}
      <div
        className="px-4 lg:px-8 pt-6 pb-8 text-white"
        style={{
          background:
            "linear-gradient(135deg, #344EAD 0%, #2A3F99 60%, #1E3070 100%)",
        }}
      >
        <div className="max-w-screen-xl mx-auto">
          {activeCategory && (
            <button
              onClick={() => setActiveCategory(null)}
              className="flex items-center gap-1 text-white/80 hover:text-white text-sm mb-3 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              {t("allCategories")}
            </button>
          )}
          <h1 className="text-white">
            {currentCategory
              ? lang === "lo"
                ? currentCategory.labelLo
                : currentCategory.label
              : t("allServices")}
          </h1>
          <p className="text-white/70 text-sm mt-1">
            {currentCategory
              ? lang === "lo"
                ? currentCategory.descLo
                : currentCategory.desc
              : t("subtitle")}
          </p>

          {/* Search */}
          <div className="mt-5 flex items-center gap-2 bg-white rounded-xl px-4 py-3 shadow-md">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-gray-700 text-sm placeholder:text-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                {t("clear")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 lg:px-8 py-6 max-w-screen-xl mx-auto">
        {showCategoryView ? (
          <>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
              {t("categories")}
            </p>

            {categoriesQuery.loading || allServicesQuery.loading ? (
              <SkeletonGrid count={8} />
            ) : categoriesQuery.error || allServicesQuery.error ? (
              <ErrorPanel
                message={
                  categoriesQuery.error ? COPY.categoriesError[lang] : COPY.servicesError[lang]
                }
                hint={COPY.errorHint[lang]}
                retryLabel={COPY.retry[lang]}
                onRetry={retryCatalogue}
              />
            ) : categories.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-700 text-sm font-medium">
                  {COPY.noCategories[lang]}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const count = counts[cat.id] ?? 0;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className="group bg-white rounded-2xl p-5 text-left shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 border border-gray-100"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <GlassIcon icon={Icon} color={cat.color} size={56} />
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                      </div>
                      <p className="text-base font-semibold text-gray-800 leading-snug">
                        {lang === "lo" ? cat.labelLo : cat.label}
                      </p>
                      <p className="text-sm text-gray-400 mt-1 leading-snug">
                        {lang === "lo" ? cat.descLo : cat.desc}
                      </p>
                      <p
                        className="text-sm mt-4 font-medium"
                        style={{ color: count > 0 ? "#344EAD" : "#9CA3AF" }}
                      >
                        {count > 0
                          ? t("serviceCount", { count })
                          : t("comingSoon")}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            {searchQuery && !listLoading && !listQuery.error && (
              <p className="text-xs text-gray-500 mb-3">
                {t("resultsFor", {
                  count: services.length,
                  q: searchQuery,
                })}
              </p>
            )}

            {listLoading ? (
              <SkeletonGrid count={8} />
            ) : listQuery.error ? (
              <ErrorPanel
                message={COPY.servicesError[lang]}
                hint={COPY.errorHint[lang]}
                retryLabel={COPY.retry[lang]}
                onRetry={listQuery.refetch}
              />
            ) : services.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {services.map((s) => (
                  <ServiceCard
                    key={s.id}
                    service={s}
                    onClick={() => {
                      if (s.tab) onTabChange(s.tab);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-700 text-sm font-medium">
                  {t("emptyTitle")}
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  {t("emptyDesc")}
                </p>
                {activeCategory && (
                  <button
                    onClick={() => setActiveCategory(null)}
                    className="mt-4 text-xs font-medium px-4 py-2 rounded-full"
                    style={{ color: "#344EAD", backgroundColor: "#EEF2FF" }}
                  >
                    {t("browseOther")}
                  </button>
                )}
              </div>
            )}
          </>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}
