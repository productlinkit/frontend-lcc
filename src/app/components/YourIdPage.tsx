import { useState } from "react";
import {
  Shield,
  Download,
  Share2,
  RefreshCw,
  CheckCircle,
  MapPin,
  Calendar,
  Hash,
  User,
} from "lucide-react";
import { useT } from "../i18n";

const PROFILE_PHOTO =
  "https://images.unsplash.com/photo-1600896997793-b8ed3459a17f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb3V0aGVhc3QlMjBhc2lhbiUyMHByb2Zlc3Npb25hbCUyMG1hbiUyMGhlYWRzaG90fGVufDF8fHx8MTc3NjY3MDIyMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

function QRCodePlaceholder() {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      {/* Outer border */}
      <rect x="2" y="2" width="76" height="76" rx="4" fill="white" />
      {/* Top-left finder pattern */}
      <rect x="8" y="8" width="20" height="20" rx="2" fill="#1A2D6B" />
      <rect x="12" y="12" width="12" height="12" rx="1" fill="white" />
      <rect x="14" y="14" width="8" height="8" rx="1" fill="#1A2D6B" />
      {/* Top-right finder pattern */}
      <rect x="52" y="8" width="20" height="20" rx="2" fill="#1A2D6B" />
      <rect x="56" y="12" width="12" height="12" rx="1" fill="white" />
      <rect x="58" y="14" width="8" height="8" rx="1" fill="#1A2D6B" />
      {/* Bottom-left finder pattern */}
      <rect x="8" y="52" width="20" height="20" rx="2" fill="#1A2D6B" />
      <rect x="12" y="56" width="12" height="12" rx="1" fill="white" />
      <rect x="14" y="58" width="8" height="8" rx="1" fill="#1A2D6B" />
      {/* Data dots */}
      {[
        [34, 8], [38, 8], [42, 8], [46, 8],
        [34, 12], [42, 12], [46, 12],
        [34, 16], [38, 16], [46, 16],
        [34, 20], [42, 20],
        [34, 24], [38, 24], [42, 24], [46, 24],
        [8, 32], [12, 32], [20, 32], [28, 32], [36, 32], [44, 32], [52, 32], [60, 32], [68, 32],
        [8, 36], [16, 36], [24, 36], [32, 36], [40, 36], [48, 36], [56, 36], [64, 36],
        [8, 40], [12, 40], [24, 40], [28, 40], [36, 40], [52, 40], [60, 40],
        [8, 44], [20, 44], [32, 44], [44, 44], [56, 44], [68, 44],
        [36, 52], [44, 52], [52, 52], [60, 52], [68, 52],
        [36, 56], [40, 56], [52, 56], [64, 56],
        [36, 60], [44, 60], [56, 60], [60, 60], [68, 60],
        [36, 64], [48, 64], [52, 64], [64, 64],
        [36, 68], [40, 68], [44, 68], [56, 68], [60, 68], [68, 68],
      ].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="4" height="4" fill="#1A2D6B" />
      ))}
    </svg>
  );
}

export function YourIdPage() {
  const [isFlipped, setIsFlipped] = useState(false);
  const t = useT("yourId");

  return (
    <div className="min-h-full">
      {/* Header */}
      <div
        className="relative px-4 pt-6 pb-6 lg:px-8"
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
        <div className="relative z-10">
          <p className="text-white/70 text-sm mb-1">{t("headerEyebrow")}</p>
          <h1 className="text-2xl text-white">{t("headerTitle")}</h1>
          <p className="text-white/60 text-xs mt-1">
            {t("country")}
          </p>
        </div>
      </div>

      <div className="px-4 lg:px-8 py-6 max-w-2xl mx-auto lg:mx-0 space-y-5">
        {/* ID Card */}
        <div
          className="relative rounded-3xl overflow-hidden shadow-2xl cursor-pointer select-none"
          style={{ minHeight: "220px" }}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {!isFlipped ? (
            /* Front */
            <div
              className="p-6 h-full"
              style={{
                background:
                  "linear-gradient(135deg, #1A2D6B 0%, #344EAD 60%, #4B67C8 100%)",
                minHeight: "220px",
              }}
            >
              {/* Pattern */}
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />

              <div className="relative z-10 flex gap-5 h-full">
                {/* Photo */}
                <div className="flex-shrink-0">
                  <div className="w-20 h-24 rounded-2xl overflow-hidden border-2 border-white/30 shadow-lg">
                    <img
                      src={PROFILE_PHOTO}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="mt-2 flex justify-center">
                    <div className="flex items-center gap-1 bg-green-500/20 border border-green-400/30 rounded-full px-2 py-0.5">
                      <CheckCircle className="w-3 h-3 text-green-400" />
                      <span className="text-green-300 text-xs">{t("verified")}</span>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🇱🇦</span>
                      <div>
                        <p className="text-white/60 text-xs">{t("countryShort")}</p>
                        <p className="text-white text-xs font-medium">
                          {t("cardType")}
                        </p>
                      </div>
                    </div>
                    <Shield className="w-6 h-6 text-white/40" />
                  </div>

                  <h2 className="text-white mb-3">
                    Somchai{" "}
                    <span style={{ color: "#F59E0B" }}>Phommasack</span>
                  </h2>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Hash className="w-3 h-3 text-white/40" />
                      <span className="text-white/60 text-xs">{t("idNumber")}</span>
                      <span className="text-white text-xs font-mono">
                        LA-2580-1234-5678
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-white/40" />
                      <span className="text-white/60 text-xs">{t("dob")}</span>
                      <span className="text-white text-xs">
                        15 March 1985
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-white/40" />
                      <span className="text-white/60 text-xs">{t("province")}</span>
                      <span className="text-white text-xs">
                        Vientiane Capital
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <p className="text-white/40 text-xs">{t("validUntil")}</p>
                      <p className="text-white/80 text-xs font-medium">
                        31 Dec 2031
                      </p>
                    </div>
                    <p className="text-white/30 text-xs">{t("tapToFlip")}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Back */
            <div
              className="p-6 flex flex-col justify-between"
              style={{
                background:
                  "linear-gradient(135deg, #1A2D6B 0%, #344EAD 60%, #4B67C8 100%)",
                minHeight: "220px",
              }}
            >
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />

              <div className="relative z-10 flex gap-6 items-center h-full">
                <div className="flex-1">
                  <p className="text-white/60 text-xs mb-2">{t("scanToVerify")}</p>
                  <p className="text-white text-sm font-medium mb-3">
                    {t("digitalVerificationQR")}
                  </p>
                  <div className="text-white/50 text-xs space-y-1">
                    <p>{t("issuedBy")}</p>
                    <p>{t("issueDate")}</p>
                    <p>{t("chip")}</p>
                  </div>
                </div>
                <div className="w-28 h-28 bg-white rounded-2xl p-2 shadow-xl flex-shrink-0">
                  <QRCodePlaceholder />
                </div>
              </div>

              <div className="relative z-10 mt-4">
                <div className="h-8 bg-black/20 rounded-lg flex items-center px-3">
                  <p className="text-white/30 text-xs font-mono tracking-widest">
                    LA2580123456781985
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Download, label: t("actionDownload") },
            { icon: Share2, label: t("actionShare") },
            { icon: RefreshCw, label: t("actionRenew") },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                className="bg-white rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "#EEF2FF" }}
                >
                  <Icon className="w-5 h-5" style={{ color: "#344EAD" }} />
                </div>
                <span className="text-xs text-gray-600">{action.label}</span>
              </button>
            );
          })}
        </div>

        {/* Personal Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div
            className="px-5 py-4 border-b border-gray-100 flex items-center gap-2"
          >
            <User className="w-4 h-4" style={{ color: "#344EAD" }} />
            <h3 className="text-gray-800 text-sm">{t("personalInformation")}</h3>
          </div>

          {[
            { label: t("fullName"), value: "Somchai Phommasack" },
            { label: t("gender"), value: t("genderValue") },
            { label: t("dateOfBirth"), value: "15 March 1985" },
            { label: t("nationality"), value: t("nationalityValue") },
            { label: t("ethnicity"), value: t("ethnicityValue") },
            { label: t("religion"), value: t("religionValue") },
            { label: t("provinceLabel"), value: t("provinceValue") },
            { label: t("district"), value: t("districtValue") },
            { label: t("village"), value: t("villageValue") },
          ].map((item, i, arr) => (
            <div
              key={item.label}
              className={`flex items-center justify-between px-5 py-3.5 ${
                i < arr.length - 1 ? "border-b border-gray-50" : ""
              }`}
            >
              <span className="text-gray-400 text-sm">{item.label}</span>
              <span className="text-gray-700 text-sm font-medium">
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {/* Status Card */}
        <div
          className="rounded-2xl p-5 flex items-center gap-4"
          style={{ backgroundColor: "#EEF2FF" }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: "#344EAD" }}
          >
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p
              className="text-sm font-medium"
              style={{ color: "#344EAD" }}
            >
              {t("statusTitle")}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {t("statusNote")}
            </p>
          </div>
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
}