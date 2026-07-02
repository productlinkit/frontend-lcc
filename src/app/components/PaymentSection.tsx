import { Scan, Landmark, CreditCard, Lock } from "lucide-react";
import { formatLak } from "../serviceConfig";
import { useT, useLang } from "../i18n";
import { useShowErrors, FieldError, fieldErrorRing } from "./formValidation";

/*
 * Reusable payment UI — QR / Bank transfer / Card. Used by every fee-bearing
 * Civil Registration service. Payment state lives in the parent form; this
 * component is presentational and reports changes through `onChange`.
 */

export type PaymentMethod = "qr" | "bank" | "cc";

export interface PaymentState {
  method: PaymentMethod;
  bankName: string;
  cardNumber: string;
  cardName: string;
  cardExpiry: string;
  cardCvv: string;
}

export const blankPayment: PaymentState = {
  method: "qr", bankName: "", cardNumber: "", cardName: "", cardExpiry: "", cardCvv: "",
};

// Commercial banks operating in Lao PDR
export const LAO_BANKS = [
  "BCEL — Banque pour le Commerce Extérieur Lao",
  "Lao Development Bank (LDB)",
  "Agricultural Promotion Bank (APB)",
  "Joint Development Bank (JDB)",
  "Phongsavanh Bank",
  "ST Bank",
  "BIC Bank Lao",
  "Indochina Bank",
  "Maruhan Japan Bank Lao",
  "Lao-Viet Bank",
  "Lao China Bank",
  "ACLEDA Bank Lao",
];

export function isPaymentValid(p: PaymentState): boolean {
  if (p.method === "bank") return Boolean(p.bankName);
  if (p.method === "cc")
    return (
      p.cardNumber.replace(/\s/g, "").length === 16 &&
      p.cardName.trim().length > 0 &&
      p.cardExpiry.length === 5 &&
      p.cardCvv.length === 3
    );
  return true; // qr
}

const formatCard = (v: string) =>
  v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

const formatExpiry = (v: string) => {
  const raw = v.replace(/\D/g, "").slice(0, 4);
  return raw.length >= 3 ? raw.slice(0, 2) + "/" + raw.slice(2) : raw;
};

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

/* ─── QR Code ─── */
function QRCode() {
  const pattern = [
    [1,1,1,1,1,1,1,0,1,0,0,1,0,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,1,1,0,0,1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,1,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,0,1,0,1,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,1,1,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0,0,1,1,0,1,0,0,0,0,0,0,0,0],
    [1,0,1,1,0,1,1,0,0,1,1,0,1,1,0,1,1,0,1,0],
    [0,1,0,1,1,0,0,1,1,0,1,1,0,1,1,0,0,1,1,1],
    [1,1,0,0,1,0,1,0,1,1,0,0,1,0,1,1,0,0,1,0],
    [0,0,1,0,0,1,0,1,0,1,1,0,0,1,0,0,1,0,0,1],
    [1,0,1,1,1,0,1,0,1,0,0,1,1,0,1,0,1,1,1,0],
    [0,0,0,0,0,0,0,0,1,1,0,1,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,0,0,1,0,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,1,1,0,1,0,1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,0,1,1,0,1,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,1,1,0,1,1,0,0,0,1,1,1,0,0],
    [1,0,0,0,0,0,1,0,0,1,0,0,1,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,1,0,1,1,0,1,1,1,1,1,1,1],
  ];
  const cells: { x: number; y: number }[] = [];
  pattern.forEach((row, y) => row.forEach((cell, x) => { if (cell) cells.push({ x, y }); }));
  return (
    <svg viewBox="0 0 20 20" className="w-full h-full" shapeRendering="crispEdges">
      <rect width="20" height="20" fill="white" />
      {cells.map(({ x, y }) => <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#1a1a1a" />)}
    </svg>
  );
}

interface PaymentSectionProps {
  amount: number;
  serviceName: string;
  value: PaymentState;
  onChange: (patch: Partial<PaymentState>) => void;
  reference?: string;
}

export function PaymentSection({ amount, serviceName, value, onChange, reference }: PaymentSectionProps) {
  const t = useT("payment");
  const { lang } = useLang();
  const showErrors = useShowErrors();
  const bankErr = showErrors && value.method === "bank" && !value.bankName;
  const numErr = showErrors && value.method === "cc" && value.cardNumber.replace(/\s/g, "").length !== 16;
  const nameErr = showErrors && value.method === "cc" && value.cardName.trim().length === 0;
  const expErr = showErrors && value.method === "cc" && value.cardExpiry.length !== 5;
  const cvvErr = showErrors && value.method === "cc" && value.cardCvv.length !== 3;
  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">{t("serviceFee")}</p>
          <p className="text-2xl font-bold" style={{ color: "#344EAD" }}>{formatLak(amount, lang)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 mb-0.5">{t("service")}</p>
          <p className="text-sm font-semibold text-gray-700">{serviceName}</p>
        </div>
      </div>

      {/* Method toggle — QR / Bank / Card */}
      <div className="p-1 bg-gray-200 rounded-2xl grid grid-cols-3 gap-1">
        {([
          { id: "qr", label: t("methodQr"), Icon: Scan },
          { id: "bank", label: t("methodBank"), Icon: Landmark },
          { id: "cc", label: t("methodCard"), Icon: CreditCard },
        ] as const).map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => onChange({ method: id })}
            className="flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200"
            style={
              value.method === id
                ? { backgroundColor: "#344EAD", color: "white", boxShadow: "0 2px 12px #344EAD55" }
                : { color: "#6B7280" }
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* QR */}
      {value.method === "qr" && (
        <div className="flex flex-col items-center gap-5 py-2">
          <div className="relative">
            <div className="w-56 h-56 p-4 bg-white rounded-3xl shadow-lg border border-gray-100">
              <QRCode />
            </div>
            {[
              "top-2.5 left-2.5 border-t-[3px] border-l-[3px] rounded-tl-2xl",
              "top-2.5 right-2.5 border-t-[3px] border-r-[3px] rounded-tr-2xl",
              "bottom-2.5 left-2.5 border-b-[3px] border-l-[3px] rounded-bl-2xl",
              "bottom-2.5 right-2.5 border-b-[3px] border-r-[3px] rounded-br-2xl",
            ].map((cls, i) => (
              <div key={i} className={`absolute w-7 h-7 ${cls}`} style={{ borderColor: "#344EAD" }} />
            ))}
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">{t("qrScanTitle")}</p>
            <p className="text-xs text-gray-400 mt-1">{t("qrScanSub")}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Lock className="w-3 h-3" />
            {t("qrSecured")}
          </div>
        </div>
      )}

      {/* Bank transfer */}
      {value.method === "bank" && (
        <div className="space-y-4">
          <div>
            <FieldLabel required>{t("selectBank")}</FieldLabel>
            <div className="relative">
              <select
                value={value.bankName}
                onChange={(e) => onChange({ bankName: e.target.value })}
                className={`w-full appearance-none bg-white border rounded-2xl px-4 py-3.5 text-sm text-gray-800 focus:outline-none focus:ring-2 transition-all pr-10 ${fieldErrorRing(bankErr)}`}
              >
                <option value="">{t("chooseBank")}</option>
                {LAO_BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <FieldError show={bankErr} />
          </div>
          {value.bankName && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t("transferDetails")}</p>
              {[
                { label: t("payTo"), value: "Lao Citizen Center" },
                { label: t("bank"), value: value.bankName },
                { label: t("accountNo"), value: "010-12-00-8800391-001" },
                { label: t("amount"), value: formatLak(amount, lang) },
                { label: t("reference"), value: reference ?? "—" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-gray-500 flex-shrink-0">{row.label}</span>
                  <span className="text-sm font-semibold text-gray-800 text-right truncate">{row.value}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-start gap-2 text-xs text-gray-400">
            <Lock className="w-3 h-3 flex-shrink-0 mt-0.5" />
            {t("bankNote")}
          </div>
        </div>
      )}

      {/* Card */}
      {value.method === "cc" && (
        <div className="space-y-4">
          <div
            className="relative rounded-3xl p-6 overflow-hidden"
            style={{ background: "linear-gradient(135deg, #344EAD 0%, #1a2d7a 100%)" }}
          >
            <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white opacity-[0.07]" />
            <div className="absolute top-8 -right-4 w-20 h-20 rounded-full bg-white opacity-[0.07]" />
            <p className="text-white/50 text-[11px] mb-5 font-medium tracking-widest uppercase">{t("cardType")}</p>
            <p className="text-white font-mono text-lg tracking-widest">
              {value.cardNumber || "•••• •••• •••• ••••"}
            </p>
            <div className="flex justify-between mt-4">
              <div>
                <p className="text-white/50 text-[10px] uppercase tracking-wider">{t("cardholder")}</p>
                <p className="text-white text-sm mt-0.5 font-medium tracking-wide">
                  {value.cardName || t("yourName")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/50 text-[10px] uppercase tracking-wider">{t("expires")}</p>
                <p className="text-white text-sm mt-0.5 font-medium">
                  {value.cardExpiry || "MM/YY"}
                </p>
              </div>
            </div>
          </div>

          <div>
            <FieldLabel required>{t("cardNumber")}</FieldLabel>
            <input
              type="text"
              inputMode="numeric"
              value={value.cardNumber}
              onChange={(e) => onChange({ cardNumber: formatCard(e.target.value) })}
              placeholder="0000 0000 0000 0000"
              className={`w-full bg-white border rounded-2xl px-4 py-3.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all ${fieldErrorRing(numErr)}`}
            />
            <FieldError show={numErr} />
          </div>
          <div>
            <FieldLabel required>{t("cardholderName")}</FieldLabel>
            <input
              type="text"
              value={value.cardName}
              onChange={(e) => onChange({ cardName: e.target.value.toUpperCase() })}
              placeholder={t("cardNamePlaceholder")}
              className={`w-full bg-white border rounded-2xl px-4 py-3.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all ${fieldErrorRing(nameErr)}`}
            />
            <FieldError show={nameErr} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel required>{t("expiryDate")}</FieldLabel>
              <input
                type="text"
                inputMode="numeric"
                value={value.cardExpiry}
                onChange={(e) => onChange({ cardExpiry: formatExpiry(e.target.value) })}
                placeholder="MM/YY"
                maxLength={5}
                className={`w-full bg-white border rounded-2xl px-4 py-3.5 text-sm text-gray-800 font-mono placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all ${fieldErrorRing(expErr)}`}
              />
              <FieldError show={expErr} />
            </div>
            <div>
              <FieldLabel required>{t("cvv")}</FieldLabel>
              <input
                type="password"
                inputMode="numeric"
                value={value.cardCvv}
                onChange={(e) => onChange({ cardCvv: e.target.value.replace(/\D/g, "").slice(0, 3) })}
                placeholder="•••"
                maxLength={3}
                className={`w-full bg-white border rounded-2xl px-4 py-3.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all ${fieldErrorRing(cvvErr)}`}
              />
              <FieldError show={cvvErr} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Lock className="w-3 h-3 flex-shrink-0" />
            {t("cardEncrypted")}
          </div>
        </div>
      )}
    </div>
  );
}
