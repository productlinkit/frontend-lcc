import { useState } from "react";
import {
  ChevronLeft,
  ArrowRight,
  Check,
  Loader2,
  AlertCircle,
  Users2,
  Crown,
  Plus,
  Trash2,
  Hash,
} from "lucide-react";
import { LocationFields, DateField } from "./formFields";

/*
 * Family Book (Household Registration) — follows the PRD §10.
 * Fields: Cover & Household Head (§10.2) and Household Members table (§10.3).
 * The Family Book is normally auto-maintained by DoPS from the other services;
 * this form captures / updates the household record.
 * M = Mandatory · C = Conditional · O = Optional · Auto = system-generated.
 */

/* ─── Types ─── */
interface Member {
  name: string; // M — Name and Surname
  gender: string; // M
  dob: string; // M
  relationship: string; // M — relationship to household head
  ethnicity: string; // O
  nationality: string; // M
}

/* ─── Constants ─── */
const STEPS = [
  { id: 1, label: "Household", subtitle: "Cover and household head" },
  { id: 2, label: "Members", subtitle: "People registered in the household" },
  { id: 3, label: "Review", subtitle: "Check and submit the record" },
];

const GENDERS = ["Female", "Male"];
const NATIONALITIES = ["Lao", "Thai", "Vietnamese", "Chinese", "Cambodian", "Other"];
const ETHNICITIES = ["Lao", "Khmu", "Hmong", "Phouthai", "Tai", "Other"];
const RELATIONSHIPS = [
  "Household Head", "Spouse", "Child", "Parent",
  "Sibling", "Grandparent", "Grandchild", "Other",
];

const blankMember: Member = {
  name: "", gender: "", dob: "", relationship: "", ethnicity: "", nationality: "Lao",
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
  inputMode?: "text" | "numeric";
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
interface FamilyBookPageProps {
  onBack: () => void;
}

export function FamilyBookPage({ onBack }: FamilyBookPageProps) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Auto values (PRD §10.2)
  const familyBookNo = "VTE-CHA-0098-2412";

  const [head, setHead] = useState({
    holderName: "", // Holder's Name (Book Cover)
    holderFullName: "", // Holder's Name and Surname
    idCardNo: "",
    placeOfBirth: "",
    unit: "",
    group: "",
    village: "",
    district: "",
    province: "",
  });
  const [members, setMembers] = useState<Member[]>([blankMember]);

  const patchHead = (patch: Partial<typeof head>) => setHead((p) => ({ ...p, ...patch }));

  const patchMember = (index: number, patch: Partial<Member>) =>
    setMembers((list) => list.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  const addMember = () => setMembers((list) => [...list, blankMember]);
  const removeMember = (index: number) =>
    setMembers((list) => (list.length > 1 ? list.filter((_, i) => i !== index) : list));

  // Counts (PRD §10.2 — derived from the members table)
  const total = members.length;
  const men = members.filter((m) => m.gender === "Male").length;
  const women = members.filter((m) => m.gender === "Female").length;

  const memberValid = (m: Member) =>
    Boolean(m.name.trim() && m.gender && m.dob.trim() && m.relationship && m.nationality);

  /* ── Validation — only Mandatory fields block progression ── */
  const canProceed = () => {
    if (step === 1)
      return Boolean(
        head.holderName.trim() && head.holderFullName.trim() && head.idCardNo.trim() &&
        head.placeOfBirth.trim() && head.unit.trim() && head.group.trim() &&
        head.village.trim() && head.district.trim() && head.province
      );
    if (step === 2) return members.length > 0 && members.every(memberValid);
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
            <h2 className="text-gray-900 mb-2">Household Record Submitted!</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              The family book record has been received. A UIN is assigned to each member and the record is maintained by DoPS.
            </p>
          </div>
          <div className="w-full bg-white rounded-3xl p-5 text-left space-y-3 shadow-sm border border-gray-100">
            {[
              { label: "Household head", value: head.holderFullName || head.holderName || "—" },
              { label: "Family Book No.", value: familyBookNo },
              { label: "Members", value: `${total} (${men}M / ${women}F)` },
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
          <p className="text-xs text-gray-400">Track your record in the History tab</p>
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
            <p className="text-sm font-semibold text-gray-800">Family Book</p>
            <p className="text-xs text-gray-400">Household Registration</p>
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

          {/* Step 1 — Household & Head */}
          {step === 1 && (
            <>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-100">
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Family Book No.</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{familyBookNo}</p>
                </div>
                <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                  Auto-generated
                </span>
              </div>

              <InputField
                label="Holder's Name (Book Cover)"
                value={head.holderName}
                placeholder="Name shown on the book cover"
                onChange={(v) => patchHead({ holderName: v })}
                required
              />

              <SectionLabel>Household head</SectionLabel>
              <InputField
                label="Name and Surname"
                value={head.holderFullName}
                placeholder="Full name of the household head"
                onChange={(v) => patchHead({ holderFullName: v })}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="ID Card No."
                  value={head.idCardNo}
                  placeholder="National ID number"
                  onChange={(v) => patchHead({ idCardNo: v })}
                  required
                />
                <InputField
                  label="Place of Birth"
                  value={head.placeOfBirth}
                  placeholder="Town / village"
                  onChange={(v) => patchHead({ placeOfBirth: v })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="Unit"
                  value={head.unit}
                  placeholder="Unit no."
                  onChange={(v) => patchHead({ unit: v })}
                  required
                />
                <InputField
                  label="Group"
                  value={head.group}
                  placeholder="Group no."
                  onChange={(v) => patchHead({ group: v })}
                  required
                />
              </div>

              <SectionLabel>Address</SectionLabel>
              <LocationFields
                province={head.province}
                district={head.district}
                village={head.village}
                required
                onChange={(p) => patchHead(p)}
              />

              <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <p className="text-xs font-medium" style={{ color: "#344EAD" }}>
                  Date of Issue
                </p>
                <span className="text-[10px] font-medium px-2 py-1 rounded-full" style={{ backgroundColor: "white", color: "#344EAD" }}>
                  Set on issuance
                </span>
              </div>
            </>
          )}

          {/* Step 2 — Members */}
          {step === 2 && (
            <>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-100">
                <div className="flex items-center gap-2">
                  <Users2 className="w-4 h-4" style={{ color: "#344EAD" }} />
                  <p className="text-sm font-medium text-gray-700">
                    {total} {total === 1 ? "person" : "people"}
                  </p>
                </div>
                <p className="text-xs text-gray-400">{men} men · {women} women</p>
              </div>

              {members.map((m, i) => {
                const isHead = m.relationship === "Household Head";
                return (
                  <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isHead ? (
                          <Crown className="w-4 h-4" style={{ color: "#344EAD" }} />
                        ) : (
                          <span className="text-xs font-semibold text-gray-400">#{i + 1}</span>
                        )}
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Member {i + 1}
                        </p>
                      </div>
                      {members.length > 1 && (
                        <button
                          onClick={() => removeMember(i)}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <InputField
                      label="Name and Surname"
                      value={m.name}
                      placeholder="Full name"
                      onChange={(v) => patchMember(i, { name: v })}
                      required
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <SelectField
                        label="Gender"
                        value={m.gender}
                        options={GENDERS}
                        placeholder="Select..."
                        onChange={(v) => patchMember(i, { gender: v })}
                        required
                      />
                      <DateField
                        label="Date of Birth"
                        value={m.dob}
                        onChange={(v) => patchMember(i, { dob: v })}
                        required
                      />
                    </div>
                    <SelectField
                      label="Relationship to Head"
                      value={m.relationship}
                      options={RELATIONSHIPS}
                      placeholder="Select..."
                      onChange={(v) => patchMember(i, { relationship: v })}
                      required
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <SelectField
                        label="Nationality"
                        value={m.nationality}
                        options={NATIONALITIES}
                        placeholder="Select..."
                        onChange={(v) => patchMember(i, { nationality: v })}
                        required
                      />
                      <SelectField
                        label="Ethnicity (optional)"
                        value={m.ethnicity}
                        options={ETHNICITIES}
                        placeholder="Select..."
                        onChange={(v) => patchMember(i, { ethnicity: v })}
                      />
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-gray-400 pt-0.5">
                      <Hash className="w-3 h-3 flex-shrink-0" />
                      UIN — assigned automatically on registration
                    </div>
                  </div>
                );
              })}

              <button
                onClick={addMember}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-gray-200 text-sm font-semibold transition-all hover:border-[#344EAD]/40 hover:bg-blue-50/50"
                style={{ color: "#344EAD" }}
              >
                <Plus className="w-4 h-4" />
                Add member
              </button>
            </>
          )}

          {/* Step 3 — Review */}
          {step === 3 && (
            <>
              <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-amber-50 border border-amber-100">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  Please review the household record before submitting. The record is maintained by DoPS and updated automatically as life events are registered.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-2.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Household</p>
                {[
                  ["Family Book No.", familyBookNo],
                  ["Holder", head.holderFullName || head.holderName || "—"],
                  ["ID Card No.", head.idCardNo || "—"],
                  ["Unit / Group", `${head.unit || "—"} / ${head.group || "—"}`],
                  ["Address", [head.village, head.district, head.province].filter(Boolean).join(", ") || "—"],
                  ["People", `${total} (${men}M / ${women}F)`],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-3">
                    <span className="text-sm text-gray-500 flex-shrink-0">{label}</span>
                    <span className="text-sm font-medium text-gray-800 text-right">{value}</span>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Members</p>
                <div className="space-y-2">
                  {members.map((m, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 py-1.5 border-b border-gray-50 last:border-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{m.name || `Member ${i + 1}`}</p>
                        <p className="text-xs text-gray-400">{[m.relationship, m.gender, m.dob].filter(Boolean).join(" · ") || "—"}</p>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">{m.nationality || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
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
                Submit Record
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
