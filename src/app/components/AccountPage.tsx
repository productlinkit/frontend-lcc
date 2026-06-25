import {
  User,
  Bell,
  Globe,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Phone,
  Mail,
  CheckCircle,
  FileText,
  CreditCard,
  Eye,
  Download,
} from "lucide-react";
import type { Lang } from "../App";

const PROFILE_PHOTO =
  "https://images.unsplash.com/photo-1600896997793-b8ed3459a17f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb3V0aGVhc3QlMjBhc2lhbiUyMHByb2Zlc3Npb25hbCUyMG1hbiUyMGhlYWRzaG90fGVufDF8fHx8MTc3NjY3MDIyMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

const DOCUMENTS = [
  {
    id: "doc-1",
    name: "National ID Card",
    number: "LA-2580-1234-5678",
    validUntil: "31 Dec 2028",
  },
  {
    id: "doc-2",
    name: "Resident Certificate",
    number: "RC-2024-00891",
    validUntil: "15 Mar 2025",
  },
  {
    id: "doc-3",
    name: "Household Registration",
    number: "HR-VTE-20-4412",
    validUntil: "01 Jan 2030",
  },
];

const LANG_LABEL: Record<Lang, string> = {
  en: "English",
  lo: "ລາວ",
};

export function AccountPage({ lang }: { lang: Lang }) {
  const settingsItems = [
    {
      icon: Bell,
      label: lang === "lo" ? "ການແຈ້ງເຕືອນ" : "Notifications",
      desc: lang === "lo" ? "ຈັດການການແຈ້ງເຕືອນ" : "Manage alerts & reminders",
    },
    {
      icon: Globe,
      label: lang === "lo" ? "ພາສາ" : "Language",
      desc: LANG_LABEL[lang],
    },
    {
      icon: CreditCard,
      label: lang === "lo" ? "ວິທີການຊຳລະເງິນ" : "Payment Methods",
      desc: lang === "lo" ? "ບັດ, ກະເປົ໋າເງິນ" : "Cards, wallets",
    },
  ];

  const MENU_GROUPS = [
    {
      title: lang === "lo" ? "ບັນຊີ" : "Account",
      items: [
        {
          icon: User,
          label: lang === "lo" ? "ຂໍ້ມູນສ່ວນຕົວ" : "Personal Information",
          desc: lang === "lo" ? "ແກ້ໄຂໂປຣໄຟລ໌" : "Edit your profile",
        },
        { icon: Phone, label: lang === "lo" ? "ເບີໂທລະສັບ" : "Phone Number", desc: "+856 20 5551 2345" },
        { icon: Mail, label: lang === "lo" ? "ອີເມລ" : "Email Address", desc: "somchai@example.la" },
      ],
    },
    {
      title: lang === "lo" ? "ການຕັ້ງຄ່າ" : "Settings",
      items: settingsItems,
    },
    {
      title: lang === "lo" ? "ຄວາມປອດໄພ" : "Security",
      items: [
        {
          icon: Shield,
          label: lang === "lo" ? "ຄວາມເປັນສ່ວນຕົວ & ຄວາມປອດໄພ" : "Privacy & Security",
          desc: lang === "lo" ? "PIN, ຊີວະມິຕິ" : "PIN, biometrics",
        },
        {
          icon: HelpCircle,
          label: lang === "lo" ? "ຊ່ວຍເຫຼືອ & ສະໜັບສະໜູນ" : "Help & Support",
          desc: lang === "lo" ? "FAQs, ຕິດຕໍ່ພວກເຮົາ" : "FAQs, contact us",
        },
      ],
    },
  ];

  return (
    <div className="min-h-full">
      {/* Header */}
      <div
        className="relative px-4 pt-6 pb-10 lg:px-8"
        style={{
          background: "linear-gradient(135deg, #1A2D6B 0%, #344EAD 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white/30 shadow-xl">
              <img
                src={PROFILE_PHOTO}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
              <CheckCircle className="w-3 h-3 text-white" />
            </div>
          </div>
          <h2 className="text-white">
            Somchai{" "}
            <span style={{ color: "#F59E0B" }}>Phommasack</span>
          </h2>
          <p className="text-white/60 text-sm mt-1">ID: LA-2580-1234-5678</p>
          <div className="flex items-center gap-1.5 mt-2 bg-white/10 border border-white/20 rounded-full px-3 py-1">
            <CheckCircle className="w-3 h-3 text-green-400" />
            <span className="text-green-300 text-xs">
              {lang === "lo" ? "ພົນລະເມືອງທີ່ຢືນຢັນແລ້ວ" : "Verified Citizen"}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-8 py-6 space-y-6">
        {/* My Documents */}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 px-1">
            {lang === "lo" ? "ເອກະສານຂອງຂ້ອຍ" : "My Documents"}
          </p>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {DOCUMENTS.map((doc, i) => (
              <div
                key={doc.id}
                className={`px-5 py-4 ${i < DOCUMENTS.length - 1 ? "border-b border-gray-50" : ""}`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: "#EEF2FF" }}
                  >
                    <FileText className="w-5 h-5" style={{ color: "#344EAD" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-gray-800 text-sm font-medium">{doc.name}</p>
                      <span className="inline-flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 text-xs px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        {lang === "lo" ? "ຢືນຢັນແລ້ວ" : "Verified"}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs mt-0.5">{doc.number}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      <span className="text-gray-400">
                        {lang === "lo" ? "ໃຊ້ໄດ້ຈົນ:" : "Valid until:"}
                      </span>{" "}
                      <span className="font-medium">{doc.validUntil}</span>
                    </p>
                    <div className="flex gap-2 mt-2.5">
                      <button
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {lang === "lo" ? "ເບິ່ງ" : "View"}
                      </button>
                      <button
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
                        style={{ backgroundColor: "#344EAD" }}
                      >
                        <Download className="w-3.5 h-3.5" />
                        {lang === "lo" ? "ດາວໂຫລດ" : "Download"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {MENU_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 px-1">
              {group.title}
            </p>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {group.items.map((item, i) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    className={`w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left ${
                      i < group.items.length - 1 ? "border-b border-gray-50" : ""
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "#EEF2FF" }}
                    >
                      <Icon className="w-5 h-5" style={{ color: "#344EAD" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-800 text-sm font-medium">
                        {item.label}
                      </p>
                      <p className="text-gray-400 text-xs">{item.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Sign Out */}
        <button className="w-full flex items-center justify-center gap-2 bg-white rounded-2xl p-4 shadow-sm border border-red-100 text-red-500 hover:bg-red-50 transition-colors">
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">
            {lang === "lo" ? "ອອກຈາກລະບົບ" : "Sign Out"}
          </span>
        </button>

        <div className="text-center">
          <p className="text-gray-300 text-xs">LaoGov v2.1.0</p>
          <p className="text-gray-300 text-xs">Ministry of Interior, Lao PDR</p>
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
}
