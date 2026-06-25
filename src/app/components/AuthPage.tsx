import { useState, useRef, useEffect } from "react";
import {
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowLeft,
  CheckCircle,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import logoLcc from "../../imports/logo-lcc.png";
import { useT } from "../i18n";

const BG_IMAGE =
  "https://images.unsplash.com/photo-1723622689088-3b00cce5d5ed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxWaWVudGlhbmUlMjBMYW9zJTIwY2l0eXNjYXBlJTIwdGVtcGxlfGVufDF8fHx8MTc4MDkxODgwNnww&ixlib=rb-4.1.0&q=80&w=1080";

interface AuthPageProps {
  onSuccess: () => void;
  onBack: () => void;
}

type AuthStep = "tabs" | "otp";
type AuthMode = "login" | "register";

function generateMath() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  return { a, b, answer: a + b };
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

const inputBase =
  "w-full px-4 py-3 rounded-xl border bg-gray-50 text-gray-800 text-sm outline-none transition-all focus:bg-white focus:border-[#344EAD] focus:ring-2 focus:ring-[#344EAD]/15 placeholder:text-gray-400";
const errClass = "border-red-400 bg-red-50 focus:border-red-400 focus:ring-red-400/15";
const normalClass = "border-gray-200";

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="text-red-500 text-xs mt-1.5">{msg}</p>
  );
}

/* ── Left panel with background image ── */
function LeftPanel() {
  const t = useT("auth");
  return (
    <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center overflow-hidden">
      <img
        src={BG_IMAGE}
        alt="Laos"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(160deg, rgba(26,45,107,0.90) 0%, rgba(52,78,173,0.78) 50%, rgba(26,45,107,0.93) 100%)",
        }}
      />
      <div className="relative z-10 flex flex-col items-center text-center px-12">
        <img
          src={logoLcc}
          alt="Lao Citizen Center"
          className="w-28 h-28 object-contain mb-6 drop-shadow-2xl rounded-2xl"
        />
        <h1 className="text-white mb-3" style={{ fontSize: "26px" }}>
          {t("brand")}
        </h1>
        <p className="text-white/65 text-sm leading-relaxed max-w-xs">
          {t("brandTagline")}
        </p>
        <div className="mt-8 flex flex-col gap-3 w-full max-w-xs">
          {[
            t("featureRequestDocs"),
            t("featurePayFees"),
            t("featureTrackStatus"),
          ].map((feat) => (
            <div key={feat} className="flex items-center gap-3 text-left">
              <CheckCircle className="w-4 h-4 text-white/70 flex-shrink-0" />
              <span className="text-white/80 text-sm">{feat}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="absolute bottom-6 text-white/35 text-xs">
        {t("ministry")}
      </p>
    </div>
  );
}

export function AuthPage({ onSuccess, onBack }: AuthPageProps) {
  const t = useT("auth");
  const [mode, setMode] = useState<AuthMode>("login");
  const [step, setStep] = useState<AuthStep>("tabs");

  /* Login */
  const [loginId, setLoginId] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [math, setMath] = useState(generateMath);
  const [mathInput, setMathInput] = useState("");
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});

  /* Register */
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});

  /* OTP */
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [otpResent, setOtpResent] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step !== "otp") return;
    setCountdown(60);
    const id = setInterval(() => {
      setCountdown((c) => { if (c <= 1) { clearInterval(id); return 0; } return c - 1; });
    }, 1000);
    return () => clearInterval(id);
  }, [step, otpResent]);

  const maskedContact = mode === "login"
    ? loginId.includes("@")
      ? loginId.replace(/(.{2}).+(@.+)/, "$1****$2")
      : loginId.replace(/(\+?\d{3})\d+(\d{3})/, "$1 **** $2")
    : phone.replace(/(\+?\d{3})\d+(\d{2})/, "$1 **** $2");

  function validateLogin() {
    const errs: Record<string, string> = {};
    if (!loginId.trim()) errs.loginId = t("errLoginIdRequired");
    if (!loginPass) errs.loginPass = t("errPasswordRequired");
    if (!mathInput.trim()) {
      errs.math = t("errSecurityRequired");
    } else if (parseInt(mathInput) !== math.answer) {
      errs.math = t("errSecurityIncorrect");
      setMath(generateMath());
      setMathInput("");
    }
    return errs;
  }

  function validateRegister() {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = t("errFullNameRequired");
    if (!phone.trim()) errs.phone = t("errPhoneRequired");
    else if (!/^\+?\d{7,15}$/.test(phone.replace(/\s/g, "")))
      errs.phone = t("errPhoneInvalid");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = t("errEmailInvalid");
    if (!password) errs.password = t("errPasswordRequired");
    else if (password.length < 8) errs.password = t("errPasswordMin");
    if (!confirmPassword) errs.confirmPassword = t("errConfirmRequired");
    else if (password !== confirmPassword) errs.confirmPassword = t("errPasswordMismatch");
    if (!agreed) errs.agreed = t("errMustAgree");
    return errs;
  }

  function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateLogin();
    if (Object.keys(errs).length) { setLoginErrors(errs); return; }
    setLoginErrors({});
    setStep("otp");
  }

  function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateRegister();
    if (Object.keys(errs).length) { setRegErrors(errs); return; }
    setRegErrors({});
    setStep("otp");
  }

  function handleOtpChange(i: number, val: string) {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    setOtpError("");
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  }

  function handleOtpKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) { setOtp(text.split("")); otpRefs.current[5]?.focus(); }
  }

  function handleOtpVerify() {
    if (otp.join("").length < 6) { setOtpError(t("errOtpIncomplete")); return; }
    onSuccess();
  }

  /* ─── OTP SCREEN ─── */
  if (step === "otp") {
    return (
      <div className="flex h-screen w-full overflow-hidden">
        <LeftPanel />
        <div className="w-full lg:w-1/2 flex flex-col bg-[#F0F2F8] overflow-y-auto">
          <div className="px-6 pt-6 pb-2 flex-shrink-0">
            <button
              onClick={() => setStep("tabs")}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">{t("back")}</span>
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center px-6 py-8">
            <div className="w-full max-w-sm">
              <div className="flex lg:hidden justify-center mb-8">
                <img src={logoLcc} alt="LCC" className="w-20 h-20 object-contain rounded-2xl" />
              </div>
              <div className="text-center mb-8">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: "#EEF2FF" }}
                >
                  <Phone className="w-7 h-7" style={{ color: "#344EAD" }} />
                </div>
                <h2 className="text-gray-800 mb-2" style={{ fontSize: "22px" }}>{t("otpVerification")}</h2>
                <p className="text-gray-500 text-sm">
                  {t("otpSentTo")}<br />
                  <span className="font-semibold text-gray-700">{maskedContact}</span>
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex gap-2 justify-center mb-1" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      style={{ height: "52px", width: "44px" }}
                      className={`text-center rounded-xl border-2 text-xl font-bold outline-none transition-all flex-shrink-0 ${
                        otpError
                          ? "border-red-400 bg-red-50 text-red-600"
                          : digit
                          ? "border-[#344EAD] bg-[#EEF2FF] text-[#344EAD]"
                          : "border-gray-200 bg-gray-50 text-gray-800"
                      } focus:border-[#344EAD] focus:bg-white focus:ring-2 focus:ring-[#344EAD]/15`}
                    />
                  ))}
                </div>
                {otpError && <p className="text-red-500 text-xs text-center mt-2">{otpError}</p>}
                <button
                  onClick={handleOtpVerify}
                  className="w-full py-3.5 rounded-xl text-white text-sm font-semibold mt-5 transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "#344EAD" }}
                >
                  {t("verifyCode")}
                </button>
                <div className="mt-5 text-center">
                  {countdown > 0 ? (
                    <p className="text-gray-400 text-sm">
                      {t("resendIn", { seconds: countdown })}
                    </p>
                  ) : (
                    <button
                      onClick={() => { setOtp(["","","","","",""]); setOtpError(""); setOtpResent(x=>!x); setTimeout(()=>otpRefs.current[0]?.focus(),50); }}
                      className="flex items-center gap-1.5 mx-auto text-sm font-medium"
                      style={{ color: "#344EAD" }}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      {t("resendOtp")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── LOGIN / REGISTER ─── */
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <LeftPanel />

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex flex-col bg-[#F0F2F8] overflow-y-auto">
        <div className="px-6 pt-6 pb-2 flex-shrink-0">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">{t("backToHome")}</span>
          </button>
        </div>

        <div className="flex-1 flex items-start justify-center px-6 py-4">
          <div className="w-full max-w-sm">
            {/* Logo — mobile only */}
            <div className="flex lg:hidden justify-center mb-6">
              <img src={logoLcc} alt="LCC" className="w-16 h-16 object-contain rounded-2xl" />
            </div>

            <div className="mb-5">
              <h2 className="text-gray-800" style={{ fontSize: "22px" }}>
                {mode === "login" ? t("welcomeBack") : t("createAccount")}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                {mode === "login" ? t("welcomeBackSub") : t("createAccountSub")}
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Tab switcher */}
              <div className="flex border-b border-gray-100">
                {(["login", "register"] as AuthMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setLoginErrors({}); setRegErrors({}); }}
                    className={`flex-1 py-3.5 text-sm font-semibold transition-colors relative ${
                      mode === m ? "text-[#344EAD]" : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {m === "login" ? t("login") : t("register")}
                    {mode === m && (
                      <span
                        className="absolute bottom-0 left-6 right-6 h-0.5 rounded-full"
                        style={{ backgroundColor: "#344EAD" }}
                      />
                    )}
                  </button>
                ))}
              </div>

              <div className="p-5">
                {/* ══ LOGIN ══ */}
                {mode === "login" && (
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    {/* Phone / Email */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        {t("loginIdLabel")}
                      </label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                          {loginId.includes("@")
                            ? <Mail className="w-4 h-4 text-gray-400" />
                            : <Phone className="w-4 h-4 text-gray-400" />}
                        </div>
                        <input
                          type="text"
                          placeholder={t("loginIdPlaceholder")}
                          value={loginId}
                          onChange={(e) => { setLoginId(e.target.value); setLoginErrors(x => ({ ...x, loginId: "" })); }}
                          className={`${inputBase} pl-10 ${loginErrors.loginId ? errClass : normalClass}`}
                        />
                      </div>
                      <FieldError msg={loginErrors.loginId} />
                    </div>

                    {/* Password */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-medium text-gray-600">{t("passwordLabel")}</label>
                        <button type="button" className="text-xs font-medium" style={{ color: "#344EAD" }}>
                          {t("forgotPassword")}
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                          type={showLoginPass ? "text" : "password"}
                          placeholder={t("passwordPlaceholder")}
                          value={loginPass}
                          onChange={(e) => { setLoginPass(e.target.value); setLoginErrors(x => ({ ...x, loginPass: "" })); }}
                          className={`${inputBase} pl-10 pr-10 ${loginErrors.loginPass ? errClass : normalClass}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPass(s => !s)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <FieldError msg={loginErrors.loginPass} />
                    </div>

                    {/* Security Check */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        {t("securityCheckLabel")}
                      </label>
                      <div
                        className="flex items-center gap-2 p-2.5 rounded-xl border"
                        style={{ borderColor: loginErrors.math ? "#F87171" : "#E5E7EB", backgroundColor: loginErrors.math ? "#FEF2F2" : "#F9FAFB" }}
                      >
                        {/* Equation pill */}
                        <div
                          className="flex items-center justify-center px-4 py-2 rounded-lg flex-shrink-0"
                          style={{ backgroundColor: "#EEF2FF", minWidth: "108px" }}
                        >
                          <span className="font-bold text-sm tracking-wide" style={{ color: "#344EAD" }}>
                            {math.a} + {math.b} = ?
                          </span>
                        </div>
                        {/* Answer */}
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder={t("answerPlaceholder")}
                          maxLength={2}
                          value={mathInput}
                          onChange={(e) => { setMathInput(e.target.value.replace(/\D/g, "")); setLoginErrors(x => ({ ...x, math: "" })); }}
                          className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-center font-semibold text-gray-800 outline-none focus:border-[#344EAD] focus:ring-2 focus:ring-[#344EAD]/15 placeholder:text-gray-300 placeholder:font-normal"
                        />
                        {/* Refresh */}
                        <button
                          type="button"
                          onClick={() => { setMath(generateMath()); setMathInput(""); }}
                          className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-100 transition-colors flex-shrink-0"
                          title={t("newQuestion")}
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                      </div>
                      <FieldError msg={loginErrors.math} />
                    </div>

                    {/* Sign In button */}
                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                      style={{ backgroundColor: "#344EAD" }}
                    >
                      {t("signIn")}
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-gray-100" />
                      <span className="text-gray-400 text-xs">{t("orContinueWith")}</span>
                      <div className="flex-1 h-px bg-gray-100" />
                    </div>

                    {/* Google button */}
                    <button
                      type="button"
                      className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 shadow-sm"
                    >
                      <GoogleIcon />
                      {t("continueWithGoogle")}
                    </button>

                    <p className="text-center text-xs text-gray-400">
                      {t("noAccount")}{" "}
                      <button
                        type="button"
                        className="text-xs font-semibold"
                        style={{ color: "#344EAD" }}
                        onClick={() => { setMode("register"); setLoginErrors({}); }}
                      >
                        {t("register")}
                      </button>
                    </p>
                  </form>
                )}

                {/* ══ REGISTER ══ */}
                {mode === "register" && (
                  <form onSubmit={handleRegisterSubmit} className="space-y-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">{t("fullNameLabel")}</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                          type="text"
                          placeholder={t("fullNamePlaceholder")}
                          value={fullName}
                          onChange={(e) => { setFullName(e.target.value); setRegErrors(x => ({ ...x, fullName: "" })); }}
                          className={`${inputBase} pl-10 ${regErrors.fullName ? errClass : normalClass}`}
                        />
                      </div>
                      <FieldError msg={regErrors.fullName} />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">{t("phoneLabel")}</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                          type="tel"
                          placeholder={t("phonePlaceholder")}
                          value={phone}
                          onChange={(e) => { setPhone(e.target.value); setRegErrors(x => ({ ...x, phone: "" })); }}
                          className={`${inputBase} pl-10 ${regErrors.phone ? errClass : normalClass}`}
                        />
                      </div>
                      <FieldError msg={regErrors.phone} />
                    </div>

                    {/* Email optional */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        {t("emailLabel")}
                        <span className="ml-1.5 text-gray-400 font-normal">{t("optional")}</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                          type="email"
                          placeholder={t("emailPlaceholder")}
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); setRegErrors(x => ({ ...x, email: "" })); }}
                          className={`${inputBase} pl-10 ${regErrors.email ? errClass : normalClass}`}
                        />
                      </div>
                      <FieldError msg={regErrors.email} />
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">{t("passwordLabel")}</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                          type={showPass ? "text" : "password"}
                          placeholder={t("registerPasswordPlaceholder")}
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); setRegErrors(x => ({ ...x, password: "", confirmPassword: "" })); }}
                          className={`${inputBase} pl-10 pr-10 ${regErrors.password ? errClass : normalClass}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass(s => !s)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {password && (
                        <div className="flex gap-1 mt-2">
                          {[1,2,3,4].map((lvl) => {
                            const s = password.length >= 12 && /[A-Z]/.test(password) && /\d/.test(password) ? 4
                              : password.length >= 10 && /\d/.test(password) ? 3
                              : password.length >= 8 ? 2 : 1;
                            return (
                              <div key={lvl} className="h-1 flex-1 rounded-full transition-colors"
                                style={{ backgroundColor: lvl <= s ? s >= 4 ? "#16A34A" : s >= 3 ? "#F59E0B" : "#EF4444" : "#E5E7EB" }}
                              />
                            );
                          })}
                        </div>
                      )}
                      <FieldError msg={regErrors.password} />
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">{t("confirmPasswordLabel")}</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                          type={showConfirmPass ? "text" : "password"}
                          placeholder={t("confirmPasswordPlaceholder")}
                          value={confirmPassword}
                          onChange={(e) => { setConfirmPassword(e.target.value); setRegErrors(x => ({ ...x, confirmPassword: "" })); }}
                          className={`${inputBase} pl-10 pr-16 ${regErrors.confirmPassword ? errClass : normalClass}`}
                        />
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                          {confirmPassword && password === confirmPassword && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                          <button
                            type="button"
                            onClick={() => setShowConfirmPass(s => !s)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <FieldError msg={regErrors.confirmPassword} />
                    </div>

                    {/* Agreement checkbox */}
                    <div>
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="relative mt-0.5 flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={agreed}
                            onChange={(e) => { setAgreed(e.target.checked); setRegErrors(x => ({ ...x, agreed: "" })); }}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                            agreed ? "border-[#344EAD] bg-[#344EAD]"
                            : regErrors.agreed ? "border-red-400 bg-red-50"
                            : "border-gray-300 bg-white group-hover:border-[#344EAD]/50"
                          }`}>
                            {agreed && (
                              <svg viewBox="0 0 12 10" className="w-3 h-3 fill-none stroke-white stroke-2">
                                <polyline points="1,5 4,8 11,1" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <span className={`text-xs leading-relaxed ${regErrors.agreed ? "text-red-500" : "text-gray-500"}`}>
                          {t("agreePrefix")}{" "}
                          <button type="button" className="text-xs font-semibold underline" style={{ color: "#344EAD" }}>{t("termsOfService")}</button>
                          {" "}{t("and")}{" "}
                          <button type="button" className="text-xs font-semibold underline" style={{ color: "#344EAD" }}>{t("privacyPolicy")}</button>
                          {" "}{t("agreeSuffix")}
                        </span>
                      </label>
                      <FieldError msg={regErrors.agreed} />
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                      style={{ backgroundColor: "#344EAD" }}
                    >
                      {t("createAccount")}
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <p className="text-center text-xs text-gray-400">
                      {t("haveAccount")}{" "}
                      <button
                        type="button"
                        className="text-xs font-semibold"
                        style={{ color: "#344EAD" }}
                        onClick={() => { setMode("login"); setRegErrors({}); }}
                      >
                        {t("signIn")}
                      </button>
                    </p>
                  </form>
                )}
              </div>
            </div>

            <p className="text-center text-gray-400 text-xs mt-5 pb-6">
              {t("ministry")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
