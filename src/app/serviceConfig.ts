/*
 * Per-service configuration — fee, processing time and required documents.
 * Keyed by the service `code` the API uses ("resident", "birth", …), which is
 * also the `id` other pages already pass around.
 *
 * The numbers below are no longer the source of truth: they are the *initial*
 * state so a card never flashes an empty fee, and the fallback when the backend
 * cannot be reached. The real table is /services, fetched once and cached in
 * this module (see `loadServiceCatalogue`). Anything reading SERVICE_CONFIG or
 * getServiceConfig transparently gets the fetched values once they land; a
 * component that wants to re-render when they do should use `useServiceConfig`.
 *
 * processingTime / requiredDocs are bilingual ({ en, lo }); read the current
 * language with `cfg.processingTime[lang]` and `cfg.requiredDocs.map(d => d[lang])`.
 *
 * fee: number  → amount in LAK (0 = free)
 * fee: null    → not configured / to be confirmed
 */
import { useEffect, useMemo, useState } from "react";

import { catalog } from "./api/endpoints";
import type { Service } from "./api/types";
import type { Lang } from "./i18n";

export interface Bilingual {
  en: string;
  lo: string;
}

export interface ServiceConfig {
  fee: number | null;
  /** Upper bound when the fee is conditional (e.g. marriage). Shown as a range. */
  feeMax?: number;
  processingTime: Bilingual;
  requiredDocs: Bilingual[];
}

export function formatLak(n: number | null, lang: Lang = "en"): string {
  if (n === null) return "—";
  if (n === 0) return lang === "lo" ? "ຟຣີ" : "Free";
  const num = n.toLocaleString("en-US");
  return lang === "lo" ? `${num} ກີບ` : `${num} LAK`;
}

/** Fee label for a service — a range when `feeMax` is set, otherwise a single amount. */
export function formatFee(cfg: ServiceConfig, lang: Lang = "en"): string {
  if (cfg.feeMax != null && cfg.fee != null && cfg.feeMax > cfg.fee) {
    const lo = cfg.fee.toLocaleString("en-US");
    const hi = cfg.feeMax.toLocaleString("en-US");
    return lang === "lo" ? `${lo}–${hi} ກີບ` : `${lo}–${hi} LAK`;
  }
  return formatLak(cfg.fee, lang);
}

/*
 * Seed values. Mutated in place by loadServiceCatalogue() so the exported
 * object identity — which several pages captured at import time — stays valid.
 */
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
    fee: 20000,
    processingTime: { en: "≤ 5 working days", lo: "ບໍ່ເກີນ 5 ວັນລັດຖະການ" },
    requiredDocs: [
      { en: "Hospital / clinic birth record", lo: "ບັນທຶກການເກີດຈາກໂຮງໝໍ / ຄລີນິກ" },
      { en: "Parents' ID card", lo: "ບັດປະຈຳຕົວຂອງພໍ່ແມ່" },
      { en: "Family book", lo: "ປຶ້ມສຳມະໂນຄົວ" },
    ],
  },
  death: {
    fee: 20000,
    processingTime: { en: "≤ 5 working days", lo: "ບໍ່ເກີນ 5 ວັນລັດຖະການ" },
    requiredDocs: [
      { en: "Deceased's ID card", lo: "ບັດປະຈຳຕົວຂອງຜູ້ເສຍຊີວິດ" },
      { en: "Medical / cause-of-death note", lo: "ໃບຢັ້ງຢືນທາງການແພດ / ສາເຫດການເສຍຊີວິດ" },
      { en: "Family book", lo: "ປຶ້ມສຳມະໂນຄົວ" },
    ],
  },
  marriage: {
    // Conditional fee — the real total is computed in MarriageCertificatePage
    // from the couple's nationality + whether a betrothal record is created
    // (see MARRIAGE_FEES). Cards show the range: 100,000 (Lao+Lao, linked
    // betrothal) up to 250,000 (foreign spouse + new betrothal record).
    fee: 100000,
    feeMax: 250000,
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
    fee: 10000,
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

/*
 * Marriage fee schedule (LAK) — official MoHA rate card. The marriage total is
 * conditional on the couple, which /services does not break down (it only
 * publishes the 100,000–250,000 range), so this stays a local constant.
 *   • Betrothal (Proposal) Record ............ 100,000  (only when creating one)
 *   • Registration, Lao national + Lao national 100,000
 *   • Registration, Lao national + foreigner .. 150,000  (resident/alien or from abroad)
 */
export const MARRIAGE_FEES = {
  betrothalRecord: 100000,
  registrationLaoLao: 100000,
  registrationForeign: 150000,
} as const;

export const DEFAULT_SERVICE_CONFIG: ServiceConfig = {
  fee: null,
  processingTime: { en: "Varies", lo: "ແຕກຕ່າງກັນ" },
  requiredDocs: [{ en: "National ID card", lo: "ບັດປະຈຳຕົວ" }],
};

/*
 * Fee-only fallback (LAK, 0 = free) for services the catalogue has not been
 * read for yet. Overwritten from /services on the first load.
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

/* ── The cached catalogue ──────────────────────────────────────────────── */

function toConfig(s: Service): ServiceConfig {
  const isRange = s.fee_is_range && s.fee_max_lak > s.fee_lak;
  const time = s.processing_time;
  return {
    fee: typeof s.fee_lak === "number" ? s.fee_lak : null,
    feeMax: isRange ? s.fee_max_lak : undefined,
    processingTime:
      time && (time.en || time.lo)
        ? { en: time.en || time.lo, lo: time.lo || time.en }
        : DEFAULT_SERVICE_CONFIG.processingTime,
    requiredDocs: (s.required_docs ?? []).map((d) => ({ en: d.en || d.lo, lo: d.lo || d.en })),
  };
}

let catalogueLoaded = false;
let cataloguePromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

/** True once /services has been read at least once in this tab. */
export function isServiceCatalogueLoaded(): boolean {
  return catalogueLoaded;
}

/**
 * Read /services once per tab and fold it into SERVICE_CONFIG / SERVICE_FEE.
 * Concurrent callers share the same request; a failure is swallowed (the seed
 * values stay on screen) and the next call retries.
 */
export function loadServiceCatalogue(): Promise<void> {
  if (catalogueLoaded) return Promise.resolve();
  if (cataloguePromise) return cataloguePromise;

  cataloguePromise = catalog
    .services()
    .then((rows) => {
      for (const row of rows ?? []) {
        if (!row?.code) continue;
        SERVICE_CONFIG[row.code] = toConfig(row);
        if (typeof row.fee_lak === "number") SERVICE_FEE[row.code] = row.fee_lak;
      }
      catalogueLoaded = true;
    })
    .catch(() => {
      // Offline or the API is down — the seeded table above is the fallback.
    })
    .finally(() => {
      cataloguePromise = null;
      listeners.forEach((fn) => fn());
    });

  return cataloguePromise;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * The configuration for one service, kept in step with the fetched catalogue.
 *
 *   const { config, loading } = useServiceConfig("resident");
 *
 * `config` is never undefined: until the catalogue lands it is the seeded value
 * (or the default), so a fee never renders as a blank.
 */
export function useServiceConfig(code: string): { config: ServiceConfig; loading: boolean } {
  const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(!catalogueLoaded);

  useEffect(() => {
    if (catalogueLoaded) {
      setLoading(false);
      return;
    }

    let alive = true;
    setLoading(true);

    const unsubscribe = subscribe(() => {
      if (!alive) return;
      setVersion((n) => n + 1);
      setLoading(false);
    });

    void loadServiceCatalogue();

    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  return useMemo(
    () => ({ config: getServiceConfig(code), loading }),
    // `version` is the cache-changed signal, not a value we read directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [code, loading, version],
  );
}
