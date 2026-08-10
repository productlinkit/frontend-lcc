import { useEffect, useState, useRef } from "react";
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
  ClipboardList,
  FilePlus2,
  Link2,
  Search,
  RotateCcw,
} from "lucide-react";
import { PaymentSection, blankPayment, isPaymentValid, type PaymentState } from "./PaymentSection";
import { SearchableSelect, DateField, type Option } from "./formFields";
import {
  ValidationProvider,
  useShowErrors,
  FieldError,
  fieldErrorRing,
  isEmpty,
  scrollToFirstError,
} from "./formValidation";
import { formatLak } from "../serviceConfig";
import { useT, useLang } from "../i18n";
import { ApiError } from "../api/client";
import { applications, catalog, locations } from "../api/endpoints";
import { useQuery, useMutation, useDebounced } from "../api/hooks";
import { useSession } from "../api/session";
import {
  text,
  type Bilingual,
  type District,
  type FeeQuote,
  type PrerequisiteRecord,
  type ReferenceItem,
  type Village,
} from "../api/types";

/*
 * Marriage Certificate — follows PRD §8. The menu groups two sub-processes:
 *   1) Betrothal Record (ບົດບັນທຶກພາບສູ່ຂໍ) — captured at the village, and
 *   2) Marriage Registration — application + supporting forms at the district.
 * Per FR-11 a case STARTS by selecting an existing betrothal record by its
 * number (links & pre-fills the couple), or by creating one first. Officer-only
 * artefacts (couple/witness/registrar e-signatures) are excluded (back-office).
 * M = Mandatory · C = Conditional · O = Optional · Auto = system-generated.
 *
 * Wiring: the betrothal picker reads /prerequisite-records, the fee comes from
 * POST /services/marriage/quote (it is conditional on a foreign spouse and on
 * whether a betrothal record is created), and the case itself is
 * create → attachments → submit → pay against /applications.
 */

/* ─── Types ─── */
interface DocFile {
  name: string;
  file: File;
}

interface LocationValue {
  provinceId: string;
  districtId: string;
  villageId: string;
  provinceName: string;
  districtName: string;
  villageName: string;
}

const blankLocation: LocationValue = {
  provinceId: "", districtId: "", villageId: "",
  provinceName: "", districtName: "", villageName: "",
};

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
  address: LocationValue; // M — village is the registry key
  residenceCertRef: string; // M
  singleStatusCert: DocFile | null; // M — Certificate of Marital Status
  priorMaritalProof: DocFile | null; // C — divorce/widowhood proof
  foreignDocs: DocFile | null; // C — foreign-spouse documents
}

/* Fields the schema marks mandatory but the registrar captures in the office —
 * the citizen portal records the intent so the case can leave draft. */
const OFFICE_DEFERRED = "captured-at-office";

/* Short bilingual sentences for the data states. The i18n namespaces are owned
 * elsewhere, so these live here rather than as new dictionary keys. */
const COPY = {
  retry: { en: "Try again", lo: "ລອງໃໝ່" },
  searchRecord: { en: "Search by record number or name…", lo: "ຄົ້ນຫາດ້ວຍເລກບົດບັນທຶກ ຫຼື ຊື່..." },
  recordsLoading: { en: "Looking for your betrothal records…", lo: "ກຳລັງຊອກຫາບົດບັນທຶກການໝັ້ນໝາຍ..." },
  recordsError: { en: "We could not load the betrothal records.", lo: "ບໍ່ສາມາດໂຫຼດບົດບັນທຶກການໝັ້ນໝາຍໄດ້." },
  recordsEmpty: {
    en: "No betrothal record is linked to you yet. Create one first, or ask your village office to record it.",
    lo: "ຍັງບໍ່ມີບົດບັນທຶກການໝັ້ນໝາຍຜູກກັບທ່ານ. ກະລຸນາສ້າງໃໝ່ ຫຼື ຕິດຕໍ່ຫ້ອງການບ້ານ.",
  },
  recordOpenError: { en: "We could not open that record.", lo: "ບໍ່ສາມາດເປີດບົດບັນທຶກນັ້ນໄດ້." },
  quoteError: { en: "The fee could not be calculated.", lo: "ບໍ່ສາມາດຄິດໄລ່ຄ່າທຳນຽມໄດ້." },
  fixTitle: { en: "Please fix the following before submitting", lo: "ກະລຸນາແກ້ໄຂລາຍການລຸ່ມນີ້ກ່ອນສົ່ງ" },
} as const;

type Copy = keyof typeof COPY;

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

/* The schema leaves gender free-form; every other list is master data. */
const GENDERS: SelectOption[] = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
];

/* The gateway offers no card rail; a card payment settles as a bank transfer. */
const METHOD_CODE: Record<PaymentState["method"], string> = {
  qr: "laoqr",
  bank: "bank-transfer",
  cc: "bank-transfer",
};

/* ─── Blank record ─── */
const blankSpouse: SpouseInfo = {
  fullName: "", dob: "", gender: "", nationality: "",
  ethnicity: "", ethnicGroup: "", religion: "", occupation: "",
  idOrPassport: "", addrHouseNo: "", address: blankLocation,
  residenceCertRef: "", singleStatusCert: null, priorMaritalProof: null, foreignDocs: null,
};

/* ─── Reference data ─── */
interface SelectOption {
  value: string;
  label: string;
}

/** The reference-list endpoint answers with `{ type, count, items }`. */
function refItems(data: unknown): ReferenceItem[] {
  if (Array.isArray(data)) return data as ReferenceItem[];
  return (data as { items?: ReferenceItem[] } | undefined)?.items ?? [];
}

interface RefList {
  options: SelectOption[];
  loading: boolean;
}

/* The quote endpoint answers with `total_lak` + `lines`; older builds sent
 * `fee_lak` + `breakdown`. Read whichever arrived. */
type QuoteResult = Partial<FeeQuote> & {
  total_lak?: number;
  lines?: Array<{ code?: string; label: Bilingual; amount_lak: number }>;
};

function useRefList(type: string): RefList {
  const { lang } = useLang();
  const { data, loading } = useQuery((signal) => catalog.referenceList(type, signal), [type]);
  return {
    options: refItems(data).map((item) => ({ value: item.code, label: text(item.label, lang) })),
    loading,
  };
}

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
  label, value, placeholder, onChange, required, inputMode, serverError,
}: {
  label: React.ReactNode; value: string; placeholder: string;
  onChange: (v: string) => void; required?: boolean;
  inputMode?: "text" | "numeric" | "tel" | "email";
  serverError?: string;
}) {
  const showErrors = useShowErrors();
  const hasError = Boolean(serverError) || (showErrors && Boolean(required) && isEmpty(value));
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
      <FieldError show={hasError} message={serverError} />
    </div>
  );
}

function SelectField({
  label, value, options, placeholder, onChange, required, serverError,
}: {
  label: React.ReactNode; value: string; options: SelectOption[];
  placeholder: string; onChange: (v: string) => void; required?: boolean;
  serverError?: string;
}) {
  const showErrors = useShowErrors();
  const hasError = Boolean(serverError) || (showErrors && Boolean(required) && isEmpty(value));
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
      <FieldError show={hasError} message={serverError} />
    </div>
  );
}

/** The shared DateField carries its own client error; this adds the server's. */
function DatedField({
  label, value, onChange, required, serverError,
}: {
  label: React.ReactNode; value: string; onChange: (v: string) => void;
  required?: boolean; serverError?: string;
}) {
  return (
    <div>
      <DateField label={label} value={value} onChange={onChange} required={required} />
      <FieldError show={Boolean(serverError)} message={serverError} />
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

/* ─── Cascading Province → District → Village, from /locations ─── */
function ApiLocationFields({
  value, onChange, villageLabel, required, serverError,
}: {
  value: LocationValue;
  onChange: (next: LocationValue) => void;
  villageLabel?: string;
  required?: boolean;
  serverError?: string;
}) {
  const tf = useT("fields");
  const { lang } = useLang();

  const provinces = useQuery((signal) => locations.provinces(signal), []);
  const districts = useQuery<District[]>(
    (signal) => (value.provinceId ? locations.districts(value.provinceId, signal) : Promise.resolve([])),
    [value.provinceId],
  );
  const villages = useQuery<Village[]>(
    (signal) =>
      value.districtId
        ? locations.villages(value.districtId, signal).then((page) => page.data)
        : Promise.resolve([]),
    [value.districtId],
  );

  const toOptions = (rows: { id: string; name: Bilingual }[] | undefined): Option[] =>
    (rows ?? []).map((row) => ({ value: row.id, label: text(row.name, lang), sub: row.name.lo }));

  const nameOf = (rows: { id: string; name: Bilingual }[] | undefined, id: string) => {
    const found = (rows ?? []).find((row) => row.id === id);
    return found ? text(found.name, lang) : "";
  };

  return (
    <>
      <SearchableSelect
        label={tf("province")}
        value={value.provinceId}
        options={toOptions(provinces.data)}
        placeholder={tf("selectProvince")}
        required={required}
        loading={provinces.loading}
        onChange={(id) =>
          onChange({
            ...blankLocation,
            provinceId: id,
            provinceName: nameOf(provinces.data, id),
          })
        }
      />
      <div className="grid grid-cols-2 gap-3">
        <SearchableSelect
          label={tf("district")}
          value={value.districtId}
          options={toOptions(districts.data)}
          placeholder={value.provinceId ? tf("selectDistrict") : tf("selectProvinceFirst")}
          required={required}
          disabled={!value.provinceId}
          loading={districts.loading}
          onChange={(id) =>
            onChange({
              ...value,
              districtId: id,
              districtName: nameOf(districts.data, id),
              villageId: "",
              villageName: "",
            })
          }
        />
        <SearchableSelect
          label={villageLabel ?? tf("village")}
          value={value.villageId}
          options={toOptions(villages.data)}
          placeholder={value.districtId ? tf("selectVillage") : tf("selectDistrictFirst")}
          required={required}
          disabled={!value.districtId}
          loading={villages.loading}
          onChange={(id) =>
            onChange({ ...value, villageId: id, villageName: nameOf(villages.data, id) })
          }
        />
      </div>
      <FieldError show={Boolean(serverError)} message={serverError} />
    </>
  );
}

/* ─── Document upload (PDF or image) ─── */
function DocUpload({
  label, file, onChange, required, hint, serverError,
}: {
  label: React.ReactNode; file: DocFile | null;
  onChange: (f: DocFile | null) => void; required?: boolean; hint?: string;
  serverError?: string;
}) {
  const t = useT("marriage");
  const inputRef = useRef<HTMLInputElement>(null);
  const showErrors = useShowErrors();
  const hasError = Boolean(serverError) || (showErrors && Boolean(required) && !file);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    onChange({ name: picked.name, file: picked });
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
            <p className="text-xs text-gray-400 mt-0.5">{hint ?? t("pdfOrImage")}</p>
          </div>
        </button>
      )}
      <FieldError show={hasError} message={serverError} />
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

/* ─── Spouse section (Spouse A / B share the same structure — PRD §8.4) ─── */
interface SpouseRefs {
  nationalities: RefList;
  ethnicities: RefList;
  ethnicGroups: RefList;
  religions: RefList;
}

function SpouseSection({
  value, onChange, prevMarried, onTogglePrevMarried, refs, serverErrors,
}: {
  value: SpouseInfo; onChange: (patch: Partial<SpouseInfo>) => void;
  prevMarried: boolean; onTogglePrevMarried: () => void;
  refs: SpouseRefs;
  serverErrors: Record<string, string>;
}) {
  const t = useT("marriage");
  const isForeign = Boolean(value.nationality) && value.nationality !== "lao";
  return (
    <>
      <InputField
        label={t("fullName")}
        value={value.fullName}
        placeholder={t("fullNamePh")}
        onChange={(v) => onChange({ fullName: v })}
        required
        serverError={serverErrors["spouses.name"]}
      />
      <div className="grid grid-cols-2 gap-3">
        <DatedField
          label={t("dob")}
          value={value.dob}
          onChange={(v) => onChange({ dob: v })}
          required
          serverError={serverErrors["spouses.dob"]}
        />
        <SelectField
          label={t("gender")}
          value={value.gender}
          options={GENDERS}
          placeholder={t("selectPh")}
          onChange={(v) => onChange({ gender: v })}
          required
          serverError={serverErrors["spouses.gender"]}
        />
      </div>
      <SelectField
        label={t("nationality")}
        value={value.nationality}
        options={refs.nationalities.options}
        placeholder={t("selectPh")}
        onChange={(v) => onChange({ nationality: v })}
        required
        serverError={serverErrors["spouses.nationality"]}
      />
      <InputField
        label={t("idOrPassport")}
        value={value.idOrPassport}
        placeholder={t("idOrPassportPh")}
        onChange={(v) => onChange({ idOrPassport: v })}
        required
        serverError={serverErrors["spouses.id_number"]}
      />

      <SectionLabel>{t("currentAddress")}</SectionLabel>
      <InputField
        label={t("houseNo")}
        value={value.addrHouseNo}
        placeholder={t("houseNoPh")}
        onChange={(v) => onChange({ addrHouseNo: v })}
      />
      <ApiLocationFields
        value={value.address}
        villageLabel={t("village")}
        required
        onChange={(address) => onChange({ address })}
        serverError={serverErrors["spouses.current_address"]}
      />
      <InputField
        label={t("residenceCertRef")}
        value={value.residenceCertRef}
        placeholder={t("residenceCertRefPh")}
        onChange={(v) => onChange({ residenceCertRef: v })}
        required
        serverError={serverErrors["spouses.residence_certificate_ref"]}
      />

      <SectionLabel>{t("documents")}</SectionLabel>
      <DocUpload
        label={t("singleStatusCert")}
        file={value.singleStatusCert}
        onChange={(f) => onChange({ singleStatusCert: f })}
        required
        serverError={serverErrors["spouses.single_status_certificate"]}
      />

      {/* Previously married → prior marital-status proof (PRD §8.2, Conditional) */}
      <ToggleRow
        active={prevMarried}
        onToggle={onTogglePrevMarried}
        title={t("prevMarried")}
        hint={t("prevMarriedHint")}
      />
      {prevMarried && (
        <DocUpload
          label={t("priorMaritalProof")}
          file={value.priorMaritalProof}
          onChange={(f) => onChange({ priorMaritalProof: f })}
          required
          serverError={serverErrors["spouses.prior_marital_proof"]}
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
            serverError={serverErrors["spouses.foreign_documents"]}
          />
        </>
      )}

      <SectionLabel>{t("additionalDetails")}</SectionLabel>
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label={t("ethnicity")}
          value={value.ethnicity}
          options={refs.ethnicities.options}
          placeholder={t("selectPh")}
          onChange={(v) => onChange({ ethnicity: v })}
        />
        <SelectField
          label={t("religion")}
          value={value.religion}
          options={refs.religions.options}
          placeholder={t("selectPh")}
          onChange={(v) => onChange({ religion: v })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label={t("ethnicGroup")}
          value={value.ethnicGroup}
          options={refs.ethnicGroups.options}
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

/* ─── Helpers ─── */
const today = () => new Date().toISOString().slice(0, 10);

/** Read a string out of a prerequisite record's free-form payload. */
function payloadString(payload: Record<string, unknown> | undefined, ...keys: string[]): string {
  if (!payload) return "";
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
  }
  return "";
}

/* The API validates a repeated section on the section itself, so the mandatory
 * keys are mirrored at that level; the per-instance detail sits beneath. */
const both = (a: string, b: string) => (a.trim() && b.trim() ? a.trim() : "");

/* ─── Main Page ─── */
interface MarriageCertificatePageProps {
  onBack: () => void;
}

export function MarriageCertificatePage({ onBack }: MarriageCertificatePageProps) {
  const t = useT("marriage");
  const { lang } = useLang();
  const { profile } = useSession();
  const [step, setStep] = useState(1);
  const [showErrors, setShowErrors] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const say = (key: Copy) => COPY[key][lang] ?? COPY[key].en;

  /* The case, once the draft exists — kept so a retry never duplicates it. */
  const [caseId, setCaseId] = useState("");
  const [caseRef, setCaseRef] = useState("");
  const [attachmentsSent, setAttachmentsSent] = useState(false);

  // Step 1 — Betrothal record (FR-11): choose to link an existing record or create one.
  const [betrothalMode, setBetrothalMode] = useState<"" | "existing" | "new">("");
  const [recordSearch, setRecordSearch] = useState("");
  const [linkedRecord, setLinkedRecord] = useState<PrerequisiteRecord | null>(null);
  const [betrothal, setBetrothal] = useState({
    householdHead: "", bridePriceCash: "", bridePriceGold: "", housing: "",
    w1Name: "", w2Name: "",
  });

  const [header, setHeader] = useState<LocationValue>(blankLocation);
  const [spouseA, setSpouseA] = useState<SpouseInfo>(blankSpouse);
  const [spouseB, setSpouseB] = useState<SpouseInfo>(blankSpouse);
  const [prevMarriedA, setPrevMarriedA] = useState(false);
  const [prevMarriedB, setPrevMarriedB] = useState(false);

  // Step 4 — supporting documents (PRD §8.2 checklist)
  const [householdBook, setHouseholdBook] = useState<DocFile | null>(null);
  const [photos, setPhotos] = useState<DocFile | null>(null);
  const [hasChildren, setHasChildren] = useState(false);
  const [birthRecord, setBirthRecord] = useState<DocFile | null>(null);

  const [reg, setReg] = useState({
    dateOfMarriage: "", placeOfRegistration: "",
    w1Name: "", w1Id: "", w2Name: "", w2Id: "", w3Name: "", w3Id: "",
  });
  const [payment, setPayment] = useState<PaymentState>(blankPayment);

  /* ── Master data ── */
  const refs: SpouseRefs = {
    nationalities: useRefList("nationality"),
    ethnicities: useRefList("ethnicity"),
    ethnicGroups: useRefList("ethnic-group"),
    religions: useRefList("religion"),
  };

  /* ── The betrothal-record picker (FR-11) ── */
  const search = useDebounced(recordSearch, 300);
  const records = useQuery(
    (signal) => catalog.prerequisiteRecords({ kind: "betrothal", search, per_page: 20 }, signal),
    [search],
    { enabled: betrothalMode === "existing" && !linkedRecord },
  );
  const openRecord = useMutation((recordNo: string) => catalog.prerequisiteRecord(recordNo));

  /* ── Conditional fee (PRD §8.3): recomputed whenever either input changes ── */
  const anyForeign =
    (Boolean(spouseA.nationality) && spouseA.nationality !== "lao") ||
    (Boolean(spouseB.nationality) && spouseB.nationality !== "lao");
  const includeBetrothalFee = betrothalMode === "new";

  const quote = useQuery<QuoteResult>(
    () =>
      catalog.quote("marriage", {
        has_foreign_spouse: anyForeign,
        creates_betrothal_record: includeBetrothalFee,
      }),
    [anyForeign, includeBetrothalFee],
  );

  const fee = quote.data ? quote.data.fee_lak ?? quote.data.total_lak ?? 0 : null;
  const quoteLines: Array<{ label: Bilingual; amount_lak: number }> =
    quote.data?.breakdown ?? quote.data?.lines ?? [];
  const feeBreakdown = quoteLines.map((line) => ({
    label: text(line.label, lang),
    amount: line.amount_lak,
  }));

  const patchA = (patch: Partial<SpouseInfo>) => setSpouseA((p) => ({ ...p, ...patch }));
  const patchB = (patch: Partial<SpouseInfo>) => setSpouseB((p) => ({ ...p, ...patch }));
  const patchReg = (patch: Partial<typeof reg>) => setReg((p) => ({ ...p, ...patch }));
  const patchBetrothal = (patch: Partial<typeof betrothal>) => setBetrothal((p) => ({ ...p, ...patch }));

  /* The registering office defaults to the citizen's own jurisdiction; a linked
   * record overrides it with the village that recorded the betrothal. */
  useEffect(() => {
    const place = profile?.account.jurisdiction;
    if (!place?.village_id) return;
    setHeader((h) =>
      h.provinceId
        ? h
        : {
            provinceId: place.province_id ?? "",
            districtId: place.district_id ?? "",
            villageId: place.village_id ?? "",
            provinceName: place.province_name ?? "",
            districtName: place.district_name ?? "",
            villageName: place.village_name ?? "",
          },
    );
  }, [profile]);

  /* Link an existing betrothal record → pre-fill header + couple (FR-11). */
  const selectExisting = async (recordNo: string) => {
    try {
      const record = await openRecord.run(recordNo);
      setLinkedRecord(record);
      const p = record.payload;
      const provinceId = payloadString(p, "province_id");
      if (provinceId) {
        setHeader({
          provinceId,
          districtId: payloadString(p, "district_id"),
          villageId: payloadString(p, "village_id"),
          provinceName: payloadString(p, "province_name", "province"),
          districtName: payloadString(p, "district_name", "district"),
          villageName: payloadString(p, "village_name", "village"),
        });
      }
      patchA({ fullName: record.party_a_name, idOrPassport: record.party_a_uin ?? "" });
      patchB({ fullName: record.party_b_name, idOrPassport: record.party_b_uin ?? "" });
      const bridePrice = payloadString(p, "bride_price_cash", "bride_price");
      if (bridePrice) setBetrothal((b) => ({ ...b, bridePriceCash: bridePrice.replace(/\D/g, "") }));
    } catch {
      // Surfaced from openRecord.error below the picker.
    }
  };

  const resetBetrothal = () => {
    setBetrothalMode("");
    setLinkedRecord(null);
    openRecord.reset();
  };

  const spouseValid = (s: SpouseInfo, prevMarried: boolean) => {
    const isForeign = Boolean(s.nationality) && s.nationality !== "lao";
    return Boolean(
      s.fullName.trim() && s.dob.trim() && s.gender && s.nationality &&
      s.idOrPassport.trim() && s.address.villageId && s.address.provinceId &&
      s.residenceCertRef.trim() && s.singleStatusCert &&
      (!prevMarried || s.priorMaritalProof) &&
      (!isForeign || s.foreignDocs)
    );
  };

  /* ── Validation — only Mandatory fields block progression ── */
  const canProceed = () => {
    if (step === 1) {
      const headerOk = Boolean(header.provinceId && header.districtId && header.villageId);
      if (betrothalMode === "existing") return Boolean(linkedRecord && headerOk);
      if (betrothalMode === "new")
        return Boolean(headerOk && betrothal.householdHead.trim() && betrothal.bridePriceCash.trim());
      return false; // must pick existing or create new
    }
    if (step === 2) return spouseValid(spouseA, prevMarriedA);
    if (step === 3) return spouseValid(spouseB, prevMarriedB);
    if (step === 4) return Boolean(householdBook && photos && (!hasChildren || birthRecord));
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

  /* ── The wire payload ── */
  const spousePayload = (s: SpouseInfo) => ({
    name: s.fullName.trim(),
    dob: s.dob,
    gender: s.gender,
    nationality: s.nationality,
    ethnicity: s.ethnicity,
    ethnic_group: s.ethnicGroup,
    religion: s.religion,
    occupation: s.occupation,
    id_number: s.idOrPassport.trim(),
    house_no: s.addrHouseNo,
    current_address: s.address.villageId,
    address_text: [s.addrHouseNo, s.address.villageName, s.address.districtName, s.address.provinceName]
      .filter(Boolean)
      .join(", "),
    residence_certificate_ref: s.residenceCertRef.trim(),
  });

  const buildFormData = (documentNo: string) => ({
    header: {
      province_id: header.provinceId,
      district_id: header.districtId,
      village_id: header.villageId,
      document_no: documentNo,
      dated: today(),
    },
    betrothal: {
      betrothal_record_no: linkedRecord?.record_no ?? "",
      creates_betrothal_record: betrothalMode === "new",
      proposal_date: linkedRecord?.recorded_at?.slice(0, 10) ?? "",
      household_head: betrothal.householdHead,
      bride_price: betrothal.bridePriceCash,
      bride_price_gold: betrothal.bridePriceGold,
      housing: betrothal.housing,
      attendees: [betrothal.w1Name, betrothal.w2Name].filter(Boolean).join(", "),
    },
    spouses: {
      // Section-level mirror the API validates against.
      name: both(spouseA.fullName, spouseB.fullName),
      dob: both(spouseA.dob, spouseB.dob),
      gender: both(spouseA.gender, spouseB.gender),
      nationality: both(spouseA.nationality, spouseB.nationality),
      id_number: both(spouseA.idOrPassport, spouseB.idOrPassport),
      current_address: both(spouseA.address.villageId, spouseB.address.villageId),
      residence_certificate_ref: both(spouseA.residenceCertRef, spouseB.residenceCertRef),
      // Captured by the district office at the appointment.
      medical_certificate: OFFICE_DEFERRED,
      spouse_a: spousePayload(spouseA),
      spouse_b: spousePayload(spouseB),
    },
    registration: {
      marriage_date: reg.dateOfMarriage,
      registration_place: reg.placeOfRegistration.trim(),
      witness_1: [reg.w1Name, reg.w1Id].filter(Boolean).join(" · "),
      witness_2: [reg.w2Name, reg.w2Id].filter(Boolean).join(" · "),
      witness_3: [reg.w3Name, reg.w3Id].filter(Boolean).join(" · "),
      // Signed in front of the registrar (PRD §8.5) — not captured in the app.
      couple_signatures: OFFICE_DEFERRED,
      registrar_signature: OFFICE_DEFERRED,
    },
  });

  const uploads = () =>
    [
      { file: spouseA.singleStatusCert, slot: "spouses.single_status_certificate", kind: "document", label: "Spouse A" },
      { file: spouseB.singleStatusCert, slot: "spouses.single_status_certificate", kind: "document", label: "Spouse B" },
      { file: spouseA.priorMaritalProof, slot: "spouses.prior_marital_proof", kind: "document", label: "Spouse A" },
      { file: spouseB.priorMaritalProof, slot: "spouses.prior_marital_proof", kind: "document", label: "Spouse B" },
      { file: spouseA.foreignDocs, slot: "spouses.foreign_documents", kind: "document", label: "Spouse A" },
      { file: spouseB.foreignDocs, slot: "spouses.foreign_documents", kind: "document", label: "Spouse B" },
      { file: householdBook, slot: "supporting.household_book", kind: "document", label: "Household book" },
      { file: photos, slot: "supporting.photos_3x4", kind: "photo", label: "3x4 photographs" },
      { file: birthRecord, slot: "supporting.birth_record", kind: "document", label: "Children birth record" },
    ].filter((u): u is { file: DocFile; slot: string; kind: string; label: string } => u.file !== null);

  /* create → attachments → submit → pay. A retry reuses the draft. */
  const submitCase = useMutation(async () => {
    let id = caseId;
    let reference = caseRef;

    if (!id) {
      const draft = await applications.create({
        service_code: "marriage",
        province_id: header.provinceId,
        district_id: header.districtId,
        village_id: header.villageId,
        event_date: reg.dateOfMarriage || undefined,
        linked_reference_no: linkedRecord?.record_no,
        form_data: buildFormData(""),
      });
      id = draft.id;
      reference = draft.reference_no;
      setCaseId(id);
      setCaseRef(reference);
    }

    if (!attachmentsSent) {
      for (const item of uploads()) {
        await applications.addAttachment(id, item.file.file, item.slot, item.kind, item.label);
      }
      setAttachmentsSent(true);
    }

    // The document number IS the case reference, which only exists after create.
    await applications.update(id, {
      form_data: buildFormData(reference),
      event_date: reg.dateOfMarriage || undefined,
    });

    const submittedCase = await applications.submit(id);

    if ((submittedCase.fee_lak ?? 0) > 0 && submittedCase.payment_state !== "paid") {
      await applications.pay(id, { method_code: METHOD_CODE[payment.method] });
    }
    return submittedCase;
  });

  const goBack = () => {
    setShowErrors(false);
    if (step > 1) setStep((s) => s - 1);
    else onBack();
  };

  const handleNext = async () => {
    if (submitCase.pending) return;
    // Button stays enabled; tapping an incomplete step reveals inline errors.
    if (!canProceed()) {
      setShowErrors(true);
      scrollToFirstError();
      return;
    }
    setShowErrors(false);
    if (step < lastStep) {
      setStep((s) => s + 1);
      return;
    }
    setServerErrors({});
    try {
      await submitCase.run(undefined);
      setSubmitted(true);
    } catch (err) {
      // A 422 names every mandatory field still missing; show them all at once
      // rather than stopping at the first one.
      const fields = err instanceof ApiError ? err.fieldMap() : {};
      setServerErrors(fields);
      if (Object.keys(fields).length > 0) {
        setShowErrors(true);
        scrollToFirstError();
      }
    }
  };

  const documentNo = caseRef || t("autoGenerated");
  const serverMessages = Object.entries(serverErrors);

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
              { label: t("successDocumentNo"), value: caseRef || t("dash") },
              { label: t("successEstReview"), value: t("successEstReviewValue") },
              {
                label: t("successStatus"),
                value: text(submitCase.data?.status_label, lang) || t("successStatusValue"),
                isStatus: true,
              },
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

          {/* Everything the server still wants, listed together (FR-11 / §8.6) */}
          {serverMessages.length > 0 && (
            <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-red-50 border border-red-100">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-red-600">{say("fixTitle")}</p>
                <ul className="mt-1 space-y-0.5">
                  {serverMessages.map(([field, message]) => (
                    <li key={field} className="text-xs text-red-600 leading-relaxed">• {message}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {submitCase.error && serverMessages.length === 0 && (
            <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-red-50 border border-red-100">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
              <p className="text-xs text-red-600 leading-relaxed">{submitCase.error.message}</p>
            </div>
          )}

          {/* Step 1 — Betrothal record (link existing or create new) */}
          {step === 1 && (
            <>
              {/* Chooser */}
              {betrothalMode === "" && (
                <>
                  <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                    <Heart className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#344EAD" }} />
                    <p className="text-xs leading-relaxed" style={{ color: "#344EAD" }}>
                      {t("betrothalChooseNote")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBetrothalMode("existing")}
                    className="w-full flex items-center gap-3 p-4 rounded-2xl border border-gray-200 bg-white hover:border-[#344EAD]/40 hover:bg-blue-50/40 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#EEF2FF" }}>
                      <Link2 className="w-5 h-5" style={{ color: "#344EAD" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{t("betrothalSelectExisting")}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{t("betrothalSelectExistingHint")}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setBetrothalMode("new")}
                    className="w-full flex items-center gap-3 p-4 rounded-2xl border border-gray-200 bg-white hover:border-[#344EAD]/40 hover:bg-blue-50/40 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#EEF2FF" }}>
                      <FilePlus2 className="w-5 h-5" style={{ color: "#344EAD" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{t("betrothalCreateNew")}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{t("betrothalCreateNewHint")}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </button>
                  {showErrors && (
                    <FieldError show message={t("betrothalChooseRequired")} />
                  )}
                </>
              )}

              {/* Existing → pick a record, then show the linked summary */}
              {betrothalMode === "existing" && (
                <>
                  <button
                    type="button"
                    onClick={resetBetrothal}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                  >
                    <ChevronLeft className="w-4 h-4" /> {t("betrothalBack")}
                  </button>

                  {!linkedRecord ? (
                    <>
                      <SectionLabel>{t("betrothalPickTitle")}</SectionLabel>

                      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2.5">
                        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <input
                          value={recordSearch}
                          onChange={(e) => setRecordSearch(e.target.value)}
                          placeholder={say("searchRecord")}
                          className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400"
                        />
                      </div>

                      {records.loading ? (
                        <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-400">
                          <Loader2 className="w-4 h-4 animate-spin" /> {say("recordsLoading")}
                        </div>
                      ) : records.error ? (
                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col items-center text-center gap-3">
                          <AlertCircle className="w-6 h-6 text-amber-500" />
                          <p className="text-sm text-gray-600">{say("recordsError")}</p>
                          <p className="text-xs text-gray-400">{records.error.message}</p>
                          <button
                            type="button"
                            onClick={records.refetch}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-white text-sm font-semibold shadow-md hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: "#344EAD" }}
                          >
                            <RotateCcw className="w-4 h-4" />
                            {say("retry")}
                          </button>
                        </div>
                      ) : (records.data?.data.length ?? 0) === 0 ? (
                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
                          <p className="text-sm text-gray-500 leading-relaxed">{say("recordsEmpty")}</p>
                        </div>
                      ) : (
                        records.data!.data.map((rec) => (
                          <button
                            key={rec.id}
                            type="button"
                            disabled={openRecord.pending}
                            onClick={() => void selectExisting(rec.record_no)}
                            className="w-full text-left p-4 rounded-2xl border border-gray-200 bg-white hover:border-[#344EAD]/40 hover:bg-blue-50/40 transition-all"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm font-semibold text-gray-800">{rec.party_a_name} &amp; {rec.party_b_name}</span>
                              <span className="text-[11px] font-mono text-gray-400">{rec.record_no}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {rec.recorded_by} · {rec.recorded_at?.slice(0, 10)}
                            </p>
                          </button>
                        ))
                      )}
                      {openRecord.error && (
                        <FieldError show message={`${say("recordOpenError")} ${openRecord.error.message}`} />
                      )}
                      {showErrors && <FieldError show message={t("betrothalPickRequired")} />}
                    </>
                  ) : (
                    <>
                      <div className="rounded-2xl border-2 border-green-300 bg-green-50 p-4 space-y-2.5">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <p className="text-sm font-semibold text-green-700">{t("betrothalLinkedTitle")}</p>
                        </div>
                        {[
                          [t("betrothalRecordNo"), linkedRecord.record_no],
                          [t("betrothalCouple"), `${linkedRecord.party_a_name} & ${linkedRecord.party_b_name}`],
                          [t("betrothalWhere"), [header.villageName, header.districtName, header.provinceName].filter(Boolean).join(", ") || t("dash")],
                          [t("betrothalDate"), linkedRecord.recorded_at?.slice(0, 10) ?? t("dash")],
                          [t("bridePriceCash"), betrothal.bridePriceCash ? formatLak(Number(betrothal.bridePriceCash), lang) : t("dash")],
                        ].map(([label, value]) => (
                          <div key={label} className="flex items-start justify-between gap-3">
                            <span className="text-xs text-gray-500 flex-shrink-0">{label}</span>
                            <span className="text-xs font-medium text-gray-800 text-right">{value}</span>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setLinkedRecord(null)}
                          className="text-xs font-medium text-[#344EAD] hover:underline pt-1"
                        >
                          {t("betrothalChange")}
                        </button>
                      </div>
                      <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#344EAD" }} />
                        <p className="text-xs leading-relaxed" style={{ color: "#344EAD" }}>
                          {t("betrothalPrefillNote")}
                        </p>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* New → capture the betrothal record (condensed) */}
              {betrothalMode === "new" && (
                <>
                  <button
                    type="button"
                    onClick={resetBetrothal}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                  >
                    <ChevronLeft className="w-4 h-4" /> {t("betrothalBack")}
                  </button>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-100">
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{t("betrothalNoLabel")}</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">{t("dash")}</p>
                    </div>
                    <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                      {t("autoGenerated")}
                    </span>
                  </div>

                  <ApiLocationFields
                    value={header}
                    required
                    onChange={setHeader}
                    serverError={serverErrors["header.province_id"] ?? serverErrors["header.district_id"] ?? serverErrors["header.village_id"]}
                  />

                  <InputField
                    label={t("householdHead")}
                    value={betrothal.householdHead}
                    placeholder={t("householdHeadPh")}
                    onChange={(v) => patchBetrothal({ householdHead: v })}
                    required
                  />

                  <SectionLabel>{t("bridePriceSection")}</SectionLabel>
                  <div className="grid grid-cols-2 gap-3">
                    <InputField
                      label={t("bridePriceCash")}
                      value={betrothal.bridePriceCash}
                      placeholder={t("bridePriceCashPh")}
                      inputMode="numeric"
                      onChange={(v) => patchBetrothal({ bridePriceCash: v.replace(/\D/g, "") })}
                      required
                    />
                    <InputField
                      label={t("bridePriceGold")}
                      value={betrothal.bridePriceGold}
                      placeholder={t("bridePriceGoldPh")}
                      onChange={(v) => patchBetrothal({ bridePriceGold: v })}
                    />
                  </div>
                  <InputField
                    label={t("housing")}
                    value={betrothal.housing}
                    placeholder={t("housingPh")}
                    onChange={(v) => patchBetrothal({ housing: v })}
                  />

                  <SectionLabel>{t("betrothalWitnesses")}</SectionLabel>
                  <div className="grid grid-cols-2 gap-3">
                    <InputField
                      label={t("witnessName")}
                      value={betrothal.w1Name}
                      placeholder={t("witnessNamePh")}
                      onChange={(v) => patchBetrothal({ w1Name: v })}
                    />
                    <InputField
                      label={t("witnessName")}
                      value={betrothal.w2Name}
                      placeholder={t("witnessNamePh")}
                      onChange={(v) => patchBetrothal({ w2Name: v })}
                    />
                  </div>

                  <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                    <Heart className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#344EAD" }} />
                    <p className="text-xs leading-relaxed" style={{ color: "#344EAD" }}>
                      {t("betrothalNewNote")}
                    </p>
                  </div>
                </>
              )}
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
                refs={refs}
                serverErrors={serverErrors}
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
                refs={refs}
                serverErrors={serverErrors}
              />
            </>
          )}

          {/* Step 4 — Supporting documents (PRD §8.2 checklist) */}
          {step === 4 && (
            <>
              <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-amber-50 border border-amber-100">
                <ClipboardList className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  {t("docsNote")}
                </p>
              </div>
              <DocUpload
                label={t("householdBook")}
                file={householdBook}
                onChange={setHouseholdBook}
                required
              />
              <DocUpload
                label={t("photos3x4")}
                file={photos}
                onChange={setPhotos}
                required
                hint={t("photos3x4Hint")}
              />
              <ToggleRow
                active={hasChildren}
                onToggle={() => setHasChildren((v) => !v)}
                title={t("hasChildren")}
                hint={t("hasChildrenHint")}
              />
              {hasChildren && (
                <DocUpload
                  label={t("birthRecord")}
                  file={birthRecord}
                  onChange={setBirthRecord}
                  required
                  hint={t("birthRecordHint")}
                />
              )}
            </>
          )}

          {/* Step 5 — Registration */}
          {step === 5 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <DatedField
                  label={t("dateOfMarriage")}
                  value={reg.dateOfMarriage}
                  onChange={(v) => patchReg({ dateOfMarriage: v })}
                  required
                  serverError={serverErrors["registration.marriage_date"]}
                />
                <InputField
                  label={t("placeOfRegistration")}
                  value={reg.placeOfRegistration}
                  placeholder={t("placeOfRegistrationPh")}
                  onChange={(v) => patchReg({ placeOfRegistration: v })}
                  required
                  serverError={serverErrors["registration.registration_place"]}
                />
              </div>

              <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <Users className="w-4 h-4 flex-shrink-0" style={{ color: "#344EAD" }} />
                <p className="text-xs leading-relaxed" style={{ color: "#344EAD" }}>
                  {t("witnessesNote")}
                </p>
              </div>

              {[
                { n: 1, name: reg.w1Name, id: reg.w1Id, kn: "w1Name" as const, ki: "w1Id" as const, key: "registration.witness_1" },
                { n: 2, name: reg.w2Name, id: reg.w2Id, kn: "w2Name" as const, ki: "w2Id" as const, key: "registration.witness_2" },
                { n: 3, name: reg.w3Name, id: reg.w3Id, kn: "w3Name" as const, ki: "w3Id" as const, key: "registration.witness_3" },
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
                      serverError={serverErrors[w.key]}
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
                  title: t("reviewBetrothal"),
                  rows: [
                    [t("betrothalRecordNo"), linkedRecord?.record_no ?? t("autoGenerated")],
                    [t("bridePriceCash"), betrothal.bridePriceCash ? formatLak(Number(betrothal.bridePriceCash), lang) : t("dash")],
                  ],
                },
                {
                  title: t("reviewHeader"),
                  rows: [
                    [t("reviewProvinceDistrictVillage"), [header.provinceName, header.districtName, header.villageName].filter(Boolean).join(" / ") || t("dash")],
                    [t("documentNo"), documentNo],
                  ],
                },
                {
                  title: t("reviewSpouseA"),
                  rows: [
                    [t("reviewName"), spouseA.fullName || t("dash")],
                    [t("reviewNationality"), refs.nationalities.options.find((o) => o.value === spouseA.nationality)?.label || t("dash")],
                    [t("reviewIdPassport"), spouseA.idOrPassport || t("dash")],
                  ],
                },
                {
                  title: t("reviewSpouseB"),
                  rows: [
                    [t("reviewName"), spouseB.fullName || t("dash")],
                    [t("reviewNationality"), refs.nationalities.options.find((o) => o.value === spouseB.nationality)?.label || t("dash")],
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
                {
                  title: t("feeSectionTitle"),
                  rows: [
                    ...feeBreakdown.map((i) => [i.label, formatLak(i.amount, lang)] as [string, string]),
                    [t("feeTotal"), quote.loading ? "…" : formatLak(fee, lang)],
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

              {quote.error && (
                <FieldError show message={`${say("quoteError")} ${quote.error.message}`} />
              )}
            </>
          )}

          {/* Step 7 — Payment */}
          {step === 7 && (
            <PaymentSection
              amount={fee ?? 0}
              serviceName={t("serviceName")}
              value={payment}
              onChange={(patch) => setPayment((p) => ({ ...p, ...patch }))}
              reference={caseRef || documentNo}
              breakdown={feeBreakdown}
            />
          )}
        </div>
      </div>

      {/* ── Fixed bottom CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 pt-3 pb-6 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-40">
        <div className="max-w-screen-sm mx-auto">
          <button
            onClick={() => void handleNext()}
            className="w-full h-14 rounded-2xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-md"
            style={{
              backgroundColor: submitCase.pending ? "#C7D2FE" : "#344EAD",
              cursor: submitCase.pending ? "progress" : "pointer",
            }}
          >
            {submitCase.pending ? (
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
