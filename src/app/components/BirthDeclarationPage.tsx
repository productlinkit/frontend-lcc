import { useState } from "react";
import {
  ChevronLeft,
  ArrowRight,
  Check,
  Loader2,
  AlertCircle,
  Scale,
  Baby,
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
 * Birth Declaration — follows the PRD §6 (Birth Declaration Form, ໃບແຈ້ງເກີດ,
 * Family Law No. 44/NA). Sections: Header, The Child, Mother, Father, Informant.
 * M = Mandatory · C = Conditional · O = Optional · Auto = system-generated.
 */

/* ─── Types ─── */
interface ChildInfo {
  fullName: string; // M
  gender: string; // M
  dob: string; // M
  weight: string; // O
  height: string; // O
  fingerprint: string; // O
  bloodType: string; // O
  deliveryMode: string; // O
  deliveryAssistedBy: string; // O
  birthType: string; // M — Single / Twins
  birthOrder: string; // M — child number
  ethnicity: string; // M
  nationality: string; // M
  religion: string; // M
  // Place of birth
  pobProvince: string; // M
  pobDistrict: string; // M
  pobVillage: string; // M
  pobCountry: string; // M
  // Current address
  addrHouseNo: string;
  addrVillage: string; // M
  addrDistrict: string; // M
  addrProvince: string; // M
  // Twin (conditional)
  twinName: string; // C
  twinGender: string; // C
}

interface ParentInfo {
  fullName: string; // M
  fingerprint: string; // O
  dob: string; // M
  ethnicity: string; // M
  nationality: string; // M
  ethnicGroup: string; // O
  religion: string; // O
  maritalStatus: string; // M
  addrHouseNo: string;
  addrVillage: string; // M
  addrDistrict: string;
  addrProvince: string; // M
  censusOrId: string; // M — Census Book No. / ID Card No.
  education: string; // O
  occupation: string; // O
}

interface InformantInfo {
  fullName: string; // M
  fingerprint: string; // O
  dob: string; // M
  ethnicity: string; // O
  nationality: string; // O
  ethnicGroup: string; // O
  religion: string; // O
  maritalStatus: string; // O
  addrHouseNo: string;
  addrVillage: string; // M
  addrDistrict: string;
  addrProvince: string; // M
  censusOrId: string; // M
  education: string; // O
  relationship: string; // M — relationship to the child
  phone: string; // M
  email: string; // O
}

/* ─── i18n option helpers ─── */
type BirthKey = Parameters<ReturnType<typeof useT<"birth">>>[0];
type Opt = { value: string; labelKey: BirthKey };

/* Option VALUES stay in English (used by validation & data); labels translate. */
const GENDERS: Opt[] = [
  { value: "Female", labelKey: "optFemale" },
  { value: "Male", labelKey: "optMale" },
];
const MARITAL: Opt[] = [
  { value: "Single", labelKey: "optSingle" },
  { value: "Married", labelKey: "optMarried" },
  { value: "Widowed", labelKey: "optWidowed" },
  { value: "Divorced", labelKey: "optDivorced" },
];
const NATIONALITIES: Opt[] = [
  { value: "Lao", labelKey: "optNatLao" },
  { value: "Thai", labelKey: "optNatThai" },
  { value: "Vietnamese", labelKey: "optNatVietnamese" },
  { value: "Chinese", labelKey: "optNatChinese" },
  { value: "Cambodian", labelKey: "optNatCambodian" },
  { value: "Other", labelKey: "optNatOther" },
];
const ETHNICITIES: Opt[] = [
  { value: "Lao", labelKey: "optEthLao" },
  { value: "Khmu", labelKey: "optEthKhmu" },
  { value: "Hmong", labelKey: "optEthHmong" },
  { value: "Phouthai", labelKey: "optEthPhouthai" },
  { value: "Tai", labelKey: "optEthTai" },
  { value: "Other", labelKey: "optEthOther" },
];
const ETHNIC_GROUPS: Opt[] = [
  { value: "Lao-Tai", labelKey: "optGrpLaoTai" },
  { value: "Mon-Khmer", labelKey: "optGrpMonKhmer" },
  { value: "Hmong-Iu Mien", labelKey: "optGrpHmongIuMien" },
  { value: "Sino-Tibetan", labelKey: "optGrpSinoTibetan" },
  { value: "Other", labelKey: "optGrpOther" },
];
const RELIGIONS: Opt[] = [
  { value: "Buddhism", labelKey: "optRelBuddhism" },
  { value: "Christianity", labelKey: "optRelChristianity" },
  { value: "Islam", labelKey: "optRelIslam" },
  { value: "Bahá'í", labelKey: "optRelBahai" },
  { value: "Animism", labelKey: "optRelAnimism" },
  { value: "None", labelKey: "optRelNone" },
  { value: "Other", labelKey: "optRelOther" },
];
const EDUCATION: Opt[] = [
  { value: "None", labelKey: "optEduNone" },
  { value: "Primary", labelKey: "optEduPrimary" },
  { value: "Lower Secondary", labelKey: "optEduLowerSecondary" },
  { value: "Upper Secondary", labelKey: "optEduUpperSecondary" },
  { value: "Vocational", labelKey: "optEduVocational" },
  { value: "Bachelor", labelKey: "optEduBachelor" },
  { value: "Master", labelKey: "optEduMaster" },
  { value: "Doctorate", labelKey: "optEduDoctorate" },
];
const DELIVERY_MODE: Opt[] = [
  { value: "Natural", labelKey: "optDelNatural" },
  { value: "C-section", labelKey: "optDelCsection" },
];
const BIRTH_TYPE: Opt[] = [
  { value: "Single", labelKey: "optBirthSingle" },
  { value: "Twins", labelKey: "optBirthTwins" },
];
const BLOOD_TYPES: Opt[] = [
  { value: "A", labelKey: "optBloodA" },
  { value: "B", labelKey: "optBloodB" },
  { value: "AB", labelKey: "optBloodAB" },
  { value: "O", labelKey: "optBloodO" },
  { value: "Unknown", labelKey: "optBloodUnknown" },
];

/* ─── Blank records ─── */
const blankChild: ChildInfo = {
  fullName: "", gender: "", dob: "", weight: "", height: "", fingerprint: "",
  bloodType: "", deliveryMode: "", deliveryAssistedBy: "", birthType: "", birthOrder: "",
  ethnicity: "", nationality: "Lao", religion: "",
  pobProvince: "", pobDistrict: "", pobVillage: "", pobCountry: "Laos",
  addrHouseNo: "", addrVillage: "", addrDistrict: "", addrProvince: "",
  twinName: "", twinGender: "",
};

const blankParent: ParentInfo = {
  fullName: "", fingerprint: "", dob: "", ethnicity: "", nationality: "Lao",
  ethnicGroup: "", religion: "", maritalStatus: "",
  addrHouseNo: "", addrVillage: "", addrDistrict: "", addrProvince: "",
  censusOrId: "", education: "", occupation: "",
};

const blankInformant: InformantInfo = {
  fullName: "", fingerprint: "", dob: "", ethnicity: "", nationality: "Lao",
  ethnicGroup: "", religion: "", maritalStatus: "",
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
  label: React.ReactNode; value: string; options: { value: string; label: string }[];
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
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
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

/* ─── Reusable address group ─── */
function AddressFields({
  houseNo, village, district, province, onChange, withHouseNo = true, required = true,
}: {
  houseNo: string; village: string; district: string; province: string;
  onChange: (patch: Partial<{ addrHouseNo: string; addrVillage: string; addrDistrict: string; addrProvince: string }>) => void;
  withHouseNo?: boolean; required?: boolean;
}) {
  const t = useT("birth");
  return (
    <>
      {withHouseNo && (
        <InputField
          label={t("houseNoLabel")}
          value={houseNo}
          placeholder={t("houseNoPlaceholder")}
          onChange={(v) => onChange({ addrHouseNo: v })}
        />
      )}
      <LocationFields
        province={province}
        district={district}
        village={village}
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

/* ─── Parent section (Mother / Father share the same structure, PRD §6.4) ─── */
function ParentSection({
  value, onChange, required = true,
}: {
  value: ParentInfo; onChange: (patch: Partial<ParentInfo>) => void; required?: boolean;
}) {
  const t = useT("birth");
  const opts = (list: Opt[]) => list.map((o) => ({ value: o.value, label: t(o.labelKey) }));
  return (
    <>
      <InputField
        label={t("fullNameLabel")}
        value={value.fullName}
        placeholder={t("parentNamePlaceholder")}
        onChange={(v) => onChange({ fullName: v })}
        required={required}
      />
      <div className="grid grid-cols-2 gap-3">
        <DateField
          label={t("dobLabel")}
          value={value.dob}
          onChange={(v) => onChange({ dob: v })}
          required={required}
        />
        <SelectField
          label={t("maritalStatusLabel")}
          value={value.maritalStatus}
          options={opts(MARITAL)}
          placeholder={t("selectPlaceholder")}
          onChange={(v) => onChange({ maritalStatus: v })}
          required={required}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label={t("ethnicityLabel")}
          value={value.ethnicity}
          options={opts(ETHNICITIES)}
          placeholder={t("selectPlaceholder")}
          onChange={(v) => onChange({ ethnicity: v })}
          required={required}
        />
        <SelectField
          label={t("nationalityLabel")}
          value={value.nationality}
          options={opts(NATIONALITIES)}
          placeholder={t("selectPlaceholder")}
          onChange={(v) => onChange({ nationality: v })}
          required={required}
        />
      </div>

      <SectionLabel>{t("currentAddressSection")}</SectionLabel>
      <AddressFields
        houseNo={value.addrHouseNo}
        village={value.addrVillage}
        district={value.addrDistrict}
        province={value.addrProvince}
        onChange={onChange}
        required={required}
      />

      <InputField
        label={t("censusOrIdLabel")}
        value={value.censusOrId}
        placeholder={t("censusOrIdPlaceholder")}
        onChange={(v) => onChange({ censusOrId: v })}
        required={required}
      />

      <SectionLabel>{t("additionalDetailsSection")}</SectionLabel>
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label={t("ethnicGroupLabel")}
          value={value.ethnicGroup}
          options={opts(ETHNIC_GROUPS)}
          placeholder={t("selectPlaceholder")}
          onChange={(v) => onChange({ ethnicGroup: v })}
        />
        <SelectField
          label={t("religionLabel")}
          value={value.religion}
          options={opts(RELIGIONS)}
          placeholder={t("selectPlaceholder")}
          onChange={(v) => onChange({ religion: v })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label={t("educationLabel")}
          value={value.education}
          options={opts(EDUCATION)}
          placeholder={t("selectPlaceholder")}
          onChange={(v) => onChange({ education: v })}
        />
        <InputField
          label={t("occupationLabel")}
          value={value.occupation}
          placeholder={t("occupationPlaceholder")}
          onChange={(v) => onChange({ occupation: v })}
        />
      </div>
      <InputField
        label={t("fingerprintLabel")}
        value={value.fingerprint}
        placeholder={t("parentFingerprintPlaceholder")}
        onChange={(v) => onChange({ fingerprint: v })}
      />
    </>
  );
}

/* ─── Step meta ─── */
const STEP_META: { id: number; titleKey: BirthKey; subtitleKey: BirthKey; shortKey: BirthKey }[] = [
  { id: 1, titleKey: "step1Title", subtitleKey: "step1Subtitle", shortKey: "stepHeader" },
  { id: 2, titleKey: "step2Title", subtitleKey: "step2Subtitle", shortKey: "stepChild" },
  { id: 3, titleKey: "step3Title", subtitleKey: "step3Subtitle", shortKey: "stepMother" },
  { id: 4, titleKey: "step4Title", subtitleKey: "step4Subtitle", shortKey: "stepFather" },
  { id: 5, titleKey: "step5Title", subtitleKey: "step5Subtitle", shortKey: "stepInformant" },
  { id: 6, titleKey: "step6Title", subtitleKey: "step6Subtitle", shortKey: "stepReview" },
];
const STEP_COUNT = STEP_META.length;

/* ─── Step Indicator (spans the form container width) ─── */
function StepIndicator({ step }: { step: number }) {
  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-screen-sm mx-auto px-4 py-4 flex items-center">
        {STEP_META.map((s, i) => {
          const done = step > s.id;
          const active = step === s.id;
          const isLast = i === STEP_META.length - 1;
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
  const t = useT("birth");
  const meta = STEP_META.find((s) => s.id === step)!;
  return (
    <div className="mb-3 pb-1">
      <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#344EAD" }}>
        {t("stepOf", { n: step, m: STEP_COUNT })}
      </p>
      <h2 className="text-gray-900 mt-0.5">{t(meta.titleKey)}</h2>
      <p className="text-gray-400 text-xs mt-0.5">{t(meta.subtitleKey)}</p>
    </div>
  );
}

/* ─── Main Page ─── */
interface BirthDeclarationPageProps {
  onBack: () => void;
}

export function BirthDeclarationPage({ onBack }: BirthDeclarationPageProps) {
  const t = useT("birth");
  const { lang } = useLang();
  const opts = (list: Opt[]) => list.map((o) => ({ value: o.value, label: t(o.labelKey) }));

  const [step, setStep] = useState(1);
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Auto / static header values (PRD §6.2)
  const documentNo = "BD-2026-00417";

  const [header, setHeader] = useState({ province: "", district: "", village: "" });
  const [child, setChild] = useState<ChildInfo>(blankChild);
  const [mother, setMother] = useState<ParentInfo>(blankParent);
  const [father, setFather] = useState<ParentInfo>(blankParent);
  const [fatherUnknown, setFatherUnknown] = useState(false);
  const [informant, setInformant] = useState<InformantInfo>(blankInformant);

  const patchChild = (patch: Partial<ChildInfo>) => setChild((p) => ({ ...p, ...patch }));
  const patchMother = (patch: Partial<ParentInfo>) => setMother((p) => ({ ...p, ...patch }));
  const patchFather = (patch: Partial<ParentInfo>) => setFather((p) => ({ ...p, ...patch }));
  const patchInformant = (patch: Partial<InformantInfo>) => setInformant((p) => ({ ...p, ...patch }));

  const parentValid = (p: ParentInfo) =>
    Boolean(
      p.fullName.trim() && p.dob.trim() && p.ethnicity && p.nationality &&
      p.maritalStatus && p.addrVillage.trim() && p.addrProvince && p.censusOrId.trim()
    );

  /* ── Validation — only Mandatory fields block progression ── */
  const canProceed = () => {
    if (step === 1)
      return Boolean(header.province && header.district.trim() && header.village.trim());
    if (step === 2)
      return Boolean(
        child.fullName.trim() && child.gender && child.dob.trim() && child.birthType &&
        child.birthOrder.trim() && child.ethnicity && child.nationality && child.religion &&
        child.weight.trim() && child.height.trim() &&
        child.pobProvince && child.pobVillage.trim() &&
        child.addrProvince && child.addrVillage.trim() &&
        (child.birthType !== "Twins" || child.twinName.trim())
      );
    if (step === 3) return parentValid(mother);
    if (step === 4) return fatherUnknown || parentValid(father);
    if (step === 5)
      return Boolean(
        informant.fullName.trim() && informant.dob.trim() &&
        informant.addrVillage.trim() && informant.addrProvince &&
        informant.censusOrId.trim() && informant.relationship.trim() && informant.phone.trim()
      );
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
              { label: t("successChild"), value: child.fullName || t("emptyValue") },
              { label: t("documentNo"), value: documentNo },
              { label: t("successInformant"), value: informant.fullName || t("emptyValue") },
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
            <p className="text-sm font-semibold text-gray-800">{t("headerTitle")}</p>
            <p className="text-xs text-gray-400">{t("headerSubtitle")}</p>
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

              <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-100">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{t("fee")}</p>
                <span className="text-sm font-semibold" style={{ color: "#344EAD" }}>
                  {formatLak(0, lang)}
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
                <Scale className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#344EAD" }} />
                <div>
                  <p className="text-xs font-semibold" style={{ color: "#344EAD" }}>{t("legalBasisTitle")}</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#344EAD" }}>
                    {t("legalBasisText")}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Step 2 — The Child */}
          {step === 2 && (
            <>
              <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <Baby className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#344EAD" }} />
                <p className="text-xs leading-relaxed" style={{ color: "#344EAD" }}>
                  {t("childUinNote")}
                </p>
              </div>

              <InputField
                label={t("fullNameLabel")}
                value={child.fullName}
                placeholder={t("childNamePlaceholder")}
                onChange={(v) => patchChild({ fullName: v })}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label={t("genderLabel")}
                  value={child.gender}
                  options={opts(GENDERS)}
                  placeholder={t("selectPlaceholder")}
                  onChange={(v) => patchChild({ gender: v })}
                  required
                />
                <DateField
                  label={t("dobLabel")}
                  value={child.dob}
                  onChange={(v) => patchChild({ dob: v })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label={t("typeOfBirthLabel")}
                  value={child.birthType}
                  options={opts(BIRTH_TYPE)}
                  placeholder={t("selectPlaceholder")}
                  onChange={(v) => patchChild({ birthType: v })}
                  required
                />
                <InputField
                  label={t("birthOrderLabel")}
                  value={child.birthOrder}
                  placeholder={t("birthOrderPlaceholder")}
                  inputMode="numeric"
                  maxLength={2}
                  onChange={(v) => patchChild({ birthOrder: v.replace(/\D/g, "").slice(0, 2) })}
                  required
                />
              </div>

              {child.birthType === "Twins" && (
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label={t("twinNameLabel")}
                    value={child.twinName}
                    placeholder={t("twinNamePlaceholder")}
                    onChange={(v) => patchChild({ twinName: v })}
                    required
                  />
                  <SelectField
                    label={t("twinGenderLabel")}
                    value={child.twinGender}
                    options={opts(GENDERS)}
                    placeholder={t("selectPlaceholder")}
                    onChange={(v) => patchChild({ twinGender: v })}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label={t("ethnicityLabel")}
                  value={child.ethnicity}
                  options={opts(ETHNICITIES)}
                  placeholder={t("selectPlaceholder")}
                  onChange={(v) => patchChild({ ethnicity: v })}
                  required
                />
                <SelectField
                  label={t("nationalityLabel")}
                  value={child.nationality}
                  options={opts(NATIONALITIES)}
                  placeholder={t("selectPlaceholder")}
                  onChange={(v) => patchChild({ nationality: v })}
                  required
                />
              </div>
              <SelectField
                label={t("religionLabel")}
                value={child.religion}
                options={opts(RELIGIONS)}
                placeholder={t("selectPlaceholder")}
                onChange={(v) => patchChild({ religion: v })}
                required
              />

              <SectionLabel>{t("placeOfBirthSection")}</SectionLabel>
              <LocationFields
                province={child.pobProvince}
                district={child.pobDistrict}
                village={child.pobVillage}
                villageLabel={t("pobVillageLabel")}
                required
                onChange={(p) =>
                  patchChild({
                    ...(p.province !== undefined ? { pobProvince: p.province } : {}),
                    ...(p.district !== undefined ? { pobDistrict: p.district } : {}),
                    ...(p.village !== undefined ? { pobVillage: p.village } : {}),
                  })
                }
              />
              <InputField
                label={t("countryLabel")}
                value={child.pobCountry}
                placeholder={t("countryPlaceholder")}
                onChange={(v) => patchChild({ pobCountry: v })}
              />

              <SectionLabel>{t("currentAddressSection")}</SectionLabel>
              <AddressFields
                houseNo={child.addrHouseNo}
                village={child.addrVillage}
                district={child.addrDistrict}
                province={child.addrProvince}
                onChange={patchChild}
              />

              <SectionLabel>{t("additionalDetailsSection")}</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label={t("weightLabel")}
                  value={child.weight}
                  placeholder={t("weightPlaceholder")}
                  inputMode="numeric"
                  onChange={(v) => patchChild({ weight: v })}
                  required
                />
                <InputField
                  label={t("heightLabel")}
                  value={child.height}
                  placeholder={t("heightPlaceholder")}
                  inputMode="numeric"
                  onChange={(v) => patchChild({ height: v })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label={t("bloodTypeLabel")}
                  value={child.bloodType}
                  options={opts(BLOOD_TYPES)}
                  placeholder={t("selectPlaceholder")}
                  onChange={(v) => patchChild({ bloodType: v })}
                />
                <SelectField
                  label={t("deliveryModeLabel")}
                  value={child.deliveryMode}
                  options={opts(DELIVERY_MODE)}
                  placeholder={t("selectPlaceholder")}
                  onChange={(v) => patchChild({ deliveryMode: v })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label={t("assistedByLabel")}
                  value={child.deliveryAssistedBy}
                  placeholder={t("assistedByPlaceholder")}
                  onChange={(v) => patchChild({ deliveryAssistedBy: v })}
                />
                <InputField
                  label={t("fingerprintLabel")}
                  value={child.fingerprint}
                  placeholder={t("fingerprintPlaceholder")}
                  onChange={(v) => patchChild({ fingerprint: v })}
                />
              </div>
            </>
          )}

          {/* Step 3 — Mother */}
          {step === 3 && (
            <>
              <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <User className="w-4 h-4 flex-shrink-0" style={{ color: "#344EAD" }} />
                <p className="text-xs leading-relaxed" style={{ color: "#344EAD" }}>
                  {t("motherNote")}
                </p>
              </div>
              <ParentSection value={mother} onChange={patchMother} />
            </>
          )}

          {/* Step 4 — Father */}
          {step === 4 && (
            <>
              <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <User className="w-4 h-4 flex-shrink-0" style={{ color: "#344EAD" }} />
                <p className="text-xs leading-relaxed" style={{ color: "#344EAD" }}>
                  {t("fatherNote")}
                </p>
              </div>

              {/* Sole-parent declaration toggle (PRD §6.4 note) */}
              <button
                type="button"
                onClick={() => setFatherUnknown((v) => !v)}
                className="w-full flex items-center justify-between gap-3 p-4 rounded-2xl border transition-all text-left"
                style={{
                  backgroundColor: fatherUnknown ? "#EEF2FF" : "white",
                  borderColor: fatherUnknown ? "#344EAD" : "#E5E7EB",
                }}
              >
                <div className="flex items-start gap-2.5">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#344EAD" }} />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{t("fatherUnknownTitle")}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{t("fatherUnknownSubtitle")}</p>
                  </div>
                </div>
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border-2"
                  style={{
                    backgroundColor: fatherUnknown ? "#344EAD" : "transparent",
                    borderColor: fatherUnknown ? "#344EAD" : "#D1D5DB",
                  }}
                >
                  {fatherUnknown && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>
              </button>

              {!fatherUnknown && <ParentSection value={father} onChange={patchFather} required={!fatherUnknown} />}
            </>
          )}

          {/* Step 5 — Informant */}
          {step === 5 && (
            <>
              <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <Users className="w-4 h-4 flex-shrink-0" style={{ color: "#344EAD" }} />
                <p className="text-xs leading-relaxed" style={{ color: "#344EAD" }}>
                  {t("informantNote")}
                </p>
              </div>

              <InputField
                label={t("fullNameLabel")}
                value={informant.fullName}
                placeholder={t("informantNamePlaceholder")}
                onChange={(v) => patchInformant({ fullName: v })}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <DateField
                  label={t("dobLabel")}
                  value={informant.dob}
                  onChange={(v) => patchInformant({ dob: v })}
                  required
                />
                <InputField
                  label={t("relationshipLabel")}
                  value={informant.relationship}
                  placeholder={t("relationshipPlaceholder")}
                  onChange={(v) => patchInformant({ relationship: v })}
                  required
                />
              </div>

              <SectionLabel>{t("currentAddressSection")}</SectionLabel>
              <AddressFields
                houseNo={informant.addrHouseNo}
                village={informant.addrVillage}
                district={informant.addrDistrict}
                province={informant.addrProvince}
                onChange={patchInformant}
              />

              <InputField
                label={t("censusOrIdLabel")}
                value={informant.censusOrId}
                placeholder={t("censusOrIdPlaceholder")}
                onChange={(v) => patchInformant({ censusOrId: v })}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label={t("phoneLabel")}
                  value={informant.phone}
                  placeholder={t("phonePlaceholder")}
                  inputMode="tel"
                  onChange={(v) => patchInformant({ phone: v })}
                  required
                />
                <InputField
                  label={t("emailLabel")}
                  value={informant.email}
                  placeholder={t("emailPlaceholder")}
                  inputMode="email"
                  onChange={(v) => patchInformant({ email: v })}
                />
              </div>

              <SectionLabel>{t("additionalDetailsSection")}</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label={t("maritalStatusLabel")}
                  value={informant.maritalStatus}
                  options={opts(MARITAL)}
                  placeholder={t("selectPlaceholder")}
                  onChange={(v) => patchInformant({ maritalStatus: v })}
                />
                <SelectField
                  label={t("educationLabel")}
                  value={informant.education}
                  options={opts(EDUCATION)}
                  placeholder={t("selectPlaceholder")}
                  onChange={(v) => patchInformant({ education: v })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label={t("nationalityLabel")}
                  value={informant.nationality}
                  options={opts(NATIONALITIES)}
                  placeholder={t("selectPlaceholder")}
                  onChange={(v) => patchInformant({ nationality: v })}
                />
                <InputField
                  label={t("fingerprintLabel")}
                  value={informant.fingerprint}
                  placeholder={t("fingerprintPlaceholder")}
                  onChange={(v) => patchInformant({ fingerprint: v })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label={t("ethnicityLabel")}
                  value={informant.ethnicity}
                  options={opts(ETHNICITIES)}
                  placeholder={t("selectPlaceholder")}
                  onChange={(v) => patchInformant({ ethnicity: v })}
                />
                <SelectField
                  label={t("ethnicGroupLabel")}
                  value={informant.ethnicGroup}
                  options={opts(ETHNIC_GROUPS)}
                  placeholder={t("selectPlaceholder")}
                  onChange={(v) => patchInformant({ ethnicGroup: v })}
                />
              </div>
              <SelectField
                label={t("religionLabel")}
                value={informant.religion}
                options={opts(RELIGIONS)}
                placeholder={t("selectPlaceholder")}
                onChange={(v) => patchInformant({ religion: v })}
              />
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
                    [t("reviewProvinceDistrictVillage"), [header.province, header.district, header.village].filter(Boolean).join(" / ") || t("emptyValue")],
                    [t("documentNo"), documentNo],
                  ],
                },
                {
                  title: t("step2Title"),
                  rows: [
                    [t("reviewName"), child.fullName || t("emptyValue")],
                    [t("reviewGenderDob"), [child.gender, child.dob].filter(Boolean).join(" · ") || t("emptyValue")],
                    [t("reviewBirth"), [child.birthType, child.birthOrder && `#${child.birthOrder}`].filter(Boolean).join(" · ") || t("emptyValue")],
                    [t("reviewPlaceOfBirth"), [child.pobVillage, child.pobDistrict, child.pobProvince].filter(Boolean).join(", ") || t("emptyValue")],
                  ],
                },
                {
                  title: t("step3Title"),
                  rows: [
                    [t("reviewName"), mother.fullName || t("emptyValue")],
                    [t("reviewIdCensus"), mother.censusOrId || t("emptyValue")],
                  ],
                },
                {
                  title: t("step4Title"),
                  rows: fatherUnknown
                    ? [[t("reviewStatus"), t("reviewFatherUnknown")]]
                    : [
                        [t("reviewName"), father.fullName || t("emptyValue")],
                        [t("reviewIdCensus"), father.censusOrId || t("emptyValue")],
                      ],
                },
                {
                  title: t("step5Title"),
                  rows: [
                    [t("reviewName"), informant.fullName || t("emptyValue")],
                    [t("reviewRelationship"), informant.relationship || t("emptyValue")],
                    [t("reviewPhone"), informant.phone || t("emptyValue")],
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
