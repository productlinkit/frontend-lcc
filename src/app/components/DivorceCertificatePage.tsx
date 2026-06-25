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
} from "lucide-react";
import { PaymentSection, blankPayment, isPaymentValid, type PaymentState } from "./PaymentSection";
import { LocationFields, DateField } from "./formFields";
import { SERVICE_CONFIG, formatLak } from "../serviceConfig";

/*
 * Divorce Certificate — follows the PRD §9. Field set is "derived" (per the PRD)
 * and should be validated against the official divorce registration form.
 * Captured once per spouse (Husband & Wife), plus the divorce basis and
 * registration details. A separate certificate is issued to each spouse.
 * M = Mandatory · C = Conditional · O = Optional · Auto = system-generated.
 *
 * Registrar e-signature (PRD §9.3) is applied in the back-office and is excluded here.
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

/* ─── Constants ─── */
const STEPS = [
  { id: 1, label: "Header", subtitle: "Jurisdiction and document details" },
  { id: 2, label: "Husband", subtitle: "Husband's particulars" },
  { id: 3, label: "Wife", subtitle: "Wife's particulars" },
  { id: 4, label: "Divorce & Registration", subtitle: "Basis, date, place and custody" },
  { id: 5, label: "Review", subtitle: "Check your application" },
  { id: 6, label: "Payment", subtitle: "Service fee" },
];

const NATIONALITIES = ["Lao", "Thai", "Vietnamese", "Chinese", "Cambodian", "American", "French", "Other"];
const DIVORCE_TYPES = ["Voluntary", "Contested"];

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
            <p className="text-sm font-semibold text-gray-600">Upload document</p>
            <p className="text-xs text-gray-400 mt-0.5">{hint ?? "PDF or image"}</p>
          </div>
        </button>
      )}
    </div>
  );
}

/* ─── Spouse section (Husband / Wife share the same structure — PRD §9.2) ─── */
function SpouseSection({
  value, onChange,
}: {
  value: SpouseInfo; onChange: (patch: Partial<SpouseInfo>) => void;
}) {
  return (
    <>
      <InputField
        label="Full Name (Lao / English)"
        value={value.fullName}
        placeholder="Spouse's full name"
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
          label="Nationality"
          value={value.nationality}
          options={NATIONALITIES}
          placeholder="Select..."
          onChange={(v) => onChange({ nationality: v })}
          required
        />
      </div>
      <InputField
        label="ID Card / Passport No."
        value={value.idOrPassport}
        placeholder="National ID (Lao) or passport (foreign)"
        onChange={(v) => onChange({ idOrPassport: v })}
        required
      />

      <SectionLabel>Current address</SectionLabel>
      <InputField
        label="House No."
        value={value.addrHouseNo}
        placeholder="House number"
        onChange={(v) => onChange({ addrHouseNo: v })}
      />
      <LocationFields
        province={value.addrProvince}
        district={value.addrDistrict}
        village={value.addrVillage}
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
        label="Existing Marriage Certificate Ref."
        value={value.marriageCertRef}
        placeholder="Reference of the marriage being dissolved"
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
interface DivorceCertificatePageProps {
  onBack: () => void;
}

export function DivorceCertificatePage({ onBack }: DivorceCertificatePageProps) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const documentNo = "DV-2026-00073";

  const [header, setHeader] = useState({ province: "", district: "", village: "" });
  const [husband, setHusband] = useState<SpouseInfo>(blankSpouse);
  const [wife, setWife] = useState<SpouseInfo>(blankSpouse);
  const [basis, setBasis] = useState({
    divorceType: "",
    dateOfDivorce: "",
    placeOfRegistration: "",
    custodyRef: "",
  });
  const [minuteOfDivorce, setMinuteOfDivorce] = useState<DocFile | null>(null);
  const [courtDecision, setCourtDecision] = useState<DocFile | null>(null);
  const [payment, setPayment] = useState<PaymentState>(blankPayment);

  const fee = SERVICE_CONFIG.divorce.fee ?? 0;

  const patchHusband = (patch: Partial<SpouseInfo>) => setHusband((p) => ({ ...p, ...patch }));
  const patchWife = (patch: Partial<SpouseInfo>) => setWife((p) => ({ ...p, ...patch }));
  const patchBasis = (patch: Partial<typeof basis>) => setBasis((p) => ({ ...p, ...patch }));

  const spouseValid = (s: SpouseInfo) =>
    Boolean(
      s.fullName.trim() && s.dob.trim() && s.nationality && s.idOrPassport.trim() &&
      s.addrVillage.trim() && s.addrProvince && s.marriageCertRef.trim()
    );

  /* ── Validation — only Mandatory fields block progression ── */
  const canProceed = () => {
    if (step === 1)
      return Boolean(header.province && header.district.trim() && header.village.trim());
    if (step === 2) return spouseValid(husband);
    if (step === 3) return spouseValid(wife);
    if (step === 4)
      return Boolean(
        basis.divorceType && basis.dateOfDivorce.trim() && basis.placeOfRegistration.trim() &&
        (basis.divorceType !== "Voluntary" || minuteOfDivorce) &&
        (basis.divorceType !== "Contested" || courtDecision)
      );
    if (step === 6) return isPaymentValid(payment);
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
              Your divorce application has been received. On registration, a certificate is issued to each spouse and marital status is updated.
            </p>
          </div>
          <div className="w-full bg-white rounded-3xl p-5 text-left space-y-3 shadow-sm border border-gray-100">
            {[
              { label: "Spouses", value: [husband.fullName, wife.fullName].filter(Boolean).join(" & ") || "—" },
              { label: "Document No.", value: documentNo },
              { label: "Type", value: basis.divorceType || "—" },
              { label: "Est. review", value: "≤ 3 working days" },
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
            <p className="text-sm font-semibold text-gray-800">Divorce Certificate</p>
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
                <HeartCrack className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#344EAD" }} />
                <p className="text-xs leading-relaxed" style={{ color: "#344EAD" }}>
                  A voluntary divorce uses a village minute; a contested divorce requires a final People's Court decision. The district registrar registers either route.
                </p>
              </div>
            </>
          )}

          {/* Step 2 — Husband */}
          {step === 2 && (
            <>
              <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <User className="w-4 h-4 flex-shrink-0" style={{ color: "#344EAD" }} />
                <p className="text-xs leading-relaxed" style={{ color: "#344EAD" }}>
                  Details of the husband.
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
                  Details of the wife.
                </p>
              </div>
              <SpouseSection value={wife} onChange={patchWife} />
            </>
          )}

          {/* Step 4 — Divorce basis & registration */}
          {step === 4 && (
            <>
              <SelectField
                label="Divorce Type"
                value={basis.divorceType}
                options={DIVORCE_TYPES}
                placeholder="Select..."
                onChange={(v) => patchBasis({ divorceType: v })}
                required
              />

              {basis.divorceType === "Voluntary" && (
                <DocUpload
                  label="Minute of divorce (Village Chief)"
                  file={minuteOfDivorce}
                  onChange={setMinuteOfDivorce}
                  required
                  hint="Village minute for a voluntary divorce"
                />
              )}
              {basis.divorceType === "Contested" && (
                <DocUpload
                  label="Court decision"
                  file={courtDecision}
                  onChange={setCourtDecision}
                  required
                  hint="Final People's Court decision"
                />
              )}

              <div className="grid grid-cols-2 gap-3">
                <DateField
                  label="Date of Divorce"
                  value={basis.dateOfDivorce}
                  onChange={(v) => patchBasis({ dateOfDivorce: v })}
                  required
                />
                <InputField
                  label="Place of Registration"
                  value={basis.placeOfRegistration}
                  placeholder="DoHA office"
                  onChange={(v) => patchBasis({ placeOfRegistration: v })}
                  required
                />
              </div>

              <InputField
                label="Children / custody reference (optional)"
                value={basis.custodyRef}
                placeholder="Custody or dependent arrangements"
                onChange={(v) => patchBasis({ custodyRef: v })}
              />

              <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-gray-100 border border-gray-200">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-500" />
                <p className="text-xs text-gray-500 leading-relaxed">
                  On registration, a separate divorce certificate is issued to each spouse; the registrar applies a protected e-signature in the back office.
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
                  Please review before submitting. The Head of DoHA approves registration; for a contested divorce the People's Court decision applies.
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
                  title: "Husband",
                  rows: [
                    ["Name", husband.fullName || "—"],
                    ["ID / Passport", husband.idOrPassport || "—"],
                    ["Marriage Ref.", husband.marriageCertRef || "—"],
                  ],
                },
                {
                  title: "Wife",
                  rows: [
                    ["Name", wife.fullName || "—"],
                    ["ID / Passport", wife.idOrPassport || "—"],
                    ["Marriage Ref.", wife.marriageCertRef || "—"],
                  ],
                },
                {
                  title: "Divorce & Registration",
                  rows: [
                    ["Type", basis.divorceType || "—"],
                    ["Date of divorce", basis.dateOfDivorce || "—"],
                    ["Place", basis.placeOfRegistration || "—"],
                    ["Custody", basis.custodyRef || "—"],
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
              serviceName="Divorce Certificate"
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
                Submitting…
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
