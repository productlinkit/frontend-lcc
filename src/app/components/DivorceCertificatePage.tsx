import { useEffect, useState, useRef } from "react";
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
  Link2,
  FilePlus2,
  ClipboardList,
  Gavel,
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
import { getServiceConfig, formatLak } from "../serviceConfig";
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
 * Divorce Certificate — follows PRD §9. The menu groups two sub-processes:
 *   A) Divorce Mediation Records — Record of Voluntary Divorce + Division of
 *      joint property / custody / debts (village), and
 *   B) Divorce Registration — application + supporting forms (district).
 * Per FR-11 a voluntary case STARTS by selecting the mediation record by its
 * reference number (links & pre-fills the spouses), or by creating one first.
 * A contested divorce instead relies on a final People's Court decree.
 * Officer artefacts (registrar e-signature) are excluded (back-office).
 * M = Mandatory · C = Conditional · O = Optional · Auto = system-generated.
 *
 * Wiring: the mediation picker reads /prerequisite-records, the fee comes from
 * POST /services/divorce/quote, and the case itself is
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
  nationality: string; // M
  idOrPassport: string; // M
  addrHouseNo: string;
  address: LocationValue; // M
  marriageCertRef: string; // M — existing marriage certificate ref
}

/* Fields the schema marks mandatory but the registrar captures in the office —
 * the citizen portal records the intent so the case can leave draft. */
const OFFICE_DEFERRED = "captured-at-office";

/* Short bilingual sentences for the data states. The i18n namespaces are owned
 * elsewhere, so these live here rather than as new dictionary keys. */
const COPY = {
  retry: { en: "Try again", lo: "ລອງໃໝ່" },
  searchRecord: { en: "Search by record number or name…", lo: "ຄົ້ນຫາດ້ວຍເລກບົດບັນທຶກ ຫຼື ຊື່..." },
  recordsLoading: { en: "Looking for your mediation records…", lo: "ກຳລັງຊອກຫາບົດບັນທຶກໄກ່ເກ່ຍ..." },
  recordsError: { en: "We could not load the mediation records.", lo: "ບໍ່ສາມາດໂຫຼດບົດບັນທຶກໄກ່ເກ່ຍໄດ້." },
  recordsEmpty: {
    en: "No mediation record is linked to you yet. Create one first, or ask your village office to record it.",
    lo: "ຍັງບໍ່ມີບົດບັນທຶກໄກ່ເກ່ຍຜູກກັບທ່ານ. ກະລຸນາສ້າງໃໝ່ ຫຼື ຕິດຕໍ່ຫ້ອງການບ້ານ.",
  },
  recordOpenError: { en: "We could not open that record.", lo: "ບໍ່ສາມາດເປີດບົດບັນທຶກນັ້ນໄດ້." },
  quoteError: { en: "The fee could not be calculated.", lo: "ບໍ່ສາມາດຄິດໄລ່ຄ່າທຳນຽມໄດ້." },
  fixTitle: { en: "Please fix the following before submitting", lo: "ກະລຸນາແກ້ໄຂລາຍການລຸ່ມນີ້ກ່ອນສົ່ງ" },
} as const;

type Copy = keyof typeof COPY;

/* ─── Constants ─── */
const STEP_IDS = [1, 2, 3, 4, 5, 6] as const;
const STEP_COUNT = STEP_IDS.length;

type DivorceT = ReturnType<typeof useT<"divorce">>;

const stepTitleKey = (id: number) => `step${id}Title` as Parameters<DivorceT>[0];
const stepSubtitleKey = (id: number) => `step${id}Subtitle` as Parameters<DivorceT>[0];

/* The gateway offers no card rail; a card payment settles as a bank transfer. */
const METHOD_CODE: Record<PaymentState["method"], string> = {
  qr: "laoqr",
  bank: "bank-transfer",
  cc: "bank-transfer",
};

/* ─── Blank record ─── */
const blankSpouse: SpouseInfo = {
  fullName: "", dob: "", nationality: "", idOrPassport: "",
  addrHouseNo: "", address: blankLocation, marriageCertRef: "",
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

const labelFor = (list: RefList, value: string) =>
  list.options.find((o) => o.value === value)?.label ?? "";

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

function TextAreaField({
  label, value, placeholder, onChange, required, serverError,
}: {
  label: React.ReactNode; value: string; placeholder: string;
  onChange: (v: string) => void; required?: boolean; serverError?: string;
}) {
  const showErrors = useShowErrors();
  const hasError = Boolean(serverError) || (showErrors && Boolean(required) && isEmpty(value));
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className={`w-full bg-white border rounded-2xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all resize-none ${fieldErrorRing(hasError)}`}
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
          onChange({ ...blankLocation, provinceId: id, provinceName: nameOf(provinces.data, id) })
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
          onChange={(id) => onChange({ ...value, villageId: id, villageName: nameOf(villages.data, id) })}
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
  const t = useT("divorce");
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
            <p className="text-xs text-gray-400 mt-0.5">{hint ?? t("uploadHint")}</p>
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

/* ─── Spouse section (Husband / Wife share the same structure — PRD §9.4) ─── */
function SpouseSection({
  value, onChange, nationalities, serverErrors,
}: {
  value: SpouseInfo; onChange: (patch: Partial<SpouseInfo>) => void;
  nationalities: RefList;
  serverErrors: Record<string, string>;
}) {
  const t = useT("divorce");
  return (
    <>
      <InputField
        label={t("fullName")}
        value={value.fullName}
        placeholder={t("fullNamePlaceholder")}
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
          label={t("nationality")}
          value={value.nationality}
          options={nationalities.options}
          placeholder={t("selectPlaceholder")}
          onChange={(v) => onChange({ nationality: v })}
          required
          serverError={serverErrors["spouses.nationality"]}
        />
      </div>
      <InputField
        label={t("idOrPassport")}
        value={value.idOrPassport}
        placeholder={t("idOrPassportPlaceholder")}
        onChange={(v) => onChange({ idOrPassport: v })}
        required
        serverError={serverErrors["spouses.id_number"]}
      />

      <SectionLabel>{t("currentAddress")}</SectionLabel>
      <InputField
        label={t("houseNo")}
        value={value.addrHouseNo}
        placeholder={t("houseNoPlaceholder")}
        onChange={(v) => onChange({ addrHouseNo: v })}
      />
      <ApiLocationFields
        value={value.address}
        villageLabel={t("villageLabel")}
        required
        onChange={(address) => onChange({ address })}
        serverError={serverErrors["spouses.current_address"]}
      />

      <InputField
        label={t("marriageCertRef")}
        value={value.marriageCertRef}
        placeholder={t("marriageCertRefPlaceholder")}
        onChange={(v) => onChange({ marriageCertRef: v })}
        required
        serverError={serverErrors["spouses.marriage_certificate_ref"]}
      />
    </>
  );
}

/* ─── Step Indicator (spans the form container width) ─── */
function StepIndicator({ step }: { step: number }) {
  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-screen-sm mx-auto px-4 py-4 flex items-center">
        {STEP_IDS.map((id, i) => {
          const done = step > id;
          const active = step === id;
          const isLast = i === STEP_IDS.length - 1;
          return (
            <div key={id} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 flex-shrink-0"
                style={{
                  backgroundColor: done || active ? "#344EAD" : "#F3F4F6",
                  color: done || active ? "white" : "#9CA3AF",
                  opacity: done ? 0.55 : 1,
                }}
              >
                {done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : id}
              </div>
              {!isLast && (
                <div
                  className="flex-1 h-0.5 mx-1.5 rounded-full transition-all duration-500"
                  style={{
                    backgroundColor: step > id ? "#344EAD" : "#E5E7EB",
                    opacity: step > id ? 0.4 : 1,
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
  const t = useT("divorce");
  return (
    <div className="mb-3 pb-1">
      <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#344EAD" }}>
        {t("stepOf", { n: step, m: STEP_COUNT })}
      </p>
      <h2 className="text-gray-900 mt-0.5">{t(stepTitleKey(step))}</h2>
      <p className="text-gray-400 text-xs mt-0.5">{t(stepSubtitleKey(step))}</p>
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
interface DivorceCertificatePageProps {
  onBack: () => void;
}

export function DivorceCertificatePage({ onBack }: DivorceCertificatePageProps) {
  const t = useT("divorce");
  const { lang } = useLang();
  const { profile } = useSession();
  const cfg = getServiceConfig("divorce");
  const [step, setStep] = useState(1);
  const [showErrors, setShowErrors] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const say = (key: Copy) => COPY[key][lang] ?? COPY[key].en;

  /* The case, once the draft exists — kept so a retry never duplicates it. */
  const [caseId, setCaseId] = useState("");
  const [caseRef, setCaseRef] = useState("");
  const [attachmentsSent, setAttachmentsSent] = useState(false);

  const [header, setHeader] = useState<LocationValue>(blankLocation);
  const [husband, setHusband] = useState<SpouseInfo>(blankSpouse);
  const [wife, setWife] = useState<SpouseInfo>(blankSpouse);

  // Step 1 — divorce basis
  const [basis, setBasis] = useState({ divorceType: "", dateOfDivorce: "", placeOfRegistration: "" });

  // Voluntary path — mediation record (FR-11)
  const [mediationMode, setMediationMode] = useState<"" | "existing" | "new">("");
  const [recordSearch, setRecordSearch] = useState("");
  const [linkedRecord, setLinkedRecord] = useState<PrerequisiteRecord | null>(null);
  const [mediation, setMediation] = useState({
    dateMarriageBegan: "", reasonsHusband: "", reasonsWife: "", outcome: "",
    propertyDivision: "", debts: "", additionalAssets: "", w1Name: "", w2Name: "",
  });
  const [hasChildren, setHasChildren] = useState(false);
  const [children, setChildren] = useState({ list: "", custody: "" });

  // Contested path — People's Court decree
  const [court, setCourt] = useState({ name: "", decisionDate: "" });
  const [courtDecision, setCourtDecision] = useState<DocFile | null>(null);

  // Step 4 — supporting documents
  const [guaranteeCert, setGuaranteeCert] = useState<DocFile | null>(null);
  const [householdBook, setHouseholdBook] = useState<DocFile | null>(null);
  const [photos, setPhotos] = useState<DocFile | null>(null);

  const [payment, setPayment] = useState<PaymentState>(blankPayment);

  /* ── Master data ── */
  const nationalities = useRefList("nationality");
  const divorceTypes = useRefList("divorce-type");
  const service = useQuery((signal) => catalog.service("divorce", signal), []);

  /* ── The mediation-record picker (FR-11) ── */
  const search = useDebounced(recordSearch, 300);
  const records = useQuery(
    (signal) => catalog.prerequisiteRecords({ kind: "mediation", search, per_page: 20 }, signal),
    [search],
    { enabled: mediationMode === "existing" && !linkedRecord },
  );
  const openRecord = useMutation((recordNo: string) => catalog.prerequisiteRecord(recordNo));

  /* ── Fee ── */
  const quote = useQuery<QuoteResult>(() => catalog.quote("divorce", {}), []);
  const fee = quote.data ? quote.data.fee_lak ?? quote.data.total_lak ?? 0 : null;
  const quoteLines: Array<{ label: Bilingual; amount_lak: number }> =
    quote.data?.breakdown ?? quote.data?.lines ?? [];
  const feeBreakdown = quoteLines.map((line) => ({
    label: text(line.label, lang),
    amount: line.amount_lak,
  }));

  const patchHusband = (patch: Partial<SpouseInfo>) => setHusband((p) => ({ ...p, ...patch }));
  const patchWife = (patch: Partial<SpouseInfo>) => setWife((p) => ({ ...p, ...patch }));
  const patchBasis = (patch: Partial<typeof basis>) => setBasis((p) => ({ ...p, ...patch }));
  const patchMediation = (patch: Partial<typeof mediation>) => setMediation((p) => ({ ...p, ...patch }));
  const patchCourt = (patch: Partial<typeof court>) => setCourt((p) => ({ ...p, ...patch }));

  /* The registering office defaults to the citizen's own jurisdiction; a linked
   * record overrides it with the village that recorded the mediation. */
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

  /* Link an existing mediation record → pre-fill header + spouses (FR-11). */
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
      patchHusband({ fullName: record.party_a_name, idOrPassport: record.party_a_uin ?? "" });
      patchWife({ fullName: record.party_b_name, idOrPassport: record.party_b_uin ?? "" });
      setMediation((m) => ({
        ...m,
        dateMarriageBegan: payloadString(p, "marriage_began", "marriage_date") || m.dateMarriageBegan,
        propertyDivision: payloadString(p, "property_division") || m.propertyDivision,
        outcome: payloadString(p, "outcome", "mediation_outcome") || m.outcome,
      }));
    } catch {
      // Surfaced from openRecord.error below the picker.
    }
  };

  const resetMediation = () => {
    setMediationMode("");
    setLinkedRecord(null);
    openRecord.reset();
  };

  const spouseValid = (s: SpouseInfo) =>
    Boolean(
      s.fullName.trim() && s.dob.trim() && s.nationality && s.idOrPassport.trim() &&
      s.address.villageId && s.address.provinceId && s.marriageCertRef.trim()
    );

  const headerValid = () => Boolean(header.provinceId && header.districtId && header.villageId);

  const isVoluntary = basis.divorceType === "voluntary";
  const isContested = basis.divorceType === "contested";

  /* ── Validation — only Mandatory fields block progression ── */
  const canProceed = () => {
    if (step === 1) {
      if (!basis.divorceType) return false;
      if (isVoluntary) {
        if (mediationMode === "existing") return Boolean(linkedRecord && headerValid());
        if (mediationMode === "new")
          return Boolean(
            headerValid() &&
            mediation.dateMarriageBegan.trim() && mediation.reasonsHusband.trim() &&
            mediation.reasonsWife.trim() && mediation.outcome.trim() &&
            mediation.propertyDivision.trim() &&
            (!hasChildren || (children.list.trim() && children.custody.trim()))
          );
        return false; // must pick existing or create new
      }
      // Contested
      return Boolean(headerValid() && courtDecision && court.name.trim() && court.decisionDate.trim());
    }
    if (step === 2) return spouseValid(husband);
    if (step === 3) return spouseValid(wife);
    if (step === 4)
      return Boolean(
        basis.dateOfDivorce.trim() && basis.placeOfRegistration.trim() &&
        guaranteeCert && householdBook && photos
      );
    if (step === 6) return isPaymentValid(payment);
    return true;
  };

  const lastStep = STEP_COUNT;

  /* ── The wire payload ── */
  const spousePayload = (s: SpouseInfo) => ({
    name: s.fullName.trim(),
    dob: s.dob,
    nationality: s.nationality,
    id_number: s.idOrPassport.trim(),
    house_no: s.addrHouseNo,
    current_address: s.address.villageId,
    address_text: [s.addrHouseNo, s.address.villageName, s.address.districtName, s.address.provinceName]
      .filter(Boolean)
      .join(", "),
    marriage_certificate_ref: s.marriageCertRef.trim(),
  });

  const buildFormData = (documentNo: string) => ({
    header: {
      province_id: header.provinceId,
      district_id: header.districtId,
      village_id: header.villageId,
      document_no: documentNo,
      dated: today(),
    },
    mediation: {
      mediation_record_no: linkedRecord?.record_no ?? "",
      property_division: mediation.propertyDivision,
      custody_arrangement: hasChildren ? children.custody : "",
      debt_division: mediation.debts,
      date_marriage_began: mediation.dateMarriageBegan,
      reasons_husband: mediation.reasonsHusband,
      reasons_wife: mediation.reasonsWife,
      outcome: mediation.outcome,
      additional_assets: mediation.additionalAssets,
      children: hasChildren ? children.list : "",
      witnesses: [mediation.w1Name, mediation.w2Name].filter(Boolean).join(", "),
    },
    spouses: {
      // Section-level mirror the API validates against.
      name: both(husband.fullName, wife.fullName),
      dob: both(husband.dob, wife.dob),
      nationality: both(husband.nationality, wife.nationality),
      id_number: both(husband.idOrPassport, wife.idOrPassport),
      current_address: both(husband.address.villageId, wife.address.villageId),
      marriage_certificate_ref: both(husband.marriageCertRef, wife.marriageCertRef),
      husband: spousePayload(husband),
      wife: spousePayload(wife),
    },
    basis: {
      divorce_type: basis.divorceType,
      divorce_date: basis.dateOfDivorce,
      registration_place: basis.placeOfRegistration.trim(),
      custody_reference: hasChildren ? children.custody : "",
      court_name: court.name,
      court_decision_date: court.decisionDate,
      // Signed in front of the registrar (PRD §9.5) — not captured in the app.
      registrar_signature: OFFICE_DEFERRED,
      certificate_each_spouse: OFFICE_DEFERRED,
    },
  });

  const uploads = () =>
    [
      { file: courtDecision, slot: "basis.court_decision", kind: "document", label: "Court decision" },
      { file: householdBook, slot: "supporting.household_book", kind: "document", label: "Household book" },
      { file: guaranteeCert, slot: "supporting.guarantee_certificate", kind: "document", label: "Guarantee certificate" },
      { file: photos, slot: "supporting.photos_3x4", kind: "photo", label: "3x4 photographs" },
    ].filter((u): u is { file: DocFile; slot: string; kind: string; label: string } => u.file !== null);

  /* create → attachments → submit → pay. A retry reuses the draft. */
  const submitCase = useMutation(async () => {
    let id = caseId;
    let reference = caseRef;

    if (!id) {
      const draft = await applications.create({
        service_code: "divorce",
        province_id: header.provinceId,
        district_id: header.districtId,
        village_id: header.villageId,
        event_date: basis.dateOfDivorce || undefined,
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
      event_date: basis.dateOfDivorce || undefined,
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
  const processingTime = text(service.data?.processing_time, lang) || cfg.processingTime[lang];

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
              { label: t("successSpouses"), value: [husband.fullName, wife.fullName].filter(Boolean).join(" & ") || t("empty") },
              { label: t("successDocumentNo"), value: caseRef || t("empty") },
              { label: t("successType"), value: labelFor(divorceTypes, basis.divorceType) || t("empty") },
              { label: t("successEstReview"), value: processingTime },
              {
                label: t("successStatus"),
                value: text(submitCase.data?.status_label, lang) || t("statusSubmitted"),
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

          {/* Everything the server still wants, listed together (FR-11 / §9.6) */}
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

          {/* Step 1 — Divorce basis (type + mediation record / court decree) */}
          {step === 1 && (
            <>
              <SelectField
                label={t("divorceType")}
                value={basis.divorceType}
                options={divorceTypes.options}
                placeholder={t("selectPlaceholder")}
                onChange={(v) => { patchBasis({ divorceType: v }); resetMediation(); }}
                required
                serverError={serverErrors["basis.divorce_type"]}
              />

              {!basis.divorceType && (
                <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                  <HeartCrack className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#344EAD" }} />
                  <p className="text-xs leading-relaxed" style={{ color: "#344EAD" }}>
                    {t("basisTypeNote")}
                  </p>
                </div>
              )}

              {/* Voluntary → mediation-record chooser (FR-11) */}
              {isVoluntary && mediationMode === "" && (
                <>
                  <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#344EAD" }} />
                    <p className="text-xs leading-relaxed" style={{ color: "#344EAD" }}>
                      {t("mediationChooseNote")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMediationMode("existing")}
                    className="w-full flex items-center gap-3 p-4 rounded-2xl border border-gray-200 bg-white hover:border-[#344EAD]/40 hover:bg-blue-50/40 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#EEF2FF" }}>
                      <Link2 className="w-5 h-5" style={{ color: "#344EAD" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{t("mediationSelectExisting")}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{t("mediationSelectExistingHint")}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediationMode("new")}
                    className="w-full flex items-center gap-3 p-4 rounded-2xl border border-gray-200 bg-white hover:border-[#344EAD]/40 hover:bg-blue-50/40 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#EEF2FF" }}>
                      <FilePlus2 className="w-5 h-5" style={{ color: "#344EAD" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{t("mediationCreateNew")}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{t("mediationCreateNewHint")}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </button>
                  {showErrors && <FieldError show message={t("mediationChooseRequired")} />}
                </>
              )}

              {/* Voluntary existing → pick then show linked summary */}
              {isVoluntary && mediationMode === "existing" && (
                <>
                  <button
                    type="button"
                    onClick={resetMediation}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                  >
                    <ChevronLeft className="w-4 h-4" /> {t("mediationBack")}
                  </button>

                  {!linkedRecord ? (
                    <>
                      <SectionLabel>{t("mediationPickTitle")}</SectionLabel>

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
                            <p className="text-xs text-gray-400 mt-1">{rec.recorded_by} · {rec.recorded_at?.slice(0, 10)}</p>
                          </button>
                        ))
                      )}
                      {openRecord.error && (
                        <FieldError show message={`${say("recordOpenError")} ${openRecord.error.message}`} />
                      )}
                      {showErrors && <FieldError show message={t("mediationPickRequired")} />}
                    </>
                  ) : (
                    <>
                      <div className="rounded-2xl border-2 border-green-300 bg-green-50 p-4 space-y-2.5">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <p className="text-sm font-semibold text-green-700">{t("mediationLinkedTitle")}</p>
                        </div>
                        {[
                          [t("mediationRecordNo"), linkedRecord.record_no],
                          [t("mediationCouple"), `${linkedRecord.party_a_name} & ${linkedRecord.party_b_name}`],
                          [t("mediationWhere"), [header.villageName, header.districtName, header.provinceName].filter(Boolean).join(", ") || t("empty")],
                          [t("mediationDate"), linkedRecord.recorded_at?.slice(0, 10) ?? t("empty")],
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
                          {t("mediationChange")}
                        </button>
                      </div>
                      <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#344EAD" }} />
                        <p className="text-xs leading-relaxed" style={{ color: "#344EAD" }}>
                          {t("mediationPrefillNote")}
                        </p>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Voluntary new → capture the Record of Voluntary Divorce + division */}
              {isVoluntary && mediationMode === "new" && (
                <>
                  <button
                    type="button"
                    onClick={resetMediation}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                  >
                    <ChevronLeft className="w-4 h-4" /> {t("mediationBack")}
                  </button>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-100">
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{t("mediationNoLabel")}</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">{t("empty")}</p>
                    </div>
                    <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                      {t("autoGenerated")}
                    </span>
                  </div>

                  <ApiLocationFields
                    value={header}
                    villageLabel={t("villageLabel")}
                    required
                    onChange={setHeader}
                    serverError={serverErrors["header.province_id"] ?? serverErrors["header.district_id"] ?? serverErrors["header.village_id"]}
                  />

                  <DatedField
                    label={t("dateMarriageBegan")}
                    value={mediation.dateMarriageBegan}
                    onChange={(v) => patchMediation({ dateMarriageBegan: v })}
                    required
                  />
                  <TextAreaField
                    label={t("reasonsHusband")}
                    value={mediation.reasonsHusband}
                    placeholder={t("reasonsPlaceholder")}
                    onChange={(v) => patchMediation({ reasonsHusband: v })}
                    required
                  />
                  <TextAreaField
                    label={t("reasonsWife")}
                    value={mediation.reasonsWife}
                    placeholder={t("reasonsPlaceholder")}
                    onChange={(v) => patchMediation({ reasonsWife: v })}
                    required
                  />
                  <TextAreaField
                    label={t("mediationOutcome")}
                    value={mediation.outcome}
                    placeholder={t("mediationOutcomePlaceholder")}
                    onChange={(v) => patchMediation({ outcome: v })}
                    required
                  />

                  <SectionLabel>{t("divisionSection")}</SectionLabel>
                  <TextAreaField
                    label={t("propertyDivision")}
                    value={mediation.propertyDivision}
                    placeholder={t("propertyDivisionPlaceholder")}
                    onChange={(v) => patchMediation({ propertyDivision: v })}
                    required
                    serverError={serverErrors["mediation.property_division"]}
                  />
                  <div className="grid grid-cols-1 gap-3">
                    <InputField
                      label={t("debts")}
                      value={mediation.debts}
                      placeholder={t("debtsPlaceholder")}
                      onChange={(v) => patchMediation({ debts: v })}
                      serverError={serverErrors["mediation.debt_division"]}
                    />
                    <InputField
                      label={t("additionalAssets")}
                      value={mediation.additionalAssets}
                      placeholder={t("additionalAssetsPlaceholder")}
                      onChange={(v) => patchMediation({ additionalAssets: v })}
                    />
                  </div>

                  <ToggleRow
                    active={hasChildren}
                    onToggle={() => setHasChildren((v) => !v)}
                    title={t("hasChildren")}
                    hint={t("hasChildrenHint")}
                  />
                  {hasChildren && (
                    <>
                      <TextAreaField
                        label={t("childrenList")}
                        value={children.list}
                        placeholder={t("childrenListPlaceholder")}
                        onChange={(v) => setChildren((c) => ({ ...c, list: v }))}
                        required
                      />
                      <TextAreaField
                        label={t("custodyAgreement")}
                        value={children.custody}
                        placeholder={t("custodyAgreementPlaceholder")}
                        onChange={(v) => setChildren((c) => ({ ...c, custody: v }))}
                        required
                        serverError={serverErrors["mediation.custody_arrangement"]}
                      />
                    </>
                  )}

                  <SectionLabel>{t("mediationWitnesses")}</SectionLabel>
                  <div className="grid grid-cols-2 gap-3">
                    <InputField
                      label={t("witnessName")}
                      value={mediation.w1Name}
                      placeholder={t("witnessNamePlaceholder")}
                      onChange={(v) => patchMediation({ w1Name: v })}
                    />
                    <InputField
                      label={t("witnessName")}
                      value={mediation.w2Name}
                      placeholder={t("witnessNamePlaceholder")}
                      onChange={(v) => patchMediation({ w2Name: v })}
                    />
                  </div>

                  <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                    <HeartCrack className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#344EAD" }} />
                    <p className="text-xs leading-relaxed" style={{ color: "#344EAD" }}>
                      {t("mediationNewNote")}
                    </p>
                  </div>
                </>
              )}

              {/* Contested → People's Court decree */}
              {isContested && (
                <>
                  <ApiLocationFields
                    value={header}
                    villageLabel={t("villageLabel")}
                    required
                    onChange={setHeader}
                    serverError={serverErrors["header.province_id"] ?? serverErrors["header.district_id"] ?? serverErrors["header.village_id"]}
                  />
                  <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-amber-50 border border-amber-100">
                    <Gavel className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                    <p className="text-xs text-amber-700 leading-relaxed">
                      {t("contestedNote")}
                    </p>
                  </div>
                  <InputField
                    label={t("courtName")}
                    value={court.name}
                    placeholder={t("courtNamePlaceholder")}
                    onChange={(v) => patchCourt({ name: v })}
                    required
                  />
                  <DatedField
                    label={t("courtDecisionDate")}
                    value={court.decisionDate}
                    onChange={(v) => patchCourt({ decisionDate: v })}
                    required
                  />
                  <DocUpload
                    label={t("courtDecisionLabel")}
                    file={courtDecision}
                    onChange={setCourtDecision}
                    required
                    hint={t("courtDecisionHint")}
                    serverError={serverErrors["basis.court_decision"]}
                  />
                </>
              )}
            </>
          )}

          {/* Step 2 — Husband */}
          {step === 2 && (
            <>
              <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <User className="w-4 h-4 flex-shrink-0" style={{ color: "#344EAD" }} />
                <p className="text-xs leading-relaxed" style={{ color: "#344EAD" }}>
                  {t("husbandIntro")}
                </p>
              </div>
              <SpouseSection
                value={husband}
                onChange={patchHusband}
                nationalities={nationalities}
                serverErrors={serverErrors}
              />
            </>
          )}

          {/* Step 3 — Wife */}
          {step === 3 && (
            <>
              <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <User className="w-4 h-4 flex-shrink-0" style={{ color: "#344EAD" }} />
                <p className="text-xs leading-relaxed" style={{ color: "#344EAD" }}>
                  {t("wifeIntro")}
                </p>
              </div>
              <SpouseSection
                value={wife}
                onChange={patchWife}
                nationalities={nationalities}
                serverErrors={serverErrors}
              />
            </>
          )}

          {/* Step 4 — Registration & documents */}
          {step === 4 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <DatedField
                  label={t("dateOfDivorce")}
                  value={basis.dateOfDivorce}
                  onChange={(v) => patchBasis({ dateOfDivorce: v })}
                  required
                  serverError={serverErrors["basis.divorce_date"]}
                />
                <InputField
                  label={t("placeOfRegistration")}
                  value={basis.placeOfRegistration}
                  placeholder={t("placeOfRegistrationPlaceholder")}
                  onChange={(v) => patchBasis({ placeOfRegistration: v })}
                  required
                  serverError={serverErrors["basis.registration_place"]}
                />
              </div>

              <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-amber-50 border border-amber-100">
                <ClipboardList className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  {t("registrationDocsNote")}
                </p>
              </div>

              <DocUpload
                label={t("householdBook")}
                file={householdBook}
                onChange={setHouseholdBook}
                required
              />
              <DocUpload
                label={t("guaranteeCert")}
                file={guaranteeCert}
                onChange={setGuaranteeCert}
                required
                hint={t("guaranteeCertHint")}
              />
              <DocUpload
                label={t("photos3x4")}
                file={photos}
                onChange={setPhotos}
                required
                hint={t("photos3x4Hint")}
              />

              <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-gray-100 border border-gray-200">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-500" />
                <p className="text-xs text-gray-500 leading-relaxed">
                  {t("registrationNote")}
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
                  {t("reviewNote")}
                </p>
              </div>

              {[
                {
                  title: t("reviewBasis"),
                  rows: [
                    [t("reviewType"), labelFor(divorceTypes, basis.divorceType) || t("empty")],
                    [
                      isContested ? t("reviewCourtDecision") : t("mediationRecordNo"),
                      isContested
                        ? (court.name || t("empty"))
                        : (linkedRecord?.record_no ?? t("autoGenerated")),
                    ],
                  ],
                },
                {
                  title: t("reviewHeader"),
                  rows: [
                    [t("reviewProvinceDistrictVillage"), [header.provinceName, header.districtName, header.villageName].filter(Boolean).join(" / ") || t("empty")],
                    [t("documentNo"), documentNo],
                  ],
                },
                {
                  title: t("reviewHusband"),
                  rows: [
                    [t("reviewName"), husband.fullName || t("empty")],
                    [t("reviewIdPassport"), husband.idOrPassport || t("empty")],
                    [t("reviewMarriageRef"), husband.marriageCertRef || t("empty")],
                  ],
                },
                {
                  title: t("reviewWife"),
                  rows: [
                    [t("reviewName"), wife.fullName || t("empty")],
                    [t("reviewIdPassport"), wife.idOrPassport || t("empty")],
                    [t("reviewMarriageRef"), wife.marriageCertRef || t("empty")],
                  ],
                },
                {
                  title: t("reviewRegistration"),
                  rows: [
                    [t("reviewDate"), basis.dateOfDivorce || t("empty")],
                    [t("reviewPlace"), basis.placeOfRegistration || t("empty")],
                    [t("reviewCustody"), hasChildren ? (children.custody || t("empty")) : t("empty")],
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

          {/* Step 6 — Payment */}
          {step === 6 && (
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
