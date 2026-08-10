/*
 * Document specs for the printable PDF generator (lib/document.ts).
 *
 * The mappers at the bottom turn what the API actually sends — a
 * /me/documents/{id} payload, an issued certificate, an issued case — into a
 * DocSpec. ACCOUNT_DOC_SPECS / serviceDocSpec above them are the older
 * placeholder specs, still imported by AccountPage.
 */
import type { DocSpec } from "../lib/document";
import type {
  ApplicationDetail,
  Bilingual,
  Certificate,
  DocumentDetail,
  Lang,
  PlaceNames,
} from "../api/types";
import { text } from "../api/types";

const HOLDER = "Somchai Phommasack";

/** Account → My Documents. Keyed by the document id in AccountPage. */
export const ACCOUNT_DOC_SPECS: Record<string, DocSpec> = {
  "doc-1": {
    title: "National Identity Card",
    kicker: "Civil & Population",
    refNo: "LA-2580-1234-5678",
    holderName: HOLDER,
    office: "Ministry of Home Affairs · Department of Civil Registration",
    hasPhoto: true,
    fields: [
      { label: "Date of birth", value: "14 Mar 1992" },
      { label: "Sex", value: "Male" },
      { label: "Nationality", value: "Lao" },
      { label: "Place of birth", value: "Vientiane Capital" },
      { label: "District", value: "Chanthabuly" },
      { label: "Village", value: "Ban Phonxay" },
    ],
    issued: "05 Jan 2024",
    validUntil: "31 Dec 2028",
    verifyCode: "LA25-8012-3456",
  },
  "doc-3": {
    title: "Family Registration Book",
    kicker: "Civil & Population",
    refNo: "HR-VTE-20-4412",
    holderName: "Phommasack Household",
    office: "Ministry of Home Affairs · District Administration Office",
    fields: [
      { label: "Household head", value: HOLDER },
      { label: "Members", value: "4 persons" },
      { label: "Province", value: "Vientiane Capital" },
      { label: "District", value: "Chanthabuly" },
      { label: "Village", value: "Ban Phonxay" },
      { label: "House No.", value: "128/04" },
    ],
    issued: "12 Feb 2022",
    validUntil: "01 Jan 2030",
    verifyCode: "HRVT-2044-12",
  },
};

/** History → per-application certificate, generated from the service + ref no. */
export function serviceDocSpec(serviceKey: string, refNo: string): DocSpec {
  const code = refNo.replace(/[^A-Z0-9]/gi, "").slice(-10).toUpperCase();
  switch (serviceKey) {
    case "serviceBirthCertificate":
      return {
        title: "Birth Certificate",
        kicker: "Civil Registration",
        refNo,
        holderName: "Dara Phommasack",
        office: "Civil Registry Office · Vientiane Capital",
        fields: [
          { label: "Date of birth", value: "02 Mar 2026" },
          { label: "Sex", value: "Female" },
          { label: "Place of birth", value: "Mother & Child Hospital" },
          { label: "Father", value: HOLDER },
          { label: "Mother", value: "Noy Phommasack" },
          { label: "Nationality", value: "Lao" },
        ],
        issued: "20 Mar 2026",
        verifyCode: code,
      };
    case "serviceGeneralApplication":
      return {
        title: "Service Certificate",
        kicker: "District Administration",
        refNo,
        holderName: HOLDER,
        office: "District Administration Office",
        fields: [
          { label: "Application type", value: "General Service Request" },
          { label: "Outcome", value: "Approved" },
          { label: "Reference", value: refNo },
          { label: "Processed by", value: "District Admin Office" },
        ],
        issued: "10 Mar 2026",
        verifyCode: code,
      };
    default:
      // Generic acknowledgement for any other approved service.
      return {
        title: "Official Certificate",
        kicker: "Lao Citizen Center",
        refNo,
        holderName: HOLDER,
        office: "Lao Citizen Center",
        fields: [
          { label: "Reference", value: refNo },
          { label: "Status", value: "Approved" },
        ],
        issued: "2026",
        verifyCode: code,
      };
  }
}

/* ── Live payloads → printable spec ────────────────────────────────────── */

type DocField = { label: string; value: string };

/**
 * What /me/documents/{id} really sends. `DocumentDetail` covers the common
 * fields; the registry block below rides along with it and is what the printed
 * card is filled from when the API does not send an explicit `fields` list.
 */
export type DocumentPayload = DocumentDetail & {
  holder?: {
    name?: Bilingual | string;
    uin?: string;
    national_id_no?: string;
    gender?: string;
    date_of_birth?: string;
    place_of_birth?: string;
    nationality?: string;
    ethnicity?: string;
    religion?: string;
    household_no?: string;
    address?: string;
  };
  place?: PlaceNames;
};

const L = (lang: Lang, en: string, lo: string) => (lang === "lo" ? lo : en);

/** "2026-08-08" or an RFC3339 stamp → "08 Aug 2026". */
function day(value: string | undefined, lang: Lang): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(lang === "lo" ? "lo-LA" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function titleCase(slug: string): string {
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function holderName(doc: DocumentPayload, lang: Lang): string {
  if (doc.holder_name) return doc.holder_name;
  const name = doc.holder?.name;
  if (typeof name === "string") return name;
  return text(name, lang) || "—";
}

/** A document held by the citizen, ready to print. */
export function docSpecFromDocument(doc: DocumentPayload, lang: Lang): DocSpec {
  const explicit: DocField[] = (doc.fields ?? []).map((f) => ({
    label: text(f.label, lang),
    value: f.value,
  }));

  const derived: DocField[] = [];
  const h = doc.holder;
  const push = (label: string, value?: string) => {
    if (value) derived.push({ label, value });
  };
  push(L(lang, "Document no.", "ເລກເອກະສານ"), doc.number);
  push(L(lang, "UIN", "ລະຫັດປະຈຳຕົວ"), h?.uin);
  push(L(lang, "Date of birth", "ວັນເດືອນປີເກີດ"), h?.date_of_birth ? day(h.date_of_birth, lang) : undefined);
  push(L(lang, "Sex", "ເພດ"), h?.gender ? titleCase(h.gender) : undefined);
  push(L(lang, "Nationality", "ສັນຊາດ"), h?.nationality);
  push(L(lang, "Place of birth", "ສະຖານທີ່ເກີດ"), h?.place_of_birth);
  push(L(lang, "Province", "ແຂວງ"), text(doc.place?.province, lang) || undefined);
  push(L(lang, "District", "ເມືອງ"), text(doc.place?.district, lang) || undefined);
  push(L(lang, "Village", "ບ້ານ"), text(doc.place?.village, lang) || undefined);
  push(L(lang, "Household no.", "ເລກສຳມະໂນຄົວ"), h?.household_no);

  return {
    title: text(doc.title, lang) || titleCase(doc.type),
    kicker: titleCase(doc.type),
    refNo: doc.number || "—",
    holderName: holderName(doc, lang),
    office: doc.authority || "Lao Citizen Center",
    fields: explicit.length > 0 ? explicit : derived,
    issued: day(doc.issued_at, lang),
    validUntil: doc.expires_at ? day(doc.expires_at, lang) : undefined,
    verifyCode: doc.verify_code || doc.number || "—",
    hasPhoto: doc.type.includes("id") || doc.type.includes("passport"),
  };
}

/** An issued certificate, ready to print. */
export function docSpecFromCertificate(cert: Certificate, lang: Lang): DocSpec {
  const fields: DocField[] = [];
  const push = (label: string, value?: string) => {
    if (value) fields.push({ label, value });
  };
  push(L(lang, "Certificate no.", "ເລກໃບຢັ້ງຢືນ"), cert.certificate_no);
  push(L(lang, "Reference", "ເລກອ້າງອີງ"), cert.reference_no);
  push(L(lang, "UIN", "ລະຫັດປະຈຳຕົວ"), cert.uin);
  push(L(lang, "Status", "ສະຖານະ"), cert.status ? titleCase(cert.status) : undefined);
  push(L(lang, "Issued by", "ອອກໂດຍ"), cert.issued_by_name);
  push(L(lang, "Verify code", "ລະຫັດກວດສອບ"), cert.verify_code);

  return {
    title: text(cert.service_name, lang) || L(lang, "Official Certificate", "ໃບຢັ້ງຢືນທາງການ"),
    kicker: L(lang, "Civil Registration", "ທະບຽນພົນລະເມືອງ"),
    refNo: cert.certificate_no || cert.reference_no || "—",
    holderName: cert.holder_name || "—",
    office: cert.issued_by_name || "Lao Citizen Center",
    fields,
    issued: day(cert.issued_at, lang),
    verifyCode: cert.verify_code || cert.certificate_no || "—",
  };
}

/**
 * An issued case, for when the certificate record itself is not readable —
 * the case still carries the certificate number, the holder and the office.
 */
export function docSpecFromApplication(
  app: ApplicationDetail,
  cert: Certificate | undefined,
  lang: Lang,
): DocSpec {
  if (cert) return docSpecFromCertificate(cert, lang);

  const fields: DocField[] = [];
  const push = (label: string, value?: string) => {
    if (value) fields.push({ label, value });
  };
  push(L(lang, "Reference", "ເລກອ້າງອີງ"), app.reference_no);
  push(L(lang, "Certificate no.", "ເລກໃບຢັ້ງຢືນ"), app.certificate_no);
  push(L(lang, "Status", "ສະຖານະ"), text(app.status_label, lang));
  push(L(lang, "Province", "ແຂວງ"), app.jurisdiction?.province_name);
  push(L(lang, "District", "ເມືອງ"), app.jurisdiction?.district_name);
  push(L(lang, "Village", "ບ້ານ"), app.jurisdiction?.village_name);

  return {
    title: text(app.service_name, lang),
    kicker: L(lang, "Civil Registration", "ທະບຽນພົນລະເມືອງ"),
    refNo: app.certificate_no || app.reference_no,
    holderName: app.subject_name || app.applicant || "—",
    office: app.jurisdiction?.district_name
      ? `${app.jurisdiction.district_name} · ${app.jurisdiction.province_name ?? ""}`.trim()
      : "Lao Citizen Center",
    fields,
    issued: day(app.issued_at ?? app.updated_at, lang),
    verifyCode: app.certificate_no || app.reference_no,
  };
}
