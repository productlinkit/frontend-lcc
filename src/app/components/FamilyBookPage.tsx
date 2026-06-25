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
import { useT, useLang } from "../i18n";
import { formatLak } from "../serviceConfig";

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
/* Step ids are stable; labels/subtitles are translated at render time. */
const STEPS = [
  { id: 1, labelKey: "step1Label", subKey: "step1Subtitle" },
  { id: 2, labelKey: "step2Label", subKey: "step2Subtitle" },
  { id: 3, labelKey: "step3Label", subKey: "step3Subtitle" },
] as const;

/* `value` is the stable identifier used in logic; `key` maps to the translated label. */
const GENDERS = [
  { value: "Female", key: "genderFemale" },
  { value: "Male", key: "genderMale" },
] as const;
const NATIONALITIES = [
  { value: "Lao", key: "natLao" },
  { value: "Thai", key: "natThai" },
  { value: "Vietnamese", key: "natVietnamese" },
  { value: "Chinese", key: "natChinese" },
  { value: "Cambodian", key: "natCambodian" },
  { value: "Other", key: "natOther" },
] as const;
const ETHNICITIES = [
  { value: "Lao", key: "ethLao" },
  { value: "Khmu", key: "ethKhmu" },
  { value: "Hmong", key: "ethHmong" },
  { value: "Phouthai", key: "ethPhouthai" },
  { value: "Tai", key: "ethTai" },
  { value: "Other", key: "ethOther" },
] as const;
const RELATIONSHIPS = [
  { value: "Household Head", key: "relHead" },
  { value: "Spouse", key: "relSpouse" },
  { value: "Child", key: "relChild" },
  { value: "Parent", key: "relParent" },
  { value: "Sibling", key: "relSibling" },
  { value: "Grandparent", key: "relGrandparent" },
  { value: "Grandchild", key: "relGrandchild" },
  { value: "Other", key: "relOther" },
] as const;

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
  label: React.ReactNode; value: string;
  options: { value: string; label: string }[];
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
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
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
  const t = useT("familyBook");
  const meta = STEPS.find((s) => s.id === step)!;
  return (
    <div className="mb-3 pb-1">
      <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#344EAD" }}>
        {t("stepOf", { n: step, m: STEPS.length })}
      </p>
      <h2 className="text-gray-900 mt-0.5">{t(meta.labelKey)}</h2>
      <p className="text-gray-400 text-xs mt-0.5">{t(meta.subKey)}</p>
    </div>
  );
}

/* ─── Main Page ─── */
interface FamilyBookPageProps {
  onBack: () => void;
}

export function FamilyBookPage({ onBack }: FamilyBookPageProps) {
  const t = useT("familyBook");
  const { lang } = useLang();
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

  // Translate a stable option value to its display label (for read-only review rows).
  const labelOf = (
    list: readonly { value: string; key: string }[],
    value: string,
  ) => {
    const found = list.find((o) => o.value === value);
    return found ? t(found.key as Parameters<typeof t>[0]) : value;
  };

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
            <h2 className="text-gray-900 mb-2">{t("successTitle")}</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              {t("successBody")}
            </p>
          </div>
          <div className="w-full bg-white rounded-3xl p-5 text-left space-y-3 shadow-sm border border-gray-100">
            {[
              { label: t("successHead"), value: head.holderFullName || head.holderName || "—" },
              { label: t("familyBookNo"), value: familyBookNo },
              { label: t("successMembers"), value: t("peopleSummary", { total, men, women }) },
              { label: t("statusLabel"), value: t("statusSubmitted"), isStatus: true },
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

          {/* Step 1 — Household & Head */}
          {step === 1 && (
            <>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-100">
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{t("familyBookNo")}</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{familyBookNo}</p>
                </div>
                <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                  {t("autoGenerated")}
                </span>
              </div>

              <InputField
                label={t("holderNameLabel")}
                value={head.holderName}
                placeholder={t("holderNamePlaceholder")}
                onChange={(v) => patchHead({ holderName: v })}
                required
              />

              <SectionLabel>{t("householdHead")}</SectionLabel>
              <InputField
                label={t("nameAndSurname")}
                value={head.holderFullName}
                placeholder={t("holderFullNamePlaceholder")}
                onChange={(v) => patchHead({ holderFullName: v })}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label={t("idCardNo")}
                  value={head.idCardNo}
                  placeholder={t("idCardNoPlaceholder")}
                  onChange={(v) => patchHead({ idCardNo: v })}
                  required
                />
                <InputField
                  label={t("placeOfBirth")}
                  value={head.placeOfBirth}
                  placeholder={t("placeOfBirthPlaceholder")}
                  onChange={(v) => patchHead({ placeOfBirth: v })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label={t("unit")}
                  value={head.unit}
                  placeholder={t("unitPlaceholder")}
                  onChange={(v) => patchHead({ unit: v })}
                  required
                />
                <InputField
                  label={t("group")}
                  value={head.group}
                  placeholder={t("groupPlaceholder")}
                  onChange={(v) => patchHead({ group: v })}
                  required
                />
              </div>

              <SectionLabel>{t("address")}</SectionLabel>
              <LocationFields
                province={head.province}
                district={head.district}
                village={head.village}
                required
                onChange={(p) => patchHead(p)}
              />

              <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <p className="text-xs font-medium" style={{ color: "#344EAD" }}>
                  {t("dateOfIssue")}
                </p>
                <span className="text-[10px] font-medium px-2 py-1 rounded-full" style={{ backgroundColor: "white", color: "#344EAD" }}>
                  {t("setOnIssuance")}
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
                    {total} {total === 1 ? t("person") : t("people")}
                  </p>
                </div>
                <p className="text-xs text-gray-400">{t("menCount", { n: men })} · {t("womenCount", { n: women })}</p>
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
                          {t("memberN", { n: i + 1 })}
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
                      label={t("nameAndSurname")}
                      value={m.name}
                      placeholder={t("memberFullNamePlaceholder")}
                      onChange={(v) => patchMember(i, { name: v })}
                      required
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <SelectField
                        label={t("gender")}
                        value={m.gender}
                        options={GENDERS.map((o) => ({ value: o.value, label: t(o.key) }))}
                        placeholder={t("selectPlaceholder")}
                        onChange={(v) => patchMember(i, { gender: v })}
                        required
                      />
                      <DateField
                        label={t("dateOfBirth")}
                        value={m.dob}
                        onChange={(v) => patchMember(i, { dob: v })}
                        required
                      />
                    </div>
                    <SelectField
                      label={t("relationshipToHead")}
                      value={m.relationship}
                      options={RELATIONSHIPS.map((o) => ({ value: o.value, label: t(o.key) }))}
                      placeholder={t("selectPlaceholder")}
                      onChange={(v) => patchMember(i, { relationship: v })}
                      required
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <SelectField
                        label={t("nationality")}
                        value={m.nationality}
                        options={NATIONALITIES.map((o) => ({ value: o.value, label: t(o.key) }))}
                        placeholder={t("selectPlaceholder")}
                        onChange={(v) => patchMember(i, { nationality: v })}
                        required
                      />
                      <SelectField
                        label={t("ethnicityOptional")}
                        value={m.ethnicity}
                        options={ETHNICITIES.map((o) => ({ value: o.value, label: t(o.key) }))}
                        placeholder={t("selectPlaceholder")}
                        onChange={(v) => patchMember(i, { ethnicity: v })}
                      />
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-gray-400 pt-0.5">
                      <Hash className="w-3 h-3 flex-shrink-0" />
                      {t("uinNote")}
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
                {t("addMember")}
              </button>
            </>
          )}

          {/* Step 3 — Review */}
          {step === 3 && (
            <>
              <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-amber-50 border border-amber-100">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  {t("reviewNotice")}
                </p>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-2.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("household")}</p>
                {[
                  [t("familyBookNo"), familyBookNo],
                  [t("holder"), head.holderFullName || head.holderName || "—"],
                  [t("idCardNo"), head.idCardNo || "—"],
                  [t("unitGroup"), `${head.unit || "—"} / ${head.group || "—"}`],
                  [t("address"), [head.village, head.district, head.province].filter(Boolean).join(", ") || "—"],
                  [t("peopleLabel"), t("peopleSummary", { total, men, women })],
                  [t("fee"), formatLak(0, lang)],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-3">
                    <span className="text-sm text-gray-500 flex-shrink-0">{label}</span>
                    <span className="text-sm font-medium text-gray-800 text-right">{value}</span>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t("members")}</p>
                <div className="space-y-2">
                  {members.map((m, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 py-1.5 border-b border-gray-50 last:border-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{m.name || t("memberN", { n: i + 1 })}</p>
                        <p className="text-xs text-gray-400">{[
                          m.relationship && labelOf(RELATIONSHIPS, m.relationship),
                          m.gender && labelOf(GENDERS, m.gender),
                          m.dob,
                        ].filter(Boolean).join(" · ") || "—"}</p>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">{m.nationality ? labelOf(NATIONALITIES, m.nationality) : "—"}</span>
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
                {t("submitting")}
              </>
            ) : step === lastStep ? (
              <>
                {t("submitRecord")}
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
