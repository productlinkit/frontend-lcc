import { useState } from "react";
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
  X,
} from "lucide-react";
import { useT } from "../i18n";
import residentCertPdf from "../../imports/RC 2026 Report.pdf";

const RESIDENT_CERT_REF = "RC-2026-004821";

const PROFILE_PHOTO =
  "https://images.unsplash.com/photo-1600896997793-b8ed3459a17f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb3V0aGVhc3QlMjBhc2lhbiUyMHByb2Zlc3Npb25hbCUyMG1hbiUyMGhlYWRzaG90fGVufDF8fHx8MTc3NjY3MDIyMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

const DOCUMENTS = [
  {
    id: "doc-rc",
    nameKey: "docResidentCert",
    number: RESIDENT_CERT_REF,
    validUntil: "24 Jun 2027",
    kind: "resident",
  },
  {
    id: "doc-1",
    nameKey: "docNationalId",
    number: "LA-2580-1234-5678",
    validUntil: "31 Dec 2028",
  },
  {
    id: "doc-3",
    nameKey: "docHousehold",
    number: "HR-VTE-20-4412",
    validUntil: "01 Jan 2030",
  },
] as const;

export function AccountPage() {
  const t = useT("account");
  const [showCert, setShowCert] = useState(false);

  const handleView = (kind?: string) => {
    if (kind === "resident") setShowCert(true);
  };
  const handleDownload = (kind?: string) => {
    if (kind !== "resident") return;
    const a = document.createElement("a");
    a.href = residentCertPdf;
    a.download = `${RESIDENT_CERT_REF}.pdf`;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const settingsItems = [
    {
      icon: Bell,
      label: t("notifications"),
      desc: t("notificationsDesc"),
    },
    {
      icon: Globe,
      label: t("language"),
      desc: t("languageValue"),
    },
    {
      icon: CreditCard,
      label: t("paymentMethods"),
      desc: t("paymentMethodsDesc"),
    },
  ];

  const MENU_GROUPS = [
    {
      title: t("groupAccount"),
      items: [
        {
          icon: User,
          label: t("personalInfo"),
          desc: t("personalInfoDesc"),
        },
        { icon: Phone, label: t("phoneNumber"), desc: "+856 20 5551 2345" },
        { icon: Mail, label: t("emailAddress"), desc: "somchai@example.la" },
      ],
    },
    {
      title: t("groupSettings"),
      items: settingsItems,
    },
    {
      title: t("groupSecurity"),
      items: [
        {
          icon: Shield,
          label: t("privacySecurity"),
          desc: t("privacySecurityDesc"),
        },
        {
          icon: HelpCircle,
          label: t("helpSupport"),
          desc: t("helpSupportDesc"),
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
              {t("verifiedCitizen")}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-8 py-6 space-y-6">
        {/* My Documents */}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 px-1">
            {t("myDocuments")}
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
                      <p className="text-gray-800 text-sm font-medium">{t(doc.nameKey)}</p>
                      <span className="inline-flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 text-xs px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        {t("verified")}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs mt-0.5">{doc.number}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      <span className="text-gray-400">
                        {t("validUntil")}
                      </span>{" "}
                      <span className="font-medium">{doc.validUntil}</span>
                    </p>
                    <div className="flex gap-2 mt-2.5">
                      <button
                        onClick={() => handleView((doc as { kind?: string }).kind)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {t("view")}
                      </button>
                      <button
                        onClick={() => handleDownload((doc as { kind?: string }).kind)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
                        style={{ backgroundColor: "#344EAD" }}
                      >
                        <Download className="w-3.5 h-3.5" />
                        {t("download")}
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
            {t("signOut")}
          </span>
        </button>

        <div className="text-center">
          <p className="text-gray-300 text-xs">LaoGov v2.1.0</p>
          <p className="text-gray-300 text-xs">Ministry of Interior, Lao PDR</p>
        </div>

        <div className="h-4" />
      </div>

      {/* Residence Certificate preview */}
      {showCert && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/60">
          <div className="flex items-center justify-between px-4 py-3 bg-[#344EAD] text-white flex-shrink-0">
            <p className="text-sm font-semibold">
              {t("docResidentCert")} · {RESIDENT_CERT_REF}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDownload("resident")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/15 hover:bg-white/25 border border-white/20 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                {t("download")}
              </button>
              <button
                onClick={() => setShowCert(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/15 hover:bg-white/25 border border-white/20 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto bg-gray-200">
            <iframe
              title={RESIDENT_CERT_REF}
              src={residentCertPdf}
              className="w-full h-full border-0"
            />
          </div>
        </div>
      )}
    </div>
  );
}
