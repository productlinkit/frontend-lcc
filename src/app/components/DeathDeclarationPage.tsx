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
  { id: 1, label: "Header", subtitle: "Jurisdiction and document details" },
  { id: 2, label: "The Deceased", subtitle: "Details of the deceased person" },
  { id: 3, label: "Mother", subtitle: "Mother of the deceased" },
  { id: 4, label: "Father", subtitle: "Father of the deceased" },
  { id: 5, label: "Informant", subtitle: "Reporter of the death" },
  { id: 6, label: "Review", subtitle: "Check and submit your declaration" },
];

const PROVINCES = [
  "Vientiane Capital", "Phongsali", "Luang Namtha", "Oudomxay",
  "Bokeo", "Luang Prabang", "Houaphan", "Xayabury",
  "Xieng Khouang", "Vientiane Province", "Borikhamxay", "Khammouane",
  "Savannakhet", "Salavan", "Xekong", "Champasak",
  "Attapeu", "Xaysomboune",
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

/* ─── Reusable address group ─── */
function AddressFields({
  houseNo, village, district, province, onChange, required = true,
}: {
  houseNo: string; village: string; district: string; province: string;
  onChange: (patch: Partial<{ addrHouseNo: string; addrVillage: string; addrDistrict: string; addrProvince: string }>) => void;
  required?: boolean;
}) {
  return (
    <>
      <InputField
        label="House No."
        value={houseNo}
        placeholder="House number"
        onChange={(v) => onChange({ addrHouseNo: v })}
      />
      <div className="grid grid-cols-2 gap-3">
        <InputField
          label="Village"
          value={village}
          placeholder="Ban..."
          onChange={(v) => onChange({ addrVillage: v })}
          required={required}
        />
        <InputField
          label="District"
          value={district}
          placeholder="Muang..."
          onChange={(v) => onChange({ addrDistrict: v })}
        />
      </div>
      <SelectField
        label="Province / Capital"
        value={province}
        options={PROVINCES}
        placeholder="Select province..."
        onChange={(v) => onChange({ addrProvince: v })}
        required={required}
      />
    </>
  );
}

/* ─── Parent section (Mother / Father of the deceased — PRD §7.4) ─── */
function ParentSection({
  value, onChange,
}: {
  value: ParentInfo; onChange: (patch: Partial<ParentInfo>) => void;
}) {
  return (
    <>
      <InputField
        label="Full Name (Lao / English)"
        value={value.fullName}
        placeholder="Full name"
        onChange={(v) => onChange({ fullName: v })}
        required
      />
      <div className="grid grid-cols-2 gap-3">
        <InputField
          label="Date of Birth (optional)"
          value={value.dob}
          placeholder="DD/MM/YYYY"
          onChange={(v) => onChange({ dob: v })}
        />
        <SelectField
          label="Marital Status (optional)"
          value={value.maritalStatus}
          options={MARITAL}
          placeholder="Select..."
          onChange={(v) => onChange({ maritalStatus: v })}
        />
      </div>

      <SectionLabel>Demographics (optional)</SectionLabel>
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="Ethnicity"
          value={value.ethnicity}
          options={ETHNICITIES}
          placeholder="Select..."
          onChange={(v) => onChange({ ethnicity: v })}
        />
        <SelectField
          label="Nationality"
          value={value.nationality}
          options={NATIONALITIES}
          placeholder="Select..."
          onChange={(v) => onChange({ nationality: v })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="Ethnic Group"
          value={value.ethnicGroup}
          options={ETHNIC_GROUPS}
          placeholder="Select..."
          onChange={(v) => onChange({ ethnicGroup: v })}
        />
        <SelectField
          label="Religion"
          value={value.religion}
          options={RELIGIONS}
          placeholder="Select..."
          onChange={(v) => onChange({ religion: v })}
        />
      </div>

      <SectionLabel>Current address (if applicable)</SectionLabel>
      <AddressFields
        houseNo={value.addrHouseNo}
        village={value.addrVillage}
        district={value.addrDistrict}
        province={value.addrProvince}
        onChange={onChange}
        required={false}
      />

      <InputField
        label="Census Book No. / ID Card No. (if applicable)"
        value={value.censusOrId}
        placeholder="One identifier + issue date"
        onChange={(v) => onChange({ censusOrId: v })}
      />

      <SectionLabel>Education & work (optional)</SectionLabel>
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="Education Level"
          value={value.education}
          options={EDUCATION}
          placeholder="Select..."
          onChange={(v) => onChange({ education: v })}
        />
        <InputField
          label="Occupation"
          value={value.occupation}
          placeholder="Occupation"
          onChange={(v) => onChange({ occupation: v })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <InputField
          label="Workplace"
          value={value.workplace}
          placeholder="Workplace"
          onChange={(v) => onChange({ workplace: v })}
        />
        <InputField
          label="Fingerprint Code"
          value={value.fingerprint}
          placeholder="Biometric code"
          onChange={(v) => onChange({ fingerprint: v })}
        />
      </div>
    </>
  );
}

/* ─── Parent step with a "deceased / unknown" toggle (PRD §7.4 note) ─── */
function ParentStep({
  intro, value, onChange, skip, onToggleSkip,
}: {
  intro: string; value: ParentInfo; onChange: (patch: Partial<ParentInfo>) => void;
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
            <p className="text-sm font-medium text-gray-800">Parent deceased / unknown</p>
            <p className="text-xs text-gray-400 mt-0.5">Skip this section</p>
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

      {!skip && <ParentSection value={value} onChange={onChange} />}
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
  const meta = STEPS.find((s) => s.id === step)!;
  return (
    <div className="mb-3 pb-1">
      <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#344EAD" }}>
        Step {step} of {STEPS.length}
      </p>
      <h2 className="text-gray-900 mt-0.5">{meta.label}</h2>
      <p className="text-gray-400 text-xs mt-0.5">{meta.subtitle}</p>
    </div>
  );
}

/* ─── Main Page ─── */
interface DeathDeclarationPageProps {
  onBack: () => void;
}

export function DeathDeclarationPage({ onBack }: DeathDeclarationPageProps) {
  const [step, setStep] = useState(1);
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
        deceased.ethnicity && deceased.nationality && deceased.maritalStatus &&
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
            <h2 className="text-gray-900 mb-2">Death Declaration Submitted!</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              The declaration has been received. On approval, the deceased will be removed from the household record.
            </p>
          </div>
          <div className="w-full bg-white rounded-3xl p-5 text-left space-y-3 shadow-sm border border-gray-100">
            {[
              { label: "Deceased", value: deceased.fullName || "—" },
              { label: "Document No.", value: documentNo },
              { label: "Informant", value: informant.fullName || "—" },
              { label: "Est. review", value: "≤ 5 working days" },
              { label: "Status", value: "Submitted", isStatus: true },
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
            Back to Home
          </button>
          <p className="text-xs text-gray-400">Track your declaration in the History tab</p>
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
            <p className="text-sm font-semibold text-gray-800">Death Declaration</p>
            <p className="text-xs text-gray-400">Online Application</p>
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
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Document No.</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{documentNo}</p>
                </div>
                <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                  Auto-generated
                </span>
              </div>

              <SelectField
                label="Province / Capital City"
                value={header.province}
                options={PROVINCES}
                placeholder="Select province..."
                onChange={(v) => setHeader((h) => ({ ...h, province: v }))}
                required
              />
              <InputField
                label="District"
                value={header.district}
                placeholder="e.g. Chanthabouly"
                onChange={(v) => setHeader((h) => ({ ...h, district: v }))}
                required
              />
              <InputField
                label="Village"
                value={header.village}
                placeholder="Village issuing the declaration"
                onChange={(v) => setHeader((h) => ({ ...h, village: v }))}
                required
              />

              <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <Scale className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#344EAD" }} />
                <div>
                  <p className="text-xs font-semibold" style={{ color: "#344EAD" }}>Legal basis</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#344EAD" }}>
                    Pursuant to the Family Law No. 44/NA, dated 14/06/2018. The date of declaration is set automatically on submission.
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
                  Section 1 — details of the deceased person.
                </p>
              </div>

              <InputField
                label="Full Name (Lao / English)"
                value={deceased.fullName}
                placeholder="Deceased's full name"
                onChange={(v) => patchDeceased({ fullName: v })}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label="Gender"
                  value={deceased.gender}
                  options={GENDERS}
                  placeholder="Select..."
                  onChange={(v) => patchDeceased({ gender: v })}
                  required
                />
                <InputField
                  label="Date of Birth"
                  value={deceased.dob}
                  placeholder="DD/MM/YYYY"
                  onChange={(v) => patchDeceased({ dob: v })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label="Ethnicity"
                  value={deceased.ethnicity}
                  options={ETHNICITIES}
                  placeholder="Select..."
                  onChange={(v) => patchDeceased({ ethnicity: v })}
                  required
                />
                <SelectField
                  label="Nationality"
                  value={deceased.nationality}
                  options={NATIONALITIES}
                  placeholder="Select..."
                  onChange={(v) => patchDeceased({ nationality: v })}
                  required
                />
              </div>
              <SelectField
                label="Marital Status"
                value={deceased.maritalStatus}
                options={MARITAL}
                placeholder="Select..."
                onChange={(v) => patchDeceased({ maritalStatus: v })}
                required
              />

              <SectionLabel>Current address</SectionLabel>
              <AddressFields
                houseNo={deceased.addrHouseNo}
                village={deceased.addrVillage}
                district={deceased.addrDistrict}
                province={deceased.addrProvince}
                onChange={patchDeceased}
              />
              <InputField
                label="Census Book No. / ID Card No."
                value={deceased.censusOrId}
                placeholder="One identifier + issue date"
                onChange={(v) => patchDeceased({ censusOrId: v })}
                required
              />

              <SectionLabel>The death</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="Place of Death — Village"
                  value={deceased.podVillage}
                  placeholder="Ban..."
                  onChange={(v) => patchDeceased({ podVillage: v })}
                  required
                />
                <InputField
                  label="District / City"
                  value={deceased.podDistrict}
                  placeholder="Muang..."
                  onChange={(v) => patchDeceased({ podDistrict: v })}
                />
              </div>
              <SelectField
                label="Place of Death — Province"
                value={deceased.podProvince}
                options={PROVINCES}
                placeholder="Select..."
                onChange={(v) => patchDeceased({ podProvince: v })}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="Date of Death"
                  value={deceased.dateOfDeath}
                  placeholder="DD/MM/YYYY"
                  onChange={(v) => patchDeceased({ dateOfDeath: v })}
                  required
                />
                <InputField
                  label="Time of Death (optional)"
                  value={deceased.timeOfDeath}
                  placeholder="HH:MM"
                  onChange={(v) => patchDeceased({ timeOfDeath: v })}
                />
              </div>
              <SelectField
                label="Cause of Death"
                value={deceased.cause}
                options={CAUSES}
                placeholder="Select..."
                onChange={(v) => patchDeceased({ cause: v })}
                required
              />
              {deceased.cause === "Other" && (
                <InputField
                  label="Cause — please specify"
                  value={deceased.causeOther}
                  placeholder="Specify the cause"
                  onChange={(v) => patchDeceased({ causeOther: v })}
                  required
                />
              )}

              <SectionLabel>Education & work (optional)</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label="Education Level"
                  value={deceased.education}
                  options={EDUCATION}
                  placeholder="Select..."
                  onChange={(v) => patchDeceased({ education: v })}
                />
                <InputField
                  label="Occupation"
                  value={deceased.occupation}
                  placeholder="Occupation"
                  onChange={(v) => patchDeceased({ occupation: v })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="Workplace"
                  value={deceased.workplace}
                  placeholder="Workplace"
                  onChange={(v) => patchDeceased({ workplace: v })}
                />
                <InputField
                  label="Fingerprint Code"
                  value={deceased.fingerprint}
                  placeholder="Biometric code"
                  onChange={(v) => patchDeceased({ fingerprint: v })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label="Ethnic Group"
                  value={deceased.ethnicGroup}
                  options={ETHNIC_GROUPS}
                  placeholder="Select..."
                  onChange={(v) => patchDeceased({ ethnicGroup: v })}
                />
                <SelectField
                  label="Religion"
                  value={deceased.religion}
                  options={RELIGIONS}
                  placeholder="Select..."
                  onChange={(v) => patchDeceased({ religion: v })}
                />
              </div>
            </>
          )}

          {/* Step 3 — Mother */}
          {step === 3 && (
            <ParentStep
              intro="Section 2 — the mother of the deceased."
              value={mother}
              onChange={patchMother}
              skip={motherSkip}
              onToggleSkip={() => setMotherSkip((v) => !v)}
            />
          )}

          {/* Step 4 — Father */}
          {step === 4 && (
            <ParentStep
              intro="Section 3 — the father of the deceased."
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
                  Section 4 — the person reporting the death.
                </p>
              </div>

              <InputField
                label="Full Name (Lao / English)"
                value={informant.fullName}
                placeholder="Informant's full name"
                onChange={(v) => patchInformant({ fullName: v })}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="Date of Birth"
                  value={informant.dob}
                  placeholder="DD/MM/YYYY"
                  onChange={(v) => patchInformant({ dob: v })}
                  required
                />
                <InputField
                  label="Relationship to Deceased"
                  value={informant.relationship}
                  placeholder="e.g. Son, Spouse"
                  onChange={(v) => patchInformant({ relationship: v })}
                  required
                />
              </div>

              <SectionLabel>Current address</SectionLabel>
              <AddressFields
                houseNo={informant.addrHouseNo}
                village={informant.addrVillage}
                district={informant.addrDistrict}
                province={informant.addrProvince}
                onChange={patchInformant}
              />

              <InputField
                label="Census Book No. / ID Card No."
                value={informant.censusOrId}
                placeholder="One identifier + issue date"
                onChange={(v) => patchInformant({ censusOrId: v })}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="Phone Number"
                  value={informant.phone}
                  placeholder="+856..."
                  inputMode="tel"
                  onChange={(v) => patchInformant({ phone: v })}
                  required
                />
                <InputField
                  label="Email (optional)"
                  value={informant.email}
                  placeholder="name@email.com"
                  inputMode="email"
                  onChange={(v) => patchInformant({ email: v })}
                />
              </div>

              <SectionLabel>Additional details (optional)</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label="Marital Status"
                  value={informant.maritalStatus}
                  options={MARITAL}
                  placeholder="Select..."
                  onChange={(v) => patchInformant({ maritalStatus: v })}
                />
                <SelectField
                  label="Education Level"
                  value={informant.education}
                  options={EDUCATION}
                  placeholder="Select..."
                  onChange={(v) => patchInformant({ education: v })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label="Nationality"
                  value={informant.nationality}
                  options={NATIONALITIES}
                  placeholder="Select..."
                  onChange={(v) => patchInformant({ nationality: v })}
                />
                <InputField
                  label="Fingerprint Code"
                  value={informant.fingerprint}
                  placeholder="Biometric code"
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
                  Please review the declaration before submitting. The Village Chief and informant sign the form at the village office.
                </p>
              </div>

              {[
                {
                  title: "Header",
                  rows: [
                    ["Province / District / Village", [header.province, header.district, header.village].filter(Boolean).join(" / ") || "—"],
                    ["Document No.", documentNo],
                  ],
                },
                {
                  title: "The Deceased",
                  rows: [
                    ["Name", deceased.fullName || "—"],
                    ["Gender / DoB", [deceased.gender, deceased.dob].filter(Boolean).join(" · ") || "—"],
                    ["Place of death", [deceased.podVillage, deceased.podDistrict, deceased.podProvince].filter(Boolean).join(", ") || "—"],
                    ["Date / cause", [deceased.dateOfDeath, deceased.cause === "Other" ? deceased.causeOther : deceased.cause].filter(Boolean).join(" · ") || "—"],
                  ],
                },
                {
                  title: "Mother",
                  rows: motherSkip ? [["Status", "Deceased / unknown"]] : [["Name", mother.fullName || "—"]],
                },
                {
                  title: "Father",
                  rows: fatherSkip ? [["Status", "Deceased / unknown"]] : [["Name", father.fullName || "—"]],
                },
                {
                  title: "Informant",
                  rows: [
                    ["Name", informant.fullName || "—"],
                    ["Relationship", informant.relationship || "—"],
                    ["Phone", informant.phone || "—"],
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
                Submitting…
              </>
            ) : step === lastStep ? (
              <>
                Submit Declaration
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
