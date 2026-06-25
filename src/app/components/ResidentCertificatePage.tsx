import { useState, useRef } from "react";
import {
  ChevronLeft,
  ArrowRight,
  CheckCircle2,
  Check,
  Loader2,
  Camera,
  X,
  AlertCircle,
  ScanLine,
  Sparkles,
} from "lucide-react";
import { PaymentSection, blankPayment, isPaymentValid, type PaymentState } from "./PaymentSection";
import { LocationFields, DateField } from "./formFields";
import { SERVICE_CONFIG, formatLak } from "../serviceConfig";

/* ─── Types ─── */
interface UploadedFile {
  name: string;
  preview: string | null;
}

/*
 * Field set follows the PRD — Residence Certificate, §5.2 "Form fields".
 * M = Mandatory · C = Conditional · O = Optional · Auto = system-generated.
 */
interface FormData {
  // Supporting documents (§5.1) — captured first; applicant details are read from the ID
  frontId: UploadedFile | null;
  backId: UploadedFile | null;

  // Applicant identity
  citizenName: string; // M
  age: string; // M
  occupation: string; // O
  nationality: string; // M
  picture: UploadedFile | null; // C — applicant 3×4 photo

  // Header / jurisdiction block
  province: string; // M
  district: string; // M
  villageName: string; // M — village whose office issues the certificate
  villageChiefName: string; // M — Nai Ban who certifies
  certifyingJurisdiction: string; // M — certifying District / Province

  // Current residence (the attested fact)
  currentVillage: string; // M
  groupKhum: string; // C — Group (Khum)
  unitNuayBan: string; // C — Unit (Nuay Ban)
  houseNo: string; // M

  // Household reference (from the family book)
  censusBookNo: string; // M — Household Census Book No.
  censusBookDate: string; // C — date the census book was issued
  censusDistrictProvince: string; // C

  // Parentage
  fatherName: string; // C — "Is the child of Mr."
  motherName: string; // C — "and Mrs."

  // Native place + purpose
  nativePlace: string; // O — Native Village / District / Province
  purpose: string; // M — "This certificate is used for"

  // Payment
  payment: PaymentState;
}

/* ─── Constants ─── */
const STEPS = [
  { id: 1, label: "Verify Identity", subtitle: "Upload your ID — we'll read your details automatically" },
  { id: 2, label: "Applicant", subtitle: "Confirm the details read from your ID" },
  { id: 3, label: "Location & Authority", subtitle: "Jurisdiction and certifying village office" },
  { id: 4, label: "Current Residence", subtitle: "The address being attested" },
  { id: 5, label: "Household & Purpose", subtitle: "Family book reference, parentage and purpose" },
  { id: 6, label: "Payment", subtitle: "Service fee" },
];

const NATIONALITIES = [
  "Lao", "Thai", "Vietnamese", "Chinese", "Cambodian",
  "Myanmar", "American", "French", "Other",
];

const PURPOSES = [
  "Employment / Job Application",
  "Bank Account Opening",
  "School / University Enrollment",
  "Travel / Visa Application",
  "Property Transaction",
  "Government Permit",
  "Other",
];

// Demo details "read" from the uploaded ID
const DETECTED = { citizenName: "Somchai Vongkhamphanh", age: "34", nationality: "Lao" };

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
  inputMode?: "text" | "numeric"; maxLength?: number;
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

function UploadBox({
  label, sublabel, file, onChange, required = true, height = "h-40",
}: {
  label: React.ReactNode; sublabel: string;
  file: UploadedFile | null; onChange: (f: UploadedFile | null) => void;
  required?: boolean; height?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    const reader = new FileReader();
    reader.onload = (ev) =>
      onChange({ name: picked.name, preview: ev.target?.result as string | null });
    reader.readAsDataURL(picked);
  };

  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {file ? (
        <div className="relative rounded-2xl overflow-hidden border-2 border-green-300 bg-green-50">
          {file.preview
            ? <img src={file.preview} alt={typeof label === "string" ? label : "upload"} className={`w-full ${height} object-cover`} />
            : <div className={`${height} flex items-center justify-center`}><Camera className="w-8 h-8 text-green-400" /></div>
          }
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 px-3 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span className="text-white text-xs truncate max-w-[180px]">{file.name}</span>
            </div>
            <button
              onClick={() => { onChange(null); if (inputRef.current) inputRef.current.value = ""; }}
              className="text-white/70 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`w-full ${height} rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 hover:border-[#344EAD]/40 hover:bg-blue-50/50 transition-all flex flex-col items-center justify-center gap-2.5 group`}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform" style={{ backgroundColor: "#EEF2FF" }}>
            <Camera className="w-7 h-7" style={{ color: "#344EAD" }} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-600 group-hover:text-[#344EAD] transition-colors">Tap to upload photo</p>
            <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>
          </div>
        </button>
      )}
    </div>
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

/* ─── Section heading inside the form body ─── */
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
interface ResidentCertificatePageProps {
  onBack: () => void;
}

export function ResidentCertificatePage({ onBack }: ResidentCertificatePageProps) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ID auto-detection (simulated OCR / eID read)
  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected] = useState(false);

  // Ref. No. is system-generated (Auto in the PRD) — shown read-only.
  const refNo = "LCC-RC-2026-08312";

  const [form, setForm] = useState<FormData>({
    frontId: null,
    backId: null,
    // Read from the ID at step 1 (left blank until detected)
    citizenName: "",
    age: "",
    occupation: "",
    nationality: "",
    picture: null,
    province: "",
    district: "",
    villageName: "",
    villageChiefName: "",
    certifyingJurisdiction: "",
    currentVillage: "",
    groupKhum: "",
    unitNuayBan: "",
    houseNo: "",
    censusBookNo: "",
    censusBookDate: "",
    censusDistrictProvince: "",
    fatherName: "",
    motherName: "",
    nativePlace: "",
    purpose: "",
    payment: blankPayment,
  });

  const fee = SERVICE_CONFIG.resident.fee ?? 0;

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  /* ── Front-ID upload triggers detection of the applicant's details ── */
  const handleFrontId = (f: UploadedFile | null) => {
    if (f) {
      setForm((prev) => ({ ...prev, frontId: f }));
      setDetecting(true);
      setDetected(false);
      setTimeout(() => {
        setForm((prev) => ({ ...prev, ...DETECTED }));
        setDetecting(false);
        setDetected(true);
      }, 1800);
    } else {
      setDetecting(false);
      setDetected(false);
      setForm((prev) => ({
        ...prev,
        frontId: null,
        citizenName: "",
        age: "",
        nationality: "",
      }));
    }
  };

  /* ── Validation — only Mandatory fields block progression ── */
  const canProceed = () => {
    if (step === 1) return Boolean(form.frontId && form.backId && !detecting);
    if (step === 2) return Boolean(form.citizenName.trim() && form.age.trim() && form.nationality);
    if (step === 3)
      return Boolean(
        form.province.trim() &&
        form.district.trim() &&
        form.villageName.trim() &&
        form.villageChiefName.trim() &&
        form.certifyingJurisdiction.trim()
      );
    if (step === 4) return Boolean(form.currentVillage.trim() && form.houseNo.trim());
    if (step === 5) return Boolean(form.censusBookNo.trim() && form.purpose);
    if (step === 6) return isPaymentValid(form.payment);
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
            <h2 className="text-gray-900 mb-2">Application Submitted!</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Your Residence Certificate application has been received and is now being processed.
            </p>
          </div>
          <div className="w-full bg-white rounded-3xl p-5 text-left space-y-3 shadow-sm border border-gray-100">
            {[
              { label: "Applicant", value: form.citizenName },
              { label: "Reference No.", value: refNo },
              { label: "Est. completion", value: "Same day (target)" },
              { label: "Status", value: "Processing", isStatus: true },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{row.label}</span>
                {row.isStatus ? (
                  <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                    {row.value}
                  </span>
                ) : (
                  <span className="text-sm font-semibold text-gray-800">{row.value}</span>
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
          <p className="text-xs text-gray-400">Track your application in the History tab</p>
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
            <p className="text-sm font-semibold text-gray-800">Residence Certificate</p>
            <p className="text-xs text-gray-400">Online Application</p>
          </div>
          {/* spacer to balance the back button */}
          <div className="w-9 flex-shrink-0" />
        </div>
      </div>

      {/* ── Step indicator ── */}
      <StepIndicator step={step} />

      {/* ── Form body ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-screen-sm mx-auto px-4 py-6 space-y-5 pb-28">

          <StepHeader step={step} />

          {/* Step 1 — Verify Identity (upload ID, auto-detect details) */}
          {step === 1 && (
            <>
              <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-amber-50 border border-amber-100">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  Upload clear photos of both sides of your National ID (or passport). We'll read your name and details automatically. Renters and foreigners should also bring a lease contract to the village office.
                </p>
              </div>

              <UploadBox
                label="ID Card — Front Side"
                sublabel="Photo or scan • JPG, PNG"
                file={form.frontId}
                onChange={handleFrontId}
              />
              <UploadBox
                label="ID Card — Back Side"
                sublabel="Photo or scan • JPG, PNG"
                file={form.backId}
                onChange={(f) => set("backId", f)}
              />

              {/* Detection status */}
              {detecting && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                  <ScanLine className="w-5 h-5 animate-pulse flex-shrink-0" style={{ color: "#344EAD" }} />
                  <p className="text-sm font-medium" style={{ color: "#344EAD" }}>
                    Reading your ID…
                  </p>
                </div>
              )}
              {detected && !detecting && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-green-50 border border-green-200">
                  <Sparkles className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-green-700">Details detected</p>
                    <p className="text-xs text-green-600 mt-0.5">
                      {form.citizenName} · Age {form.age} · {form.nationality}. Confirm them on the next step.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step 2 — Applicant */}
          {step === 2 && (
            <>
              {/* Ref No (Auto) */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-100">
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Ref. No.</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{refNo}</p>
                </div>
                <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                  Auto-generated
                </span>
              </div>

              <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-green-50 border border-green-100">
                <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-600" />
                <p className="text-xs text-green-700 leading-relaxed">
                  Auto-filled from your ID — please review and correct if anything is wrong.
                </p>
              </div>
              <InputField
                label="Citizen's Name"
                value={form.citizenName}
                placeholder="Full name of the applicant"
                onChange={(v) => set("citizenName", v)}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="Age"
                  value={form.age}
                  placeholder="e.g. 34"
                  inputMode="numeric"
                  maxLength={3}
                  onChange={(v) => set("age", v.replace(/\D/g, "").slice(0, 3))}
                  required
                />
                <SelectField
                  label="Nationality"
                  value={form.nationality}
                  options={NATIONALITIES}
                  placeholder="Select..."
                  onChange={(v) => set("nationality", v)}
                  required
                />
              </div>
              <InputField
                label="Occupation (optional)"
                value={form.occupation}
                placeholder="Current occupation or profession"
                onChange={(v) => set("occupation", v)}
              />
              <UploadBox
                label="Picture (3×4) — if applicable"
                sublabel="3×4 cm photo • JPG, PNG"
                file={form.picture}
                onChange={(f) => set("picture", f)}
                required={false}
                height="h-48"
              />
            </>
          )}

          {/* Step 3 — Location & Authority */}
          {step === 3 && (
            <>
              <LocationFields
                province={form.province}
                district={form.district}
                village={form.villageName}
                villageLabel="Village's Name"
                required
                onChange={(p) =>
                  setForm((f) => ({
                    ...f,
                    ...(p.province !== undefined ? { province: p.province } : {}),
                    ...(p.district !== undefined ? { district: p.district } : {}),
                    ...(p.village !== undefined ? { villageName: p.village } : {}),
                  }))
                }
              />
              <InputField
                label="Village Chief's Name (Nai Ban)"
                value={form.villageChiefName}
                placeholder="Full name of the certifying Village Chief"
                onChange={(v) => set("villageChiefName", v)}
                required
              />
              <InputField
                label="Certifying District / Province"
                value={form.certifyingJurisdiction}
                placeholder="Jurisdiction of the certifying authority"
                onChange={(v) => set("certifyingJurisdiction", v)}
                required
              />
            </>
          )}

          {/* Step 4 — Current Residence */}
          {step === 4 && (
            <>
              <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#344EAD" }} />
                <p className="text-xs leading-relaxed" style={{ color: "#344EAD" }}>
                  This is the address being attested — the village where you currently reside.
                </p>
              </div>
              <InputField
                label="Current Village"
                value={form.currentVillage}
                placeholder="e.g. Ban Phonxay"
                onChange={(v) => set("currentVillage", v)}
                required
              />
              <InputField
                label="House No."
                value={form.houseNo}
                placeholder="House number"
                onChange={(v) => set("houseNo", v)}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="Unit / Nuay Ban (if applicable)"
                  value={form.unitNuayBan}
                  placeholder="Administrative unit"
                  onChange={(v) => set("unitNuayBan", v)}
                />
                <InputField
                  label="Group / Khum (if applicable)"
                  value={form.groupKhum}
                  placeholder="Cluster group"
                  onChange={(v) => set("groupKhum", v)}
                />
              </div>
            </>
          )}

          {/* Step 5 — Household, Parentage & Purpose */}
          {step === 5 && (
            <>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Household reference (family book)
              </p>
              <InputField
                label="Household Census Book No."
                value={form.censusBookNo}
                placeholder="Family book number"
                onChange={(v) => set("censusBookNo", v)}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <DateField
                  label="Census Book Issue Date (if applicable)"
                  value={form.censusBookDate}
                  onChange={(v) => set("censusBookDate", v)}
                />
                <InputField
                  label="Census District / Province (if applicable)"
                  value={form.censusDistrictProvince}
                  placeholder="Registration jurisdiction"
                  onChange={(v) => set("censusDistrictProvince", v)}
                />
              </div>

              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-1">
                Parentage (if applicable)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="Child of Mr. (father)"
                  value={form.fatherName}
                  placeholder="Father's full name"
                  onChange={(v) => set("fatherName", v)}
                />
                <InputField
                  label="and Mrs. (mother)"
                  value={form.motherName}
                  placeholder="Mother's full name"
                  onChange={(v) => set("motherName", v)}
                />
              </div>
              <InputField
                label="Native Village / District / Province (optional)"
                value={form.nativePlace}
                placeholder="Home place of the family record"
                onChange={(v) => set("nativePlace", v)}
              />

              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-1">
                Purpose
              </p>
              <SelectField
                label="This certificate is used for"
                value={form.purpose}
                options={PURPOSES}
                placeholder="Select purpose..."
                onChange={(v) => set("purpose", v)}
                required
              />
            </>
          )}

          {/* Step 6 — Payment */}
          {step === 6 && (
            <PaymentSection
              amount={fee}
              serviceName="Residence Certificate"
              value={form.payment}
              onChange={(patch) => set("payment", { ...form.payment, ...patch })}
              reference={refNo}
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
                Processing payment…
              </>
            ) : step === lastStep ? (
              <>
                Pay {formatLak(fee)}
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
