import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, Loader2, Check, AlertCircle, RefreshCw } from "lucide-react";
import { catalog, locations } from "../api/endpoints";
import { useQuery } from "../api/hooks";
import { text, type Bilingual, type ReferenceItem } from "../api/types";
import { useT, useLang } from "../i18n";
import {
  useClearServerError,
  useFieldError,
  FieldError,
  fieldErrorRing,
} from "./formValidation";

/*
 * Shared form fields used across the Civil Registration forms:
 * - DateField        → native date picker
 * - SearchableSelect → select2-style dropdown with type-to-search
 * - LocationFields   → cascading Province → District → Village, read from the
 *                      live location service (provinces → districts → villages)
 * - ReferenceSelect  → a <select> fed by a reference list (nationality,
 *                      ethnicity, religion, relation, cause of death, …)
 *
 * Every field accepts an optional `path` — the key the API uses for it in
 * form_data, e.g. "applicant.nationality". When a submission comes back 422 the
 * page puts the returned messages on the ValidationProvider and the field with
 * the matching path renders the server's own sentence.
 */

/* Sentences the shared fields need that no page dictionary owns. */
const LOAD_FAILED: Bilingual = {
  en: "Could not load this list.",
  lo: "ບໍ່ສາມາດໂຫຼດລາຍການນີ້ໄດ້.",
};
const RETRY: Bilingual = { en: "Retry", lo: "ລອງໃໝ່" };
const NOTHING_YET: Bilingual = {
  en: "Nothing to choose from here yet.",
  lo: "ຍັງບໍ່ມີໃຫ້ເລືອກເທື່ອ.",
};

export function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

const fieldBase =
  "w-full bg-white border rounded-2xl px-4 py-3.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all";

/** "Couldn't load — Retry" row, in the same inline style as a field error. */
function LoadFailure({ onRetry }: { onRetry: () => void }) {
  const { lang } = useLang();
  return (
    <p data-field-error className="flex items-center gap-1.5 text-xs text-red-500 mt-1.5">
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
      {text(LOAD_FAILED, lang)}
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:opacity-80"
      >
        <RefreshCw className="w-3 h-3" />
        {text(RETRY, lang)}
      </button>
    </p>
  );
}

export function DateField({
  label, value, onChange, required, path, min, max,
}: {
  label: React.ReactNode; value: string; onChange: (v: string) => void; required?: boolean;
  /** form_data key, so a server-side error can land on this field. */
  path?: string;
  min?: string; max?: string;
}) {
  const { hasError, message } = useFieldError({ path, required, value });
  const clearServerError = useClearServerError();
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(e) => { clearServerError(path); onChange(e.target.value); }}
        className={`${fieldBase} ${fieldErrorRing(hasError)}`}
      />
      <FieldError show={hasError} message={message} />
    </div>
  );
}

/* ─── Searchable select (select2-style) ─── */
export interface Option {
  value: string;
  label: string;
  sub?: string; // secondary text (e.g. Lao name)
}

export function SearchableSelect({
  label, value, options, placeholder, onChange, required, disabled, loading,
  path, failed, onRetry, emptyMessage,
}: {
  label: React.ReactNode;
  value: string;
  options: Option[];
  placeholder: string;
  onChange: (v: string) => void;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  /** form_data key, so a server-side error can land on this field. */
  path?: string;
  /** The list behind this select could not be loaded. */
  failed?: boolean;
  onRetry?: () => void;
  /** Shown inside the dropdown when the list loaded but came back empty. */
  emptyMessage?: string;
}) {
  const t = useT("fields");
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const clearServerError = useClearServerError();
  const { hasError, message } = useFieldError({ path, required, value, disabled });

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const q = query.trim().toLowerCase();
  const filtered = (q
    ? options.filter((o) => `${o.label} ${o.sub ?? ""}`.toLowerCase().includes(q))
    : options
  ).slice(0, 100);

  const selected = options.find((o) => o.value === value);
  const outlined = hasError || Boolean(failed);

  return (
    <div ref={ref}>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => { if (!disabled) { setQuery(""); setOpen((o) => !o); } }}
          className={`w-full flex items-center justify-between gap-2 border rounded-2xl px-4 py-3.5 text-sm text-left transition-all focus:outline-none focus:ring-2 ${
            disabled
              ? "bg-gray-100 border-gray-200 cursor-not-allowed"
              : `bg-white ${fieldErrorRing(outlined)}`
          }`}
        >
          <span className={`truncate ${selected ? "text-gray-800" : "text-gray-400"}`}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && !disabled && (
          <div className="absolute z-[60] mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-2 border-b border-gray-100">
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("search")}
                  className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400"
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto py-1">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" /> {t("loading")}
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-400">
                  {q ? t("noResults") : emptyMessage ?? text(NOTHING_YET, lang)}
                </div>
              ) : (
                filtered.map((o) => {
                  const active = o.value === value;
                  return (
                    <button
                      key={o.value + o.label}
                      type="button"
                      onClick={() => { clearServerError(path); onChange(o.value); setOpen(false); }}
                      className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left transition-colors ${
                        active ? "bg-[#EEF2FF]" : "hover:bg-gray-50"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block text-sm text-gray-800 truncate">{o.label}</span>
                        {o.sub && o.sub !== o.label && (
                          <span className="block text-xs text-gray-400 truncate">{o.sub}</span>
                        )}
                      </span>
                      {active && <Check className="w-4 h-4 flex-shrink-0" style={{ color: "#344EAD" }} />}
                    </button>
                  );
                })
              )}
              {!loading && filtered.length === 100 && (
                <div className="px-4 py-2 text-[11px] text-gray-400">{t("refineSearch")}</div>
              )}
            </div>
          </div>
        )}
      </div>
      {failed && onRetry ? <LoadFailure onRetry={onRetry} /> : <FieldError show={hasError} message={message} />}
    </div>
  );
}

/* ─── Reference lists (nationality, ethnicity, relation, …) ─── */

/*
 * The reference endpoint answers with { type, count, items }. The declared
 * return type is the item array, so unwrap whichever shape actually arrives
 * rather than trusting one of them.
 */
export async function fetchReferenceList(type: string, signal?: AbortSignal): Promise<ReferenceItem[]> {
  const payload = (await catalog.referenceList(type, signal)) as unknown;
  if (Array.isArray(payload)) return payload as ReferenceItem[];
  const items = (payload as { items?: ReferenceItem[] } | null)?.items;
  return Array.isArray(items) ? items : [];
}

export interface ReferenceOptions {
  options: Option[];
  loading: boolean;
  failed: boolean;
  retry: () => void;
  /** Label for a stored code, so a review screen can read it back. */
  labelOf: (code: string) => string;
}

/** Load one reference list and shape it for a select. */
export function useReferenceOptions(type: string): ReferenceOptions {
  const { lang } = useLang();
  const { data, loading, error, refetch } = useQuery(
    (signal) => fetchReferenceList(type, signal),
    [type],
  );

  const options = useMemo<Option[]>(
    () =>
      (data ?? []).map((item) => ({
        value: item.code,
        label: text(item.label, lang),
        sub: lang === "lo" ? item.label.en : item.label.lo,
      })),
    [data, lang],
  );

  const labelOf = useCallback(
    (code: string) => options.find((o) => o.value === code)?.label ?? code,
    [options],
  );

  return { options, loading, failed: Boolean(error), retry: refetch, labelOf };
}

/**
 * A <select> whose choices come from a reference list already loaded by the
 * page — use this when the page also needs the list for something else (a
 * review screen reading a code back as a label) so it is fetched once.
 */
export function ReferenceSelectView({
  label, source, value, placeholder, onChange, required, path, disabled,
}: {
  label: React.ReactNode;
  source: ReferenceOptions;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  required?: boolean;
  /** form_data key, so a server-side error can land on this field. */
  path?: string;
  disabled?: boolean;
}) {
  const t = useT("fields");
  const { lang } = useLang();
  const { options, loading, failed, retry } = source;
  const clearServerError = useClearServerError();
  const { hasError, message } = useFieldError({ path, required, value, disabled });
  const outlined = hasError || failed;
  const empty = !loading && !failed && options.length === 0;

  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div className="relative">
        <select
          value={value}
          disabled={disabled || loading}
          onChange={(e) => { clearServerError(path); onChange(e.target.value); }}
          className={`w-full appearance-none bg-white border rounded-2xl px-4 py-3.5 text-sm text-gray-800 focus:outline-none focus:ring-2 transition-all pr-10 ${fieldErrorRing(outlined)} ${
            disabled || loading ? "bg-gray-100 text-gray-400" : ""
          }`}
        >
          <option value="">{loading ? t("loading") : placeholder}</option>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          ) : (
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>
      {failed ? (
        <LoadFailure onRetry={retry} />
      ) : empty ? (
        <p className="text-xs text-gray-400 mt-1.5">{text(NOTHING_YET, lang)}</p>
      ) : (
        <FieldError show={hasError} message={message} />
      )}
    </div>
  );
}

/**
 * A <select> whose choices come from a reference list. Same shape as the plain
 * selects the forms already use; it just knows how to load, fail and retry.
 */
export function ReferenceSelect({
  type, ...rest
}: {
  label: React.ReactNode;
  /** Reference list type — the field's `lookup_key` in the form schema. */
  type: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  required?: boolean;
  path?: string;
  disabled?: boolean;
}) {
  const source = useReferenceOptions(type);
  return <ReferenceSelectView source={source} {...rest} />;
}

/* ─── Cascading Province → District → Village (live location service) ─── */

/** What a location group resolved to: the UUIDs the API wants, plus the names
 *  a review screen has to print back at the citizen. */
export interface LocationIds {
  province_id: string;
  district_id: string;
  village_id: string;
  province_name: string;
  district_name: string;
  village_name: string;
}

/** The error paths a location group can report, one per level. */
export interface LocationPaths {
  province?: string;
  district?: string;
  village?: string;
}

export function LocationFields({
  province, district, village, onChange, villageLabel, required,
  valueMode = "name", paths, onResolve,
}: {
  province: string;
  district: string;
  village: string;
  onChange: (patch: { province?: string; district?: string; village?: string }) => void;
  villageLabel?: string;
  required?: boolean;
  /**
   * What the three values hold. "id" stores the location UUIDs the API wants in
   * form_data; "name" (the default) keeps the English place names, which is
   * what the older forms carry.
   */
  valueMode?: "name" | "id";
  /** form_data keys for the three levels, for server-side errors. */
  paths?: LocationPaths;
  /** Reports the resolved UUIDs, whichever value mode is in use. */
  onResolve?: (ids: LocationIds) => void;
}) {
  const t = useT("fields");
  const { lang } = useLang();
  const resolvedVillageLabel = villageLabel ?? t("village");
  const byId = valueMode === "id";

  const provincesQuery = useQuery((signal) => locations.provinces(signal), []);
  const provinces = useMemo(() => provincesQuery.data ?? [], [provincesQuery.data]);

  const provinceId = useMemo(() => {
    if (!province) return "";
    if (byId) return province;
    return provinces.find((p) => p.name.en === province || p.name.lo === province)?.id ?? "";
  }, [byId, province, provinces]);

  const districtsQuery = useQuery(
    (signal) => locations.districts(provinceId, signal),
    [provinceId],
    { enabled: Boolean(provinceId) },
  );
  // While a new province's districts are in flight the previous province's rows
  // are still in `data`; showing them would offer choices that do not belong to
  // the province the citizen just picked.
  const districtsBusy = districtsQuery.loading || districtsQuery.refreshing;
  const districts = useMemo(
    () => (provinceId && !districtsBusy ? districtsQuery.data ?? [] : []),
    [provinceId, districtsBusy, districtsQuery.data],
  );

  const districtId = useMemo(() => {
    if (!district) return "";
    if (byId) return district;
    return districts.find((d) => d.name.en === district || d.name.lo === district)?.id ?? "";
  }, [byId, district, districts]);

  const villagesQuery = useQuery(
    async (signal) => (await locations.villages(districtId, signal)).data,
    [districtId],
    { enabled: Boolean(districtId) },
  );
  const villagesBusy = villagesQuery.loading || villagesQuery.refreshing;
  const villages = useMemo(
    () => (districtId && !villagesBusy ? villagesQuery.data ?? [] : []),
    [districtId, villagesBusy, villagesQuery.data],
  );

  // The pages need the UUIDs to open a case, whichever way the values are held.
  const villageId = useMemo(() => {
    if (!village) return "";
    if (byId) return village;
    return villages.find((v) => v.name.en === village || v.name.lo === village)?.id ?? "";
  }, [byId, village, villages]);

  const nameOf = (rows: { id: string; name: Bilingual }[], id: string) => {
    const row = rows.find((r) => r.id === id);
    return row ? text(row.name, lang) : "";
  };
  const provinceName = nameOf(provinces, provinceId);
  const districtName = nameOf(districts, districtId);
  const villageName = nameOf(villages, villageId);

  const resolveRef = useRef(onResolve);
  resolveRef.current = onResolve;
  useEffect(() => {
    resolveRef.current?.({
      province_id: provinceId,
      district_id: districtId,
      village_id: villageId,
      province_name: provinceName,
      district_name: districtName,
      village_name: villageName,
    });
  }, [provinceId, districtId, villageId, provinceName, districtName, villageName]);

  const toOptions = (rows: { id: string; name: Bilingual }[]): Option[] =>
    rows.map((row) => ({
      value: byId ? row.id : row.name.en,
      label: text(row.name, lang),
      sub: lang === "lo" ? row.name.en : row.name.lo,
    }));

  return (
    <>
      <SearchableSelect
        label={t("province")}
        value={province}
        options={toOptions(provinces)}
        placeholder={t("selectProvince")}
        required={required}
        loading={provincesQuery.loading}
        failed={Boolean(provincesQuery.error)}
        onRetry={provincesQuery.refetch}
        path={paths?.province}
        onChange={(v) => onChange({ province: v, district: "", village: "" })}
      />
      <div className="grid grid-cols-2 gap-3">
        <SearchableSelect
          label={t("district")}
          value={district}
          options={toOptions(districts)}
          placeholder={province ? t("selectDistrict") : t("selectProvinceFirst")}
          required={required}
          disabled={!province}
          loading={districtsBusy}
          failed={Boolean(districtsQuery.error)}
          onRetry={districtsQuery.refetch}
          path={paths?.district}
          onChange={(v) => onChange({ district: v, village: "" })}
        />
        <SearchableSelect
          label={resolvedVillageLabel}
          value={village}
          options={toOptions(villages)}
          placeholder={district ? t("selectVillage") : t("selectDistrictFirst")}
          required={required}
          disabled={!district}
          loading={villagesBusy}
          failed={Boolean(villagesQuery.error)}
          onRetry={villagesQuery.refetch}
          path={paths?.village}
          onChange={(v) => onChange({ village: v })}
        />
      </div>
    </>
  );
}
