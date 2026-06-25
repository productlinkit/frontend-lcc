import { useState, useRef } from "react";
import {
  ChevronLeft,
  ArrowRight,
  Check,
  Loader2,
  AlertCircle,
  Heart,
  Users,
  Info,
  FileText,
  X,
  CheckCircle2,
  Globe2,
} from "lucide-react";
import { PaymentSection, blankPayment, isPaymentValid, type PaymentState } from "./PaymentSection";
import { LocationFields, DateField } from "./formFields";
import { SERVICE_CONFIG, formatLak } from "../serviceConfig";
import { useT, useLang } from "../i18n";

/*
 * Marriage Certificate — follows the PRD §8. Field set is "derived" (per the PRD)
 * and should be validated against the official marriage registration form.
 * Captured once per spouse (Spouse A & Spouse B), plus supporting documents and
 * registration details (date, place, 3 witnesses).
 * M = Mandatory · C = Conditional · O = Optional · Auto = system-generated.
 *
 * Registrar e-signature (PRD §8.3) is applied in the back-office and is excluded here.
 */

/* ─── Types ─── */
interface DocFile {
  name: string;
}

interface SpouseInfo {
  fullName: string; // M
  dob: string; // M
  gender: string; // M
  nationality: string; // M — drives the foreign-spouse path
  ethnicity: string; // O
  ethnicGroup: string; // O
  religion: string; // O
  occupation: string; // O
  idOrPassport: string; // M
  addrHouseNo: string;
  addrVillage: string; // M
  addrDistrict: string;
  addrProvince: string; // M
  residenceCertRef: string; // M
  singleStatusCert: DocFile | null; // M
  priorMaritalProof: DocFile | null; // C — divorce/widowhood proof
  foreignDocs: DocFile | null; // C — foreign-spouse documents
}

/* ─── Constants ─── */
const STEPS = [
  { id: 1, titleKey: "step1Title", subtitleKey: "step1Subtitle" },
  { id: 2, titleKey: "step2Title", subtitleKey: "step2Subtitle" },
  { id: 3, titleKey: "step3Title", subtitleKey: "step3Subtitle" },
  { id: 4, titleKey: "step4Title", subtitleKey: "step4Subtitle" },
  { id: 5, titleKey: "step5Title", subtitleKey: "step5Subtitle" },
  { id: 6, titleKey: "step6Title", subtitleKey: "step6Subtitle" },
  { id: 7, titleKey: "step7Title", subtitleKey: "step7Subtitle" },
] as const;

const GENDERS = ["Female", "Male"];
const NATIONALITIES = ["Lao", "Thai", "Vietnamese", "Chinese", "Cambodian", "American", "French", "Other"];
const ETHNICITIES = ["Lao", "Khmu", "Hmong", "Phouthai", "Tai", "Other"];
const ETHNIC_GROUPS = ["Lao-Tai", "Mon-Khmer", "Hmong-Iu Mien", "Sino-Tibetan", "Other"];
const RELIGIONS = ["Buddhism", "Christianity", "Islam", "Bahá'í", "Animism", "None", "Other"];

/* ─── Blank record ─── */
const blankSpouse: SpouseInfo = {
  fullName: "", dob: "", gender: "", nationality: "Lao",
  ethnicity: "", ethnicGroup: "", religion: "", occupation: "",
  idOrPassport: "", addrHouseNo: "", addrVillage: "", addrDistrict: "", addrProvince: "",
  residenceCertRef: "", singleStatusCert: null, priorMaritalProof: null, foreignDocs: null,
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
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        type="text"
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#344EAD] focus:ring-2 focus:ring-[#344EAD]/20 transition-all"
      />
    </div>
  );
}

function SelectField({
  label, value, options, placeholder, onChange, required,
}: {
  label: React.ReactNode; value: string; options: string[];
  placeholder: string; onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-gray-800 focus:outline-none focus:border-[#344EAD] focus:ring-2 focus:ring-[#344EAD]/20 transition-all pr-10"
        >
          <option value="">{placeholder}</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
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
  const t = useT("marriage");
  const inputRef = useRef<HTMLInputElement>(null);

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
          className="w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 hover:border-[#344EAD]/40 hover:bg-blue-50/50 transition-all text-left"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#EEF2FF" }}>
            <FileText className="w-5 h-5" style={{ color: "#344EAD" }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-600">{t("uploadDocument")}</p>
            <p className="text-xs text-gray-400 mt-0.5">{hint ?? t("pdfOrImage")}</p>
          </div>
        </button>
      )}
    </div>
  );
}

/* ─── Spouse section (Spouse A / B share the same structure — PRD §8.2) ─── */
function SpouseSection({
  value, onChange, prevMarried, onTogglePrevMarried,
}: {
  value: SpouseInfo; onChange: (patch: Partial<SpouseInfo>) => void;
  prevMarried: boolean; onTogglePrevMarried: () => void;
}) {
  const t = useT("marriage");
  const isForeign = Boolean(value.nationality && value.nationality !== "Lao");
  return (
    <>
      <InputField
        label={t("fullName")}
        value={value.fullName}
        placeholder={t("fullNamePh")}
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
          label={t("gender")}
          value={value.gender}
          options={GENDERS}
          placeholder={t("selectPh")}
          onChange={(v) => onChange({ gender: v })}
          required
        />
      </div>
      <SelectField
        label={t("nationality")}
        value={value.nationality}
        options={NATIONALITIES}
        placeholder={t("selectPh")}
        onChange={(v) => onChange({ nationality: v })}
        required
      />
      <InputField
        label={t("idOrPassport")}
        value={value.idOrPassport}
        placeholder={t("idOrPassportPh")}
        onChange={(v) => onChange({ idOrPassport: v })}
        required
      />

      <SectionLabel>{t("currentAddress")}</SectionLabel>
      <InputField
        label={t("houseNo")}
        value={value.addrHouseNo}
        placeholder={t("houseNoPh")}
        onChange={(v) => onChange({ addrHouseNo: v })}
      />
      <LocationFields
        province={value.addrProvince}
        district={value.addrDistrict}
        village={value.addrVillage}
        villageLabel={t("village")}
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
        label={t("residenceCertRef")}
        value={value.residenceCertRef}
        placeholder={t("residenceCertRefPh")}
        onChange={(v) => onChange({ residenceCertRef: v })}
        required
      />

      <SectionLabel>{t("documents")}</SectionLabel>
      <DocUpload
        label={t("singleStatusCert")}
        file={value.singleStatusCert}
        onChange={(f) => onChange({ singleStatusCert: f })}
        required
      />

      {/* Previously married → prior marital-status proof (PRD §8.2, Conditional) */}
      <button
        type="button"
        onClick={onTogglePrevMarried}
        className="w-full flex items-center justify-between gap-3 p-4 rounded-2xl border transition-all text-left"
        style={{
          backgroundColor: prevMarried ? "#EEF2FF" : "white",
          borderColor: prevMarried ? "#344EAD" : "#E5E7EB",
        }}
      >
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#344EAD" }} />
          <div>
            <p className="text-sm font-medium text-gray-800">{t("prevMarried")}</p>
            <p className="text-xs text-gray-400 mt-0.5">{t("prevMarriedHint")}</p>
          </div>
        </div>
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border-2"
          style={{
            backgroundColor: prevMarried ? "#344EAD" : "transparent",
            borderColor: prevMarried ? "#344EAD" : "#D1D5DB",
          }}
        >
          {prevMarried && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
        </div>
      </button>
      {prevMarried && (
        <DocUpload
          label={t("priorMaritalProof")}
          file={value.priorMaritalProof}
          onChange={(f) => onChange({ priorMaritalProof: f })}
          required
        />
      )}

      {/* Foreign spouse → additional documents (PRD §8.2, Conditional) */}
      {isForeign && (
        <>
          <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-amber-50 border border-amber-100">
            <Globe2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
            <p className="text-xs text-amber-700 leading-relaxed">
              {t("foreignSpouseNote")}
            </p>
          </div>
          <DocUpload
            label={t("foreignDocs")}
            file={value.foreignDocs}
            onChange={(f) => onChange({ foreignDocs: f })}
            required
            hint={t("foreignDocsHint")}
          />
        </>
      )}

      <SectionLabel>{t("additionalDetails")}</SectionLabel>
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label={t("ethnicity")}
          value={value.ethnicity}
          options={ETHNICITIES}
          placeholder={t("selectPh")}
          onChange={(v) => onChange({ ethnicity: v })}
        />
        <SelectField
          label={t("religion")}
          value={value.religion}
          options={RELIGIONS}
          placeholder={t("selectPh")}
          onChange={(v) => onChange({ religion: v })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label={t("ethnicGroup")}
          value={value.ethnicGroup}
          options={ETHNIC_GROUPS}
          placeholder={t("selectPh")}
          onChange={(v) => onChange({ ethnicGroup: v })}
        />
        <InputField
          label={t("occupation")}
          value={value.occupation}
          placeholder={t("occupationPh")}
          onChange={(v) => onChange({ occupation: v })}
        />
      </div>
    </>
  );
}

/* ─── Step Indicator (spans the form container width) ─── */
function StepIndicator({ step }: { step: number }) {
  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-screen-sm mx-auto px-4 py-4 flex items-center">
        {STEPS.map((s, i) => {
          const done = step > s.id;
          const active = step === s.id;
          const isLast = i === STEPS.length - 1;
          return (
            <div key={s.id} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 flex-shrink-0"
                style={{
                  backgroundColor: done || active ? "#344EAD" : "#F3F4F6",
                  color: done || active ? "white" : "#9CA3AF",
                  opacity: done ? 0.55 : 1,
                }}
              >
                {done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : s.id}
              </div>
              {!isLast && (
                <div
                  className="flex-1 h-0.5 mx-1.5 rounded-full transition-all duration-500"
                  style={{
                    backgroundColor: step > s.id ? "#344EAD" : "#E5E7EB",
                    opacity: step > s.id ? 0.4 : 1,
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
  const t = useT("marriage");
  const meta = STEPS.find((s) => s.id === step)!;
  return (
    <div className="mb-3 pb-1">
      <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#344EAD" }}>
        {t("stepOf", { n: step, m: STEPS.length })}
      </p>
      <h2 className="text-gray-900 mt-0.5">{t(meta.titleKey)}</h2>
      <p className="text-gray-400 text-xs mt-0.5">{t(meta.subtitleKey)}</p>
    </div>
  );
}

/* ─── Main Page ─── */
interface MarriageCertificatePageProps {
  onBack: () => void;
}

export function MarriageCertificatePage({ onBack }: MarriageCertificatePageProps) {
  const t = useT("marriage");
  const { lang } = useLang();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const documentNo = "MC-2026-00118";

  const [header, setHeader] = useState({ province: "", district: "", village: "" });
  const [spouseA, setSpouseA] = useState<SpouseInfo>(blankSpouse);
  const [spouseB, setSpouseB] = useState<SpouseInfo>(blankSpouse);
  const [prevMarriedA, setPrevMarriedA] = useState(false);
  const [prevMarriedB, setPrevMarriedB] = useState(false);
  const [medicalCert, setMedicalCert] = useState<DocFile | null>(null);
  const [engagementMinute, setEngagementMinute] = useState<DocFile | null>(null);
  const [reg, setReg] = useState({
    dateOfMarriage: "", placeOfRegistration: "",
    w1Name: "", w1Id: "", w2Name: "", w2Id: "", w3Name: "", w3Id: "",
  });
  const [payment, setPayment] = useState<PaymentState>(blankPayment);

  const fee = SERVICE_CONFIG.marriage.fee ?? 0;

  const patchA = (patch: Partial<SpouseInfo>) => setSpouseA((p) => ({ ...p, ...patch }));
  const patchB = (patch: Partial<SpouseInfo>) => setSpouseB((p) => ({ ...p, ...patch }));
  const patchReg = (patch: Partial<typeof reg>) => setReg((p) => ({ ...p, ...patch }));

  const spouseValid = (s: SpouseInfo, prevMarried: boolean) => {
    const isForeign = Boolean(s.nationality && s.nationality !== "Lao");
    return Boolean(
      s.fullName.trim() && s.dob.trim() && s.gender && s.nationality &&
      s.idOrPassport.trim() && s.addrVillage.trim() && s.addrProvince &&
      s.residenceCertRef.trim() && s.singleStatusCert &&
      (!prevMarried || s.priorMaritalProof) &&
      (!isForeign || s.foreignDocs)
    );
  };

  /* ── Validation — only Mandatory fields block progression ── */
  const canProceed = () => {
    if (step === 1)
      return Boolean(header.province && header.district.trim() && header.village.trim());
    if (step === 2) return spouseValid(spouseA, prevMarriedA);
    if (step === 3) return spouseValid(spouseB, prevMarriedB);
    if (step === 4) return Boolean(medicalCert && engagementMinute);
    if (step === 5)
      return Boolean(
        reg.dateOfMarriage.trim() && reg.placeOfRegistration.trim() &&
        reg.w1Name.trim() && reg.w1Id.trim() &&
        reg.w2Name.trim() && reg.w2Id.trim() &&
        reg.w3Name.trim() && reg.w3Id.trim()
      );
    if (step === 7) return isPaymentValid(payment);
    return true;
  };

  const lastStep = STEPS.length;

  const goBack = () => {
    if (step > 1) setStep((s) => s - 1);
    else onBack();
  };

  const handleNext = () => {
    if (step < lastStep) setStep((s) => s + 1);
    else {
      setSubmitting(true);
      setTimeout(() => { setSubmitting(false); setSubmitted(true); }, 2200);
    }
  };

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
              { label: t("successCouple"), value: [spouseA.fullName, spouseB.fullName].filter(Boolean).join(" & ") || t("dash") },
              { label: t("successDocumentNo"), value: documentNo },
              { label: t("successEstReview"), value: t("successEstReviewValue") },
              { label: t("successStatus"), value: t("successStatusValue"), isStatus: true },
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

          {/* Step 1 — Header */}
          {step === 1 && (
            <>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-100">
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{t("documentNo")}</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{documentNo}</p>
                </div>
                <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                  {t("autoGenerated")}
                </span>
              </div>

              <LocationFields
                province={header.province}
                district={header.district}
                village={header.village}
                required
                onChange={(p) => setHeader((h) => ({ ...h, ...p }))}
              />

              <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <Heart className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#344EAD" }} />
                <p className="text-xs leading-relaxed" style={{ color: "#344EAD" }}>
                  {t("headerNote")}
                </p>
              </div>
            </>
          )}

          {/* Step 2 — Spouse A */}
          {step === 2 && (
            <>
              <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <Heart className="w-4 h-4 flex-shrink-0" style={{ color: "#344EAD" }} />
                <p className="text-xs leading-relaxed" style={{ color: "#344EAD" }}>
                  {t("spouseAIntro")}
                </p>
              </div>
              <SpouseSection
                value={spouseA}
                onChange={patchA}
                prevMarried={prevMarriedA}
                onTogglePrevMarried={() => setPrevMarriedA((v) => !v)}
              />
            </>
          )}

          {/* Step 3 — Spouse B */}
          {step === 3 && (
            <>
              <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <Heart className="w-4 h-4 flex-shrink-0" style={{ color: "#344EAD" }} />
                <p className="text-xs leading-relaxed" style={{ color: "#344EAD" }}>
                  {t("spouseBIntro")}
                </p>
              </div>
              <SpouseSection
                value={spouseB}
                onChange={patchB}
                prevMarried={prevMarriedB}
                onTogglePrevMarried={() => setPrevMarriedB((v) => !v)}
              />
            </>
          )}

          {/* Step 4 — Documents (couple) */}
          {step === 4 && (
            <>
              <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-amber-50 border border-amber-100">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  {t("docsNote")}
                </p>
              </div>
              <DocUpload
                label={t("medicalCert")}
                file={medicalCert}
                onChange={setMedicalCert}
                required
              />
              <DocUpload
                label={t("engagementMinute")}
                file={engagementMinute}
                onChange={setEngagementMinute}
                required
                hint={t("engagementMinuteHint")}
              />
            </>
          )}

          {/* Step 5 — Registration */}
          {step === 5 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <DateField
                  label={t("dateOfMarriage")}
                  value={reg.dateOfMarriage}
                  onChange={(v) => patchReg({ dateOfMarriage: v })}
                  required
                />
                <InputField
                  label={t("placeOfRegistration")}
                  value={reg.placeOfRegistration}
                  placeholder={t("placeOfRegistrationPh")}
                  onChange={(v) => patchReg({ placeOfRegistration: v })}
                  required
                />
              </div>

              <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <Users className="w-4 h-4 flex-shrink-0" style={{ color: "#344EAD" }} />
                <p className="text-xs leading-relaxed" style={{ color: "#344EAD" }}>
                  {t("witnessesNote")}
                </p>
              </div>

              {[
                { n: 1, name: reg.w1Name, id: reg.w1Id, kn: "w1Name" as const, ki: "w1Id" as const },
                { n: 2, name: reg.w2Name, id: reg.w2Id, kn: "w2Name" as const, ki: "w2Id" as const },
                { n: 3, name: reg.w3Name, id: reg.w3Id, kn: "w3Name" as const, ki: "w3Id" as const },
              ].map((w) => (
                <div key={w.n}>
                  <SectionLabel>{t("witness", { n: w.n })}</SectionLabel>
                  <div className="grid grid-cols-2 gap-3 mt-1.5">
                    <InputField
                      label={t("witnessName")}
                      value={w.name}
                      placeholder={t("witnessNamePh")}
                      onChange={(v) => patchReg({ [w.kn]: v })}
                      required
                    />
                    <InputField
                      label={t("witnessId")}
                      value={w.id}
                      placeholder={t("witnessIdPh")}
                      onChange={(v) => patchReg({ [w.ki]: v })}
                      required
                    />
                  </div>
                </div>
              ))}

              <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-gray-100 border border-gray-200">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-500" />
                <p className="text-xs text-gray-500 leading-relaxed">
                  {t("signNote")}
                </p>
              </div>
            </>
          )}

          {/* Step 6 — Review */}
          {step === 6 && (
            <>
              <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-amber-50 border border-amber-100">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  {t("reviewNote")}
                </p>
              </div>

              {[
                {
                  title: t("reviewHeader"),
                  rows: [
                    [t("reviewProvinceDistrictVillage"), [header.province, header.district, header.village].filter(Boolean).join(" / ") || t("dash")],
                    [t("documentNo"), documentNo],
                  ],
                },
                {
                  title: t("reviewSpouseA"),
                  rows: [
                    [t("reviewName"), spouseA.fullName || t("dash")],
                    [t("reviewNationality"), spouseA.nationality || t("dash")],
                    [t("reviewIdPassport"), spouseA.idOrPassport || t("dash")],
                  ],
                },
                {
                  title: t("reviewSpouseB"),
                  rows: [
                    [t("reviewName"), spouseB.fullName || t("dash")],
                    [t("reviewNationality"), spouseB.nationality || t("dash")],
                    [t("reviewIdPassport"), spouseB.idOrPassport || t("dash")],
                  ],
                },
                {
                  title: t("reviewRegistration"),
                  rows: [
                    [t("reviewDateOfMarriage"), reg.dateOfMarriage || t("dash")],
                    [t("reviewPlace"), reg.placeOfRegistration || t("dash")],
                    [t("reviewWitnesses"), [reg.w1Name, reg.w2Name, reg.w3Name].filter(Boolean).join(", ") || t("dash")],
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

          {/* Step 7 — Payment */}
          {step === 7 && (
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
            disabled={!canProceed() || submitting}
            className="w-full h-14 rounded-2xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-md"
            style={{
              backgroundColor: canProceed() && !submitting ? "#344EAD" : "#C7D2FE",
              cursor: canProceed() && !submitting ? "pointer" : "not-allowed",
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
  );
}
