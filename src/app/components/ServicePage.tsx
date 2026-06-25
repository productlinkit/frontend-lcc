import { useState, useMemo } from "react";
import {
  Search,
  Users,
  Plane,
  Wallet,
  HeartPulse,
  Bus,
  Briefcase,
  Building2,
  ShieldCheck,
  GraduationCap,
  Sprout,
  HandHeart,
  MessagesSquare,
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
} from "lucide-react";

interface ServicePageProps {
  onTabChange: (tab: string) => void;
}

export interface Category {
  id: string;
  label: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  desc: string;
  icon: React.ElementType;
  category: string;
  tab?: string; // route to navigate to
}

export const CATEGORIES: Category[] = [
  { id: "civil", label: "Civil & Population", desc: "ID, certificates & registration", icon: Users, color: "#344EAD", bg: "#EEF2FF" },
  { id: "immigration", label: "Immigration", desc: "Passport, visa & travel", icon: Plane, color: "#0EA5E9", bg: "#E0F2FE" },
  { id: "finance", label: "Finance & Tax", desc: "Tax, payments & permits", icon: Wallet, color: "#16A34A", bg: "#DCFCE7" },
  { id: "health", label: "Health", desc: "Healthcare & insurance", icon: HeartPulse, color: "#DC2626", bg: "#FEE2E2" },
  { id: "transport", label: "Transport", desc: "License & vehicle", icon: Bus, color: "#F59E0B", bg: "#FEF3C7" },
  { id: "business", label: "Business", desc: "Registration & licensing", icon: Briefcase, color: "#7C3AED", bg: "#EDE9FE" },
  { id: "housing", label: "Housing & Land", desc: "Property & residence", icon: Building2, color: "#EA580C", bg: "#FFEDD5" },
  { id: "safety", label: "Safety & Legal", desc: "Legal documents & reports", icon: ShieldCheck, color: "#1F2937", bg: "#E5E7EB" },
  { id: "education", label: "Education", desc: "Schools & scholarships", icon: GraduationCap, color: "#2563EB", bg: "#DBEAFE" },
  { id: "agriculture", label: "Agriculture", desc: "Farming & livestock", icon: Sprout, color: "#15803D", bg: "#DCFCE7" },
  { id: "welfare", label: "Welfare", desc: "Social aid & benefits", icon: HandHeart, color: "#DB2777", bg: "#FCE7F3" },
  { id: "community", label: "Community", desc: "Local services & requests", icon: MessagesSquare, color: "#0891B2", bg: "#CFFAFE" },
];

export const SERVICES: ServiceItem[] = [
  // Civil & Population — Civil Registration (Phase 1, per PRD)
  { id: "resident", name: "Residence Certificate", desc: "Proof of current address", icon: Home, category: "civil", tab: "resident-certificate" },
  { id: "birth", name: "Birth Declaration", desc: "Register a birth", icon: Baby, category: "civil", tab: "birth-declaration" },
  { id: "death", name: "Death Declaration", desc: "Register a death", icon: UserMinus, category: "civil", tab: "death-declaration" },
  { id: "marriage", name: "Marriage Certificate", desc: "Register a marriage", icon: Heart, category: "civil", tab: "marriage-certificate" },
  { id: "divorce", name: "Divorce Certificate", desc: "Register a divorce", icon: HeartCrack, category: "civil", tab: "divorce-certificate" },
  { id: "family-book", name: "Family Book", desc: "Household registration", icon: Users2, category: "civil", tab: "family-book" },
  // Other civil services
  { id: "national-id", name: "National ID Card", desc: "Apply or renew national ID", icon: IdCard, category: "civil" },
  { id: "name-change", name: "Name Change", desc: "Update your legal name", icon: Tag, category: "civil" },

  // Immigration
  { id: "passport", name: "Passport", desc: "Apply or renew passport", icon: BookOpen, category: "immigration" },
  { id: "visa", name: "Visa Services", desc: "Visa application & status", icon: StickyNote, category: "immigration" },
  { id: "travel-doc", name: "Travel Document", desc: "Emergency travel papers", icon: Globe2, category: "immigration" },
  { id: "embassy", name: "Embassy Service", desc: "Consular assistance abroad", icon: Landmark, category: "immigration" },

  // Finance & Tax
  { id: "tax-payment", name: "Tax Payment", desc: "Pay personal income tax", icon: Receipt, category: "finance" },
  { id: "utility", name: "Utility Bills", desc: "Pay water & electricity", icon: Zap, category: "finance" },
  { id: "fines", name: "Traffic Fines", desc: "Check & pay traffic fines", icon: AlertOctagon, category: "finance" },
  { id: "gov-fees", name: "Government Fees", desc: "Pay official service fees", icon: Coins, category: "finance" },

  // Health
  { id: "insurance", name: "Health Insurance", desc: "Register & manage coverage", icon: HeartHandshake, category: "health" },
  { id: "appointment", name: "Hospital Appointment", desc: "Book a hospital visit", icon: CalendarCheck, category: "health" },
  { id: "vaccination", name: "Vaccination Records", desc: "View your immunization", icon: Syringe, category: "health" },
  { id: "medical-cert", name: "Medical Certificate", desc: "Request medical letter", icon: Stethoscope, category: "health" },

  // Transport
  { id: "driver-license", name: "Driver's License", desc: "Apply or renew license", icon: Car, category: "transport" },
  { id: "vehicle-reg", name: "Vehicle Registration", desc: "Register a vehicle", icon: CarFront, category: "transport" },
  { id: "road-tax", name: "Road Tax", desc: "Pay annual road tax", icon: Route, category: "transport" },

  // Business
  { id: "biz-reg", name: "Business Registration", desc: "Register a new business", icon: Store, category: "business" },
  { id: "biz-permit", name: "Business Permit", desc: "Apply for business permit", icon: BadgeCheck, category: "business" },
  { id: "corp-tax", name: "Corporate Tax", desc: "File corporate taxes", icon: Building, category: "business" },
  { id: "trade-license", name: "Trade License", desc: "Apply for trade license", icon: ScrollText, category: "business" },

  // Housing & Land
  { id: "property-reg", name: "Property Registration", desc: "Register property ownership", icon: MapPinned, category: "housing" },
  { id: "building-permit", name: "Building Permit", desc: "Construction approval", icon: Hammer, category: "housing" },
  { id: "land-cert", name: "Land Certificate", desc: "Official land title", icon: Map, category: "housing" },

  // Safety & Legal
  { id: "court", name: "Court Services", desc: "Court schedules & filings", icon: Gavel, category: "safety" },
  { id: "police-report", name: "Police Report", desc: "File a police report", icon: Siren, category: "safety" },
  { id: "legal-doc", name: "Legal Document", desc: "Notarize legal papers", icon: FileText, category: "safety" },

  // Education
  { id: "enrollment", name: "School Enrollment", desc: "Enroll a student", icon: School, category: "education" },
  { id: "cert-verify", name: "Certificate Verification", desc: "Verify academic certificates", icon: Award, category: "education" },
  { id: "scholarship", name: "Scholarship Application", desc: "Apply for scholarships", icon: GradCap, category: "education" },

  // Agriculture
  { id: "farm-reg", name: "Farm Registration", desc: "Register agricultural land", icon: Tractor, category: "agriculture" },
  { id: "subsidy", name: "Subsidy Application", desc: "Apply for farm subsidy", icon: PiggyBank, category: "agriculture" },

  // Welfare
  { id: "social-aid", name: "Social Assistance", desc: "Financial aid programs", icon: HandCoins, category: "welfare" },
  { id: "disability", name: "Disability Support", desc: "Services for disabilities", icon: Accessibility, category: "welfare" },
  { id: "child-support", name: "Child Support", desc: "Support for families", icon: BabyIcon, category: "welfare" },

  // Community
  { id: "forums", name: "Community Forums", desc: "Discuss with neighbors", icon: MessageCircle, category: "community" },
  { id: "village", name: "Village Services", desc: "Local village requests", icon: MapPin, category: "community" },
];

export function ServicePage({ onTabChange }: ServicePageProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredServices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      return SERVICES.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.desc.toLowerCase().includes(q)
      );
    }
    if (activeCategory) {
      return SERVICES.filter((s) => s.category === activeCategory);
    }
    return [];
  }, [searchQuery, activeCategory]);

  const showCategoryView = !activeCategory && searchQuery.trim() === "";
  const currentCategory = CATEGORIES.find((c) => c.id === activeCategory);

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
              All categories
            </button>
          )}
          <h1 className="text-white">
            {currentCategory ? currentCategory.label : "All Services"}
          </h1>
          <p className="text-white/70 text-sm mt-1">
            {currentCategory
              ? currentCategory.desc
              : "Browse public services by category"}
          </p>

          {/* Search */}
          <div className="mt-5 flex items-center gap-2 bg-white rounded-xl px-4 py-3 shadow-md">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search for a service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-gray-700 text-sm placeholder:text-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Clear
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
              Categories
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const count = SERVICES.filter((s) => s.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className="group bg-white rounded-2xl p-4 text-left shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 border border-gray-100"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: cat.bg }}
                      >
                        <Icon className="w-5 h-5" style={{ color: cat.color }} />
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                    </div>
                    <p className="text-sm font-semibold text-gray-800 leading-snug">
                      {cat.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                      {cat.desc}
                    </p>
                    <p
                      className="text-xs mt-3 font-medium"
                      style={{ color: count > 0 ? "#344EAD" : "#9CA3AF" }}
                    >
                      {count > 0
                        ? `${count} service${count > 1 ? "s" : ""}`
                        : "Coming soon"}
                    </p>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            {searchQuery && (
              <p className="text-xs text-gray-500 mb-3">
                {filteredServices.length} result
                {filteredServices.length !== 1 ? "s" : ""} for "{searchQuery}"
              </p>
            )}

            {filteredServices.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredServices.map((s) => {
                  const Icon = s.icon;
                  const cat = CATEGORIES.find((c) => c.id === s.category)!;
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        if (s.tab) onTabChange(s.tab);
                      }}
                      className="bg-white rounded-2xl p-4 text-left shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 border border-gray-100 flex items-start gap-3"
                    >
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: cat.bg }}
                      >
                        <Icon className="w-5 h-5" style={{ color: cat.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 leading-snug">
                          {s.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                          {s.desc}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: cat.bg, color: cat.color }}
                          >
                            {cat.label}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-700 text-sm font-medium">
                  No services available yet
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  Services in this category are coming soon.
                </p>
                {activeCategory && (
                  <button
                    onClick={() => setActiveCategory(null)}
                    className="mt-4 text-xs font-medium px-4 py-2 rounded-full"
                    style={{ color: "#344EAD", backgroundColor: "#EEF2FF" }}
                  >
                    Browse other categories
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
