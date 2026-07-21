/*
 * Dummy document specs for the prototype. The Residence Certificate uses a real
 * PDF asset (kept as-is); every other document is generated on demand from these
 * specs (see lib/document.ts). Content is illustrative English placeholder data.
 */
import type { DocSpec } from "../lib/document";

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
