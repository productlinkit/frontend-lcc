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

/* ─── Constants ─── */
const STEPS = [
  { id: 1, label: "Header", subtitle: "Jurisdiction and document details" },
  { id: 2, label: "The Child", subtitle: "Details of the newborn" },
  { id: 3, label: "Mother", subtitle: "Mother's particulars" },
  { id: 4, label: "Father", subtitle: "Father's particulars" },
  { id: 5, label: "Informant", subtitle: "Reporter of the birth" },
  { id: 6, label: "Review", subtitle: "Check and submit your declaration" },
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
const DELIVERY_MODE = ["Natural", "C-section"];
const BIRTH_TYPE = ["Single", "Twins"];
const BLOOD_TYPES = ["A", "B", "AB", "O", "Unknown"];

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
  houseNo, village, district, province, onChange, withHouseNo = true,
}: {
  houseNo: string; village: string; district: string; province: string;
  onChange: (patch: Partial<{ addrHouseNo: string; addrVillage: string; addrDistrict: string; addrProvince: string }>) => void;
  withHouseNo?: boolean;
}) {
  return (
    <>
      {withHouseNo && (
        <InputField
          label="House No."
          value={houseNo}
          placeholder="House number"
          onChange={(v) => onChange({ addrHouseNo: v })}
        />
      )}
      <LocationFields
        province={province}
        district={district}
        village={village}
        required
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
        <DateField
          label="Date of Birth"
          value={value.dob}
          onChange={(v) => onChange({ dob: v })}
          required
        />
        <SelectField
          label="Marital Status"
          value={value.maritalStatus}
          options={MARITAL}
          placeholder="Select..."
          onChange={(v) => onChange({ maritalStatus: v })}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="Ethnicity"
          value={value.ethnicity}
          options={ETHNICITIES}
          placeholder="Select..."
          onChange={(v) => onChange({ ethnicity: v })}
          required
        />
        <SelectField
          label="Nationality"
          value={value.nationality}
          options={NATIONALITIES}
          placeholder="Select..."
          onChange={(v) => onChange({ nationality: v })}
          required
        />
      </div>

      <SectionLabel>Current address</SectionLabel>
      <AddressFields
        houseNo={value.addrHouseNo}
        village={value.addrVillage}
        district={value.addrDistrict}
        province={value.addrProvince}
        onChange={onChange}
      />

      <InputField
        label="Census Book No. / ID Card No."
        value={value.censusOrId}
        placeholder="One identifier + issue date"
        onChange={(v) => onChange({ censusOrId: v })}
        required
      />

      <SectionLabel>Additional details (optional)</SectionLabel>
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
      <InputField
        label="Fingerprint Code"
        value={value.fingerprint}
        placeholder="Biometric fingerprint code"
        onChange={(v) => onChange({ fingerprint: v })}
      />
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
interface BirthDeclarationPageProps {
  onBack: () => void;
}

export function BirthDeclarationPage({ onBack }: BirthDeclarationPageProps) {
  const [step, setStep] = useState(1);
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
            <h2 className="text-gray-900 mb-2">Birth Declaration Submitted!</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              The declaration has been received. The village office will review it and a UIN will be assigned to the child.
            </p>
          </div>
          <div className="w-full bg-white rounded-3xl p-5 text-left space-y-3 shadow-sm border border-gray-100">
            {[
              { label: "Child", value: child.fullName || "—" },
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
            <p className="text-sm font-semibold text-gray-800">Birth Declaration</p>
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
                  <p className="text-xs font-semibold" style={{ color: "#344EAD" }}>Legal basis</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#344EAD" }}>
                    Pursuant to the Family Law No. 44/NA, dated 14/06/2018. The date of declaration is set automatically on submission.
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
                  A Unique Identification Number (UIN) is assigned to the child on registration.
                </p>
              </div>

              <InputField
                label="Full Name (Lao / English)"
                value={child.fullName}
                placeholder="Child's full name"
                onChange={(v) => patchChild({ fullName: v })}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label="Gender"
                  value={child.gender}
                  options={GENDERS}
                  placeholder="Select..."
                  onChange={(v) => patchChild({ gender: v })}
                  required
                />
                <DateField
                  label="Date of Birth"
                  value={child.dob}
                  onChange={(v) => patchChild({ dob: v })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label="Type of Birth"
                  value={child.birthType}
                  options={BIRTH_TYPE}
                  placeholder="Select..."
                  onChange={(v) => patchChild({ birthType: v })}
                  required
                />
                <InputField
                  label="Birth Order (child no.)"
                  value={child.birthOrder}
                  placeholder="e.g. 1"
                  inputMode="numeric"
                  maxLength={2}
                  onChange={(v) => patchChild({ birthOrder: v.replace(/\D/g, "").slice(0, 2) })}
                  required
                />
              </div>

              {child.birthType === "Twins" && (
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label="Twin — Full Name"
                    value={child.twinName}
                    placeholder="Co-delivered child"
                    onChange={(v) => patchChild({ twinName: v })}
                    required
                  />
                  <SelectField
                    label="Twin — Gender"
                    value={child.twinGender}
                    options={GENDERS}
                    placeholder="Select..."
                    onChange={(v) => patchChild({ twinGender: v })}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label="Ethnicity"
                  value={child.ethnicity}
                  options={ETHNICITIES}
                  placeholder="Select..."
                  onChange={(v) => patchChild({ ethnicity: v })}
                  required
                />
                <SelectField
                  label="Nationality"
                  value={child.nationality}
                  options={NATIONALITIES}
                  placeholder="Select..."
                  onChange={(v) => patchChild({ nationality: v })}
                  required
                />
              </div>
              <SelectField
                label="Religion"
                value={child.religion}
                options={RELIGIONS}
                placeholder="Select..."
                onChange={(v) => patchChild({ religion: v })}
                required
              />

              <SectionLabel>Place of birth</SectionLabel>
              <LocationFields
                province={child.pobProvince}
                district={child.pobDistrict}
                village={child.pobVillage}
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
                label="Country"
                value={child.pobCountry}
                placeholder="Country"
                onChange={(v) => patchChild({ pobCountry: v })}
              />

              <SectionLabel>Current address</SectionLabel>
              <AddressFields
                houseNo={child.addrHouseNo}
                village={child.addrVillage}
                district={child.addrDistrict}
                province={child.addrProvince}
                onChange={patchChild}
              />

              <SectionLabel>Additional details (optional)</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="Weight (kg)"
                  value={child.weight}
                  placeholder="e.g. 3.2"
                  inputMode="numeric"
                  onChange={(v) => patchChild({ weight: v })}
                />
                <InputField
                  label="Height (cm)"
                  value={child.height}
                  placeholder="e.g. 50"
                  inputMode="numeric"
                  onChange={(v) => patchChild({ height: v })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label="Blood Type / Group"
                  value={child.bloodType}
                  options={BLOOD_TYPES}
                  placeholder="Select..."
                  onChange={(v) => patchChild({ bloodType: v })}
                />
                <SelectField
                  label="Mode of Delivery"
                  value={child.deliveryMode}
                  options={DELIVERY_MODE}
                  placeholder="Select..."
                  onChange={(v) => patchChild({ deliveryMode: v })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="Assisted by"
                  value={child.deliveryAssistedBy}
                  placeholder="Midwife / doctor"
                  onChange={(v) => patchChild({ deliveryAssistedBy: v })}
                />
                <InputField
                  label="Fingerprint Code"
                  value={child.fingerprint}
                  placeholder="Biometric code"
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
                  Section 2 — the child's mother.
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
                  Section 3 — the child's father.
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
                    <p className="text-sm font-medium text-gray-800">Father unknown / not declared</p>
                    <p className="text-xs text-gray-400 mt-0.5">Submit a sole-parent declaration</p>
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

              {!fatherUnknown && <ParentSection value={father} onChange={patchFather} />}
            </>
          )}

          {/* Step 5 — Informant */}
          {step === 5 && (
            <>
              <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <Users className="w-4 h-4 flex-shrink-0" style={{ color: "#344EAD" }} />
                <p className="text-xs leading-relaxed" style={{ color: "#344EAD" }}>
                  Section 4 — the person reporting the birth.
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
                <DateField
                  label="Date of Birth"
                  value={informant.dob}
                  onChange={(v) => patchInformant({ dob: v })}
                  required
                />
                <InputField
                  label="Relationship to Child"
                  value={informant.relationship}
                  placeholder="e.g. Mother, Father"
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
                  Please review the declaration before submitting. The Village Chief, birth attendant (if any) and informant sign the form at the village office.
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
                  title: "The Child",
                  rows: [
                    ["Name", child.fullName || "—"],
                    ["Gender / DoB", [child.gender, child.dob].filter(Boolean).join(" · ") || "—"],
                    ["Birth", [child.birthType, child.birthOrder && `#${child.birthOrder}`].filter(Boolean).join(" · ") || "—"],
                    ["Place of birth", [child.pobVillage, child.pobDistrict, child.pobProvince].filter(Boolean).join(", ") || "—"],
                  ],
                },
                {
                  title: "Mother",
                  rows: [
                    ["Name", mother.fullName || "—"],
                    ["ID / Census", mother.censusOrId || "—"],
                  ],
                },
                {
                  title: "Father",
                  rows: fatherUnknown
                    ? [["Status", "Unknown / sole-parent declaration"]]
                    : [
                        ["Name", father.fullName || "—"],
                        ["ID / Census", father.censusOrId || "—"],
                      ],
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
