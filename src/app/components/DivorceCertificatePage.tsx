import { useState, useRef } from "react";
import {
  ChevronLeft,
  ArrowRight,
  Check,
  Loader2,
  AlertCircle,
  HeartCrack,
  User,
  Info,
  FileText,
  X,
  CheckCircle2,
  Link2,
  FilePlus2,
  ClipboardList,
  Gavel,
} from "lucide-react";
import { PaymentSection, blankPayment, isPaymentValid, type PaymentState } from "./PaymentSection";
import { LocationFields, DateField } from "./formFields";
import {
  ValidationProvider,
  useShowErrors,
  FieldError,
  fieldErrorRing,
  isEmpty,
} from "./formValidation";
import { SERVICE_CONFIG, getServiceConfig, formatLak } from "../serviceConfig";
import { useT, useLang } from "../i18n";

/*
 * Divorce Certificate — follows PRD §9. The menu groups two sub-processes:
 *   A) Divorce Mediation Records — Record of Voluntary Divorce + Division of
 *      joint property / custody / debts (village), and
 *   B) Divorce Registration — application + supporting forms (district).
 * Per FR-11 a voluntary case STARTS by selecting the mediation record by its
 * reference number (links & pre-fills the spouses), or by creating one first.
 * A contested divorce instead relies on a final People's Court decree.
 * Officer artefacts (registrar e-signature) are excluded (back-office).
 * M = Mandatory · C = Conditional · O = Optional · Auto = system-generated.
 */

/* ─── Types ─── */
interface DocFile {
  name: string;
}

interface SpouseInfo {
  fullName: string; // M
  dob: string; // M
  nationality: string; // M
  idOrPassport: string; // M
  addrHouseNo: string;
  addrVillage: string; // M
  addrDistrict: string;
  addrProvince: string; // M
  marriageCertRef: string; // M — existing marriage certificate ref
}

/* A prior divorce-mediation record the citizen can link to (FR-11). Demo/mock. */
interface MediationRecord {
  id: string;
  husbandName: string;
  husbandNat: string;
  wifeName: string;
  wifeNat: string;
  province: string;
  district: string;
  village: string;
  date: string;
  marriageBegan: string;
}

const MOCK_MEDIATIONS: MediationRecord[] = [
  {
    id: "DM-2026-00019",
    husbandName: "Bounma Keovilay", husbandNat: "Lao",
    wifeName: "Somchan Vilaphonh", wifeNat: "Lao",
    province: "Vientiane Capital", district: "Sikhottabong", village: "Ban Sikhai",
    date: "2026-05-20", marriageBegan: "2015-02-14",
  },
  {
    id: "DM-2026-00023",
    husbandName: "Phit Sengdao", husbandNat: "Lao",
    wifeName: "Kongmany Souksavath", wifeNat: "Lao",
    province: "Savannakhet", district: "Kaysone Phomvihane", village: "Ban Thahae",
    date: "2026-06-05", marriageBegan: "2012-11-30",
  },
];

/* ─── Constants ─── */
const STEP_IDS = [1, 2, 3, 4, 5, 6] as const;
const STEP_COUNT = STEP_IDS.length;

type DivorceT = ReturnType<typeof useT<"divorce">>;

const stepTitleKey = (id: number) => `step${id}Title` as Parameters<DivorceT>[0];
const stepSubtitleKey = (id: number) => `step${id}Subtitle` as Parameters<DivorceT>[0];

/* Stored values are stable identifiers; labels are resolved via the namespace. */
const NATIONALITIES = ["Lao", "Thai", "Vietnamese", "Chinese", "Cambodian", "American", "French", "Other"];
const NATIONALITY_KEY: Record<string, Parameters<DivorceT>[0]> = {
  Lao: "natLao", Thai: "natThai", Vietnamese: "natVietnamese", Chinese: "natChinese",
  Cambodian: "natCambodian", American: "natAmerican", French: "natFrench", Other: "natOther",
};
const DIVORCE_TYPES = ["Voluntary", "Contested"];
const DIVORCE_TYPE_KEY: Record<string, Parameters<DivorceT>[0]> = {
  Voluntary: "typeVoluntary", Contested: "typeContested",
};

/* ─── Blank record ─── */
const blankSpouse: SpouseInfo = {
  fullName: "", dob: "", nationality: "Lao", idOrPassport: "",
  addrHouseNo: "", addrVillage: "", addrDistrict: "", addrProvince: "",
  marriageCertRef: "",
};

/* ─── Field components ─── */
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

function InputField({
  label, value, placeholder, onChange, required, inputMode,
}: {
  label: React.ReactNode; value: string; placeholder: string;
  onChange: (v: string) => void; required?: boolean;
  inputMode?: "text" | "numeric" | "tel" | "email";
}) {
  const hasError = useShowErrors() && Boolean(required) && isEmpty(value);
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        type="text"
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-white border rounded-2xl px-4 py-3.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all ${fieldErrorRing(hasError)}`}
      />
      <FieldError show={hasError} />
    </div>
  );
}

function TextAreaField({
  label, value, placeholder, onChange, required,
}: {
  label: React.ReactNode; value: string; placeholder: string;
  onChange: (v: string) => void; required?: boolean;
}) {
  const hasError = useShowErrors() && Boolean(required) && isEmpty(value);
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className={`w-full bg-white border rounded-2xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all resize-none ${fieldErrorRing(hasError)}`}
      />
      <FieldError show={hasError} />
    </div>
  );
}

function SelectField({
  label, value, options, placeholder, onChange, required, optionLabel,
}: {
  label: React.ReactNode; value: string; options: string[];
  placeholder: string; onChange: (v: string) => void; required?: boolean;
  optionLabel?: (v: string) => string;
}) {
  const hasError = useShowErrors() && Boolean(required) && isEmpty(value);
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full appearance-none bg-white border rounded-2xl px-4 py-3.5 text-sm text-gray-800 focus:outline-none focus:ring-2 transition-all pr-10 ${fieldErrorRing(hasError)}`}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => <option key={o} value={o}>{optionLabel ? optionLabel(o) : o}</option>)}
        </select>
        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      <FieldError show={hasError} />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-1">
      {children}
    </p>
  );
}

/* ─── Document upload (PDF or image) ─── */
function DocUpload({
  label, file, onChange, required, hint,
}: {
  label: React.ReactNode; file: DocFile | null;
  onChange: (f: DocFile | null) => void; required?: boolean; hint?: string;
}) {
  const t = useT("divorce");
  const inputRef = useRef<HTMLInputElement>(null);
  const hasError = useShowErrors() && Boolean(required) && !file;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    onChange({ name: picked.name });
  };

  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input ref={inputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFile} />
      {file ? (
        <div className="flex items-center gap-3 p-3.5 rounded-2xl border-2 border-green-300 bg-green-50">
          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
          <span className="flex-1 text-sm text-gray-700 truncate">{file.name}</span>
          <button
            onClick={() => { onChange(null); if (inputRef.current) inputRef.current.value = ""; }}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 border-dashed ${hasError ? "border-red-300" : "border-gray-200"} bg-gray-50 hover:border-[#344EAD]/40 hover:bg-blue-50/50 transition-all text-left`}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#EEF2FF" }}>
            <FileText className="w-5 h-5" style={{ color: "#344EAD" }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-600">{t("uploadDocument")}</p>
            <p className="text-xs text-gray-400 mt-0.5">{hint ?? t("uploadHint")}</p>
          </div>
        </button>
      )}
      <FieldError show={hasError} />
    </div>
  );
}

/* ─── Toggle row (yes/no condition) ─── */
function ToggleRow({
  active, onToggle, title, hint,
}: {
  active: boolean; onToggle: () => void; title: string; hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between gap-3 p-4 rounded-2xl border transition-all text-left"
      style={{
        backgroundColor: active ? "#EEF2FF" : "white",
        borderColor: active ? "#344EAD" : "#E5E7EB",
      }}
    >
      <div className="flex items-start gap-2.5">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#344EAD" }} />
        <div>
          <p className="text-sm font-medium text-gray-800">{title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
        </div>
      </div>
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border-2"
        style={{
          backgroundColor: active ? "#344EAD" : "transparent",
          borderColor: active ? "#344EAD" : "#D1D5DB",
        }}
      >
        {active && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </div>
    </button>
  );
}

/* ─── Spouse section (Husband / Wife share the same structure — PRD §9.4) ─── */
function SpouseSection({
  value, onChange,
}: {
  value: SpouseInfo; onChange: (patch: Partial<SpouseInfo>) => void;
}) {
  const t = useT("divorce");
  return (
    <>
      <InputField
        label={t("fullName")}
        value={value.fullName}
        placeholder={t("fullNamePlaceholder")}
        onChange={(v) => onChange({ fullName: v })}
        required
      />
      <div className="grid grid-cols-2 gap-3">
        <DateField
          label={t("dob")}
          value={value.dob}
          onChange={(v) => onChange({ dob: v })}
          required
        />
        <SelectField
          label={t("nationality")}
          value={value.nationality}
          options={NATIONALITIES}
          placeholder={t("selectPlaceholder")}
          optionLabel={(o) => t(NATIONALITY_KEY[o] ?? "natOther")}
          onChange={(v) => onChange({ nationality: v })}
          required
        />
      </div>
      <InputField
        label={t("idOrPassport")}
        value={value.idOrPassport}
        placeholder={t("idOrPassportPlaceholder")}
        onChange={(v) => onChange({ idOrPassport: v })}
        required
      />

      <SectionLabel>{t("currentAddress")}</SectionLabel>
      <InputField
        label={t("houseNo")}
        value={value.addrHouseNo}
        placeholder={t("houseNoPlaceholder")}
        onChange={(v) => onChange({ addrHouseNo: v })}
      />
      <LocationFields
        province={value.addrProvince}
        district={value.addrDistrict}
        village={value.addrVillage}
        villageLabel={t("villageLabel")}
        required
        onChange={(p) =>
          onChange({
            ...(p.province !== undefined ? { addrProvince: p.province } : {}),
            ...(p.district !== undefined ? { addrDistrict: p.district } : {}),
            ...(p.village !== undefined ? { addrVillage: p.village } : {}),
          })
        }
      />

      <InputField
        label={t("marriageCertRef")}
        value={value.marriageCertRef}
        placeholder={t("marriageCertRefPlaceholder")}
        onChange={(v) => onChange({ marriageCertRef: v })}
        required
      />
    </>
  );
}

/* ─── Step Indicator (spans the form container width) ─── */
function StepIndicator({ step }: { step: number }) {
  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-screen-sm mx-auto px-4 py-4 flex items-center">
        {STEP_IDS.map((id, i) => {
          const done = step > id;
          const active = step === id;
          const isLast = i === STEP_IDS.length - 1;
          return (
            <div key={id} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 flex-shrink-0"
                style={{
                  backgroundColor: done || active ? "#344EAD" : "#F3F4F6",
                  color: done || active ? "white" : "#9CA3AF",
                  opacity: done ? 0.55 : 1,
                }}
              >
                {done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : id}
              </div>
              {!isLast && (
                <div
                  className="flex-1 h-0.5 mx-1.5 rounded-full transition-all duration-500"
                  style={{
                    backgroundColor: step > id ? "#344EAD" : "#E5E7EB",
                    opacity: step > id ? 0.4 : 1,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepHeader({ step }: { step: number }) {
  const t = useT("divorce");
  return (
    <div className="mb-3 pb-1">
      <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#344EAD" }}>
        {t("stepOf", { n: step, m: STEP_COUNT })}
      </p>
      <h2 className="text-gray-900 mt-0.5">{t(stepTitleKey(step))}</h2>
      <p className="text-gray-400 text-xs mt-0.5">{t(stepSubtitleKey(step))}</p>
    </div>
  );
}

/* ─── Main Page ─── */
interface DivorceCertificatePageProps {
  onBack: () => void;
}

export function DivorceCertificatePage({ onBack }: DivorceCertificatePageProps) {
  const t = useT("divorce");
  const { lang } = useLang();
  const cfg = getServiceConfig("divorce");
  const [step, setStep] = useState(1);
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const documentNo = "DV-2026-00073";

  const [header, setHeader] = useState({ province: "", district: "", village: "" });
  const [husband, setHusband] = useState<SpouseInfo>(blankSpouse);
  const [wife, setWife] = useState<SpouseInfo>(blankSpouse);

  // Step 1 — divorce basis
  const [basis, setBasis] = useState({ divorceType: "", dateOfDivorce: "", placeOfRegistration: "" });

  // Voluntary path — mediation record (FR-11)
  const [mediationMode, setMediationMode] = useState<"" | "existing" | "new">("");
  const [linkedMediationId, setLinkedMediationId] = useState("");
  const [mediation, setMediation] = useState({
    dateMarriageBegan: "", reasonsHusband: "", reasonsWife: "", outcome: "",
    propertyDivision: "", debts: "", additionalAssets: "", w1Name: "", w2Name: "",
  });
  const [hasChildren, setHasChildren] = useState(false);
  const [children, setChildren] = useState({ list: "", custody: "" });

  // Contested path — People's Court decree
  const [court, setCourt] = useState({ name: "", decisionDate: "" });
  const [courtDecision, setCourtDecision] = useState<DocFile | null>(null);

  // Step 4 — supporting documents
  const [guaranteeCert, setGuaranteeCert] = useState<DocFile | null>(null);
  const [householdBook, setHouseholdBook] = useState<DocFile | null>(null);
  const [photos, setPhotos] = useState<DocFile | null>(null);

  const [payment, setPayment] = useState<PaymentState>(blankPayment);

  const fee = SERVICE_CONFIG.divorce.fee ?? 0;

  const patchHusband = (patch: Partial<SpouseInfo>) => setHusband((p) => ({ ...p, ...patch }));
  const patchWife = (patch: Partial<SpouseInfo>) => setWife((p) => ({ ...p, ...patch }));
  const patchBasis = (patch: Partial<typeof basis>) => setBasis((p) => ({ ...p, ...patch }));
  const patchMediation = (patch: Partial<typeof mediation>) => setMediation((p) => ({ ...p, ...patch }));
  const patchCourt = (patch: Partial<typeof court>) => setCourt((p) => ({ ...p, ...patch }));

  const linkedRecord = MOCK_MEDIATIONS.find((m) => m.id === linkedMediationId) ?? null;

  /* Link an existing mediation record → pre-fill header + spouses (FR-11). */
  const selectExisting = (rec: MediationRecord) => {
    setLinkedMediationId(rec.id);
    setHeader({ province: rec.province, district: rec.district, village: rec.village });
    patchHusband({ fullName: rec.husbandName, nationality: rec.husbandNat });
    patchWife({ fullName: rec.wifeName, nationality: rec.wifeNat });
    setMediation((m) => ({ ...m, dateMarriageBegan: rec.marriageBegan }));
  };

  const resetMediation = () => {
    setMediationMode("");
    setLinkedMediationId("");
  };

  const spouseValid = (s: SpouseInfo) =>
    Boolean(
      s.fullName.trim() && s.dob.trim() && s.nationality && s.idOrPassport.trim() &&
      s.addrVillage.trim() && s.addrProvince && s.marriageCertRef.trim()
    );

  const headerValid = () => Boolean(header.province && header.district.trim() && header.village.trim());

  /* ── Validation — only Mandatory fields block progression ── */
  const canProceed = () => {
    if (step === 1) {
      if (!basis.divorceType) return false;
      if (basis.divorceType === "Voluntary") {
        if (mediationMode === "existing") return Boolean(linkedMediationId && headerValid());
        if (mediationMode === "new")
          return Boolean(
            headerValid() &&
            mediation.dateMarriageBegan.trim() && mediation.reasonsHusband.trim() &&
            mediation.reasonsWife.trim() && mediation.outcome.trim() &&
            mediation.propertyDivision.trim() &&
            (!hasChildren || (children.list.trim() && children.custody.trim()))
          );
        return false; // must pick existing or create new
      }
      // Contested
      return Boolean(headerValid() && courtDecision && court.name.trim() && court.decisionDate.trim());
    }
    if (step === 2) return spouseValid(husband);
    if (step === 3) return spouseValid(wife);
    if (step === 4)
      return Boolean(
        basis.dateOfDivorce.trim() && basis.placeOfRegistration.trim() &&
        guaranteeCert && householdBook && photos
      );
    if (step === 6) return isPaymentValid(payment);
    return true;
  };

  const lastStep = STEP_COUNT;

  const goBack = () => {
    setShowErrors(false);
    if (step > 1) setStep((s) => s - 1);
    else onBack();
  };

  const handleNext = () => {
    // Button stays enabled; tapping an incomplete step reveals inline errors.
    if (!canProceed()) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    if (step < lastStep) setStep((s) => s + 1);
    else {
      setSubmitting(true);
      setTimeout(() => { setSubmitting(false); setSubmitted(true); }, 2200);
    }
  };

  const isVoluntary = basis.divorceType === "Voluntary";
  const isContested = basis.divorceType === "Contested";

  /* ── Success ── */
  if (submitted) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm flex flex-col items-center text-center gap-5">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center shadow-xl"
            style={{ background: "linear-gradient(135deg, #344EAD 0%, #1a2d7a 100%)" }}
          >
            <Check className="w-12 h-12 text-white" strokeWidth={3} />
          </div>
          <div>
            <h2 className="text-gray-900 mb-2">{t("successTitle")}</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              {t("successBody")}
            </p>
          </div>
          <div className="w-full bg-white rounded-3xl p-5 text-left space-y-3 shadow-sm border border-gray-100">
            {[
              { label: t("successSpouses"), value: [husband.fullName, wife.fullName].filter(Boolean).join(" & ") || t("empty") },
              { label: t("successDocumentNo"), value: documentNo },
              { label: t("successType"), value: basis.divorceType ? t(DIVORCE_TYPE_KEY[basis.divorceType] ?? "empty") : t("empty") },
              { label: t("successEstReview"), value: cfg.processingTime[lang] },
              { label: t("successStatus"), value: t("statusSubmitted"), isStatus: true },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-3">
                <span className="text-sm text-gray-500 flex-shrink-0">{row.label}</span>
                {row.isStatus ? (
                  <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                    {row.value}
                  </span>
                ) : (
                  <span className="text-sm font-semibold text-gray-800 text-right truncate">{row.value}</span>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={onBack}
            className="w-full py-4 rounded-2xl text-white font-semibold shadow-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "#344EAD" }}
          >
            {t("backToHome")}
          </button>
          <p className="text-xs text-gray-400">{t("trackHint")}</p>
        </div>
      </div>
    );
  }

  return (
    <ValidationProvider showErrors={showErrors}>
    <div className="min-h-full flex flex-col bg-[#F0F2F8]">

      {/* ── Sub-header ── */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-screen-sm mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={goBack}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0 text-center">
            <p className="text-sm font-semibold text-gray-800">{t("title")}</p>
            <p className="text-xs text-gray-400">{t("subtitle")}</p>
          </div>
          <div className="w-9 flex-shrink-0" />
        </div>
      </div>

      {/* ── Step indicator ── */}
      <StepIndicator step={step} />

      {/* ── Form body ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-screen-sm mx-auto px-4 py-6 space-y-5 pb-28">

          <StepHeader step={step} />

          {/* Step 1 — Divorce basis (type + mediation record / court decree) */}
          {step === 1 && (
            <>
              <SelectField
                label={t("divorceType")}
                value={basis.divorceType}
                options={DIVORCE_TYPES}
                placeholder={t("selectPlaceholder")}
                optionLabel={(o) => t(DIVORCE_TYPE_KEY[o] ?? "empty")}
                onChange={(v) => { patchBasis({ divorceType: v }); resetMediation(); }}
                required
              />

              {!basis.divorceType && (
                <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                  <HeartCrack className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#344EAD" }} />
                  <p className="text-xs leading-relaxed" style={{ color: "#344EAD" }}>
                    {t("basisTypeNote")}
                  </p>
                </div>
              )}

              {/* Voluntary → mediation-record chooser (FR-11) */}
              {isVoluntary && mediationMode === "" && (
                <>
                  <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#344EAD" }} />
                    <p className="text-xs leading-relaxed" style={{ color: "#344EAD" }}>
                      {t("mediationChooseNote")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMediationMode("existing")}
                    className="w-full flex items-center gap-3 p-4 rounded-2xl border border-gray-200 bg-white hover:border-[#344EAD]/40 hover:bg-blue-50/40 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#EEF2FF" }}>
                      <Link2 className="w-5 h-5" style={{ color: "#344EAD" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{t("mediationSelectExisting")}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{t("mediationSelectExistingHint")}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediationMode("new")}
                    className="w-full flex items-center gap-3 p-4 rounded-2xl border border-gray-200 bg-white hover:border-[#344EAD]/40 hover:bg-blue-50/40 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#EEF2FF" }}>
                      <FilePlus2 className="w-5 h-5" style={{ color: "#344EAD" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{t("mediationCreateNew")}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{t("mediationCreateNewHint")}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </button>
                  {showErrors && <FieldError show message={t("mediationChooseRequired")} />}
                </>
              )}

              {/* Voluntary existing → pick then show linked summary */}
              {isVoluntary && mediationMode === "existing" && (
                <>
                  <button
                    type="button"
                    onClick={resetMediation}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                  >
                    <ChevronLeft className="w-4 h-4" /> {t("mediationBack")}
                  </button>

                  {!linkedRecord ? (
                    <>
                      <SectionLabel>{t("mediationPickTitle")}</SectionLabel>
                      {MOCK_MEDIATIONS.map((rec) => (
                        <button
                          key={rec.id}
                          type="button"
                          onClick={() => selectExisting(rec)}
                          className="w-full text-left p-4 rounded-2xl border border-gray-200 bg-white hover:border-[#344EAD]/40 hover:bg-blue-50/40 transition-all"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-semibold text-gray-800">{rec.husbandName} &amp; {rec.wifeName}</span>
                            <span className="text-[11px] font-mono text-gray-400">{rec.id}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{rec.village}, {rec.district} · {rec.date}</p>
                        </button>
                      ))}
                      {showErrors && <FieldError show message={t("mediationPickRequired")} />}
                    </>
                  ) : (
                    <>
                      <div className="rounded-2xl border-2 border-green-300 bg-green-50 p-4 space-y-2.5">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <p className="text-sm font-semibold text-green-700">{t("mediationLinkedTitle")}</p>
                        </div>
                        {[
                          [t("mediationRecordNo"), linkedRecord.id],
                          [t("mediationCouple"), `${linkedRecord.husbandName} & ${linkedRecord.wifeName}`],
                          [t("mediationWhere"), `${linkedRecord.village}, ${linkedRecord.district}, ${linkedRecord.province}`],
                          [t("mediationDate"), linkedRecord.date],
                        ].map(([label, value]) => (
                          <div key={label} className="flex items-start justify-between gap-3">
                            <span className="text-xs text-gray-500 flex-shrink-0">{label}</span>
                            <span className="text-xs font-medium text-gray-800 text-right">{value}</span>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setLinkedMediationId("")}
                          className="text-xs font-medium text-[#344EAD] hover:underline pt-1"
                        >
                          {t("mediationChange")}
                        </button>
                      </div>
                      <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#344EAD" }} />
                        <p className="text-xs leading-relaxed" style={{ color: "#344EAD" }}>
                          {t("mediationPrefillNote")}
                        </p>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Voluntary new → capture the Record of Voluntary Divorce + division */}
              {isVoluntary && mediationMode === "new" && (
                <>
                  <button
                    type="button"
                    onClick={resetMediation}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                  >
                    <ChevronLeft className="w-4 h-4" /> {t("mediationBack")}
                  </button>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-100">
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{t("mediationNoLabel")}</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">DM-2026-00031</p>
                    </div>
                    <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                      {t("autoGenerated")}
                    </span>
                  </div>

                  <LocationFields
                    province={header.province}
                    district={header.district}
                    village={header.village}
                    villageLabel={t("villageLabel")}
                    required
                    onChange={(p) => setHeader((h) => ({ ...h, ...p }))}
                  />

                  <DateField
                    label={t("dateMarriageBegan")}
                    value={mediation.dateMarriageBegan}
                    onChange={(v) => patchMediation({ dateMarriageBegan: v })}
                    required
                  />
                  <TextAreaField
                    label={t("reasonsHusband")}
                    value={mediation.reasonsHusband}
                    placeholder={t("reasonsPlaceholder")}
                    onChange={(v) => patchMediation({ reasonsHusband: v })}
                    required
                  />
                  <TextAreaField
                    label={t("reasonsWife")}
                    value={mediation.reasonsWife}
                    placeholder={t("reasonsPlaceholder")}
                    onChange={(v) => patchMediation({ reasonsWife: v })}
                    required
                  />
                  <TextAreaField
                    label={t("mediationOutcome")}
                    value={mediation.outcome}
                    placeholder={t("mediationOutcomePlaceholder")}
                    onChange={(v) => patchMediation({ outcome: v })}
                    required
                  />

                  <SectionLabel>{t("divisionSection")}</SectionLabel>
                  <TextAreaField
                    label={t("propertyDivision")}
                    value={mediation.propertyDivision}
                    placeholder={t("propertyDivisionPlaceholder")}
                    onChange={(v) => patchMediation({ propertyDivision: v })}
                    required
                  />
                  <div className="grid grid-cols-1 gap-3">
                    <InputField
                      label={t("debts")}
                      value={mediation.debts}
                      placeholder={t("debtsPlaceholder")}
                      onChange={(v) => patchMediation({ debts: v })}
                    />
                    <InputField
                      label={t("additionalAssets")}
                      value={mediation.additionalAssets}
                      placeholder={t("additionalAssetsPlaceholder")}
                      onChange={(v) => patchMediation({ additionalAssets: v })}
                    />
                  </div>

                  <ToggleRow
                    active={hasChildren}
                    onToggle={() => setHasChildren((v) => !v)}
                    title={t("hasChildren")}
                    hint={t("hasChildrenHint")}
                  />
                  {hasChildren && (
                    <>
                      <TextAreaField
                        label={t("childrenList")}
                        value={children.list}
                        placeholder={t("childrenListPlaceholder")}
                        onChange={(v) => setChildren((c) => ({ ...c, list: v }))}
                        required
                      />
                      <TextAreaField
                        label={t("custodyAgreement")}
                        value={children.custody}
                        placeholder={t("custodyAgreementPlaceholder")}
                        onChange={(v) => setChildren((c) => ({ ...c, custody: v }))}
                        required
                      />
                    </>
                  )}

                  <SectionLabel>{t("mediationWitnesses")}</SectionLabel>
                  <div className="grid grid-cols-2 gap-3">
                    <InputField
                      label={t("witnessName")}
                      value={mediation.w1Name}
                      placeholder={t("witnessNamePlaceholder")}
                      onChange={(v) => patchMediation({ w1Name: v })}
                    />
                    <InputField
                      label={t("witnessName")}
                      value={mediation.w2Name}
                      placeholder={t("witnessNamePlaceholder")}
                      onChange={(v) => patchMediation({ w2Name: v })}
                    />
                  </div>

                  <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                    <HeartCrack className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#344EAD" }} />
                    <p className="text-xs leading-relaxed" style={{ color: "#344EAD" }}>
                      {t("mediationNewNote")}
                    </p>
                  </div>
                </>
              )}

              {/* Contested → People's Court decree */}
              {isContested && (
                <>
                  <LocationFields
                    province={header.province}
                    district={header.district}
                    village={header.village}
                    villageLabel={t("villageLabel")}
                    required
                    onChange={(p) => setHeader((h) => ({ ...h, ...p }))}
                  />
                  <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-amber-50 border border-amber-100">
                    <Gavel className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                    <p className="text-xs text-amber-700 leading-relaxed">
                      {t("contestedNote")}
                    </p>
                  </div>
                  <InputField
                    label={t("courtName")}
                    value={court.name}
                    placeholder={t("courtNamePlaceholder")}
                    onChange={(v) => patchCourt({ name: v })}
                    required
                  />
                  <DateField
                    label={t("courtDecisionDate")}
                    value={court.decisionDate}
                    onChange={(v) => patchCourt({ decisionDate: v })}
                    required
                  />
                  <DocUpload
                    label={t("courtDecisionLabel")}
                    file={courtDecision}
                    onChange={setCourtDecision}
                    required
                    hint={t("courtDecisionHint")}
                  />
                </>
              )}
            </>
          )}

          {/* Step 2 — Husband */}
          {step === 2 && (
            <>
              <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <User className="w-4 h-4 flex-shrink-0" style={{ color: "#344EAD" }} />
                <p className="text-xs leading-relaxed" style={{ color: "#344EAD" }}>
                  {t("husbandIntro")}
                </p>
              </div>
              <SpouseSection value={husband} onChange={patchHusband} />
            </>
          )}

          {/* Step 3 — Wife */}
          {step === 3 && (
            <>
              <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <User className="w-4 h-4 flex-shrink-0" style={{ color: "#344EAD" }} />
                <p className="text-xs leading-relaxed" style={{ color: "#344EAD" }}>
                  {t("wifeIntro")}
                </p>
              </div>
              <SpouseSection value={wife} onChange={patchWife} />
            </>
          )}

          {/* Step 4 — Registration & documents */}
          {step === 4 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <DateField
                  label={t("dateOfDivorce")}
                  value={basis.dateOfDivorce}
                  onChange={(v) => patchBasis({ dateOfDivorce: v })}
                  required
                />
                <InputField
                  label={t("placeOfRegistration")}
                  value={basis.placeOfRegistration}
                  placeholder={t("placeOfRegistrationPlaceholder")}
                  onChange={(v) => patchBasis({ placeOfRegistration: v })}
                  required
                />
              </div>

              <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-amber-50 border border-amber-100">
                <ClipboardList className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  {t("registrationDocsNote")}
                </p>
              </div>

              <DocUpload
                label={t("householdBook")}
                file={householdBook}
                onChange={setHouseholdBook}
                required
              />
              <DocUpload
                label={t("guaranteeCert")}
                file={guaranteeCert}
                onChange={setGuaranteeCert}
                required
                hint={t("guaranteeCertHint")}
              />
              <DocUpload
                label={t("photos3x4")}
                file={photos}
                onChange={setPhotos}
                required
                hint={t("photos3x4Hint")}
              />

              <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-gray-100 border border-gray-200">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-500" />
                <p className="text-xs text-gray-500 leading-relaxed">
                  {t("registrationNote")}
                </p>
              </div>
            </>
          )}

          {/* Step 5 — Review */}
          {step === 5 && (
            <>
              <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-amber-50 border border-amber-100">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  {t("reviewNote")}
                </p>
              </div>

              {[
                {
                  title: t("reviewBasis"),
                  rows: [
                    [t("reviewType"), basis.divorceType ? t(DIVORCE_TYPE_KEY[basis.divorceType] ?? "empty") : t("empty")],
                    [
                      isContested ? t("reviewCourtDecision") : t("mediationRecordNo"),
                      isContested
                        ? (court.name || t("empty"))
                        : (linkedRecord ? linkedRecord.id : "DM-2026-00031"),
                    ],
                  ],
                },
                {
                  title: t("reviewHeader"),
                  rows: [
                    [t("reviewProvinceDistrictVillage"), [header.province, header.district, header.village].filter(Boolean).join(" / ") || t("empty")],
                    [t("documentNo"), documentNo],
                  ],
                },
                {
                  title: t("reviewHusband"),
                  rows: [
                    [t("reviewName"), husband.fullName || t("empty")],
                    [t("reviewIdPassport"), husband.idOrPassport || t("empty")],
                    [t("reviewMarriageRef"), husband.marriageCertRef || t("empty")],
                  ],
                },
                {
                  title: t("reviewWife"),
                  rows: [
                    [t("reviewName"), wife.fullName || t("empty")],
                    [t("reviewIdPassport"), wife.idOrPassport || t("empty")],
                    [t("reviewMarriageRef"), wife.marriageCertRef || t("empty")],
                  ],
                },
                {
                  title: t("reviewRegistration"),
                  rows: [
                    [t("reviewDate"), basis.dateOfDivorce || t("empty")],
                    [t("reviewPlace"), basis.placeOfRegistration || t("empty")],
                  ],
                },
              ].map((card) => (
                <div key={card.title} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-2.5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{card.title}</p>
                  {card.rows.map(([label, value]) => (
                    <div key={label} className="flex items-start justify-between gap-3">
                      <span className="text-sm text-gray-500 flex-shrink-0">{label}</span>
                      <span className="text-sm font-medium text-gray-800 text-right">{value}</span>
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}

          {/* Step 6 — Payment */}
          {step === 6 && (
            <PaymentSection
              amount={fee}
              serviceName={t("serviceName")}
              value={payment}
              onChange={(patch) => setPayment((p) => ({ ...p, ...patch }))}
              reference={documentNo}
            />
          )}
        </div>
      </div>

      {/* ── Fixed bottom CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 pt-3 pb-6 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-40">
        <div className="max-w-screen-sm mx-auto">
          <button
            onClick={handleNext}
            disabled={submitting}
            className="w-full h-14 rounded-2xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-md"
            style={{
              backgroundColor: submitting ? "#C7D2FE" : "#344EAD",
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("submitting")}
              </>
            ) : step === lastStep ? (
              <>
                {t("pay", { amount: formatLak(fee, lang) })}
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                {t("continue")}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
    </ValidationProvider>
  );
}
