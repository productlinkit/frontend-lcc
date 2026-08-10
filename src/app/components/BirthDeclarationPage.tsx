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
  Baby,
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
 * Birth Declaration — follows the PRD §6 (Birth Declaration Form, ໃບແຈ້ງເກີດ,
 * Family Law No. 44/NA). Sections: Header, The Child, Mother, Father, Informant.
 *
 * Every answer is carried under the key the service's published form schema
 * uses ("child.child_dob", "parents.name", …). Places are the location
 * service's UUIDs and every coded answer is a reference-list code, so the API
 * can validate the submission and name the exact field that is still missing.
 */

const SERVICE_CODE = "birth";

/* ─── Types ─── */
interface UploadedFile {
  name: string;
  preview: string | null;
  /** The real file, attached to the case on submit. */
  file: File;
}

interface ChildInfo {
  fullName: string; // M
  gender: string; // M
  dob: string; // M
  weight: string; // M
  height: string; // M
  fingerprint: string; // O
  bloodType: string; // O
  deliveryMode: string; // O
  deliveryAssistedBy: string; // O
  birthType: string; // M — single / twins
  birthOrder: string; // M — child number
  ethnicity: string; // M
  nationality: string; // M
  religion: string; // O in the schema, asked for here
  // Place of birth — location UUIDs
  pobProvince: string; // M
  pobDistrict: string; // M
  pobVillage: string; // M
  pobCountry: string;
  // Current address — location UUIDs
  addrHouseNo: string;
  addrVillage: string; // M
  addrDistrict: string;
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
  relationship: string; // M — relation to the child
  phone: string; // M
  email: string; // O
}

/* ─── i18n option helpers ─── */
type BirthKey = Parameters<ReturnType<typeof useT<"birth">>>[0];
type Opt = { value: string; labelKey: BirthKey };

/* Gender is a plain choice on the form schema, so its two values live here. */
const GENDERS: Opt[] = [
  { value: "female", labelKey: "optFemale" },
  { value: "male", labelKey: "optMale" },
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
  hospitalNotice: {
    en: "Hospital / clinic birth notice",
    lo: "ໃບແຈ້ງເກີດຈາກໂຮງໝໍ / ຄລີນິກ",
  } as Bilingual,
  payNow: { en: "Pay {amount}", lo: "ຈ່າຍ {amount}" } as Bilingual,
  receipt: { en: "Receipt No.", lo: "ເລກທີ່ໃບຮັບເງິນ" } as Bilingual,
  paid: { en: "Paid", lo: "ຈ່າຍແລ້ວ" } as Bilingual,
};

const fill = (template: string, params: Record<string, string>) => {
  let out = template;
  for (const key in params) out = out.split(`{${key}}`).join(params[key]);
  return out;
};

const today = () => new Date().toISOString().slice(0, 10);

/* ─── Blank records ─── */
const blankChild: ChildInfo = {
  fullName: "", gender: "", dob: "", weight: "", height: "", fingerprint: "",
  bloodType: "", deliveryMode: "", deliveryAssistedBy: "", birthType: "", birthOrder: "",
  ethnicity: "", nationality: "lao", religion: "",
  pobProvince: "", pobDistrict: "", pobVillage: "", pobCountry: "Laos",
  addrHouseNo: "", addrVillage: "", addrDistrict: "", addrProvince: "",
  twinName: "", twinGender: "",
};

const blankParent: ParentInfo = {
  fullName: "", fingerprint: "", dob: "", ethnicity: "", nationality: "lao",
  ethnicGroup: "", religion: "", maritalStatus: "",
  addrHouseNo: "", addrVillage: "", addrDistrict: "", addrProvince: "",
  censusOrId: "", education: "", occupation: "",
};

const blankInformant: InformantInfo = {
  fullName: "", fingerprint: "", dob: "", ethnicity: "", nationality: "lao",
  ethnicGroup: "", religion: "", maritalStatus: "",
  addrHouseNo: "", addrVillage: "", addrDistrict: "", addrProvince: "",
  censusOrId: "", education: "", relationship: "", phone: "", email: "",
};

/*
 * Which step renders which schema field. A 422 names every missing mandatory
 * field at once, so this is what lets the form jump to the earliest one.
 */
const FIELD_STEP: Record<string, number> = {
  "header.province_id": 1,
  "header.district_id": 1,
  "header.village_id": 1,
  "header.document_no": 1,
  "header.dated": 1,
  "header.legal_basis": 1,
  "child.child_name": 2,
  "child.child_gender": 2,
  "child.child_dob": 2,
  "child.child_weight_kg": 2,
  "child.child_height_cm": 2,
  "child.child_fingerprint": 2,
  "child.child_blood_type": 2,
  "child.delivery_mode": 2,
  "child.birth_type": 2,
  "child.birth_order": 2,
  "child.child_ethnicity": 2,
  "child.child_nationality": 2,
  "child.child_religion": 2,
  "child.place_of_birth": 2,
  "child.current_address": 2,
  "child.twin_name": 2,
  "child.hospital_notice": 2,
  "parents.name": 3,
  "parents.fingerprint": 3,
  "parents.dob": 3,
  "parents.ethnicity": 3,
  "parents.nationality": 3,
  "parents.ethnic_group": 3,
  "parents.religion": 3,
  "parents.marital_status": 3,
  "parents.current_address": 3,
  "parents.id_number": 3,
  "parents.education": 3,
  "parents.occupation": 3,
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

/* ─── Reference lists, loaded once for the whole form ─── */
interface RefLists {
  ethnicity: ReferenceOptions;
  nationality: ReferenceOptions;
  ethnicGroup: ReferenceOptions;
  religion: ReferenceOptions;
  education: ReferenceOptions;
  marital: ReferenceOptions;
  relation: ReferenceOptions;
  blood: ReferenceOptions;
  delivery: ReferenceOptions;
  birthType: ReferenceOptions;
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
    blood: useReferenceOptions("blood-type"),
    delivery: useReferenceOptions("delivery-mode"),
    birthType: useReferenceOptions("birth-type"),
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

/* ─── Reusable address group ─── */
function AddressFields({
  houseNo, village, district, province, onChange, withHouseNo = true, required = true, villagePath,
}: {
  houseNo: string; village: string; district: string; province: string;
  onChange: (patch: Partial<{ addrHouseNo: string; addrVillage: string; addrDistrict: string; addrProvince: string }>) => void;
  withHouseNo?: boolean; required?: boolean;
  /** The schema keeps one address key per section — the village. */
  villagePath?: string;
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
        valueMode="id"
        province={province}
        district={district}
        village={village}
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

/* ─── Parent section (Mother / Father share the same structure, PRD §6.4) ─── */
function ParentSection({
  value, onChange, refs, prefix, required = true,
}: {
  value: ParentInfo;
  onChange: (patch: Partial<ParentInfo>) => void;
  refs: RefLists;
  /** "parents" for the mother (the key the schema validates), "parents.father". */
  prefix: string;
  required?: boolean;
}) {
  const t = useT("birth");
  const at = (key: string) => `${prefix}.${key}`;
  return (
    <>
      <InputField
        label={t("fullNameLabel")}
        value={value.fullName}
        placeholder={t("parentNamePlaceholder")}
        onChange={(v) => onChange({ fullName: v })}
        required={required}
        path={at("name")}
      />
      <div className="grid grid-cols-2 gap-3">
        <DateField
          label={t("dobLabel")}
          value={value.dob}
          onChange={(v) => onChange({ dob: v })}
          required={required}
          path={at("dob")}
        />
        <ReferenceSelectView
          label={t("maritalStatusLabel")}
          source={refs.marital}
          value={value.maritalStatus}
          placeholder={t("selectPlaceholder")}
          onChange={(v) => onChange({ maritalStatus: v })}
          required={required}
          path={at("marital_status")}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <ReferenceSelectView
          label={t("ethnicityLabel")}
          source={refs.ethnicity}
          value={value.ethnicity}
          placeholder={t("selectPlaceholder")}
          onChange={(v) => onChange({ ethnicity: v })}
          required={required}
          path={at("ethnicity")}
        />
        <ReferenceSelectView
          label={t("nationalityLabel")}
          source={refs.nationality}
          value={value.nationality}
          placeholder={t("selectPlaceholder")}
          onChange={(v) => onChange({ nationality: v })}
          required={required}
          path={at("nationality")}
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
        villagePath={at("current_address")}
      />

      <InputField
        label={t("censusOrIdLabel")}
        value={value.censusOrId}
        placeholder={t("censusOrIdPlaceholder")}
        onChange={(v) => onChange({ censusOrId: v })}
        required={required}
        path={at("id_number")}
      />

      <SectionLabel>{t("additionalDetailsSection")}</SectionLabel>
      <div className="grid grid-cols-2 gap-3">
        <ReferenceSelectView
          label={t("ethnicGroupLabel")}
          source={refs.ethnicGroup}
          value={value.ethnicGroup}
          placeholder={t("selectPlaceholder")}
          onChange={(v) => onChange({ ethnicGroup: v })}
          path={at("ethnic_group")}
        />
        <ReferenceSelectView
          label={t("religionLabel")}
          source={refs.religion}
          value={value.religion}
          placeholder={t("selectPlaceholder")}
          onChange={(v) => onChange({ religion: v })}
          path={at("religion")}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <ReferenceSelectView
          label={t("educationLabel")}
          source={refs.education}
          value={value.education}
          placeholder={t("selectPlaceholder")}
          onChange={(v) => onChange({ education: v })}
          path={at("education")}
        />
        <InputField
          label={t("occupationLabel")}
          value={value.occupation}
          placeholder={t("occupationPlaceholder")}
          onChange={(v) => onChange({ occupation: v })}
          path={at("occupation")}
        />
      </div>
      <InputField
        label={t("fingerprintLabel")}
        value={value.fingerprint}
        placeholder={t("parentFingerprintPlaceholder")}
        onChange={(v) => onChange({ fingerprint: v })}
        path={at("fingerprint")}
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

interface PlaceNames {
  province: string;
  district: string;
  village: string;
}
const blankPlace: PlaceNames = { province: "", district: "", village: "" };

export function BirthDeclarationPage({ onBack }: BirthDeclarationPageProps) {
  const t = useT("birth");
  const { lang } = useLang();
  const opts = (list: Opt[]) => list.map((o) => ({ value: o.value, label: t(o.labelKey) }));

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
  const [pobNames, setPobNames] = useState<PlaceNames>(blankPlace);
  const [child, setChild] = useState<ChildInfo>(blankChild);
  const [hospitalNotice, setHospitalNotice] = useState<UploadedFile | null>(null);
  const [mother, setMother] = useState<ParentInfo>(blankParent);
  const [father, setFather] = useState<ParentInfo>(blankParent);
  const [fatherUnknown, setFatherUnknown] = useState(false);
  const [informant, setInformant] = useState<InformantInfo>(blankInformant);

  const patchChild = (patch: Partial<ChildInfo>) => setChild((p) => ({ ...p, ...patch }));
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
        hospitalNotice &&
        (child.birthType !== "twins" || child.twinName.trim())
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

  /* ── Building the submission ── */
  const [draft, setDraft] = useState<{ id: string; reference_no: string } | null>(null);
  const uploaded = useRef<Set<string>>(new Set());

  const parentData = (p: ParentInfo, prefix: string): Record<string, unknown> => ({
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
  });

  const buildFormData = (): Record<string, unknown> => ({
    "header.province_id": header.province,
    "header.district_id": header.district,
    "header.village_id": header.village,
    "header.dated": today(),
    "header.legal_basis": t("legalBasisText"),

    "child.child_name": child.fullName,
    "child.child_gender": child.gender,
    "child.child_dob": child.dob,
    "child.child_weight_kg": child.weight,
    "child.child_height_cm": child.height,
    "child.child_fingerprint": child.fingerprint,
    "child.child_blood_type": child.bloodType,
    "child.delivery_mode": child.deliveryMode,
    "child.delivery_assisted_by": child.deliveryAssistedBy,
    "child.birth_type": child.birthType,
    "child.birth_order": child.birthOrder,
    "child.child_ethnicity": child.ethnicity,
    "child.child_nationality": child.nationality,
    "child.child_religion": child.religion,
    "child.place_of_birth": child.pobVillage,
    "child.place_of_birth_country": child.pobCountry,
    "child.current_address": child.addrVillage,
    "child.house_no": child.addrHouseNo,
    "child.twin_name": child.twinName,
    "child.twin_gender": child.twinGender,

    // The schema keeps one mandatory set for "Parents"; the mother carries it
    // and each instance is also stored under its own key.
    ...parentData(mother, "parents"),
    ...parentData(mother, "parents.mother"),
    ...(fatherUnknown
      ? { "parents.father.status": "unknown" }
      : parentData(father, "parents.father")),

    "informant.informant_name": informant.fullName,
    "informant.informant_fingerprint": informant.fingerprint,
    "informant.informant_dob": informant.dob,
    "informant.informant_ethnicity": informant.ethnicity,
    "informant.informant_ethnic_group": informant.ethnicGroup,
    "informant.informant_religion": informant.religion,
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
        event_date: child.dob || today(),
        form_data: payload,
      });
      current = { id: created.id, reference_no: created.reference_no };
      setDraft(current);
    }

    // The document number is the case's own reference, which only exists once
    // the case does.
    await applications.update(current.id, {
      form_data: { ...payload, "header.document_no": current.reference_no },
      event_date: child.dob || today(),
    });

    if (hospitalNotice && !uploaded.current.has("child.hospital_notice")) {
      await applications.addAttachment(current.id, hospitalNotice.file, "child.hospital_notice", "document");
      uploaded.current.add("child.hospital_notice");
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
              { label: t("successChild"), value: child.fullName || t("emptyValue") },
              { label: t("documentNo"), value: submitted.reference_no },
              { label: t("successInformant"), value: informant.fullName || t("emptyValue") },
              { label: t("fee"), value: formatLak(submitted.fee_lak, lang) },
              ...(receiptNo ? [{ label: text(TXT.receipt, lang), value: receiptNo }] : []),
              {
                label: t("successEstReview"),
                value: serviceQuery.data ? text(serviceQuery.data.processing_time, lang) : t("successEstReviewValue"),
              },
              { label: t("successStatus"), value: text(submitted.status_label, lang), isStatus: true },
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

          {payCase.error && (
            <p className="text-xs text-red-500">{payCase.error.message}</p>
          )}

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

              <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-100">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{t("fee")}</p>
                <span className="text-sm font-semibold" style={{ color: "#344EAD" }}>
                  {formatLak(fee, lang)}
                </span>
              </div>

              <LocationFields
                valueMode="id"
                province={header.province}
                district={header.district}
                village={header.village}
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
                path="child.child_name"
              />
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label={t("genderLabel")}
                  value={child.gender}
                  options={opts(GENDERS)}
                  placeholder={t("selectPlaceholder")}
                  onChange={(v) => patchChild({ gender: v })}
                  required
                  path="child.child_gender"
                />
                <DateField
                  label={t("dobLabel")}
                  value={child.dob}
                  onChange={(v) => patchChild({ dob: v })}
                  required
                  path="child.child_dob"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ReferenceSelectView
                  label={t("typeOfBirthLabel")}
                  source={refs.birthType}
                  value={child.birthType}
                  placeholder={t("selectPlaceholder")}
                  onChange={(v) => patchChild({ birthType: v })}
                  required
                  path="child.birth_type"
                />
                <InputField
                  label={t("birthOrderLabel")}
                  value={child.birthOrder}
                  placeholder={t("birthOrderPlaceholder")}
                  inputMode="numeric"
                  maxLength={2}
                  onChange={(v) => patchChild({ birthOrder: v.replace(/\D/g, "").slice(0, 2) })}
                  required
                  path="child.birth_order"
                />
              </div>

              {child.birthType === "twins" && (
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label={t("twinNameLabel")}
                    value={child.twinName}
                    placeholder={t("twinNamePlaceholder")}
                    onChange={(v) => patchChild({ twinName: v })}
                    required
                    path="child.twin_name"
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
                <ReferenceSelectView
                  label={t("ethnicityLabel")}
                  source={refs.ethnicity}
                  value={child.ethnicity}
                  placeholder={t("selectPlaceholder")}
                  onChange={(v) => patchChild({ ethnicity: v })}
                  required
                  path="child.child_ethnicity"
                />
                <ReferenceSelectView
                  label={t("nationalityLabel")}
                  source={refs.nationality}
                  value={child.nationality}
                  placeholder={t("selectPlaceholder")}
                  onChange={(v) => patchChild({ nationality: v })}
                  required
                  path="child.child_nationality"
                />
              </div>
              <ReferenceSelectView
                label={t("religionLabel")}
                source={refs.religion}
                value={child.religion}
                placeholder={t("selectPlaceholder")}
                onChange={(v) => patchChild({ religion: v })}
                required
                path="child.child_religion"
              />

              <SectionLabel>{t("placeOfBirthSection")}</SectionLabel>
              <LocationFields
                valueMode="id"
                province={child.pobProvince}
                district={child.pobDistrict}
                village={child.pobVillage}
                villageLabel={t("pobVillageLabel")}
                required
                paths={{ village: "child.place_of_birth" }}
                onResolve={keepPlace(setPobNames)}
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
                villagePath="child.current_address"
              />

              <SectionLabel>{t("additionalDetailsSection")}</SectionLabel>
              <UploadBox
                label={text(TXT.hospitalNotice, lang)}
                sublabel={text(TXT.fileSublabel, lang)}
                file={hospitalNotice}
                onChange={setHospitalNotice}
                required
                path="child.hospital_notice"
              />
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label={t("weightLabel")}
                  value={child.weight}
                  placeholder={t("weightPlaceholder")}
                  inputMode="numeric"
                  onChange={(v) => patchChild({ weight: v })}
                  required
                  path="child.child_weight_kg"
                />
                <InputField
                  label={t("heightLabel")}
                  value={child.height}
                  placeholder={t("heightPlaceholder")}
                  inputMode="numeric"
                  onChange={(v) => patchChild({ height: v })}
                  required
                  path="child.child_height_cm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ReferenceSelectView
                  label={t("bloodTypeLabel")}
                  source={refs.blood}
                  value={child.bloodType}
                  placeholder={t("selectPlaceholder")}
                  onChange={(v) => patchChild({ bloodType: v })}
                  path="child.child_blood_type"
                />
                <ReferenceSelectView
                  label={t("deliveryModeLabel")}
                  source={refs.delivery}
                  value={child.deliveryMode}
                  placeholder={t("selectPlaceholder")}
                  onChange={(v) => patchChild({ deliveryMode: v })}
                  path="child.delivery_mode"
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
                  path="child.child_fingerprint"
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
              <ParentSection value={mother} onChange={patchMother} refs={refs} prefix="parents" />
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

              {!fatherUnknown && (
                <ParentSection
                  value={father}
                  onChange={patchFather}
                  refs={refs}
                  prefix="parents.father"
                  required={!fatherUnknown}
                />
              )}
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
                path="informant.informant_name"
              />
              <div className="grid grid-cols-2 gap-3">
                <DateField
                  label={t("dobLabel")}
                  value={informant.dob}
                  onChange={(v) => patchInformant({ dob: v })}
                  required
                  path="informant.informant_dob"
                />
                <ReferenceSelectView
                  label={t("relationshipLabel")}
                  source={refs.relation}
                  value={informant.relationship}
                  placeholder={t("selectPlaceholder")}
                  onChange={(v) => patchInformant({ relationship: v })}
                  required
                  path="informant.informant_relation"
                />
              </div>

              <SectionLabel>{t("currentAddressSection")}</SectionLabel>
              <AddressFields
                houseNo={informant.addrHouseNo}
                village={informant.addrVillage}
                district={informant.addrDistrict}
                province={informant.addrProvince}
                onChange={patchInformant}
                villagePath="informant.informant_address"
              />

              <InputField
                label={t("censusOrIdLabel")}
                value={informant.censusOrId}
                placeholder={t("censusOrIdPlaceholder")}
                onChange={(v) => patchInformant({ censusOrId: v })}
                required
                path="informant.informant_id_number"
              />
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label={t("phoneLabel")}
                  value={informant.phone}
                  placeholder={t("phonePlaceholder")}
                  inputMode="tel"
                  onChange={(v) => patchInformant({ phone: v })}
                  required
                  path="informant.informant_phone"
                />
                <InputField
                  label={t("emailLabel")}
                  value={informant.email}
                  placeholder={t("emailPlaceholder")}
                  inputMode="email"
                  onChange={(v) => patchInformant({ email: v })}
                  path="informant.informant_email"
                />
              </div>

              <SectionLabel>{t("additionalDetailsSection")}</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <ReferenceSelectView
                  label={t("maritalStatusLabel")}
                  source={refs.marital}
                  value={informant.maritalStatus}
                  placeholder={t("selectPlaceholder")}
                  onChange={(v) => patchInformant({ maritalStatus: v })}
                  path="informant.informant_marital"
                />
                <ReferenceSelectView
                  label={t("educationLabel")}
                  source={refs.education}
                  value={informant.education}
                  placeholder={t("selectPlaceholder")}
                  onChange={(v) => patchInformant({ education: v })}
                  path="informant.informant_education"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ReferenceSelectView
                  label={t("nationalityLabel")}
                  source={refs.nationality}
                  value={informant.nationality}
                  placeholder={t("selectPlaceholder")}
                  onChange={(v) => patchInformant({ nationality: v })}
                />
                <InputField
                  label={t("fingerprintLabel")}
                  value={informant.fingerprint}
                  placeholder={t("fingerprintPlaceholder")}
                  onChange={(v) => patchInformant({ fingerprint: v })}
                  path="informant.informant_fingerprint"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ReferenceSelectView
                  label={t("ethnicityLabel")}
                  source={refs.ethnicity}
                  value={informant.ethnicity}
                  placeholder={t("selectPlaceholder")}
                  onChange={(v) => patchInformant({ ethnicity: v })}
                  path="informant.informant_ethnicity"
                />
                <ReferenceSelectView
                  label={t("ethnicGroupLabel")}
                  source={refs.ethnicGroup}
                  value={informant.ethnicGroup}
                  placeholder={t("selectPlaceholder")}
                  onChange={(v) => patchInformant({ ethnicGroup: v })}
                />
              </div>
              <ReferenceSelectView
                label={t("religionLabel")}
                source={refs.religion}
                value={informant.religion}
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
                    [t("reviewProvinceDistrictVillage"), [headerNames.province, headerNames.district, headerNames.village].filter(Boolean).join(" / ") || t("emptyValue")],
                    [t("documentNo"), draft?.reference_no ?? t("emptyValue")],
                  ],
                },
                {
                  title: t("step2Title"),
                  rows: [
                    [t("reviewName"), child.fullName || t("emptyValue")],
                    [t("reviewGenderDob"), [child.gender && t(GENDERS.find((g) => g.value === child.gender)?.labelKey ?? "optFemale"), child.dob].filter(Boolean).join(" · ") || t("emptyValue")],
                    [t("reviewBirth"), [refs.birthType.labelOf(child.birthType), child.birthOrder && `#${child.birthOrder}`].filter(Boolean).join(" · ") || t("emptyValue")],
                    [t("reviewPlaceOfBirth"), [pobNames.village, pobNames.district, pobNames.province].filter(Boolean).join(", ") || t("emptyValue")],
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
                    [t("reviewRelationship"), refs.relation.labelOf(informant.relationship) || t("emptyValue")],
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
