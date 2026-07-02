import { useState } from "react";
import {
  ChevronLeft,
  ArrowRight,
  Check,
  Loader2,
  AlertCircle,
  Scale,
  UserMinus,
  User,
  Users,
  Info,
} from "lucide-react";
import { LocationFields, DateField } from "./formFields";
import {
  ValidationProvider,
  useShowErrors,
  FieldError,
  fieldErrorRing,
  isEmpty,
} from "./formValidation";
import { useT, useLang } from "../i18n";
import { formatLak } from "../serviceConfig";

/*
 * Death Declaration — follows the PRD §7 (Death Declaration Form, ໃບແຈ້ງເສຍຊີວິດ,
 * Family Law No. 44/NA). Sections: Header, The Deceased, Mother, Father, Informant.
 * Approval removes the deceased from the household record (family book).
 * M = Mandatory · C = Conditional · O = Optional · Auto = system-generated.
 */

/* ─── Types ─── */
interface DeceasedInfo {
  fullName: string; // M
  fingerprint: string; // O
  gender: string; // M
  dob: string; // M
  education: string; // O
  occupation: string; // O
  workplace: string; // O
  ethnicity: string; // M
  nationality: string; // M
  ethnicGroup: string; // O
  religion: string; // O
  maritalStatus: string; // M
  // Current address
  addrHouseNo: string;
  addrVillage: string; // M
  addrDistrict: string;
  addrProvince: string; // M
  censusOrId: string; // M
  // Place of death
  podVillage: string; // M
  podDistrict: string;
  podProvince: string; // M
  podCountry: string;
  // Event
  dateOfDeath: string; // M
  timeOfDeath: string; // O
  cause: string; // M
  causeOther: string; // C — when cause = Other
}

interface ParentInfo {
  fullName: string; // M (unless deceased/unknown)
  fingerprint: string; // O
  dob: string; // O
  ethnicity: string; // O
  nationality: string; // O
  ethnicGroup: string; // O
  religion: string; // O
  maritalStatus: string; // O
  addrHouseNo: string;
  addrVillage: string; // C
  addrDistrict: string;
  addrProvince: string; // C
  censusOrId: string; // C
  education: string; // O
  occupation: string; // O
  workplace: string; // O
}

interface InformantInfo {
  fullName: string; // M
  fingerprint: string; // O
  dob: string; // M
  nationality: string; // O
  maritalStatus: string; // O
  addrHouseNo: string;
  addrVillage: string; // M
  addrDistrict: string;
  addrProvince: string; // M
  censusOrId: string; // M
  education: string; // O
  relationship: string; // M — relationship to the deceased
  phone: string; // M
  email: string; // O
}

/* ─── Constants ─── */
const STEPS = [
  { id: 1 },
  { id: 2 },
  { id: 3 },
  { id: 4 },
  { id: 5 },
  { id: 6 },
];

const GENDERS = ["Female", "Male"];
const MARITAL = ["Single", "Married", "Widowed", "Divorced"];
const NATIONALITIES = ["Lao", "Thai", "Vietnamese", "Chinese", "Cambodian", "Other"];
const ETHNICITIES = ["Lao", "Khmu", "Hmong", "Phouthai", "Tai", "Other"];
const ETHNIC_GROUPS = ["Lao-Tai", "Mon-Khmer", "Hmong-Iu Mien", "Sino-Tibetan", "Other"];
const RELIGIONS = ["Buddhism", "Christianity", "Islam", "Bahá'í", "Animism", "None", "Other"];
const EDUCATION = [
  "None", "Primary", "Lower Secondary", "Upper Secondary",
  "Vocational", "Bachelor", "Master", "Doctorate",
];
const CAUSES = ["Illness", "Accident", "Suicide", "Homicide", "Other"];

/* ─── Blank records ─── */
const blankDeceased: DeceasedInfo = {
  fullName: "", fingerprint: "", gender: "", dob: "", education: "", occupation: "", workplace: "",
  ethnicity: "", nationality: "Lao", ethnicGroup: "", religion: "", maritalStatus: "",
  addrHouseNo: "", addrVillage: "", addrDistrict: "", addrProvince: "", censusOrId: "",
  podVillage: "", podDistrict: "", podProvince: "", podCountry: "Laos",
  dateOfDeath: "", timeOfDeath: "", cause: "", causeOther: "",
};

const blankParent: ParentInfo = {
  fullName: "", fingerprint: "", dob: "", ethnicity: "", nationality: "Lao",
  ethnicGroup: "", religion: "", maritalStatus: "",
  addrHouseNo: "", addrVillage: "", addrDistrict: "", addrProvince: "",
  censusOrId: "", education: "", occupation: "", workplace: "",
};

const blankInformant: InformantInfo = {
  fullName: "", fingerprint: "", dob: "", nationality: "Lao", maritalStatus: "",
  addrHouseNo: "", addrVillage: "", addrDistrict: "", addrProvince: "",
  censusOrId: "", education: "", relationship: "", phone: "", email: "",
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
  label, value, placeholder, onChange, required, inputMode, maxLength,
}: {
  label: React.ReactNode; value: string; placeholder: string;
  onChange: (v: string) => void; required?: boolean;
  inputMode?: "text" | "numeric" | "tel" | "email"; maxLength?: number;
}) {
  const hasError = useShowErrors() && Boolean(required) && isEmpty(value);
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        type="text"
        inputMode={inputMode}
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-white border rounded-2xl px-4 py-3.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all ${fieldErrorRing(hasError)}`}
      />
      <FieldError show={hasError} />
    </div>
  );
}

function SelectField({
  label, value, options, placeholder, onChange, required,
}: {
  label: React.ReactNode; value: string; options: string[];
  placeholder: string; onChange: (v: string) => void; required?: boolean;
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
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
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

type DeathT = ReturnType<typeof useT<"death">>;

/* ─── Reusable address group ─── */
function AddressFields({
  t, houseNo, village, district, province, onChange, required = true,
}: {
  t: DeathT;
  houseNo: string; village: string; district: string; province: string;
  onChange: (patch: Partial<{ addrHouseNo: string; addrVillage: string; addrDistrict: string; addrProvince: string }>) => void;
  required?: boolean;
}) {
  return (
    <>
      <InputField
        label={t("houseNo")}
        value={houseNo}
        placeholder={t("phHouseNo")}
        onChange={(v) => onChange({ addrHouseNo: v })}
      />
      <LocationFields
        province={province}
        district={district}
        village={village}
        villageLabel={t("villageLabel")}
        required={required}
        onChange={(p) =>
          onChange({
            ...(p.province !== undefined ? { addrProvince: p.province } : {}),
            ...(p.district !== undefined ? { addrDistrict: p.district } : {}),
            ...(p.village !== undefined ? { addrVillage: p.village } : {}),
          })
        }
      />
    </>
  );
}

/* ─── Parent section (Mother / Father of the deceased — PRD §7.4) ─── */
function ParentSection({
  t, value, onChange,
}: {
  t: DeathT; value: ParentInfo; onChange: (patch: Partial<ParentInfo>) => void;
}) {
  return (
    <>
      <InputField
        label={t("fullName")}
        value={value.fullName}
        placeholder={t("phFullName")}
        onChange={(v) => onChange({ fullName: v })}
        required
      />
      <div className="grid grid-cols-2 gap-3">
        <DateField
          label={t("dobOptional")}
          value={value.dob}
          onChange={(v) => onChange({ dob: v })}
        />
        <SelectField
          label={t("maritalStatusOptional")}
          value={value.maritalStatus}
          options={MARITAL}
          placeholder={t("phSelect")}
          onChange={(v) => onChange({ maritalStatus: v })}
        />
      </div>

      <SectionLabel>{t("secDemographics")}</SectionLabel>
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label={t("ethnicity")}
          value={value.ethnicity}
          options={ETHNICITIES}
          placeholder={t("phSelect")}
          onChange={(v) => onChange({ ethnicity: v })}
        />
        <SelectField
          label={t("nationality")}
          value={value.nationality}
          options={NATIONALITIES}
          placeholder={t("phSelect")}
          onChange={(v) => onChange({ nationality: v })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label={t("ethnicGroup")}
          value={value.ethnicGroup}
          options={ETHNIC_GROUPS}
          placeholder={t("phSelect")}
          onChange={(v) => onChange({ ethnicGroup: v })}
        />
        <SelectField
          label={t("religion")}
          value={value.religion}
          options={RELIGIONS}
          placeholder={t("phSelect")}
          onChange={(v) => onChange({ religion: v })}
        />
      </div>

      <SectionLabel>{t("secCurrentAddressOptional")}</SectionLabel>
      <AddressFields
        t={t}
        houseNo={value.addrHouseNo}
        village={value.addrVillage}
        district={value.addrDistrict}
        province={value.addrProvince}
        onChange={onChange}
        required={false}
      />

      <InputField
        label={t("censusOrIdOptional")}
        value={value.censusOrId}
        placeholder={t("phOneIdentifier")}
        onChange={(v) => onChange({ censusOrId: v })}
      />

      <SectionLabel>{t("secEducationWork")}</SectionLabel>
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label={t("educationLevel")}
          value={value.education}
          options={EDUCATION}
          placeholder={t("phSelect")}
          onChange={(v) => onChange({ education: v })}
        />
        <InputField
          label={t("occupation")}
          value={value.occupation}
          placeholder={t("phOccupation")}
          onChange={(v) => onChange({ occupation: v })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <InputField
          label={t("workplace")}
          value={value.workplace}
          placeholder={t("phWorkplace")}
          onChange={(v) => onChange({ workplace: v })}
        />
        <InputField
          label={t("fingerprintCode")}
          value={value.fingerprint}
          placeholder={t("phBiometric")}
          onChange={(v) => onChange({ fingerprint: v })}
        />
      </div>
    </>
  );
}

/* ─── Parent step with a "deceased / unknown" toggle (PRD §7.4 note) ─── */
function ParentStep({
  t, intro, value, onChange, skip, onToggleSkip,
}: {
  t: DeathT; intro: string; value: ParentInfo; onChange: (patch: Partial<ParentInfo>) => void;
  skip: boolean; onToggleSkip: () => void;
}) {
  return (
    <>
      <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-blue-50 border border-blue-100">
        <User className="w-4 h-4 flex-shrink-0" style={{ color: "#344EAD" }} />
        <p className="text-xs leading-relaxed" style={{ color: "#344EAD" }}>{intro}</p>
      </div>

      <button
        type="button"
        onClick={onToggleSkip}
        className="w-full flex items-center justify-between gap-3 p-4 rounded-2xl border transition-all text-left"
        style={{
          backgroundColor: skip ? "#EEF2FF" : "white",
          borderColor: skip ? "#344EAD" : "#E5E7EB",
        }}
      >
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#344EAD" }} />
          <div>
            <p className="text-sm font-medium text-gray-800">{t("parentDeceasedUnknown")}</p>
            <p className="text-xs text-gray-400 mt-0.5">{t("skipThisSection")}</p>
          </div>
        </div>
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border-2"
          style={{
            backgroundColor: skip ? "#344EAD" : "transparent",
            borderColor: skip ? "#344EAD" : "#D1D5DB",
          }}
        >
          {skip && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
        </div>
      </button>

      {!skip && <ParentSection t={t} value={value} onChange={onChange} />}
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

function StepHeader({ t, step }: { t: DeathT; step: number }) {
  return (
    <div className="mb-3 pb-1">
      <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#344EAD" }}>
        {t("stepOf", { n: step, m: STEPS.length })}
      </p>
      <h2 className="text-gray-900 mt-0.5">{t(`step${step}Title` as "step1Title")}</h2>
      <p className="text-gray-400 text-xs mt-0.5">{t(`step${step}Subtitle` as "step1Subtitle")}</p>
    </div>
  );
}

/* ─── Main Page ─── */
interface DeathDeclarationPageProps {
  onBack: () => void;
}

export function DeathDeclarationPage({ onBack }: DeathDeclarationPageProps) {
  const t = useT("death");
  const { lang } = useLang();
  const [step, setStep] = useState(1);
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Auto / static header values (PRD §7.2)
  const documentNo = "DD-2026-00231";

  const [header, setHeader] = useState({ province: "", district: "", village: "" });
  const [deceased, setDeceased] = useState<DeceasedInfo>(blankDeceased);
  const [mother, setMother] = useState<ParentInfo>(blankParent);
  const [motherSkip, setMotherSkip] = useState(false);
  const [father, setFather] = useState<ParentInfo>(blankParent);
  const [fatherSkip, setFatherSkip] = useState(false);
  const [informant, setInformant] = useState<InformantInfo>(blankInformant);

  const patchDeceased = (patch: Partial<DeceasedInfo>) => setDeceased((p) => ({ ...p, ...patch }));
  const patchMother = (patch: Partial<ParentInfo>) => setMother((p) => ({ ...p, ...patch }));
  const patchFather = (patch: Partial<ParentInfo>) => setFather((p) => ({ ...p, ...patch }));
  const patchInformant = (patch: Partial<InformantInfo>) => setInformant((p) => ({ ...p, ...patch }));

  /* ── Validation — only Mandatory fields block progression ── */
  const canProceed = () => {
    if (step === 1)
      return Boolean(header.province && header.district.trim() && header.village.trim());
    if (step === 2)
      return Boolean(
        deceased.fullName.trim() && deceased.gender && deceased.dob.trim() &&
        deceased.ethnicity && deceased.nationality &&
        deceased.ethnicGroup && deceased.religion && deceased.maritalStatus &&
        deceased.addrVillage.trim() && deceased.addrProvince && deceased.censusOrId.trim() &&
        deceased.podVillage.trim() && deceased.podProvince &&
        deceased.dateOfDeath.trim() && deceased.cause &&
        (deceased.cause !== "Other" || deceased.causeOther.trim())
      );
    if (step === 3) return motherSkip || Boolean(mother.fullName.trim());
    if (step === 4) return fatherSkip || Boolean(father.fullName.trim());
    if (step === 5)
      return Boolean(
        informant.fullName.trim() && informant.dob.trim() &&
        informant.addrVillage.trim() && informant.addrProvince &&
        informant.censusOrId.trim() && informant.relationship.trim() && informant.phone.trim()
      );
    return true;
  };

  const lastStep = STEPS.length;

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
              {t("successText")}
            </p>
          </div>
          <div className="w-full bg-white rounded-3xl p-5 text-left space-y-3 shadow-sm border border-gray-100">
            {[
              { label: t("sumDeceased"), value: deceased.fullName || t("dash") },
              { label: t("sumDocumentNo"), value: documentNo },
              { label: t("sumInformant"), value: informant.fullName || t("dash") },
              { label: t("sumFee"), value: formatLak(0, lang) },
              { label: t("sumEstReview"), value: t("sumEstReviewValue") },
              { label: t("sumStatus"), value: t("sumStatusValue"), isStatus: true },
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

          <StepHeader t={t} step={step} />

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
                villageLabel={t("villageLabel")}
                required
                onChange={(p) => setHeader((h) => ({ ...h, ...p }))}
              />

              <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <Scale className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#344EAD" }} />
                <div>
                  <p className="text-xs font-semibold" style={{ color: "#344EAD" }}>{t("legalBasis")}</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#344EAD" }}>
                    {t("legalBasisText")}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Step 2 — The Deceased */}
          {step === 2 && (
            <>
              <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <UserMinus className="w-4 h-4 flex-shrink-0" style={{ color: "#344EAD" }} />
                <p className="text-xs leading-relaxed" style={{ color: "#344EAD" }}>
                  {t("deceasedIntro")}
                </p>
              </div>

              <InputField
                label={t("fullName")}
                value={deceased.fullName}
                placeholder={t("phDeceasedName")}
                onChange={(v) => patchDeceased({ fullName: v })}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label={t("gender")}
                  value={deceased.gender}
                  options={GENDERS}
                  placeholder={t("phSelect")}
                  onChange={(v) => patchDeceased({ gender: v })}
                  required
                />
                <DateField
                  label={t("dob")}
                  value={deceased.dob}
                  onChange={(v) => patchDeceased({ dob: v })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label={t("ethnicity")}
                  value={deceased.ethnicity}
                  options={ETHNICITIES}
                  placeholder={t("phSelect")}
                  onChange={(v) => patchDeceased({ ethnicity: v })}
                  required
                />
                <SelectField
                  label={t("nationality")}
                  value={deceased.nationality}
                  options={NATIONALITIES}
                  placeholder={t("phSelect")}
                  onChange={(v) => patchDeceased({ nationality: v })}
                  required
                />
              </div>
              <SelectField
                label={t("maritalStatus")}
                value={deceased.maritalStatus}
                options={MARITAL}
                placeholder={t("phSelect")}
                onChange={(v) => patchDeceased({ maritalStatus: v })}
                required
              />

              <SectionLabel>{t("secCurrentAddress")}</SectionLabel>
              <AddressFields
                t={t}
                houseNo={deceased.addrHouseNo}
                village={deceased.addrVillage}
                district={deceased.addrDistrict}
                province={deceased.addrProvince}
                onChange={patchDeceased}
              />
              <InputField
                label={t("censusOrId")}
                value={deceased.censusOrId}
                placeholder={t("phOneIdentifier")}
                onChange={(v) => patchDeceased({ censusOrId: v })}
                required
              />

              <SectionLabel>{t("secPlaceOfDeath")}</SectionLabel>
              <LocationFields
                province={deceased.podProvince}
                district={deceased.podDistrict}
                village={deceased.podVillage}
                villageLabel={t("villageLabel")}
                required
                onChange={(p) =>
                  patchDeceased({
                    ...(p.province !== undefined ? { podProvince: p.province } : {}),
                    ...(p.district !== undefined ? { podDistrict: p.district } : {}),
                    ...(p.village !== undefined ? { podVillage: p.village } : {}),
                  })
                }
              />

              <SectionLabel>{t("secTheDeath")}</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <DateField
                  label={t("dateOfDeath")}
                  value={deceased.dateOfDeath}
                  onChange={(v) => patchDeceased({ dateOfDeath: v })}
                  required
                />
                <InputField
                  label={t("timeOfDeathOptional")}
                  value={deceased.timeOfDeath}
                  placeholder={t("phTime")}
                  onChange={(v) => patchDeceased({ timeOfDeath: v })}
                />
              </div>
              <SelectField
                label={t("causeOfDeath")}
                value={deceased.cause}
                options={CAUSES}
                placeholder={t("phSelect")}
                onChange={(v) => patchDeceased({ cause: v })}
                required
              />
              {deceased.cause === "Other" && (
                <InputField
                  label={t("causeSpecify")}
                  value={deceased.causeOther}
                  placeholder={t("phSpecifyCause")}
                  onChange={(v) => patchDeceased({ causeOther: v })}
                  required
                />
              )}

              <SectionLabel>{t("secEducationWork")}</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label={t("educationLevel")}
                  value={deceased.education}
                  options={EDUCATION}
                  placeholder={t("phSelect")}
                  onChange={(v) => patchDeceased({ education: v })}
                />
                <InputField
                  label={t("occupation")}
                  value={deceased.occupation}
                  placeholder={t("phOccupation")}
                  onChange={(v) => patchDeceased({ occupation: v })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label={t("workplace")}
                  value={deceased.workplace}
                  placeholder={t("phWorkplace")}
                  onChange={(v) => patchDeceased({ workplace: v })}
                />
                <InputField
                  label={t("fingerprintCode")}
                  value={deceased.fingerprint}
                  placeholder={t("phBiometric")}
                  onChange={(v) => patchDeceased({ fingerprint: v })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label={t("ethnicGroup")}
                  value={deceased.ethnicGroup}
                  options={ETHNIC_GROUPS}
                  placeholder={t("phSelect")}
                  onChange={(v) => patchDeceased({ ethnicGroup: v })}
                  required
                />
                <SelectField
                  label={t("religion")}
                  value={deceased.religion}
                  options={RELIGIONS}
                  placeholder={t("phSelect")}
                  onChange={(v) => patchDeceased({ religion: v })}
                  required
                />
              </div>
            </>
          )}

          {/* Step 3 — Mother */}
          {step === 3 && (
            <ParentStep
              t={t}
              intro={t("motherIntro")}
              value={mother}
              onChange={patchMother}
              skip={motherSkip}
              onToggleSkip={() => setMotherSkip((v) => !v)}
            />
          )}

          {/* Step 4 — Father */}
          {step === 4 && (
            <ParentStep
              t={t}
              intro={t("fatherIntro")}
              value={father}
              onChange={patchFather}
              skip={fatherSkip}
              onToggleSkip={() => setFatherSkip((v) => !v)}
            />
          )}

          {/* Step 5 — Informant */}
          {step === 5 && (
            <>
              <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <Users className="w-4 h-4 flex-shrink-0" style={{ color: "#344EAD" }} />
                <p className="text-xs leading-relaxed" style={{ color: "#344EAD" }}>
                  {t("informantIntro")}
                </p>
              </div>

              <InputField
                label={t("fullName")}
                value={informant.fullName}
                placeholder={t("phInformantName")}
                onChange={(v) => patchInformant({ fullName: v })}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <DateField
                  label={t("dob")}
                  value={informant.dob}
                  onChange={(v) => patchInformant({ dob: v })}
                  required
                />
                <InputField
                  label={t("relationshipToDeceased")}
                  value={informant.relationship}
                  placeholder={t("phRelationship")}
                  onChange={(v) => patchInformant({ relationship: v })}
                  required
                />
              </div>

              <SectionLabel>{t("secCurrentAddress")}</SectionLabel>
              <AddressFields
                t={t}
                houseNo={informant.addrHouseNo}
                village={informant.addrVillage}
                district={informant.addrDistrict}
                province={informant.addrProvince}
                onChange={patchInformant}
              />

              <InputField
                label={t("censusOrId")}
                value={informant.censusOrId}
                placeholder={t("phOneIdentifier")}
                onChange={(v) => patchInformant({ censusOrId: v })}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label={t("phoneNumber")}
                  value={informant.phone}
                  placeholder={t("phPhone")}
                  inputMode="tel"
                  onChange={(v) => patchInformant({ phone: v })}
                  required
                />
                <InputField
                  label={t("emailOptional")}
                  value={informant.email}
                  placeholder={t("phEmail")}
                  inputMode="email"
                  onChange={(v) => patchInformant({ email: v })}
                />
              </div>

              <SectionLabel>{t("secAdditionalDetails")}</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label={t("maritalStatus")}
                  value={informant.maritalStatus}
                  options={MARITAL}
                  placeholder={t("phSelect")}
                  onChange={(v) => patchInformant({ maritalStatus: v })}
                />
                <SelectField
                  label={t("educationLevel")}
                  value={informant.education}
                  options={EDUCATION}
                  placeholder={t("phSelect")}
                  onChange={(v) => patchInformant({ education: v })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label={t("nationality")}
                  value={informant.nationality}
                  options={NATIONALITIES}
                  placeholder={t("phSelect")}
                  onChange={(v) => patchInformant({ nationality: v })}
                />
                <InputField
                  label={t("fingerprintCode")}
                  value={informant.fingerprint}
                  placeholder={t("phBiometric")}
                  onChange={(v) => patchInformant({ fingerprint: v })}
                />
              </div>
            </>
          )}

          {/* Step 6 — Review */}
          {step === 6 && (
            <>
              <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-amber-50 border border-amber-100">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  {t("reviewWarning")}
                </p>
              </div>

              {[
                {
                  title: t("step1Title"),
                  rows: [
                    [t("rowProvinceDistrictVillage"), [header.province, header.district, header.village].filter(Boolean).join(" / ") || t("dash")],
                    [t("documentNo"), documentNo],
                  ],
                },
                {
                  title: t("step2Title"),
                  rows: [
                    [t("rowName"), deceased.fullName || t("dash")],
                    [t("rowGenderDob"), [deceased.gender, deceased.dob].filter(Boolean).join(" · ") || t("dash")],
                    [t("rowPlaceOfDeath"), [deceased.podVillage, deceased.podDistrict, deceased.podProvince].filter(Boolean).join(", ") || t("dash")],
                    [t("rowDateCause"), [deceased.dateOfDeath, deceased.cause === "Other" ? deceased.causeOther : deceased.cause].filter(Boolean).join(" · ") || t("dash")],
                  ],
                },
                {
                  title: t("step3Title"),
                  rows: motherSkip ? [[t("rowStatus"), t("statusDeceasedUnknown")]] : [[t("rowName"), mother.fullName || t("dash")]],
                },
                {
                  title: t("step4Title"),
                  rows: fatherSkip ? [[t("rowStatus"), t("statusDeceasedUnknown")]] : [[t("rowName"), father.fullName || t("dash")]],
                },
                {
                  title: t("step5Title"),
                  rows: [
                    [t("rowName"), informant.fullName || t("dash")],
                    [t("rowRelationship"), informant.relationship || t("dash")],
                    [t("rowPhone"), informant.phone || t("dash")],
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
                {t("submitDeclaration")}
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
