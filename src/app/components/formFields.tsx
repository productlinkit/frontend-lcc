import { useState, useEffect, useRef } from "react";
import { ChevronDown, Search, Loader2, Check } from "lucide-react";
import {
  PROVINCES,
  districtsOf,
  villagesOf,
  type Loc,
} from "../data/laoDivisions";

/*
 * Shared form fields used across the Civil Registration forms:
 * - DateField        → native date picker
 * - SearchableSelect → select2-style dropdown with type-to-search
 * - LocationFields   → cascading Province → District → Village (real Lao data,
 *                      villages lazy-loaded). Values are EN name strings.
 */

export function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

const fieldClass =
  "w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#344EAD] focus:ring-2 focus:ring-[#344EAD]/20 transition-all";

export function DateField({
  label, value, onChange, required,
}: {
  label: React.ReactNode; value: string; onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className={fieldClass} />
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
}: {
  label: React.ReactNode;
  value: string;
  options: Option[];
  placeholder: string;
  onChange: (v: string) => void;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={ref}>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => { if (!disabled) { setQuery(""); setOpen((o) => !o); } }}
          className={`w-full flex items-center justify-between gap-2 border rounded-2xl px-4 py-3.5 text-sm text-left transition-all focus:outline-none focus:border-[#344EAD] focus:ring-2 focus:ring-[#344EAD]/20 ${
            disabled
              ? "bg-gray-100 border-gray-200 cursor-not-allowed"
              : "bg-white border-gray-200"
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
                  placeholder="Search..."
                  className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400"
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto py-1">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-400">No results</div>
              ) : (
                filtered.map((o) => {
                  const active = o.value === value;
                  return (
                    <button
                      key={o.value + o.label}
                      type="button"
                      onClick={() => { onChange(o.value); setOpen(false); }}
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
                <div className="px-4 py-2 text-[11px] text-gray-400">Refine your search to see more…</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Cascading Province → District → Village (real Lao data) ─── */
export function LocationFields({
  province, district, village, onChange, villageLabel = "Village", required,
}: {
  province: string;
  district: string;
  village: string;
  onChange: (patch: { province?: string; district?: string; village?: string }) => void;
  villageLabel?: string;
  required?: boolean;
}) {
  const [villageOpts, setVillageOpts] = useState<Loc[]>([]);
  const [loadingVillages, setLoadingVillages] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (province && district) {
      setLoadingVillages(true);
      villagesOf(province, district).then((v) => {
        if (!cancelled) { setVillageOpts(v); setLoadingVillages(false); }
      });
    } else {
      setVillageOpts([]);
    }
    return () => { cancelled = true; };
  }, [province, district]);

  const provinceOptions: Option[] = PROVINCES.map((p) => ({ value: p.name, label: p.name, sub: p.lo }));
  const districtOptions: Option[] = districtsOf(province).map((d) => ({ value: d.name, label: d.name, sub: d.lo }));
  const villageOptions: Option[] = villageOpts.map((v) => ({ value: v.name, label: v.name, sub: v.lo }));

  return (
    <>
      <SearchableSelect
        label="Province / Capital"
        value={province}
        options={provinceOptions}
        placeholder="Select province..."
        required={required}
        onChange={(v) => onChange({ province: v, district: "", village: "" })}
      />
      <div className="grid grid-cols-2 gap-3">
        <SearchableSelect
          label="District"
          value={district}
          options={districtOptions}
          placeholder={province ? "Select district..." : "Select province first"}
          required={required}
          disabled={!province}
          onChange={(v) => onChange({ district: v, village: "" })}
        />
        <SearchableSelect
          label={villageLabel}
          value={village}
          options={villageOptions}
          placeholder={district ? "Select village..." : "Select district first"}
          required={required}
          disabled={!district}
          loading={loadingVillages}
          onChange={(v) => onChange({ village: v })}
        />
      </div>
    </>
  );
}
