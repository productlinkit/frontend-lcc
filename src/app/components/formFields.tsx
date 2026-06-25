import { PROVINCES, getDistricts, getVillages } from "../laoLocations";

/*
 * Shared form fields used across the Civil Registration forms:
 * - DateField   → native date picker
 * - LocationFields → cascading Province → District → Village selects
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
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={fieldClass}
      />
    </div>
  );
}

/* ─── Internal cascading select ─── */
function CascadeSelect({
  label, value, options, placeholder, onChange, required, disabled,
}: {
  label: React.ReactNode; value: string; options: string[];
  placeholder: string; onChange: (v: string) => void; required?: boolean; disabled?: boolean;
}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div className="relative">
        <select
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full appearance-none border rounded-2xl px-4 py-3.5 text-sm transition-all pr-10 focus:outline-none focus:border-[#344EAD] focus:ring-2 focus:ring-[#344EAD]/20 ${
            disabled
              ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-white border-gray-200 text-gray-800"
          }`}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ─── Cascading Province → District → Village ─── */
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
  const districts = getDistricts(province);
  const villages = getVillages(province, district);

  return (
    <>
      <CascadeSelect
        label="Province / Capital"
        value={province}
        options={PROVINCES}
        placeholder="Select province..."
        required={required}
        onChange={(v) => onChange({ province: v, district: "", village: "" })}
      />
      <div className="grid grid-cols-2 gap-3">
        <CascadeSelect
          label="District"
          value={district}
          options={districts}
          placeholder={province ? "Select district..." : "Select province first"}
          required={required}
          disabled={!province}
          onChange={(v) => onChange({ district: v, village: "" })}
        />
        <CascadeSelect
          label={villageLabel}
          value={village}
          options={villages}
          placeholder={district ? "Select village..." : "Select district first"}
          required={required}
          disabled={!district}
          onChange={(v) => onChange({ village: v })}
        />
      </div>
    </>
  );
}
