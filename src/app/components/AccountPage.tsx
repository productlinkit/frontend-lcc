import { useEffect, useRef, useState } from "react";
import {
  User,
  Bell,
  Globe,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  ChevronDown,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  FileText,
  CreditCard,
  Eye,
  Download,
  Camera,
  RefreshCw,
} from "lucide-react";
import { useT, useLang } from "../i18n";
import userPhoto from "../../imports/user-photo.png";
import { DocumentViewer } from "./DocumentViewer";
import { Button } from "./Button";
import { navigateTo } from "../routes";
import { auth, me } from "../api/endpoints";
import { useMutation, useQuery } from "../api/hooks";
import { useSession } from "../api/session";
import { text, type CitizenDocument, type CitizenPreferences, type Lang } from "../api/types";

const PROFILE_PHOTO = userPhoto;

/*
 * Wording for the parts of this screen that only exist now that it talks to the
 * API — document states, the inline editors and the load/save feedback. The
 * shared dictionary is owned elsewhere, so these stay bilingual here.
 */
const COPY = {
  retry: { en: "Try again", lo: "ລອງໃໝ່" },
  docsError: {
    en: "We could not load your documents.",
    lo: "ພວກເຮົາບໍ່ສາມາດໂຫຼດເອກະສານຂອງທ່ານໄດ້.",
  },
  docsEmpty: {
    en: "No documents are linked to your account yet.",
    lo: "ຍັງບໍ່ມີເອກະສານທີ່ເຊື່ອມກັບບັນຊີຂອງທ່ານ.",
  },
  profileError: {
    en: "We could not load your profile.",
    lo: "ພວກເຮົາບໍ່ສາມາດໂຫຼດຂໍ້ມູນບັນຊີຂອງທ່ານໄດ້.",
  },
  notReady: { en: "Not available yet", lo: "ຍັງບໍ່ພ້ອມໃຫ້ດາວໂຫຼດ" },
  expired: { en: "Expired", lo: "ໝົດອາຍຸ" },
  missing: { en: "Not on file", lo: "ຍັງບໍ່ມີ" },
  issued: { en: "Issued:", lo: "ອອກເມື່ອ:" },
  fullName: { en: "Full name", lo: "ຊື່ ແລະ ນາມສະກຸນ" },
  emailLabel: { en: "Email address", lo: "ທີ່ຢູ່ອີເມວ" },
  addressLabel: { en: "Address", lo: "ທີ່ຢູ່" },
  saved: { en: "Saved.", lo: "ບັນທຶກແລ້ວ." },
  nothingChanged: { en: "Nothing to save.", lo: "ບໍ່ມີການປ່ຽນແປງ." },
  inApp: { en: "In-app alerts", lo: "ການແຈ້ງເຕືອນໃນແອັບ" },
  emailNotif: { en: "Email", lo: "ອີເມວ" },
  smsNotif: { en: "SMS", lo: "ຂໍ້ຄວາມ SMS" },
  biometric: { en: "Biometric sign-in", lo: "ເຂົ້າສູ່ລະບົບດ້ວຍຊີວະມິຕິ" },
  changePassword: { en: "Change password", lo: "ປ່ຽນລະຫັດຜ່ານ" },
  currentPassword: { en: "Current password", lo: "ລະຫັດຜ່ານປັດຈຸບັນ" },
  newPassword: { en: "New password", lo: "ລະຫັດຜ່ານໃໝ່" },
  confirmPassword: { en: "Confirm new password", lo: "ຢືນຢັນລະຫັດຜ່ານໃໝ່" },
  passwordChanged: { en: "Password changed.", lo: "ປ່ຽນລະຫັດຜ່ານແລ້ວ." },
  passwordMismatch: { en: "The two passwords do not match.", lo: "ລະຫັດຜ່ານທັງສອງບໍ່ກົງກັນ." },
  passwordShort: { en: "At least 8 characters.", lo: "ຢ່າງໜ້ອຍ 8 ຕົວອັກສອນ." },
  photoHint: { en: "Change photo", lo: "ປ່ຽນຮູບ" },
  uin: { en: "UIN", lo: "ເລກປະຈຳຕົວ" },
} as const;

const inputBase =
  "w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-sm outline-none transition-all focus:bg-white focus:border-[#344EAD] focus:ring-2 focus:ring-[#344EAD]/15 placeholder:text-gray-400";

function formatDate(value: string | undefined, lang: Lang): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(lang === "lo" ? "lo-LA" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function triggerDownload(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/** Small on/off control used by the settings panels. */
function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="w-11 h-6 rounded-full p-0.5 flex-shrink-0 transition-colors"
      style={{ backgroundColor: checked ? "#344EAD" : "#E5E7EB" }}
    >
      <span
        className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}

/** One row of a settings card — same shape whether or not it opens a panel. */
function Row({
  icon: Icon,
  label,
  desc,
  divider,
  open,
  onClick,
  children,
}: {
  icon: React.ElementType;
  label: string;
  desc: string;
  divider: boolean;
  open?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className={divider ? "border-b border-gray-50" : ""}>
      <button
        onClick={onClick}
        aria-expanded={onClick ? Boolean(open) : undefined}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "#EEF2FF" }}
        >
          <Icon className="w-5 h-5" style={{ color: "#344EAD" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-gray-800 text-sm font-medium">{label}</p>
          <p className="text-gray-400 text-xs truncate">{desc}</p>
        </div>
        {onClick ? (
          <ChevronDown
            className={`w-4 h-4 text-gray-300 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
        )}
      </button>
      {open && children && <div className="px-5 pb-5 -mt-1">{children}</div>}
    </div>
  );
}

export function AccountPage() {
  const t = useT("account");
  const tc = useT("common");
  const { lang, setLang } = useLang();
  const session = useSession();
  const c = (key: keyof typeof COPY) => (COPY[key] as Record<Lang, string>)[lang as Lang];

  const [viewingDoc, setViewingDoc] = useState<CitizenDocument | null>(null);
  const [openPanel, setOpenPanel] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const profileQuery = useQuery((signal) => me.profile(signal), []);
  const docsQuery = useQuery((signal) => me.documents(signal), []);
  const prefsQuery = useQuery((signal) => me.preferences(signal), []);

  const profile = profileQuery.data ?? session.profile;
  const account = profile?.account;
  const prefs = prefsQuery.data;

  /* ── Profile editing ─────────────────────────────────────────────────── */
  const [form, setForm] = useState({ name: "", email: "", address: "" });
  const [profileNote, setProfileNote] = useState("");
  const saveProfile = useMutation((body: Parameters<typeof me.updateProfile>[0]) =>
    me.updateProfile(body),
  );

  useEffect(() => {
    if (!account) return;
    setForm({ name: account.name ?? "", email: account.email ?? "", address: account.address ?? "" });
  }, [account?.id, account?.name, account?.email, account?.address]);

  async function handleSaveProfile() {
    if (!account) return;
    // Only what actually changed goes on the wire.
    const body: { name?: string; email?: string; address?: string } = {};
    if (form.name.trim() && form.name.trim() !== account.name) body.name = form.name.trim();
    if (form.email.trim() !== (account.email ?? "")) body.email = form.email.trim();
    if (form.address.trim() !== (account.address ?? "")) body.address = form.address.trim();
    if (Object.keys(body).length === 0) {
      setProfileNote(c("nothingChanged"));
      return;
    }
    setProfileNote("");
    try {
      await saveProfile.run(body);
      profileQuery.refetch();
      await session.refresh();
      setProfileNote(c("saved"));
    } catch {
      /* saveProfile.error carries the message */
    }
  }

  /* ── Avatar ──────────────────────────────────────────────────────────── */
  const uploadAvatar = useMutation((file: File) => me.uploadAvatar(file));

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      await uploadAvatar.run(file);
      profileQuery.refetch();
      await session.refresh();
    } catch {
      /* uploadAvatar.error carries the message */
    }
  }

  /* ── Preferences ─────────────────────────────────────────────────────── */
  const savePrefs = useMutation((body: CitizenPreferences) => me.savePreferences(body));

  async function updatePrefs(patch: Partial<CitizenPreferences>) {
    if (!prefs) return;
    const next: CitizenPreferences = {
      ...prefs,
      ...patch,
      notifications: { ...prefs.notifications, ...(patch.notifications ?? {}) },
    };
    try {
      await savePrefs.run(next);
      prefsQuery.refetch();
    } catch {
      /* savePrefs.error carries the message */
    }
  }

  /* ── Password ────────────────────────────────────────────────────────── */
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwNote, setPwNote] = useState("");
  const [pwError, setPwError] = useState("");
  const changePassword = useMutation((body: { current_password: string; new_password: string }) =>
    auth.changePassword(body),
  );

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwNote("");
    if (pw.next.length < 8) { setPwError(c("passwordShort")); return; }
    if (pw.next !== pw.confirm) { setPwError(c("passwordMismatch")); return; }
    setPwError("");
    try {
      await changePassword.run({ current_password: pw.current, new_password: pw.next });
      setPw({ current: "", next: "", confirm: "" });
      setPwNote(c("passwordChanged"));
    } catch (err) {
      setPwError((err as Error).message);
    }
  }

  /* ── Sign out ────────────────────────────────────────────────────────── */
  async function handleSignOut() {
    await session.signOut();
    navigateTo("home");
  }

  /* ── Documents ───────────────────────────────────────────────────────── */
  const documents = docsQuery.data ?? [];

  const docStatus = (doc: CitizenDocument) =>
    doc.status === "valid"
      ? { label: t("verified"), cls: "bg-green-50 border-green-200 text-green-700", icon: true }
      : doc.status === "expired"
      ? { label: c("expired"), cls: "bg-red-50 border-red-200 text-red-600", icon: false }
      : { label: c("missing"), cls: "bg-gray-50 border-gray-200 text-gray-500", icon: false };

  const toggle = (key: string) => setOpenPanel((cur) => (cur === key ? null : key));

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
                src={account?.avatar_url || PROFILE_PHOTO}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            {/* The photo itself is the upload control. */}
            <button
              onClick={() => fileRef.current?.click()}
              aria-label={c("photoHint")}
              title={c("photoHint")}
              className="absolute inset-0 rounded-full"
            >
              <span className="sr-only">{c("photoHint")}</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleAvatar}
              className="sr-only"
            />
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
              {uploadAvatar.pending ? (
                <RefreshCw className="w-3 h-3 text-white animate-spin" />
              ) : account?.verified ? (
                <CheckCircle className="w-3 h-3 text-white" />
              ) : (
                <Camera className="w-3 h-3 text-white" />
              )}
            </div>
          </div>
          <h2 className="text-white">
            {profileQuery.loading && !account ? (
              <span className="inline-block h-5 w-40 rounded bg-white/20 animate-pulse" />
            ) : (
              account?.name ?? "—"
            )}
          </h2>
          <p className="text-white/60 text-sm mt-1">
            {c("uin")}: {account?.uin ?? "—"}
          </p>
          {account?.verified && (
            <div className="flex items-center gap-1.5 mt-2 bg-white/10 border border-white/20 rounded-full px-3 py-1">
              <CheckCircle className="w-3 h-3 text-green-400" />
              <span className="text-green-300 text-xs">
                {t("verifiedCitizen")}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 lg:px-8 py-6 space-y-6">
        {profileQuery.error && (
          <div className="flex items-center gap-3 p-4 rounded-2xl border border-red-100 bg-red-50">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="flex-1 text-red-600 text-sm">
              {profileQuery.error.message || c("profileError")}
            </p>
            <Button size="sm" variant="secondary" onClick={profileQuery.refetch}>
              {c("retry")}
            </Button>
          </div>
        )}

        {/* My Documents */}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 px-1">
            {t("myDocuments")}
          </p>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {docsQuery.loading && (
              <div className="p-5 space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            )}

            {!docsQuery.loading && docsQuery.error && (
              <div className="p-5 text-center">
                <p className="text-gray-600 text-sm">
                  {docsQuery.error.message || c("docsError")}
                </p>
                <div className="mt-3 flex justify-center">
                  <Button size="sm" variant="secondary" onClick={docsQuery.refetch}>
                    {c("retry")}
                  </Button>
                </div>
              </div>
            )}

            {!docsQuery.loading && !docsQuery.error && documents.length === 0 && (
              <p className="px-5 py-6 text-gray-400 text-sm text-center">{c("docsEmpty")}</p>
            )}

            {!docsQuery.loading &&
              !docsQuery.error &&
              documents.map((doc, i) => {
                const status = docStatus(doc);
                const openable = Boolean(doc.available && doc.file_url);
                return (
                  <div
                    key={doc.id ?? `${doc.type}-${i}`}
                    className={`px-5 py-4 ${i < documents.length - 1 ? "border-b border-gray-50" : ""}`}
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
                          <p className="text-gray-800 text-sm font-medium">{text(doc.title, lang)}</p>
                          <span
                            className={`inline-flex items-center gap-1 border text-xs px-2 py-0.5 rounded-full ${status.cls}`}
                          >
                            {status.icon && <CheckCircle className="w-3 h-3" />}
                            {status.label}
                          </span>
                        </div>
                        {doc.number && <p className="text-gray-400 text-xs mt-0.5">{doc.number}</p>}
                        {(doc.expires_at || doc.issued_at) && (
                          <p className="text-gray-500 text-xs mt-1">
                            <span className="text-gray-400">
                              {doc.expires_at ? t("validUntil") : c("issued")}
                            </span>{" "}
                            <span className="font-medium">
                              {formatDate(doc.expires_at ?? doc.issued_at, lang)}
                            </span>
                          </p>
                        )}
                        {openable ? (
                          <div className="flex gap-2 mt-2.5">
                            <button
                              onClick={() => setViewingDoc(doc)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              {t("view")}
                            </button>
                            <button
                              onClick={() =>
                                triggerDownload(doc.file_url!, `${doc.number || doc.type}.pdf`)
                              }
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
                              style={{ backgroundColor: "#344EAD" }}
                            >
                              <Download className="w-3.5 h-3.5" />
                              {t("download")}
                            </button>
                          </div>
                        ) : (
                          <p className="text-gray-400 text-xs mt-2.5">{c("notReady")}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Account */}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 px-1">
            {t("groupAccount")}
          </p>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <Row
              icon={User}
              label={t("personalInfo")}
              desc={t("personalInfoDesc")}
              divider
              open={openPanel === "profile"}
              onClick={() => toggle("profile")}
            >
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    {c("fullName")}
                  </label>
                  <input
                    className={inputBase}
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                  {saveProfile.fieldErrors.name && (
                    <p className="text-red-500 text-xs mt-1.5">{saveProfile.fieldErrors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    {c("emailLabel")}
                  </label>
                  <input
                    className={inputBase}
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  />
                  {saveProfile.fieldErrors.email && (
                    <p className="text-red-500 text-xs mt-1.5">{saveProfile.fieldErrors.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    {c("addressLabel")}
                  </label>
                  <input
                    className={inputBase}
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  />
                </div>
                {saveProfile.error && (
                  <p className="text-red-500 text-xs">{saveProfile.error.message}</p>
                )}
                {profileNote && <p className="text-green-600 text-xs">{profileNote}</p>}
                <Button size="md" loading={saveProfile.pending} onClick={handleSaveProfile}>
                  {tc("save")}
                </Button>
              </div>
            </Row>
            <Row icon={Phone} label={t("phoneNumber")} desc={account?.phone ?? "—"} divider />
            <Row icon={Mail} label={t("emailAddress")} desc={account?.email || "—"} divider={false} />
          </div>
        </div>

        {/* Settings */}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 px-1">
            {t("groupSettings")}
          </p>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <Row
              icon={Bell}
              label={t("notifications")}
              desc={t("notificationsDesc")}
              divider
              open={openPanel === "notifications"}
              onClick={() => toggle("notifications")}
            >
              {prefsQuery.loading && <div className="h-20 rounded-xl bg-gray-100 animate-pulse" />}
              {prefsQuery.error && (
                <div className="flex items-center gap-3">
                  <p className="flex-1 text-red-600 text-xs">{prefsQuery.error.message}</p>
                  <Button size="sm" variant="secondary" onClick={prefsQuery.refetch}>
                    {c("retry")}
                  </Button>
                </div>
              )}
              {prefs && (
                <div className="space-y-3">
                  {([
                    ["in_app", c("inApp")],
                    ["email", c("emailNotif")],
                    ["sms", c("smsNotif")],
                  ] as const).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between gap-4">
                      <span className="text-sm text-gray-700">{label}</span>
                      <Toggle
                        label={label}
                        checked={prefs.notifications[key]}
                        onChange={(next) =>
                          updatePrefs({ notifications: { ...prefs.notifications, [key]: next } })
                        }
                      />
                    </div>
                  ))}
                  {savePrefs.error && (
                    <p className="text-red-500 text-xs">{savePrefs.error.message}</p>
                  )}
                </div>
              )}
            </Row>

            <Row
              icon={Globe}
              label={t("language")}
              desc={prefs ? (prefs.language === "lo" ? "ລາວ" : "English") : t("languageValue")}
              divider
              open={openPanel === "language"}
              onClick={() => toggle("language")}
            >
              <div className="flex gap-2">
                {(["lo", "en"] as const).map((code) => {
                  const active = (prefs?.language ?? lang) === code;
                  return (
                    <button
                      key={code}
                      onClick={() => {
                        setLang(code);
                        updatePrefs({ language: code });
                      }}
                      className="flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: active ? "#EEF2FF" : "white",
                        borderColor: active ? "#344EAD" : "#E5E7EB",
                        color: active ? "#344EAD" : "#6B7280",
                      }}
                    >
                      {code === "lo" ? "ລາວ" : "English"}
                    </button>
                  );
                })}
              </div>
            </Row>

            <Row
              icon={CreditCard}
              label={t("paymentMethods")}
              desc={t("paymentMethodsDesc")}
              divider={false}
            />
          </div>
        </div>

        {/* Security */}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 px-1">
            {t("groupSecurity")}
          </p>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <Row
              icon={Shield}
              label={t("privacySecurity")}
              desc={t("privacySecurityDesc")}
              divider
              open={openPanel === "security"}
              onClick={() => toggle("security")}
            >
              <div className="space-y-4">
                {prefs && (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-gray-700">{c("biometric")}</span>
                    <Toggle
                      label={c("biometric")}
                      checked={prefs.biometric_login}
                      onChange={(next) => updatePrefs({ biometric_login: next })}
                    />
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-3 pt-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {c("changePassword")}
                  </p>
                  <input
                    className={inputBase}
                    type="password"
                    autoComplete="current-password"
                    placeholder={c("currentPassword")}
                    value={pw.current}
                    onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
                  />
                  <input
                    className={inputBase}
                    type="password"
                    autoComplete="new-password"
                    placeholder={c("newPassword")}
                    value={pw.next}
                    onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
                  />
                  <input
                    className={inputBase}
                    type="password"
                    autoComplete="new-password"
                    placeholder={c("confirmPassword")}
                    value={pw.confirm}
                    onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
                  />
                  {pwError && <p className="text-red-500 text-xs">{pwError}</p>}
                  {pwNote && <p className="text-green-600 text-xs">{pwNote}</p>}
                  <Button type="submit" size="md" loading={changePassword.pending}>
                    {c("changePassword")}
                  </Button>
                </form>
              </div>
            </Row>
            <Row
              icon={HelpCircle}
              label={t("helpSupport")}
              desc={t("helpSupportDesc")}
              divider={false}
              onClick={() => navigateTo("help")}
            />
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 bg-white rounded-2xl p-4 shadow-sm border border-red-100 text-red-500 hover:bg-red-50 transition-colors"
        >
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

      {/* Document viewer — the file the API issued for this document */}
      {viewingDoc?.file_url && (
        <DocumentViewer
          title={`${text(viewingDoc.title, lang)}${viewingDoc.number ? ` · ${viewingDoc.number}` : ""}`}
          staticUrl={viewingDoc.file_url}
          downloadName={`${viewingDoc.number || viewingDoc.type}.pdf`}
          onClose={() => setViewingDoc(null)}
        />
      )}
    </div>
  );
}
