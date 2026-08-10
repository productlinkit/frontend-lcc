import { useRef, useState } from "react";
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
  RefreshCw,
} from "lucide-react";
import { PaymentSection, blankPayment, isPaymentValid, type PaymentState } from "./PaymentSection";
import {
  LocationFields,
  DateField,
  ReferenceSelectView,
  useReferenceOptions,
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
import { formatLak } from "../serviceConfig";
import { useT, useLang } from "../i18n";

/* ─── Types ─── */
interface UploadedFile {
  name: string;
  preview: string | null;
  /** The real file, kept so it can be attached to the case on submit. */
  file: File;
}

/*
 * Field set follows the PRD — Residence Certificate, §5.2 "Form fields", and is
 * kept in step with the service's published form schema: every value below is
 * sent under the schema's own "section.field" key so the API can check it and
 * point back at the exact field that is missing.
 */
interface FormData {
  // Supporting documents (§5.1) — captured first; applicant details are read from the ID
  frontId: UploadedFile | null;
  backId: UploadedFile | null;
  familyBookCover: UploadedFile | null; // M — family book cover page
  familyBookContents: UploadedFile | null; // M — family book contents page

  // Applicant identity
  citizenName: string; // M
  age: string; // M
  occupation: string; // O
  nationality: string; // M — reference list code
  picture: UploadedFile | null; // M — applicant 3×4 photo

  // Header / jurisdiction block — location UUIDs from the location service
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
  purpose: string; // M — reference list code
  purposeOther: string; // C — free text when purpose is "other"

  // Payment
  payment: PaymentState;
}

/* ─── Constants ─── */
const SERVICE_CODE = "resident";

// Step titles/subtitles resolve via the `resident` namespace (step{n}Title / step{n}Subtitle).
const STEP_IDS = [1, 2, 3, 4, 5, 6] as const;
const STEP_COUNT = STEP_IDS.length;

/*
 * Which step renders which schema field. A 422 from the submit endpoint names
 * every missing mandatory field at once, and they are spread over the whole
 * form, so this is what lets the page jump to the earliest offending one.
 */
const FIELD_STEP: Record<string, number> = {
  "household_reference.family_book_upload": 1,
  "applicant.photo": 2,
  "applicant.citizen_name": 2,
  "applicant.age": 2,
  "applicant.occupation": 2,
  "applicant.nationality": 2,
  "header.ref_no": 2,
  "header.province_id": 3,
  "header.district_id": 3,
  "header.village_id": 3,
  "certifying_authority.village_chief_name": 3,
  "certifying_authority.certifying_district": 3,
  "applicant.current_village_id": 4,
  "applicant.house_no": 4,
  "applicant.unit_nuay": 4,
  "applicant.group_khum": 4,
  "household_reference.household_no": 5,
  "household_reference.household_issued_at": 5,
  "household_reference.household_district": 5,
  "parentage.father_name": 5,
  "parentage.mother_name": 5,
  "parentage.native_place": 5,
  "purpose.purpose": 5,
  "purpose.issue_date": 5,
};

/* Sentences this screen needs that the page dictionary does not carry. */
const TXT = {
  loadFailed: {
    en: "We could not load this service right now.",
    lo: "ພວກເຮົາບໍ່ສາມາດໂຫຼດບໍລິການນີ້ໄດ້ໃນຕອນນີ້.",
  } as Bilingual,
  retry: { en: "Retry", lo: "ລອງໃໝ່" } as Bilingual,
  loading: { en: "Loading the service…", lo: "ກຳລັງໂຫຼດບໍລິການ…" } as Bilingual,
  receipt: { en: "Receipt No.", lo: "ເລກທີ່ໃບຮັບເງິນ" } as Bilingual,
  fee: { en: "Fee", lo: "ຄ່າທຳນຽມ" } as Bilingual,
};

// Details read from the uploaded ID by the eID / OCR step.
const DETECTED = { citizenName: "Somchai Vongkhamphanh", age: "34", nationality: "lao" };

const today = () => new Date().toISOString().slice(0, 10);

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
  inputMode?: "text" | "numeric"; maxLength?: number;
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

function UploadBox({
  label, sublabel, file, onChange, required = true, height = "h-40", path,
}: {
  label: React.ReactNode; sublabel: string;
  file: UploadedFile | null; onChange: (f: UploadedFile | null) => void;
  required?: boolean; height?: string; path?: string;
}) {
  const t = useT("resident");
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
          className={`w-full ${height} rounded-2xl border-2 border-dashed ${hasError ? "border-red-300" : "border-gray-200"} bg-gray-50 hover:border-[#344EAD]/40 hover:bg-blue-50/50 transition-all flex flex-col items-center justify-center gap-2.5 group`}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform" style={{ backgroundColor: "#EEF2FF" }}>
            <Camera className="w-7 h-7" style={{ color: "#344EAD" }} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-600 group-hover:text-[#344EAD] transition-colors">{t("uploadTap")}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>
          </div>
        </button>
      )}
      <FieldError show={hasError} message={message} />
    </div>
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

/* ─── Section heading inside the form body ─── */
function StepHeader({ step }: { step: number }) {
  const t = useT("resident");
  return (
    <div className="mb-3 pb-1">
      <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#344EAD" }}>
        {t("stepOf", { n: step, m: STEP_COUNT })}
      </p>
      <h2 className="text-gray-900 mt-0.5">{t(`step${step}Title` as "step1Title")}</h2>
      <p className="text-gray-400 text-xs mt-0.5">{t(`step${step}Subtitle` as "step1Subtitle")}</p>
    </div>
  );
}

/* ─── Main Page ─── */
interface ResidentCertificatePageProps {
  onBack: () => void;
}

export function ResidentCertificatePage({ onBack }: ResidentCertificatePageProps) {
  const t = useT("resident");
  const { lang } = useLang();
  const [step, setStep] = useState(1);
  const [showErrors, setShowErrors] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<{ case: ApplicationDetail; receiptNo?: string } | null>(null);

  // ID auto-detection (eID / OCR read of the uploaded card)
  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected] = useState(false);

  /* ── Catalogue: fee, processing time, reference lists, payment methods ── */
  const serviceQuery = useQuery((signal) => catalog.service(SERVICE_CODE, signal), []);
  const pricingQuery = useQuery((signal) => catalog.pricing(SERVICE_CODE, signal), []);
  const methodsQuery = useQuery((signal) => payments.methods(signal), []);
  const nationalities = useReferenceOptions("nationality");
  const purposes = useReferenceOptions("certificate-purpose");

  const fee = pricingQuery.data?.fee_lak ?? serviceQuery.data?.fee_lak ?? 0;
  const processingTime = serviceQuery.data
    ? text(serviceQuery.data.processing_time, lang)
    : t("successCompletionValue");

  const [form, setForm] = useState<FormData>({
    frontId: null,
    backId: null,
    familyBookCover: null,
    familyBookContents: null,
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
    purposeOther: "",
    payment: blankPayment,
  });

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const clearServerError = (path?: string) => {
    if (!path) return;
    setServerErrors((prev) => (path in prev ? Object.fromEntries(Object.entries(prev).filter(([k]) => k !== path)) : prev));
  };

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
    if (step === 1)
      return Boolean(
        form.frontId && form.backId && form.familyBookCover && form.familyBookContents && !detecting,
      );
    if (step === 2) return Boolean(form.citizenName.trim() && form.age.trim() && form.nationality && form.picture);
    if (step === 3)
      return Boolean(
        form.province.trim() &&
        form.district.trim() &&
        form.villageName.trim() &&
        form.certifyingJurisdiction.trim()
      );
    if (step === 4) return Boolean(form.currentVillage.trim() && form.houseNo.trim());
    if (step === 5)
      return Boolean(
        form.censusBookNo.trim() &&
        form.purpose &&
        (form.purpose !== "other" || form.purposeOther.trim()),
      );
    if (step === 6) return isPaymentValid(form.payment);
    return true;
  };

  const lastStep = STEP_COUNT;

  /* ── The case: created once, then updated on every retry ── */
  const [draft, setDraft] = useState<{ id: string; reference_no: string } | null>(null);
  const uploaded = useRef<Set<string>>(new Set());

  const buildFormData = (): Record<string, unknown> => ({
    "header.province_id": form.province,
    "header.district_id": form.district,
    "header.village_id": form.villageName,
    "certifying_authority.village_chief_name": form.villageChiefName,
    "certifying_authority.certifying_district": form.certifyingJurisdiction,
    "applicant.citizen_name": form.citizenName,
    "applicant.age": form.age,
    "applicant.occupation": form.occupation,
    "applicant.nationality": form.nationality,
    "applicant.current_village_id": form.currentVillage,
    "applicant.group_khum": form.groupKhum,
    "applicant.unit_nuay": form.unitNuayBan,
    "applicant.house_no": form.houseNo,
    "household_reference.household_no": form.censusBookNo,
    "household_reference.household_issued_at": form.censusBookDate,
    "household_reference.household_district": form.censusDistrictProvince,
    "parentage.father_name": form.fatherName,
    "parentage.mother_name": form.motherName,
    "parentage.native_place": form.nativePlace,
    "purpose.purpose": form.purpose,
    "purpose.purpose_other": form.purposeOther,
    "purpose.issue_date": today(),
  });

  const attachmentsToSend = () =>
    [
      { file: form.picture, slot: "applicant.photo", kind: "photo" },
      { file: form.frontId, slot: "applicant.id_front", kind: "document" },
      { file: form.backId, slot: "applicant.id_back", kind: "document" },
      { file: form.familyBookCover, slot: "household_reference.family_book_upload", kind: "document" },
      { file: form.familyBookContents, slot: "household_reference.family_book_contents", kind: "document" },
    ].filter((a): a is { file: UploadedFile; slot: string; kind: string } => a.file !== null);

  /** The payment method code the API knows, chosen from the live method list. */
  const methodCodeFor = (method: PaymentState["method"]): string => {
    const wantedKind = method === "qr" ? "qr" : "bank";
    const found = (methodsQuery.data ?? []).find((m) => m.kind === wantedKind && m.enabled);
    return found?.code ?? (method === "qr" ? "laoqr" : "bank-transfer");
  };

  const submitCase = useMutation(async () => {
    const payload = buildFormData();

    // Reuse the draft on a retry so a rejected submission does not leave a
    // trail of half-filled cases behind it.
    let current = draft;
    if (!current) {
      const created = await applications.create({
        service_code: SERVICE_CODE,
        province_id: form.province || undefined,
        district_id: form.district || undefined,
        village_id: form.villageName || undefined,
        event_date: today(),
        form_data: payload,
      });
      current = { id: created.id, reference_no: created.reference_no };
      setDraft(current);
    }

    // The reference number is the form's own "Ref. No." field, and it only
    // exists once the case does.
    await applications.update(current.id, {
      form_data: { ...payload, "header.ref_no": current.reference_no },
      event_date: today(),
    });

    for (const attachment of attachmentsToSend()) {
      if (uploaded.current.has(attachment.slot)) continue;
      await applications.addAttachment(current.id, attachment.file.file, attachment.slot, attachment.kind);
      uploaded.current.add(attachment.slot);
    }

    const decided = await applications.submit(current.id);

    let receiptNo: string | undefined;
    if (decided.fee_lak > 0) {
      const result = (await applications.pay(current.id, {
        method_code: methodCodeFor(form.payment.method),
      })) as unknown as { receipt_no?: string; transaction?: { receipt_no?: string } };
      receiptNo = result.receipt_no ?? result.transaction?.receipt_no;
    }
    return { case: decided, receiptNo };
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
      const result = await submitCase.run(undefined);
      setSubmitted(result);
    } catch (err) {
      // 422 carries one entry per missing mandatory field. Show them all, and
      // move to the earliest step that owns one so the first is on screen.
      if (err instanceof ApiError && err.isValidation && err.fields.length) {
        const map = err.fieldMap();
        setServerErrors(map);
        const target = stepOfFirstError(Object.keys(map), FIELD_STEP);
        if (target) setStep(target);
        scrollToFirstError();
      }
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
    const decided = submitted.case;
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
              {t("successMessage")}
            </p>
          </div>
          <div className="w-full bg-white rounded-3xl p-5 text-left space-y-3 shadow-sm border border-gray-100">
            {[
              { label: t("successApplicant"), value: decided.subject_name || form.citizenName },
              { label: t("successReference"), value: decided.reference_no },
              ...(submitted.receiptNo
                ? [{ label: text(TXT.receipt, lang), value: submitted.receiptNo }]
                : []),
              { label: text(TXT.fee, lang), value: formatLak(decided.fee_lak, lang) },
              { label: t("successCompletion"), value: processingTime },
              { label: t("successStatus"), value: text(decided.status_label, lang), isStatus: true },
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

          {/* What the API said about the last submission */}
          {submitError && (
            <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-red-50 border border-red-100">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
              <p className="text-xs text-red-600 leading-relaxed">{submitError.message}</p>
            </div>
          )}

          {/* Step 1 — Verify Identity (upload ID, auto-detect details) */}
          {step === 1 && (
            <>
              <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-amber-50 border border-amber-100">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  {t("step1Notice")}
                </p>
              </div>

              <UploadBox
                label={t("frontIdLabel")}
                sublabel={t("idSublabel")}
                file={form.frontId}
                onChange={handleFrontId}
              />
              <UploadBox
                label={t("backIdLabel")}
                sublabel={t("idSublabel")}
                file={form.backId}
                onChange={(f) => set("backId", f)}
              />

              {/* Detection status */}
              {detecting && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                  <ScanLine className="w-5 h-5 animate-pulse flex-shrink-0" style={{ color: "#344EAD" }} />
                  <p className="text-sm font-medium" style={{ color: "#344EAD" }}>
                    {t("readingId")}
                  </p>
                </div>
              )}
              {detected && !detecting && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-green-50 border border-green-200">
                  <Sparkles className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-green-700">{t("detailsDetected")}</p>
                    <p className="text-xs text-green-600 mt-0.5">
                      {t("detectedSummary", {
                        name: form.citizenName,
                        age: form.age,
                        nationality: nationalities.labelOf(form.nationality),
                      })}
                    </p>
                  </div>
                </div>
              )}

              {/* Family book upload (PRD §5.2 — cover + contents, mandatory) */}
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-1">
                {t("familyBookHeading")}
              </p>
              <UploadBox
                label={t("familyBookCoverLabel")}
                sublabel={t("familyBookSublabel")}
                file={form.familyBookCover}
                onChange={(f) => set("familyBookCover", f)}
                path="household_reference.family_book_upload"
              />
              <UploadBox
                label={t("familyBookContentsLabel")}
                sublabel={t("familyBookSublabel")}
                file={form.familyBookContents}
                onChange={(f) => set("familyBookContents", f)}
              />
            </>
          )}

          {/* Step 2 — Applicant */}
          {step === 2 && (
            <>
              {/* Ref No — issued by the registry when the case is opened */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-100">
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{t("refNoLabel")}</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">
                    {draft?.reference_no ?? "—"}
                  </p>
                </div>
                <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                  {t("autoGenerated")}
                </span>
              </div>

              <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-green-50 border border-green-100">
                <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-600" />
                <p className="text-xs text-green-700 leading-relaxed">
                  {t("autoFilledNotice")}
                </p>
              </div>
              <InputField
                label={t("citizenNameLabel")}
                value={form.citizenName}
                placeholder={t("citizenNamePlaceholder")}
                onChange={(v) => set("citizenName", v)}
                required
                path="applicant.citizen_name"
              />
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label={t("ageLabel")}
                  value={form.age}
                  placeholder={t("agePlaceholder")}
                  inputMode="numeric"
                  maxLength={3}
                  onChange={(v) => set("age", v.replace(/\D/g, "").slice(0, 3))}
                  required
                  path="applicant.age"
                />
                <ReferenceSelectView
                  label={t("nationalityLabel")}
                  source={nationalities}
                  value={form.nationality}
                  placeholder={t("selectPlaceholder")}
                  onChange={(v) => set("nationality", v)}
                  required
                  path="applicant.nationality"
                />
              </div>
              <InputField
                label={t("occupationLabel")}
                value={form.occupation}
                placeholder={t("occupationPlaceholder")}
                onChange={(v) => set("occupation", v)}
                path="applicant.occupation"
              />
              <UploadBox
                label={t("pictureLabel")}
                sublabel={t("pictureSublabel")}
                file={form.picture}
                onChange={(f) => set("picture", f)}
                required
                height="h-48"
                path="applicant.photo"
              />
            </>
          )}

          {/* Step 3 — Location & Authority */}
          {step === 3 && (
            <>
              <LocationFields
                valueMode="id"
                province={form.province}
                district={form.district}
                village={form.villageName}
                villageLabel={t("villageNameLabel")}
                required
                paths={{
                  province: "header.province_id",
                  district: "header.district_id",
                  village: "header.village_id",
                }}
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
                label={t("villageChiefLabel")}
                value={form.villageChiefName}
                placeholder={t("villageChiefPlaceholder")}
                onChange={(v) => set("villageChiefName", v)}
                path="certifying_authority.village_chief_name"
              />
              <InputField
                label={t("certifyingJurisdictionLabel")}
                value={form.certifyingJurisdiction}
                placeholder={t("certifyingJurisdictionPlaceholder")}
                onChange={(v) => set("certifyingJurisdiction", v)}
                required
                path="certifying_authority.certifying_district"
              />
            </>
          )}

          {/* Step 4 — Current Residence */}
          {step === 4 && (
            <>
              <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#344EAD" }} />
                <p className="text-xs leading-relaxed" style={{ color: "#344EAD" }}>
                  {t("step4Notice")}
                </p>
              </div>
              <InputField
                label={t("currentVillageLabel")}
                value={form.currentVillage}
                placeholder={t("currentVillagePlaceholder")}
                onChange={(v) => set("currentVillage", v)}
                required
                path="applicant.current_village_id"
              />
              <InputField
                label={t("houseNoLabel")}
                value={form.houseNo}
                placeholder={t("houseNoPlaceholder")}
                onChange={(v) => set("houseNo", v)}
                required
                path="applicant.house_no"
              />
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label={t("unitLabel")}
                  value={form.unitNuayBan}
                  placeholder={t("unitPlaceholder")}
                  onChange={(v) => set("unitNuayBan", v)}
                  path="applicant.unit_nuay"
                />
                <InputField
                  label={t("groupLabel")}
                  value={form.groupKhum}
                  placeholder={t("groupPlaceholder")}
                  onChange={(v) => set("groupKhum", v)}
                  path="applicant.group_khum"
                />
              </div>
            </>
          )}

          {/* Step 5 — Household, Parentage & Purpose */}
          {step === 5 && (
            <>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {t("householdHeading")}
              </p>
              <InputField
                label={t("censusBookNoLabel")}
                value={form.censusBookNo}
                placeholder={t("censusBookNoPlaceholder")}
                onChange={(v) => set("censusBookNo", v)}
                required
                path="household_reference.household_no"
              />
              <div className="grid grid-cols-2 gap-3">
                <DateField
                  label={t("censusBookDateLabel")}
                  value={form.censusBookDate}
                  onChange={(v) => set("censusBookDate", v)}
                  path="household_reference.household_issued_at"
                />
                <InputField
                  label={t("censusDistrictProvinceLabel")}
                  value={form.censusDistrictProvince}
                  placeholder={t("censusDistrictProvincePlaceholder")}
                  onChange={(v) => set("censusDistrictProvince", v)}
                  path="household_reference.household_district"
                />
              </div>

              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-1">
                {t("parentageHeading")}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label={t("fatherLabel")}
                  value={form.fatherName}
                  placeholder={t("fatherPlaceholder")}
                  onChange={(v) => set("fatherName", v)}
                  path="parentage.father_name"
                />
                <InputField
                  label={t("motherLabel")}
                  value={form.motherName}
                  placeholder={t("motherPlaceholder")}
                  onChange={(v) => set("motherName", v)}
                  path="parentage.mother_name"
                />
              </div>
              <InputField
                label={t("nativePlaceLabel")}
                value={form.nativePlace}
                placeholder={t("nativePlacePlaceholder")}
                onChange={(v) => set("nativePlace", v)}
                path="parentage.native_place"
              />

              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-1">
                {t("purposeHeading")}
              </p>
              <ReferenceSelectView
                label={t("purposeLabel")}
                source={purposes}
                value={form.purpose}
                placeholder={t("purposePlaceholder")}
                onChange={(v) => set("purpose", v)}
                required
                path="purpose.purpose"
              />
              {form.purpose === "other" && (
                <InputField
                  label={t("purposeOtherLabel")}
                  value={form.purposeOther}
                  placeholder={t("purposeOtherPlaceholder")}
                  onChange={(v) => set("purposeOther", v.slice(0, 100))}
                  maxLength={100}
                  required
                />
              )}
            </>
          )}

          {/* Step 6 — Payment */}
          {step === 6 && (
            <PaymentSection
              amount={fee}
              serviceName={serviceQuery.data ? text(serviceQuery.data.name, lang) : t("paymentServiceName")}
              value={form.payment}
              onChange={(patch) => set("payment", { ...form.payment, ...patch })}
              reference={draft?.reference_no}
            />
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
                {t("processingPayment")}
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
