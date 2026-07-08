/*
 * Per-service configuration — fee, processing time and required documents.
 * Keyed by the service `id` in SERVICES (ServicePage.tsx).
 *
 * Fees are DEMO ESTIMATES for the prototype (except Residence Certificate, which
 * comes from the PRD §5.1). Real amounts follow the MoHA/MoPS fee schedule and
 * must be reconfirmed at configuration time (PRD §11.3 master data, §13 #4).
 *
 * processingTime / requiredDocs are bilingual ({ en, lo }); read the current
 * language with `cfg.processingTime[lang]` and `cfg.requiredDocs.map(d => d[lang])`.
 *
 * fee: number  → amount in LAK (0 = free)
 * fee: null    → not configured / to be confirmed
 */
import type { Lang } from "./i18n";

export interface Bilingual {
  en: string;
  lo: string;
}

export interface ServiceConfig {
  fee: number | null;
  processingTime: Bilingual;
  requiredDocs: Bilingual[];
}

export function formatLak(n: number | null, lang: Lang = "en"): string {
  if (n === null) return "—";
  if (n === 0) return lang === "lo" ? "ຟຣີ" : "Free";
  const num = n.toLocaleString("en-US");
  return lang === "lo" ? `${num} ກີບ` : `${num} LAK`;
}

export const SERVICE_CONFIG: Record<string, ServiceConfig> = {
  resident: {
    fee: 20000, // PRD §5.1
    processingTime: { en: "Same day (target)", lo: "ໄດ້ຮັບພາຍໃນມື້ດຽວກັນ (ຄາດໝາຍ)" },
    requiredDocs: [
      { en: "National ID card or passport", lo: "ບັດປະຈຳຕົວ ຫຼື ໜັງສືຜ່ານແດນ" },
      { en: "Family book", lo: "ປຶ້ມສຳມະໂນຄົວ" },
      { en: "Lease contract (renters / foreigners)", lo: "ສັນຍາເຊົ່າ (ຜູ້ເຊົ່າ / ຄົນຕ່າງປະເທດ)" },
    ],
  },
  birth: {
    fee: 0, // free
    processingTime: { en: "≤ 5 working days", lo: "ບໍ່ເກີນ 5 ວັນລັດຖະການ" },
    requiredDocs: [
      { en: "Hospital / clinic birth record", lo: "ບັນທຶກການເກີດຈາກໂຮງໝໍ / ຄລີນິກ" },
      { en: "Parents' ID card", lo: "ບັດປະຈຳຕົວຂອງພໍ່ແມ່" },
      { en: "Family book", lo: "ປຶ້ມສຳມະໂນຄົວ" },
    ],
  },
  death: {
    fee: 0, // free
    processingTime: { en: "≤ 5 working days", lo: "ບໍ່ເກີນ 5 ວັນລັດຖະການ" },
    requiredDocs: [
      { en: "Deceased's ID card", lo: "ບັດປະຈຳຕົວຂອງຜູ້ເສຍຊີວິດ" },
      { en: "Medical / cause-of-death note", lo: "ໃບຢັ້ງຢືນທາງການແພດ / ສາເຫດການເສຍຊີວິດ" },
      { en: "Family book", lo: "ປຶ້ມສຳມະໂນຄົວ" },
    ],
  },
  marriage: {
    fee: 50000, // demo estimate
    processingTime: { en: "≤ 3 working days", lo: "ບໍ່ເກີນ 3 ວັນລັດຖະການ" },
    requiredDocs: [
      { en: "Application + CV", lo: "ໃບສະໝັກ + ຊີວະປະຫວັດ" },
      { en: "Single-status certificate (each spouse)", lo: "ໃບຢັ້ງຢືນສະຖານະໂສດ (ແຕ່ລະຝ່າຍ)" },
      { en: "Residence certificates", lo: "ໃບຢັ້ງຢືນທີ່ຢູ່" },
      { en: "Medical certificate", lo: "ໃບຢັ້ງຢືນສຸຂະພາບ" },
      { en: "Minute of engagement", lo: "ບົດບັນທຶກການໝັ້ນໝາຍ" },
    ],
  },
  divorce: {
    fee: 50000, // demo estimate
    processingTime: { en: "≤ 3 working days", lo: "ບໍ່ເກີນ 3 ວັນລັດຖະການ" },
    requiredDocs: [
      { en: "Divorce application", lo: "ໃບສະໝັກຢ່າຮ້າງ" },
      { en: "Village minute (voluntary) or court decision (contested)", lo: "ບົດບັນທຶກຂັ້ນບ້ານ (ສະໝັກໃຈ) ຫຼື ຄຳຕັດສິນຂອງສານ (ຂັດແຍ້ງ)" },
      { en: "Existing marriage certificate", lo: "ໃບຢັ້ງຢືນການແຕ່ງງານທີ່ມີຢູ່" },
      { en: "ID cards (both spouses)", lo: "ບັດປະຈຳຕົວ (ທັງສອງຝ່າຍ)" },
    ],
  },
  "family-book": {
    fee: 0, // free — auto-maintained record, view & request a copy
    processingTime: { en: "Issued on request", lo: "ອອກໃຫ້ຕາມການຮ້ອງຂໍ" },
    requiredDocs: [
      { en: "Household head ID card", lo: "ບັດປະຈຳຕົວຂອງຫົວໜ້າຄົວເຮືອນ" },
    ],
  },
};

export const DEFAULT_SERVICE_CONFIG: ServiceConfig = {
  fee: null,
  processingTime: { en: "Varies", lo: "ແຕກຕ່າງກັນ" },
  requiredDocs: [{ en: "National ID card", lo: "ບັດປະຈຳຕົວ" }],
};

/*
 * Dummy fee schedule (LAK, 0 = free) for services without a full config above.
 * Demo estimates only. Free: social aid, health, education, most bill/tax
 * payments (you pay the amount, not a service fee). Paid: issuance, permits,
 * licenses & documents.
 */
export const SERVICE_FEE: Record<string, number> = {
  // Civil & Population
  "national-id": 30000,
  "name-change": 40000,
  // Immigration
  passport: 250000,
  visa: 200000,
  "travel-doc": 100000,
  embassy: 50000,
  // Tax & Payment
  "tax-payment": 0,
  utility: 0,
  fines: 0,
  "gov-fees": 0,
  "biz-reg": 150000,
  "biz-permit": 100000,
  "corp-tax": 0,
  "trade-license": 120000,
  // Health
  insurance: 0,
  appointment: 0,
  vaccination: 0,
  "medical-cert": 20000,
  // Transport
  "driver-license": 60000,
  "vehicle-reg": 80000,
  "road-tax": 0,
  // Land & Property
  "property-reg": 100000,
  "building-permit": 150000,
  "land-cert": 50000,
  "farm-reg": 0,
  // Social Protection
  "social-aid": 0,
  disability: 0,
  "child-support": 0,
  subsidy: 0,
  // Education
  enrollment: 0,
  "cert-verify": 30000,
  scholarship: 0,
  // Civil (community & legal)
  forums: 0,
  village: 0,
  court: 50000,
  "police-report": 0,
  "legal-doc": 40000,
};

export function getServiceConfig(id: string): ServiceConfig {
  if (SERVICE_CONFIG[id]) return SERVICE_CONFIG[id];
  const fee = id in SERVICE_FEE ? SERVICE_FEE[id] : null;
  return { ...DEFAULT_SERVICE_CONFIG, fee };
}
