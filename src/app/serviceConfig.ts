/*
 * Per-service configuration — fee, processing time and required documents.
 * Keyed by the service `id` in SERVICES (ServicePage.tsx).
 *
 * Fees are DEMO ESTIMATES for the prototype (except Residence Certificate, which
 * comes from the PRD §5.1). Real amounts follow the MoHA/MoPS fee schedule and
 * must be reconfirmed at configuration time (PRD §11.3 master data, §13 #4).
 *
 * fee: number  → amount in LAK (0 = free)
 * fee: null    → not configured / to be confirmed
 */

export interface ServiceConfig {
  fee: number | null;
  processingTime: string;
  requiredDocs: string[];
}

export function formatLak(n: number | null): string {
  if (n === null) return "—";
  if (n === 0) return "Free";
  return `${n.toLocaleString("en-US")} LAK`;
}

export const SERVICE_CONFIG: Record<string, ServiceConfig> = {
  resident: {
    fee: 20000, // PRD §5.1
    processingTime: "Same day (target)",
    requiredDocs: [
      "National ID card or passport",
      "Family book",
      "Lease contract (renters / foreigners)",
    ],
  },
  birth: {
    fee: 0, // free
    processingTime: "≤ 5 working days",
    requiredDocs: [
      "Hospital / clinic birth record",
      "Parents' ID card",
      "Family book",
    ],
  },
  death: {
    fee: 0, // free
    processingTime: "≤ 5 working days",
    requiredDocs: [
      "Deceased's ID card",
      "Medical / cause-of-death note",
      "Family book",
    ],
  },
  marriage: {
    fee: 50000, // demo estimate
    processingTime: "≤ 3 working days",
    requiredDocs: [
      "Application + CV",
      "Single-status certificate (each spouse)",
      "Residence certificates",
      "Medical certificate",
      "Minute of engagement",
    ],
  },
  divorce: {
    fee: 50000, // demo estimate
    processingTime: "≤ 3 working days",
    requiredDocs: [
      "Divorce application",
      "Village minute (voluntary) or court decision (contested)",
      "Existing marriage certificate",
      "ID cards (both spouses)",
    ],
  },
  "family-book": {
    fee: 0, // free — auto-maintained record, view & request a copy
    processingTime: "Issued on request",
    requiredDocs: ["Household head ID card"],
  },
};

export const DEFAULT_SERVICE_CONFIG: ServiceConfig = {
  fee: null,
  processingTime: "Varies",
  requiredDocs: ["National ID card"],
};

export function getServiceConfig(id: string): ServiceConfig {
  return SERVICE_CONFIG[id] ?? DEFAULT_SERVICE_CONFIG;
}
