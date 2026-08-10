import { useRef, useState } from "react";
import {
  ChevronLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Camera,
  X,
  RefreshCw,
  Scale,
  UserMinus,
  User,
  Users,
  Info,
} from "lucide-react";
import {
  LocationFields,
  DateField,
  ReferenceSelectView,
  useReferenceOptions,
  type ReferenceOptions,
} from "./formFields";
import {
  ValidationProvider,
  useFieldError,
  useClearServerError,
  FieldError,
  fieldErrorRing,
  scrollToFirstError,
  stepOfFirstError,
} from "./formValidation";
import { ApiError } from "../api/client";
import { applications, catalog, payments } from "../api/endpoints";
import { useMutation, useQuery } from "../api/hooks";
import { text, type ApplicationDetail, type Bilingual } from "../api/types";
import { useT, useLang } from "../i18n";
import { formatLak } from "../serviceConfig";

/*
 * Death Declaration — follows the PRD §7 (Death Declaration Form, ໃບແຈ້ງເສຍຊີວິດ,
 * Family Law No. 44/NA). Sections: Header, The Deceased, Mother, Father, Informant.
 * Approval removes the deceased from the household record (family book).
 *
 * Answers are carried under the published form schema's own keys
 * ("deceased.date_of_death", "parents.name", …); places are location-service
 * UUIDs and coded answers are reference-list codes, so the API can validate the
 * submission and name the exact field that is still missing.
 */

const SERVICE_CODE = "death";

/* ─── Types ─── */
interface UploadedFile {
  name: string;
  preview: string | null;
  /** The real file, attached to the case on submit. */
  file: File;
}

interface DeceasedInfo {
  fullName: string; // M
  fingerprint: string; // O
  gender: string; // M
  dob: string; // M
  education: string; // O
  occupation: string; // O
  workplace: string; // O
  ethnicity: string; // M
  nationality: string; // O in the schema, asked for here
  ethnicGroup: string; // O
  religion: string; // O
  maritalStatus: string; // M
  // Current address — location UUIDs
  addrHouseNo: string;
  addrVillage: string; // M
  addrDistrict: string;
  addrProvince: string; // M
  censusOrId: string; // M
  // Place of death — location UUIDs
  podVillage: string; // M
  podDistrict: string;
  podProvince: string; // M
  podCountry: string;
  // Event
  dateOfDeath: string; // M
  timeOfDeath: string; // O
  cause: string; // M
  causeOther: string; // C — when cause = "other"
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
  relationship: string; // M — relation to the deceased
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

/* Gender is a plain choice on the form schema, so its two values live here. */
const GENDERS: { value: string; label: Bilingual }[] = [
  { value: "female", label: { en: "Female", lo: "ຍິງ" } },
  { value: "male", label: { en: "Male", lo: "ຊາຍ" } },
];

/* Sentences this screen needs that the page dictionary does not carry. */
const TXT = {
  loading: { en: "Loading the service…", lo: "ກຳລັງໂຫຼດບໍລິການ…" } as Bilingual,
  loadFailed: {
    en: "We could not load this service right now.",
    lo: "ພວກເຮົາບໍ່ສາມາດໂຫຼດບໍລິການນີ້ໄດ້ໃນຕອນນີ້.",
  } as Bilingual,
  retry: { en: "Retry", lo: "ລອງໃໝ່" } as Bilingual,
  uploadTap: { en: "Tap to upload", lo: "ແຕະເພື່ອອັບໂຫຼດ" } as Bilingual,
  fileSublabel: { en: "Photo or scan • JPG, PNG", lo: "ຮູບຖ່າຍ ຫຼື ສະແກນ • JPG, PNG" } as Bilingual,
  deathNotice: {
    en: "Medical / cause-of-death note",
    lo: "ໃບຢັ້ງຢືນທາງການແພດ / ສາເຫດການເສຍຊີວິດ",
  } as Bilingual,
  payNow: { en: "Pay {amount}", lo: "ຈ່າຍ {amount}" } as Bilingual,
  receipt: { en: "Receipt No.", lo: "ເລກທີ່ໃບຮັບເງິນ" } as Bilingual,
};

const fill = (template: string, params: Record<string, string>) => {
  let out = template;
  for (const key in params) out = out.split(`{${key}}`).join(params[key]);
  return out;
};

const today = () => new Date().toISOString().slice(0, 10);

/*
 * Which step renders which schema field, so a 422 that names fields all over
 * the form can jump to the earliest offending step.
 */
const FIELD_STEP: Record<string, number> = {
  "header.province_id": 1,
  "header.district_id": 1,
  "header.village_id": 1,
  "header.document_no": 1,
  "header.dated": 1,
  "header.legal_basis": 1,
  "deceased.deceased_name": 2,
  "deceased.deceased_uin": 2,
  "deceased.deceased_fingerprint": 2,
  "deceased.deceased_gender": 2,
  "deceased.deceased_dob": 2,
  "deceased.deceased_education": 2,
  "deceased.deceased_ethnicity": 2,
  "deceased.deceased_marital": 2,
  "deceased.deceased_address": 2,
  "deceased.deceased_id_number": 2,
  "deceased.place_of_death": 2,
  "deceased.date_of_death": 2,
  "deceased.time_of_death": 2,
  "deceased.cause_of_death": 2,
  "deceased.death_notice": 2,
  "deceased.found_body": 2,
  "parents.name": 3,
  "parents.fingerprint": 3,
  "parents.dob": 3,
  "parents.ethnicity": 3,
  "parents.marital_status": 3,
  "parents.current_address": 3,
  "parents.id_number": 3,
  "parents.education": 3,
  "informant.informant_name": 5,
  "informant.informant_fingerprint": 5,
  "informant.informant_dob": 5,
  "informant.informant_ethnicity": 5,
  "informant.informant_marital": 5,
  "informant.informant_address": 5,
  "informant.informant_id_number": 5,
  "informant.informant_education": 5,
  "informant.informant_relation": 5,
  "informant.informant_phone": 5,
  "informant.informant_email": 5,
};

/* ─── Blank records ─── */
const blankDeceased: DeceasedInfo = {
  fullName: "", fingerprint: "", gender: "", dob: "", education: "", occupation: "", workplace: "",
  ethnicity: "", nationality: "lao", ethnicGroup: "", religion: "", maritalStatus: "",
  addrHouseNo: "", addrVillage: "", addrDistrict: "", addrProvince: "", censusOrId: "",
  podVillage: "", podDistrict: "", podProvince: "", podCountry: "Laos",
  dateOfDeath: "", timeOfDeath: "", cause: "", causeOther: "",
};

const blankParent: ParentInfo = {
  fullName: "", fingerprint: "", dob: "", ethnicity: "", nationality: "lao",
  ethnicGroup: "", religion: "", maritalStatus: "",
  addrHouseNo: "", addrVillage: "", addrDistrict: "", addrProvince: "",
  censusOrId: "", education: "", occupation: "", workplace: "",
};

const blankInformant: InformantInfo = {
  fullName: "", fingerprint: "", dob: "", nationality: "lao", maritalStatus: "",
  addrHouseNo: "", addrVillage: "", addrDistrict: "", addrProvince: "",
  censusOrId: "", education: "", relationship: "", phone: "", email: "",
};

/* ─── Reference lists, loaded once for the whole form ─── */
interface RefLists {
  ethnicity: ReferenceOptions;
  nationality: ReferenceOptions;
  ethnicGroup: ReferenceOptions;
  religion: ReferenceOptions;
  education: ReferenceOptions;
  marital: ReferenceOptions;
  relation: ReferenceOptions;
  cause: ReferenceOptions;
}

function useRefLists(): RefLists {
  return {
    ethnicity: useReferenceOptions("ethnicity"),
    nationality: useReferenceOptions("nationality"),
    ethnicGroup: useReferenceOptions("ethnic-group"),
    religion: useReferenceOptions("religion"),
    education: useReferenceOptions("education-level"),
    marital: useReferenceOptions("marital-status"),
    relation: useReferenceOptions("relation"),
    cause: useReferenceOptions("cause-of-death"),
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
  label, value, placeholder, onChange, required, inputMode, maxLength, path,
}: {
  label: React.ReactNode; value: string; placeholder: string;
  onChange: (v: string) => void; required?: boolean;
  inputMode?: "text" | "numeric" | "tel" | "email"; maxLength?: number;
  /** form_data key, so a 422 lands on this field. */
  path?: string;
}) {
  const { hasError, message } = useFieldError({ path, required, value });
  const clearServerError = useClearServerError();
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        type="text"
        inputMode={inputMode}
        maxLength={maxLength}
        value={value}
        onChange={(e) => { clearServerError(path); onChange(e.target.value); }}
        placeholder={placeholder}
        className={`w-full bg-white border rounded-2xl px-4 py-3.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all ${fieldErrorRing(hasError)}`}
      />
      <FieldError show={hasError} message={message} />
    </div>
  );
}

function SelectField({
  label, value, options, placeholder, onChange, required, path,
}: {
  label: React.ReactNode; value: string; options: { value: string; label: string }[];
  placeholder: string; onChange: (v: string) => void; required?: boolean; path?: string;
}) {
  const { hasError, message } = useFieldError({ path, required, value });
  const clearServerError = useClearServerError();
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => { clearServerError(path); onChange(e.target.value); }}
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
      <FieldError show={hasError} message={message} />
    </div>
  );
}

function UploadBox({
  label, sublabel, file, onChange, required = true, path,
}: {
  label: React.ReactNode; sublabel: string;
  file: UploadedFile | null; onChange: (f: UploadedFile | null) => void;
  required?: boolean; path?: string;
}) {
  const { lang } = useLang();
  const inputRef = useRef<HTMLInputElement>(null);
  const { hasError, message } = useFieldError({ path, required, value: file });
  const clearServerError = useClearServerError();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    clearServerError(path);
    const reader = new FileReader();
    reader.onload = (ev) =>
      onChange({ name: picked.name, preview: ev.target?.result as string | null, file: picked });
    reader.readAsDataURL(picked);
  };

  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input ref={inputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFile} />
      {file ? (
        <div className="relative rounded-2xl overflow-hidden border-2 border-green-300 bg-green-50">
          {file.preview && file.file.type.startsWith("image/")
            ? <img src={file.preview} alt={typeof label === "string" ? label : "upload"} className="w-full h-40 object-cover" />
            : <div className="h-40 flex items-center justify-center"><Camera className="w-8 h-8 text-green-400" /></div>
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
          className={`w-full h-40 rounded-2xl border-2 border-dashed ${hasError ? "border-red-300" : "border-gray-200"} bg-gray-50 hover:border-[#344EAD]/40 hover:bg-blue-50/50 transition-all flex flex-col items-center justify-center gap-2.5 group`}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform" style={{ backgroundColor: "#EEF2FF" }}>
            <Camera className="w-7 h-7" style={{ color: "#344EAD" }} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-600 group-hover:text-[#344EAD] transition-colors">{text(TXT.uploadTap, lang)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>
          </div>
        </button>
      )}
      <FieldError show={hasError} message={message} />
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
  t, houseNo, village, district, province, onChange, required = true, villagePath,
}: {
  t: DeathT;
  houseNo: string; village: string; district: string; province: string;
  onChange: (patch: Partial<{ addrHouseNo: string; addrVillage: string; addrDistrict: string; addrProvince: string }>) => void;
  required?: boolean;
  /** The schema keeps one address key per section — the village. */
  villagePath?: string;
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
        valueMode="id"
        province={province}
        district={district}
        village={village}
        villageLabel={t("villageLabel")}
        required={required}
        paths={{ village: villagePath }}
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
  t, value, onChange, refs, prefix,
}: {
  t: DeathT; value: ParentInfo; onChange: (patch: Partial<ParentInfo>) => void;
  refs: RefLists;
  /** "parents" for the mother (the key the schema validates), "parents.father". */
  prefix: string;
}) {
  const at = (key: string) => `${prefix}.${key}`;
  return (
    <>
      <InputField
        label={t("fullName")}
        value={value.fullName}
        placeholder={t("phFullName")}
        onChange={(v) => onChange({ fullName: v })}
        required
        path={at("name")}
      />
      <div className="grid grid-cols-2 gap-3">
        <DateField
          label={t("dobOptional")}
          value={value.dob}
          onChange={(v) => onChange({ dob: v })}
          path={at("dob")}
        />
        <ReferenceSelectView
          label={t("maritalStatusOptional")}
          source={refs.marital}
          value={value.maritalStatus}
          placeholder={t("phSelect")}
          onChange={(v) => onChange({ maritalStatus: v })}
          path={at("marital_status")}
        />
      </div>

      <SectionLabel>{t("secDemographics")}</SectionLabel>
      <div className="grid grid-cols-2 gap-3">
        <ReferenceSelectView
          label={t("ethnicity")}
          source={refs.ethnicity}
          value={value.ethnicity}
          placeholder={t("phSelect")}
          onChange={(v) => onChange({ ethnicity: v })}
          path={at("ethnicity")}
        />
        <ReferenceSelectView
          label={t("nationality")}
          source={refs.nationality}
          value={value.nationality}
          placeholder={t("phSelect")}
          onChange={(v) => onChange({ nationality: v })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <ReferenceSelectView
          label={t("ethnicGroup")}
          source={refs.ethnicGroup}
          value={value.ethnicGroup}
          placeholder={t("phSelect")}
          onChange={(v) => onChange({ ethnicGroup: v })}
        />
        <ReferenceSelectView
          label={t("religion")}
          source={refs.religion}
          value={value.religion}
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
        villagePath={at("current_address")}
      />

      <InputField
        label={t("censusOrIdOptional")}
        value={value.censusOrId}
        placeholder={t("phOneIdentifier")}
        onChange={(v) => onChange({ censusOrId: v })}
        path={at("id_number")}
      />

      <SectionLabel>{t("secEducationWork")}</SectionLabel>
      <div className="grid grid-cols-2 gap-3">
        <ReferenceSelectView
          label={t("educationLevel")}
          source={refs.education}
          value={value.education}
          placeholder={t("phSelect")}
          onChange={(v) => onChange({ education: v })}
          path={at("education")}
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
          path={at("fingerprint")}
        />
      </div>
    </>
  );
}

/* ─── Parent step with a "deceased / unknown" toggle (PRD §7.4 note) ─── */
function ParentStep({
  t, intro, value, onChange, skip, onToggleSkip, refs, prefix,
}: {
  t: DeathT; intro: string; value: ParentInfo; onChange: (patch: Partial<ParentInfo>) => void;
  skip: boolean; onToggleSkip: () => void; refs: RefLists; prefix: string;
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

      {!skip && <ParentSection t={t} value={value} onChange={onChange} refs={refs} prefix={prefix} />}
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

interface PlaceNames {
  province: string;
  district: string;
  village: string;
}
const blankPlace: PlaceNames = { province: "", district: "", village: "" };

export function DeathDeclarationPage({ onBack }: DeathDeclarationPageProps) {
  const t = useT("death");
  const { lang } = useLang();
  const [step, setStep] = useState(1);
  const [showErrors, setShowErrors] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<ApplicationDetail | null>(null);
  const [receiptNo, setReceiptNo] = useState<string | undefined>(undefined);

  /* ── Catalogue ── */
  const serviceQuery = useQuery((signal) => catalog.service(SERVICE_CODE, signal), []);
  const pricingQuery = useQuery((signal) => catalog.pricing(SERVICE_CODE, signal), []);
  const methodsQuery = useQuery((signal) => payments.methods(signal), []);
  const refs = useRefLists();

  const fee = pricingQuery.data?.fee_lak ?? serviceQuery.data?.fee_lak ?? 0;

  const [header, setHeader] = useState({ province: "", district: "", village: "" });
  const [headerNames, setHeaderNames] = useState<PlaceNames>(blankPlace);
  const [podNames, setPodNames] = useState<PlaceNames>(blankPlace);
  const [deceased, setDeceased] = useState<DeceasedInfo>(blankDeceased);
  const [deathNotice, setDeathNotice] = useState<UploadedFile | null>(null);
  const [mother, setMother] = useState<ParentInfo>(blankParent);
  const [motherSkip, setMotherSkip] = useState(false);
  const [father, setFather] = useState<ParentInfo>(blankParent);
  const [fatherSkip, setFatherSkip] = useState(false);
  const [informant, setInformant] = useState<InformantInfo>(blankInformant);

  const patchDeceased = (patch: Partial<DeceasedInfo>) => setDeceased((p) => ({ ...p, ...patch }));
  const patchMother = (patch: Partial<ParentInfo>) => setMother((p) => ({ ...p, ...patch }));
  const patchFather = (patch: Partial<ParentInfo>) => setFather((p) => ({ ...p, ...patch }));
  const patchInformant = (patch: Partial<InformantInfo>) => setInformant((p) => ({ ...p, ...patch }));

  const clearServerError = (path?: string) => {
    if (!path) return;
    setServerErrors((prev) =>
      path in prev ? Object.fromEntries(Object.entries(prev).filter(([k]) => k !== path)) : prev,
    );
  };

  const keepPlace = (setter: (p: PlaceNames) => void) =>
    (r: { province_name: string; district_name: string; village_name: string }) =>
      setter({ province: r.province_name, district: r.district_name, village: r.village_name });

  const genderOptions = GENDERS.map((g) => ({ value: g.value, label: text(g.label, lang) }));
  const genderLabel = (value: string) =>
    genderOptions.find((g) => g.value === value)?.label ?? "";

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
        deceased.dateOfDeath.trim() && deceased.cause && deathNotice &&
        (deceased.cause !== "other" || deceased.causeOther.trim())
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

  /* ── Building the submission ── */
  const [draft, setDraft] = useState<{ id: string; reference_no: string } | null>(null);
  const uploaded = useRef<Set<string>>(new Set());

  const parentData = (p: ParentInfo, prefix: string, skipped: boolean): Record<string, unknown> =>
    skipped
      ? { [`${prefix}.status`]: "deceased-or-unknown" }
      : {
          [`${prefix}.name`]: p.fullName,
          [`${prefix}.fingerprint`]: p.fingerprint,
          [`${prefix}.dob`]: p.dob,
          [`${prefix}.ethnicity`]: p.ethnicity,
          [`${prefix}.nationality`]: p.nationality,
          [`${prefix}.ethnic_group`]: p.ethnicGroup,
          [`${prefix}.religion`]: p.religion,
          [`${prefix}.marital_status`]: p.maritalStatus,
          [`${prefix}.current_address`]: p.addrVillage,
          [`${prefix}.house_no`]: p.addrHouseNo,
          [`${prefix}.id_number`]: p.censusOrId,
          [`${prefix}.education`]: p.education,
          [`${prefix}.occupation`]: p.occupation,
          [`${prefix}.workplace`]: p.workplace,
        };

  const buildFormData = (): Record<string, unknown> => ({
    "header.province_id": header.province,
    "header.district_id": header.district,
    "header.village_id": header.village,
    "header.dated": today(),
    "header.legal_basis": t("legalBasisText"),

    "deceased.deceased_name": deceased.fullName,
    "deceased.deceased_fingerprint": deceased.fingerprint,
    "deceased.deceased_gender": deceased.gender,
    "deceased.deceased_dob": deceased.dob,
    "deceased.deceased_education": deceased.education,
    "deceased.deceased_occupation": deceased.occupation,
    "deceased.deceased_workplace": deceased.workplace,
    "deceased.deceased_ethnicity": deceased.ethnicity,
    "deceased.deceased_nationality": deceased.nationality,
    "deceased.deceased_ethnic_group": deceased.ethnicGroup,
    "deceased.deceased_religion": deceased.religion,
    "deceased.deceased_marital": deceased.maritalStatus,
    "deceased.deceased_address": deceased.addrVillage,
    "deceased.house_no": deceased.addrHouseNo,
    "deceased.deceased_id_number": deceased.censusOrId,
    "deceased.place_of_death": deceased.podVillage,
    "deceased.place_of_death_country": deceased.podCountry,
    "deceased.date_of_death": deceased.dateOfDeath,
    "deceased.time_of_death": deceased.timeOfDeath,
    "deceased.cause_of_death": deceased.cause,
    "deceased.cause_of_death_other": deceased.causeOther,

    // The schema keeps one mandatory set for "Parents of the deceased"; the
    // mother carries it, and each instance is also stored under its own key.
    ...parentData(mother, "parents", motherSkip),
    ...parentData(mother, "parents.mother", motherSkip),
    ...parentData(father, "parents.father", fatherSkip),

    "informant.informant_name": informant.fullName,
    "informant.informant_fingerprint": informant.fingerprint,
    "informant.informant_dob": informant.dob,
    "informant.informant_nationality": informant.nationality,
    "informant.informant_marital": informant.maritalStatus,
    "informant.informant_address": informant.addrVillage,
    "informant.informant_house_no": informant.addrHouseNo,
    "informant.informant_id_number": informant.censusOrId,
    "informant.informant_education": informant.education,
    "informant.informant_relation": informant.relationship,
    "informant.informant_phone": informant.phone,
    "informant.informant_email": informant.email,
  });

  const methodCode = (): string => {
    const found = (methodsQuery.data ?? []).find((m) => m.kind === "qr" && m.enabled)
      ?? (methodsQuery.data ?? []).find((m) => m.enabled);
    return found?.code ?? "laoqr";
  };

  const submitCase = useMutation(async () => {
    const payload = buildFormData();

    let current = draft;
    if (!current) {
      const created = await applications.create({
        service_code: SERVICE_CODE,
        province_id: header.province || undefined,
        district_id: header.district || undefined,
        village_id: header.village || undefined,
        event_date: deceased.dateOfDeath || today(),
        form_data: payload,
      });
      current = { id: created.id, reference_no: created.reference_no };
      setDraft(current);
    }

    // The document number is the case's own reference, which only exists once
    // the case does.
    await applications.update(current.id, {
      form_data: { ...payload, "header.document_no": current.reference_no },
      event_date: deceased.dateOfDeath || today(),
    });

    if (deathNotice && !uploaded.current.has("deceased.death_notice")) {
      await applications.addAttachment(current.id, deathNotice.file, "deceased.death_notice", "document");
      uploaded.current.add("deceased.death_notice");
    }

    return applications.submit(current.id);
  });

  const payCase = useMutation(async (applicationId: string) => {
    const result = (await applications.pay(applicationId, { method_code: methodCode() })) as unknown as {
      receipt_no?: string;
      transaction?: { receipt_no?: string };
    };
    return result.receipt_no ?? result.transaction?.receipt_no;
  });

  const goBack = () => {
    setShowErrors(false);
    if (step > 1) setStep((s) => s - 1);
    else onBack();
  };

  const handleNext = async () => {
    // The button is never disabled (PRD), so a second tap while the first
    // submission is still in flight is ignored here rather than in the markup.
    if (submitCase.pending) return;
    // Tapping an incomplete step reveals inline errors instead of advancing.
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
      setSubmitted(await submitCase.run(undefined));
    } catch (err) {
      // 422 answers with one entry per missing mandatory field: show them all
      // and move to the earliest step that owns one.
      if (err instanceof ApiError && err.isValidation && err.fields.length) {
        const map = err.fieldMap();
        setServerErrors(map);
        const target = stepOfFirstError(Object.keys(map), FIELD_STEP);
        if (target) setStep(target);
        scrollToFirstError();
      }
    }
  };

  const handlePay = async () => {
    if (!submitted || payCase.pending) return;
    try {
      setReceiptNo(await payCase.run(submitted.id));
    } catch {
      /* the failure is rendered from payCase.error */
    }
  };

  /* ── Loading the service catalogue ── */
  if (serviceQuery.loading && !serviceQuery.data) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center p-6 gap-3">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#344EAD" }} />
        <p className="text-sm text-gray-400">{text(TXT.loading, lang)}</p>
      </div>
    );
  }

  if (serviceQuery.error && !serviceQuery.data) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm flex flex-col items-center text-center gap-4">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-sm text-gray-600">{text(TXT.loadFailed, lang)}</p>
          <p className="text-xs text-gray-400">{serviceQuery.error.message}</p>
          <button
            onClick={serviceQuery.refetch}
            className="w-full py-4 rounded-2xl text-white font-semibold shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            style={{ backgroundColor: "#344EAD" }}
          >
            <RefreshCw className="w-4 h-4" />
            {text(TXT.retry, lang)}
          </button>
          <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600">
            {t("backToHome")}
          </button>
        </div>
      </div>
    );
  }

  /* ── Success ── */
  if (submitted) {
    const unpaid = submitted.fee_lak > 0 && !receiptNo;
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
              { label: t("sumDocumentNo"), value: submitted.reference_no },
              { label: t("sumInformant"), value: informant.fullName || t("dash") },
              { label: t("sumFee"), value: formatLak(submitted.fee_lak, lang) },
              ...(receiptNo ? [{ label: text(TXT.receipt, lang), value: receiptNo }] : []),
              {
                label: t("sumEstReview"),
                value: serviceQuery.data ? text(serviceQuery.data.processing_time, lang) : t("sumEstReviewValue"),
              },
              { label: t("sumStatus"), value: text(submitted.status_label, lang), isStatus: true },
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

          {payCase.error && <p className="text-xs text-red-500">{payCase.error.message}</p>}

          {unpaid && (
            <button
              onClick={handlePay}
              className="w-full py-4 rounded-2xl text-white font-semibold shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: "#344EAD" }}
            >
              {payCase.pending && <Loader2 className="w-4 h-4 animate-spin" />}
              {fill(text(TXT.payNow, lang), { amount: formatLak(submitted.fee_lak, lang) })}
            </button>
          )}

          <button
            onClick={onBack}
            className={`w-full py-4 rounded-2xl font-semibold transition-opacity ${
              unpaid ? "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50" : "text-white shadow-lg hover:opacity-90"
            }`}
            style={unpaid ? undefined : { backgroundColor: "#344EAD" }}
          >
            {t("backToHome")}
          </button>
          <p className="text-xs text-gray-400">{t("trackHint")}</p>
        </div>
      </div>
    );
  }

  const submitError = submitCase.error;

  return (
    <ValidationProvider
      showErrors={showErrors}
      serverErrors={serverErrors}
      onClearServerError={clearServerError}
    >
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

          {/* What the API said about the last submission */}
          {submitError && (
            <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-red-50 border border-red-100">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
              <p className="text-xs text-red-600 leading-relaxed">{submitError.message}</p>
            </div>
          )}

          {/* Step 1 — Header */}
          {step === 1 && (
            <>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-100">
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{t("documentNo")}</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{draft?.reference_no ?? "—"}</p>
                </div>
                <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                  {t("autoGenerated")}
                </span>
              </div>

              <LocationFields
                valueMode="id"
                province={header.province}
                district={header.district}
                village={header.village}
                villageLabel={t("villageLabel")}
                required
                paths={{
                  province: "header.province_id",
                  district: "header.district_id",
                  village: "header.village_id",
                }}
                onResolve={keepPlace(setHeaderNames)}
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
                path="deceased.deceased_name"
              />
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label={t("gender")}
                  value={deceased.gender}
                  options={genderOptions}
                  placeholder={t("phSelect")}
                  onChange={(v) => patchDeceased({ gender: v })}
                  required
                  path="deceased.deceased_gender"
                />
                <DateField
                  label={t("dob")}
                  value={deceased.dob}
                  onChange={(v) => patchDeceased({ dob: v })}
                  required
                  path="deceased.deceased_dob"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ReferenceSelectView
                  label={t("ethnicity")}
                  source={refs.ethnicity}
                  value={deceased.ethnicity}
                  placeholder={t("phSelect")}
                  onChange={(v) => patchDeceased({ ethnicity: v })}
                  required
                  path="deceased.deceased_ethnicity"
                />
                <ReferenceSelectView
                  label={t("nationality")}
                  source={refs.nationality}
                  value={deceased.nationality}
                  placeholder={t("phSelect")}
                  onChange={(v) => patchDeceased({ nationality: v })}
                  required
                />
              </div>
              <ReferenceSelectView
                label={t("maritalStatus")}
                source={refs.marital}
                value={deceased.maritalStatus}
                placeholder={t("phSelect")}
                onChange={(v) => patchDeceased({ maritalStatus: v })}
                required
                path="deceased.deceased_marital"
              />

              <SectionLabel>{t("secCurrentAddress")}</SectionLabel>
              <AddressFields
                t={t}
                houseNo={deceased.addrHouseNo}
                village={deceased.addrVillage}
                district={deceased.addrDistrict}
                province={deceased.addrProvince}
                onChange={patchDeceased}
                villagePath="deceased.deceased_address"
              />
              <InputField
                label={t("censusOrId")}
                value={deceased.censusOrId}
                placeholder={t("phOneIdentifier")}
                onChange={(v) => patchDeceased({ censusOrId: v })}
                required
                path="deceased.deceased_id_number"
              />

              <SectionLabel>{t("secPlaceOfDeath")}</SectionLabel>
              <LocationFields
                valueMode="id"
                province={deceased.podProvince}
                district={deceased.podDistrict}
                village={deceased.podVillage}
                villageLabel={t("villageLabel")}
                required
                paths={{ village: "deceased.place_of_death" }}
                onResolve={keepPlace(setPodNames)}
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
                  path="deceased.date_of_death"
                />
                <InputField
                  label={t("timeOfDeathOptional")}
                  value={deceased.timeOfDeath}
                  placeholder={t("phTime")}
                  onChange={(v) => patchDeceased({ timeOfDeath: v })}
                  path="deceased.time_of_death"
                />
              </div>
              <ReferenceSelectView
                label={t("causeOfDeath")}
                source={refs.cause}
                value={deceased.cause}
                placeholder={t("phSelect")}
                onChange={(v) => patchDeceased({ cause: v })}
                required
                path="deceased.cause_of_death"
              />
              {deceased.cause === "other" && (
                <InputField
                  label={t("causeSpecify")}
                  value={deceased.causeOther}
                  placeholder={t("phSpecifyCause")}
                  onChange={(v) => patchDeceased({ causeOther: v })}
                  required
                />
              )}
              <UploadBox
                label={text(TXT.deathNotice, lang)}
                sublabel={text(TXT.fileSublabel, lang)}
                file={deathNotice}
                onChange={setDeathNotice}
                required
                path="deceased.death_notice"
              />

              <SectionLabel>{t("secEducationWork")}</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <ReferenceSelectView
                  label={t("educationLevel")}
                  source={refs.education}
                  value={deceased.education}
                  placeholder={t("phSelect")}
                  onChange={(v) => patchDeceased({ education: v })}
                  path="deceased.deceased_education"
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
                  path="deceased.deceased_fingerprint"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ReferenceSelectView
                  label={t("ethnicGroup")}
                  source={refs.ethnicGroup}
                  value={deceased.ethnicGroup}
                  placeholder={t("phSelect")}
                  onChange={(v) => patchDeceased({ ethnicGroup: v })}
                  required
                />
                <ReferenceSelectView
                  label={t("religion")}
                  source={refs.religion}
                  value={deceased.religion}
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
              refs={refs}
              prefix="parents"
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
              refs={refs}
              prefix="parents.father"
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
                path="informant.informant_name"
              />
              <div className="grid grid-cols-2 gap-3">
                <DateField
                  label={t("dob")}
                  value={informant.dob}
                  onChange={(v) => patchInformant({ dob: v })}
                  required
                  path="informant.informant_dob"
                />
                <ReferenceSelectView
                  label={t("relationshipToDeceased")}
                  source={refs.relation}
                  value={informant.relationship}
                  placeholder={t("phSelect")}
                  onChange={(v) => patchInformant({ relationship: v })}
                  required
                  path="informant.informant_relation"
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
                villagePath="informant.informant_address"
              />

              <InputField
                label={t("censusOrId")}
                value={informant.censusOrId}
                placeholder={t("phOneIdentifier")}
                onChange={(v) => patchInformant({ censusOrId: v })}
                required
                path="informant.informant_id_number"
              />
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label={t("phoneNumber")}
                  value={informant.phone}
                  placeholder={t("phPhone")}
                  inputMode="tel"
                  onChange={(v) => patchInformant({ phone: v })}
                  required
                  path="informant.informant_phone"
                />
                <InputField
                  label={t("emailOptional")}
                  value={informant.email}
                  placeholder={t("phEmail")}
                  inputMode="email"
                  onChange={(v) => patchInformant({ email: v })}
                  path="informant.informant_email"
                />
              </div>

              <SectionLabel>{t("secAdditionalDetails")}</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <ReferenceSelectView
                  label={t("maritalStatus")}
                  source={refs.marital}
                  value={informant.maritalStatus}
                  placeholder={t("phSelect")}
                  onChange={(v) => patchInformant({ maritalStatus: v })}
                  path="informant.informant_marital"
                />
                <ReferenceSelectView
                  label={t("educationLevel")}
                  source={refs.education}
                  value={informant.education}
                  placeholder={t("phSelect")}
                  onChange={(v) => patchInformant({ education: v })}
                  path="informant.informant_education"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ReferenceSelectView
                  label={t("nationality")}
                  source={refs.nationality}
                  value={informant.nationality}
                  placeholder={t("phSelect")}
                  onChange={(v) => patchInformant({ nationality: v })}
                />
                <InputField
                  label={t("fingerprintCode")}
                  value={informant.fingerprint}
                  placeholder={t("phBiometric")}
                  onChange={(v) => patchInformant({ fingerprint: v })}
                  path="informant.informant_fingerprint"
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
                    [t("rowProvinceDistrictVillage"), [headerNames.province, headerNames.district, headerNames.village].filter(Boolean).join(" / ") || t("dash")],
                    [t("documentNo"), draft?.reference_no ?? t("dash")],
                  ],
                },
                {
                  title: t("step2Title"),
                  rows: [
                    [t("rowName"), deceased.fullName || t("dash")],
                    [t("rowGenderDob"), [genderLabel(deceased.gender), deceased.dob].filter(Boolean).join(" · ") || t("dash")],
                    [t("rowPlaceOfDeath"), [podNames.village, podNames.district, podNames.province].filter(Boolean).join(", ") || t("dash")],
                    [t("rowDateCause"), [deceased.dateOfDeath, deceased.cause === "other" ? deceased.causeOther : refs.cause.labelOf(deceased.cause)].filter(Boolean).join(" · ") || t("dash")],
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
                    [t("rowRelationship"), refs.relation.labelOf(informant.relationship) || t("dash")],
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
            className="w-full h-14 rounded-2xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-md"
            style={{
              backgroundColor: submitCase.pending ? "#C7D2FE" : "#344EAD",
              cursor: "pointer",
            }}
          >
            {submitCase.pending ? (
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
