import { useState } from "react";
import {
  Scan,
  Landmark,
  CreditCard,
  Lock,
  Wallet,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
} from "lucide-react";
import { formatLak } from "../serviceConfig";
import { useT, useLang } from "../i18n";
import { useShowErrors, FieldError, fieldErrorRing } from "./formValidation";
import { useMutation, useQuery } from "../api/hooks";
import { applications, payments } from "../api/endpoints";
import {
  text,
  type Bilingual,
  type PaymentMethod as ApiPaymentMethod,
  type PaymentResult,
} from "../api/types";

/*
 * What /applications/{id}/pay really answers with. The flat fields are the
 * documented shape; the API also nests the receipt under `transaction` and
 * sends a step-by-step instruction for a method that settles elsewhere, so both
 * are read and whichever is present wins.
 */
type PayResponse = PaymentResult & {
  settled?: boolean;
  transaction?: {
    receipt_no?: string;
    amount_lak?: number;
    status?: string;
    method_code?: string;
  };
  instruction?: PaymentResult["instruction"] & {
    reference_no?: string;
    amount_lak?: number;
    steps?: Bilingual[];
    expires_at?: string;
  };
};

/*
 * Reusable payment UI.
 *
 * Two modes share one summary card:
 *   • draft mode (no `applicationId`) — QR / Bank transfer / Card collected into
 *     the parent form's state; the money moves later, when the case is created.
 *   • live mode (`applicationId` given) — the real methods from
 *     /payment-methods, paid through /applications/{id}/pay.
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
  /** Draft-mode state. Omitted in live mode, where the component holds its own. */
  value?: PaymentState;
  onChange?: (patch: Partial<PaymentState>) => void;
  reference?: string;
  /** Optional itemised fees; when 2+ items are given, the summary lists them. */
  breakdown?: { label: string; amount: number }[];
  /** Live mode: the case to charge through /applications/{id}/pay. */
  applicationId?: string;
  /** Called after a successful charge so the parent can refresh the case. */
  onPaid?: (result: PaymentResult) => void;
  /** Offered when the wallet has too little money in it. */
  onTopUp?: () => void;
}

export function PaymentSection({
  amount,
  serviceName,
  value,
  onChange,
  reference,
  breakdown,
  applicationId,
  onPaid,
  onTopUp,
}: PaymentSectionProps) {
  const t = useT("payment");
  const { lang } = useLang();
  const showBreakdown = Boolean(breakdown && breakdown.length > 1);
  const showErrors = useShowErrors();

  // Draft mode keeps its state in the parent form; live mode holds its own so a
  // caller that only wants to charge a case does not have to carry form state.
  const [draft, setDraft] = useState<PaymentState>(blankPayment);
  const state = value ?? draft;
  const patch = onChange ?? ((p: Partial<PaymentState>) => setDraft((s) => ({ ...s, ...p })));

  const live = Boolean(applicationId);
  const methods = useQuery((signal) => payments.methods(signal), [], { enabled: live });
  const [picked, setPicked] = useState<string>("");
  const charge = useMutation((code: string) => applications.pay(applicationId as string, { method_code: code }));

  const enabled = (methods.data ?? []).filter((m) => m.enabled);
  const methodCode = picked || enabled[0]?.code || "";
  const chosen = enabled.find((m) => m.code === methodCode);
  const insufficient = charge.error?.code === "INSUFFICIENT_FUNDS";

  const result = charge.data as PayResponse | undefined;
  const instruction = result?.instruction;
  const receiptNo = result?.receipt_no || result?.transaction?.receipt_no || "";
  const chargedAmount = result?.amount_lak ?? result?.transaction?.amount_lak ?? amount;
  const settled = Boolean(
    result && (result.settled === true || result.payment_state === "paid" || result.transaction?.status === "paid"),
  );

  const bankErr = showErrors && state.method === "bank" && !state.bankName;
  const numErr = showErrors && state.method === "cc" && state.cardNumber.replace(/\s/g, "").length !== 16;
  const nameErr = showErrors && state.method === "cc" && state.cardName.trim().length === 0;
  const expErr = showErrors && state.method === "cc" && state.cardExpiry.length !== 5;
  const cvvErr = showErrors && state.method === "cc" && state.cardCvv.length !== 3;

  const submit = async () => {
    if (!methodCode) return;
    try {
      const result = await charge.run(methodCode);
      onPaid?.(result);
    } catch {
      /* rendered from charge.error */
    }
  };

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">{t("serviceFee")}</p>
            <p className="text-2xl font-bold" style={{ color: "#344EAD" }}>{formatLak(amount, lang)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-0.5">{t("service")}</p>
            <p className="text-sm font-semibold text-gray-700">{serviceName}</p>
          </div>
        </div>
        {showBreakdown && (
          <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
            {breakdown!.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3">
                <span className="text-sm text-gray-500">{item.label}</span>
                <span className="text-sm font-medium text-gray-700">{formatLak(item.amount, lang)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100">
              <span className="text-sm font-semibold text-gray-800">{t("total")}</span>
              <span className="text-sm font-bold" style={{ color: "#344EAD" }}>{formatLak(amount, lang)}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Live mode: the real methods, charged against the case ── */}
      {live && (
        <>
          {methods.loading && (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/3 bg-gray-200 rounded" />
                    <div className="h-2.5 w-2/3 bg-gray-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {methods.error && !methods.loading && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 text-center">
              <p className="text-sm text-gray-700">{methods.error.message}</p>
              <button
                onClick={methods.refetch}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
                style={{ backgroundColor: "#344EAD" }}
              >
                <RefreshCw className="w-4 h-4" />
                {lang === "lo" ? "ລອງໃໝ່" : "Try again"}
              </button>
            </div>
          )}

          {!methods.loading && !methods.error && enabled.length === 0 && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 text-center">
              <p className="text-sm text-gray-500">
                {lang === "lo"
                  ? "ຍັງບໍ່ມີຊ່ອງທາງຊຳລະທີ່ເປີດໃຫ້ບໍລິການ."
                  : "No payment method is available right now."}
              </p>
            </div>
          )}

          {enabled.length > 0 && (
            <div className="space-y-2">
              {enabled.map((m: ApiPaymentMethod) => {
                const active = m.code === methodCode;
                const Icon = m.kind === "wallet" ? Wallet : m.kind === "qr" ? Scan : m.kind === "bank" ? Landmark : CreditCard;
                return (
                  <button
                    key={m.code}
                    onClick={() => setPicked(m.code)}
                    className="w-full bg-white rounded-2xl p-4 border shadow-sm flex items-center gap-3 text-left transition-all"
                    style={{
                      borderColor: active ? "#344EAD" : "#F3F4F6",
                      boxShadow: active ? "0 2px 12px #344EAD22" : undefined,
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${m.color || "#344EAD"}1A` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: m.color || "#344EAD" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 leading-snug">{text(m.label, lang)}</p>
                      <p className="text-xs text-gray-400 truncate">{m.note}</p>
                    </div>
                    <span
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{ borderColor: active ? "#344EAD" : "#D1D5DB" }}
                    >
                      {active && <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#344EAD" }} />}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Wallet with too little in it — say so plainly and offer a top-up. */}
          {insufficient && (
            <div className="bg-white rounded-2xl p-4 border border-amber-100" style={{ backgroundColor: "#FFFBEB" }}>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#D97706" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "#B45309" }}>
                    {lang === "lo" ? "ຍອດເງິນໃນກະເປົາບໍ່ພຽງພໍ" : "Your wallet does not have enough money"}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {lang === "lo"
                      ? `ຄ່າທຳນຽມແມ່ນ ${formatLak(amount, lang)}. ຕື່ມເງິນເຂົ້າກະເປົາ ຫຼື ເລືອກຊ່ອງທາງອື່ນ.`
                      : `The fee is ${formatLak(amount, lang)}. Top up your wallet or pick another method.`}
                  </p>
                  {onTopUp && (
                    <button
                      onClick={onTopUp}
                      className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-semibold"
                      style={{ backgroundColor: "#D97706" }}
                    >
                      <Plus className="w-4 h-4" />
                      {lang === "lo" ? "ຕື່ມເງິນ" : "Top up"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {charge.error && !insufficient && (
            <div className="flex items-start gap-2 text-sm px-1" style={{ color: "#DC2626" }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{charge.error.message}</span>
            </div>
          )}

          {/* A method that settles elsewhere answers with an instruction. */}
          {instruction && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t("transferDetails")}</p>
              {(instruction.qr_payload || chosen?.kind === "qr") && (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-44 h-44 p-3 bg-white rounded-2xl shadow border border-gray-100">
                    <QRCode />
                  </div>
                  {instruction.qr_payload && (
                    <p className="text-[11px] text-gray-400 font-mono break-all text-center">{instruction.qr_payload}</p>
                  )}
                </div>
              )}
              {instruction.account && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-gray-500 flex-shrink-0">{t("accountNo")}</span>
                  <span className="text-sm font-semibold text-gray-800 text-right">{instruction.account}</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-gray-500 flex-shrink-0">{t("amount")}</span>
                <span className="text-sm font-semibold text-gray-800">
                  {formatLak(instruction.amount_lak ?? chargedAmount, lang)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-gray-500 flex-shrink-0">{t("reference")}</span>
                <span className="text-sm font-semibold text-gray-800 text-right truncate">
                  {instruction.reference_no || receiptNo || reference || "—"}
                </span>
              </div>
              {instruction.steps && instruction.steps.length > 0 && (
                <ol className="space-y-2.5 pt-1">
                  {instruction.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span
                        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
                        style={{ backgroundColor: "#EEF2FF", color: "#344EAD" }}
                      >
                        {i + 1}
                      </span>
                      <p className="text-sm text-gray-700 leading-relaxed pt-0.5">{text(step, lang)}</p>
                    </li>
                  ))}
                </ol>
              )}
              {instruction.note && <p className="text-xs text-gray-500 leading-relaxed">{text(instruction.note, lang)}</p>}
            </div>
          )}

          {settled ? (
            <div className="flex items-center gap-2 justify-center py-2 text-sm font-semibold" style={{ color: "#16A34A" }}>
              <CheckCircle2 className="w-4 h-4" />
              {lang === "lo"
                ? `ຊຳລະສຳເລັດ · ໃບຮັບເງິນ ${receiptNo}`
                : `Paid · receipt ${receiptNo}`}
            </div>
          ) : instruction ? (
            <p className="text-center text-xs text-gray-500">
              {lang === "lo"
                ? "ພວກເຮົາຈະຢືນຢັນເມື່ອທະນາຄານຕອບກັບ."
                : "We will confirm as soon as the bank replies."}
            </p>
          ) : (
            enabled.length > 0 && (
              <button
                onClick={submit}
                disabled={charge.pending || !methodCode}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity disabled:opacity-60"
                style={{ backgroundColor: "#344EAD" }}
              >
                <Lock className="w-4 h-4" />
                {charge.pending
                  ? lang === "lo"
                    ? "ກຳລັງດຳເນີນການ…"
                    : "Processing…"
                  : lang === "lo"
                  ? `ຈ່າຍ ${formatLak(amount, lang)}${chosen ? ` · ${text(chosen.label, lang)}` : ""}`
                  : `Pay ${formatLak(amount, lang)}${chosen ? ` · ${text(chosen.label, lang)}` : ""}`}
              </button>
            )
          )}
        </>
      )}

      {/* Method toggle — QR / Bank / Card */}
      {!live && (
      <div className="p-1 bg-gray-200 rounded-2xl grid grid-cols-3 gap-1">
        {([
          { id: "qr", label: t("methodQr"), Icon: Scan },
          { id: "bank", label: t("methodBank"), Icon: Landmark },
          { id: "cc", label: t("methodCard"), Icon: CreditCard },
        ] as const).map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => patch({ method: id })}
            className="flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200"
            style={
              state.method === id
                ? { backgroundColor: "#344EAD", color: "white", boxShadow: "0 2px 12px #344EAD55" }
                : { color: "#6B7280" }
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>
      )}

      {/* QR */}
      {!live && state.method === "qr" && (
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
      {!live && state.method === "bank" && (
        <div className="space-y-4">
          <div>
            <FieldLabel required>{t("selectBank")}</FieldLabel>
            <div className="relative">
              <select
                value={state.bankName}
                onChange={(e) => patch({ bankName: e.target.value })}
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
          {state.bankName && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t("transferDetails")}</p>
              {[
                { label: t("payTo"), value: "Lao Citizen Center" },
                { label: t("bank"), value: state.bankName },
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
      {!live && state.method === "cc" && (
        <div className="space-y-4">
          <div
            className="relative rounded-3xl p-6 overflow-hidden"
            style={{ background: "linear-gradient(135deg, #344EAD 0%, #1a2d7a 100%)" }}
          >
            <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white opacity-[0.07]" />
            <div className="absolute top-8 -right-4 w-20 h-20 rounded-full bg-white opacity-[0.07]" />
            <p className="text-white/50 text-[11px] mb-5 font-medium tracking-widest uppercase">{t("cardType")}</p>
            <p className="text-white font-mono text-lg tracking-widest">
              {state.cardNumber || "•••• •••• •••• ••••"}
            </p>
            <div className="flex justify-between mt-4">
              <div>
                <p className="text-white/50 text-[10px] uppercase tracking-wider">{t("cardholder")}</p>
                <p className="text-white text-sm mt-0.5 font-medium tracking-wide">
                  {state.cardName || t("yourName")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/50 text-[10px] uppercase tracking-wider">{t("expires")}</p>
                <p className="text-white text-sm mt-0.5 font-medium">
                  {state.cardExpiry || "MM/YY"}
                </p>
              </div>
            </div>
          </div>

          <div>
            <FieldLabel required>{t("cardNumber")}</FieldLabel>
            <input
              type="text"
              inputMode="numeric"
              value={state.cardNumber}
              onChange={(e) => patch({ cardNumber: formatCard(e.target.value) })}
              placeholder="0000 0000 0000 0000"
              className={`w-full bg-white border rounded-2xl px-4 py-3.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all ${fieldErrorRing(numErr)}`}
            />
            <FieldError show={numErr} />
          </div>
          <div>
            <FieldLabel required>{t("cardholderName")}</FieldLabel>
            <input
              type="text"
              value={state.cardName}
              onChange={(e) => patch({ cardName: e.target.value.toUpperCase() })}
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
                value={state.cardExpiry}
                onChange={(e) => patch({ cardExpiry: formatExpiry(e.target.value) })}
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
                value={state.cardCvv}
                onChange={(e) => patch({ cardCvv: e.target.value.replace(/\D/g, "").slice(0, 3) })}
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
