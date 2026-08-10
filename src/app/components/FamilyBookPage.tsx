import { useState } from "react";
import {
  ChevronLeft,
  ArrowRight,
  Check,
  Loader2,
  AlertCircle,
  Users2,
  Crown,
  Hash,
  RotateCcw,
  BookX,
} from "lucide-react";
import { useT, useLang } from "../i18n";
import { formatLak } from "../serviceConfig";
import { me } from "../api/endpoints";
import { useQuery, useMutation } from "../api/hooks";
import { useSession } from "../api/session";
import type { ApplicationRow, FamilyBook, HouseholdMember } from "../api/types";
import { text } from "../api/types";

/*
 * Family Book (Household Registration) — follows the PRD §10.
 * The Family Book is auto-maintained by DoPS from the other civil registration
 * services, so the citizen portal READS it rather than capturing it:
 *   GET  /me/family-book              → cover (§10.2) + members table (§10.3)
 *   POST /me/family-book/request-copy → raises a "copy" application
 * Cover & head details come from the household record; the member rows carry
 * name, relation, gender, date of birth, UIN and status straight from DoPS.
 */

/* The wire carries a couple of cover fields the shared type does not name. */
type FamilyBookRecord = FamilyBook & {
  head_id_no?: string;
  nationality?: string;
};

/* Short bilingual sentences for the three data states. The i18n namespaces are
 * owned elsewhere, so these live here rather than as new dictionary keys. */
const COPY = {
  loading: { en: "Loading your family book…", lo: "ກຳລັງໂຫຼດປຶ້ມສຳມະໂນຄົວຂອງທ່ານ..." },
  errorTitle: { en: "We could not load your family book.", lo: "ບໍ່ສາມາດໂຫຼດປຶ້ມສຳມະໂນຄົວໄດ້." },
  retry: { en: "Try again", lo: "ລອງໃໝ່" },
  signedOut: {
    en: "Sign in to see the household you belong to.",
    lo: "ກະລຸນາເຂົ້າສູ່ລະບົບເພື່ອເບິ່ງຄົວເຮືອນຂອງທ່ານ.",
  },
  emptyTitle: { en: "No household on file", lo: "ຍັງບໍ່ມີຄົວເຮືອນໃນລະບົບ" },
  emptyBody: {
    en: "Your name is not linked to a family book yet. Your village office can add you to one.",
    lo: "ຊື່ຂອງທ່ານຍັງບໍ່ໄດ້ຜູກເຂົ້າກັບປຶ້ມສຳມະໂນຄົວ. ຫ້ອງການບ້ານຂອງທ່ານສາມາດເພີ່ມທ່ານເຂົ້າໄດ້.",
  },
  noMembers: {
    en: "No members are recorded in this household yet.",
    lo: "ຍັງບໍ່ມີສະມາຊິກຖືກບັນທຶກໃນຄົວເຮືອນນີ້.",
  },
  copyReason: {
    en: "Copy requested from the citizen portal",
    lo: "ຮ້ອງຂໍສຳເນົາຜ່ານແອັບຂອງພົນລະເມືອງ",
  },
  status: { en: "Status", lo: "ສະຖານະ" },
  uin: { en: "UIN", lo: "ລະຫັດປະຈຳຕົວ" },
} as const;

type Copy = keyof typeof COPY;

/* ─── Constants ─── */
/* Step ids are stable; labels/subtitles are translated at render time. */
const STEPS = [
  { id: 1, labelKey: "step1Label", subKey: "step1Subtitle" },
  { id: 2, labelKey: "step2Label", subKey: "step2Subtitle" },
  { id: 3, labelKey: "step3Label", subKey: "step3Subtitle" },
] as const;

/* Relation / gender arrive as free-form registry values; these map the common
 * ones onto the existing translated labels and fall back to the raw value. */
const RELATION_KEY: Record<string, string> = {
  head: "relHead", "head of household": "relHead", "household head": "relHead",
  spouse: "relSpouse", wife: "relSpouse", husband: "relSpouse",
  child: "relChild", son: "relChild", daughter: "relChild",
  parent: "relParent", father: "relParent", mother: "relParent",
  sibling: "relSibling", brother: "relSibling", sister: "relSibling",
  grandparent: "relGrandparent", grandchild: "relGrandchild",
  relative: "relOther", other: "relOther",
};
const GENDER_KEY: Record<string, string> = {
  male: "genderMale", m: "genderMale",
  female: "genderFemale", f: "genderFemale",
};

const isHeadRelation = (relation: string) =>
  RELATION_KEY[relation.trim().toLowerCase()] === "relHead";

/* ─── Field components ─── */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
      {children}
    </label>
  );
}

/* A registry value the citizen reads but cannot edit — same box as the inputs
 * it replaces, so the cover keeps its familiar shape. */
function ReadField({ label, value }: { label: React.ReactNode; value: string }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-gray-800">
        {value || "—"}
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
  const tf = useT("fields");
  const { lang } = useLang();
  const { isAuthenticated } = useSession();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState<ApplicationRow | null>(null);

  const say = (key: Copy) => COPY[key][lang] ?? COPY[key].en;

  const {
    data: book,
    loading,
    error,
    refetch,
  } = useQuery<FamilyBookRecord>((signal) => me.familyBook(signal), [], {
    enabled: isAuthenticated,
  });

  const requestCopy = useMutation((reason: string) => me.requestFamilyBookCopy({ reason }));

  /* Translate a registry value to its label, falling back to the raw string. */
  const labelOf = (map: Record<string, string>, value: string) => {
    const key = map[(value ?? "").trim().toLowerCase()];
    return key ? t(key as Parameters<typeof t>[0]) : value || "—";
  };

  const members: HouseholdMember[] = book?.members ?? [];
  const total = book?.total_members ?? members.length;
  const men = book?.male_members ?? members.filter((m) => m.gender?.toLowerCase().startsWith("m")).length;
  const women = book?.female_members ?? members.filter((m) => m.gender?.toLowerCase().startsWith("f")).length;

  const place = book?.jurisdiction;
  const addressLine =
    [place?.village_name, place?.district_name, place?.province_name].filter(Boolean).join(", ") ||
    book?.address ||
    "—";

  const lastStep = STEPS.length;

  const goBack = () => {
    if (step > 1) setStep((s) => s - 1);
    else onBack();
  };

  const handleNext = async () => {
    if (step < lastStep) {
      setStep((s) => s + 1);
      return;
    }
    try {
      const created = await requestCopy.run(say("copyReason"));
      setSubmitted(created);
    } catch {
      // The failure is rendered from requestCopy.error on the review step.
    }
  };

  /* ── Page frame — shared by every state so the chrome never flickers ── */
  const frame = (body: React.ReactNode, cta?: React.ReactNode) => (
    <div className="min-h-full flex flex-col bg-[#F0F2F8]">
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

      {book && <StepIndicator step={step} />}

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-screen-sm mx-auto px-4 py-6 space-y-5 pb-28">{body}</div>
      </div>

      {cta && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 pt-3 pb-6 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-40">
          <div className="max-w-screen-sm mx-auto">{cta}</div>
        </div>
      )}
    </div>
  );

  /* ── Loading ── */
  if (loading) {
    return frame(
      <>
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" /> {say("loading")}
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
            <div className="h-3 w-24 rounded-full bg-gray-100 animate-pulse" />
            <div className="h-3 w-full rounded-full bg-gray-100 animate-pulse" />
            <div className="h-3 w-2/3 rounded-full bg-gray-100 animate-pulse" />
          </div>
        ))}
      </>,
    );
  }

  /* ── Signed out ── */
  if (!isAuthenticated) {
    return frame(
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col items-center text-center gap-3">
        <BookX className="w-8 h-8 text-gray-300" />
        <p className="text-sm text-gray-500 leading-relaxed">{say("signedOut")}</p>
      </div>,
    );
  }

  /* ── Error (a 404 means "no household", which is an empty state, not a fault) ── */
  if (error && !error.isNotFound) {
    return frame(
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col items-center text-center gap-4">
        <AlertCircle className="w-8 h-8 text-amber-500" />
        <div>
          <p className="text-sm font-semibold text-gray-800">{say("errorTitle")}</p>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">{error.message}</p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl text-white text-sm font-semibold shadow-md hover:opacity-90 transition-opacity"
          style={{ backgroundColor: "#344EAD" }}
        >
          <RotateCcw className="w-4 h-4" />
          {say("retry")}
        </button>
      </div>,
    );
  }

  /* ── Empty — the citizen is not on a household yet ── */
  if (!book) {
    return frame(
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col items-center text-center gap-3">
        <BookX className="w-8 h-8 text-gray-300" />
        <div>
          <p className="text-sm font-semibold text-gray-800">{say("emptyTitle")}</p>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">{say("emptyBody")}</p>
        </div>
      </div>,
    );
  }

  /* ── Success — the copy request was raised ── */
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
              { label: t("successHead"), value: book.head_name || "—" },
              { label: t("familyBookNo"), value: submitted.reference_no || book.household_no },
              { label: t("successMembers"), value: t("peopleSummary", { total, men, women }) },
              {
                label: t("statusLabel"),
                value: text(submitted.status_label, lang) || t("statusSubmitted"),
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

  /* ── The household ── */
  return frame(
    <>
      <StepHeader step={step} />

      {/* Step 1 — Cover & household head */}
      {step === 1 && (
        <>
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-100">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{t("familyBookNo")}</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{book.household_no || "—"}</p>
            </div>
            <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
              {t("autoGenerated")}
            </span>
          </div>

          <ReadField label={t("holderNameLabel")} value={book.head_name} />

          <SectionLabel>{t("householdHead")}</SectionLabel>
          <ReadField label={t("nameAndSurname")} value={book.head_name} />
          <ReadField label={t("idCardNo")} value={book.head_id_no ?? ""} />
          <div className="grid grid-cols-2 gap-3">
            <ReadField label={t("unit")} value={book.unit} />
            <ReadField label={t("group")} value={book.group} />
          </div>

          <SectionLabel>{t("address")}</SectionLabel>
          <ReadField label={tf("province")} value={place?.province_name ?? ""} />
          <div className="grid grid-cols-2 gap-3">
            <ReadField label={tf("district")} value={place?.district_name ?? ""} />
            <ReadField label={tf("village")} value={place?.village_name ?? ""} />
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-50 border border-blue-100">
            <p className="text-xs font-medium" style={{ color: "#344EAD" }}>
              {t("dateOfIssue")}
            </p>
            <span className="text-[10px] font-medium px-2 py-1 rounded-full" style={{ backgroundColor: "white", color: "#344EAD" }}>
              {book.issued_at || book.registered_at || t("setOnIssuance")}
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

          {members.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
              <p className="text-sm text-gray-500 leading-relaxed">{say("noMembers")}</p>
            </div>
          ) : (
            members.map((m, i) => {
              const isHead = isHeadRelation(m.relation ?? "");
              return (
                <div key={m.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
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
                    <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                      {m.status || "—"}
                    </span>
                  </div>

                  {m.photo_url && (
                    <img
                      src={m.photo_url}
                      alt=""
                      className="w-16 h-20 object-cover rounded-xl border border-gray-200"
                    />
                  )}
                  <ReadField label={t("nameAndSurname")} value={m.name} />
                  <div className="grid grid-cols-2 gap-3">
                    <ReadField label={t("gender")} value={labelOf(GENDER_KEY, m.gender ?? "")} />
                    <ReadField label={t("dateOfBirth")} value={m.date_of_birth ?? ""} />
                  </div>
                  <ReadField label={t("relationshipToHead")} value={labelOf(RELATION_KEY, m.relation ?? "")} />
                  <div className="grid grid-cols-2 gap-3">
                    <ReadField label={t("nationality")} value={m.nationality ?? ""} />
                    <ReadField label={say("status")} value={m.status ?? ""} />
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-gray-400 pt-0.5">
                    <Hash className="w-3 h-3 flex-shrink-0" />
                    {say("uin")}: {m.uin || "—"}
                  </div>
                </div>
              );
            })
          )}
        </>
      )}

      {/* Step 3 — Review & request a copy */}
      {step === 3 && (
        <>
          <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-amber-50 border border-amber-100">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
            <p className="text-xs text-amber-700 leading-relaxed">
              {t("reviewNotice")}
            </p>
          </div>

          {requestCopy.error && (
            <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-red-50 border border-red-100">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
              <p className="text-xs text-red-600 leading-relaxed">{requestCopy.error.message}</p>
            </div>
          )}

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-2.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("household")}</p>
            {[
              [t("familyBookNo"), book.household_no || "—"],
              [t("holder"), book.head_name || "—"],
              [t("idCardNo"), book.head_id_no || "—"],
              [t("unitGroup"), `${book.unit || "—"} / ${book.group || "—"}`],
              [t("address"), addressLine],
              [t("dateOfIssue"), book.issued_at || book.registered_at || "—"],
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
            {members.length === 0 ? (
              <p className="text-sm text-gray-500 py-2">{say("noMembers")}</p>
            ) : (
              <div className="space-y-2">
                {members.map((m, i) => (
                  <div key={m.id} className="flex items-center justify-between gap-3 py-1.5 border-b border-gray-50 last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{m.name || t("memberN", { n: i + 1 })}</p>
                      <p className="text-xs text-gray-400">{[
                        m.relation && labelOf(RELATION_KEY, m.relation),
                        m.gender && labelOf(GENDER_KEY, m.gender),
                        m.date_of_birth,
                        m.uin,
                      ].filter(Boolean).join(" · ") || "—"}</p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{m.status || "—"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </>,
    <button
      onClick={handleNext}
      disabled={requestCopy.pending}
      className="w-full h-14 rounded-2xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-md"
      style={{
        backgroundColor: requestCopy.pending ? "#C7D2FE" : "#344EAD",
        cursor: requestCopy.pending ? "not-allowed" : "pointer",
      }}
    >
      {requestCopy.pending ? (
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
    </button>,
  );
}
