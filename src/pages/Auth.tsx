import { useState, useRef, useEffect } from "react";
import { register, login, sendEmailCode, verifyEmailCode } from "@/lib/api";
import { saveSession } from "@/lib/store";
import { User } from "@/lib/api";

interface AuthProps {
  onAuth: (user: User) => void;
}

type LoginMode = "login";
type RegisterStep = "email" | "code" | "profile";
type Mode = "login" | "register";

const CODE_LENGTH = 5;
const RESEND_TIMEOUT = 60;

export default function Auth({ onAuth }: AuthProps) {
  const [mode, setMode] = useState<Mode>("login");
  const [registerStep, setRegisterStep] = useState<RegisterStep>("email");

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register fields
  const [regEmail, setRegEmail] = useState("");
  const [regCode, setRegCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [regUsername, setRegUsername] = useState("");
  const [regDisplayName, setRegDisplayName] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPasswordConfirm, setRegPasswordConfirm] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [codeSent, setCodeSent] = useState(false);

  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start resend countdown
  const startResendTimer = () => {
    setResendTimer(RESEND_TIMEOUT);
    timerRef.current = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setRegisterStep("email");
    setError("");
    setRegCode(Array(CODE_LENGTH).fill(""));
    setCodeSent(false);
  };

  // ── LOGIN ──────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(loginEmail, loginPassword);
      saveSession(result.user, result.token);
      onAuth(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
    } finally {
      setLoading(false);
    }
  };

  // ── REGISTER: Step 1 — send code ──────────────────────
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await sendEmailCode(regEmail);
      setCodeSent(true);
      setRegisterStep("code");
      startResendTimer();
      setTimeout(() => codeInputRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;
    setError("");
    setLoading(true);
    try {
      await sendEmailCode(regEmail);
      setRegCode(Array(CODE_LENGTH).fill(""));
      startResendTimer();
      setTimeout(() => codeInputRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
    } finally {
      setLoading(false);
    }
  };

  // ── REGISTER: Step 2 — verify code ───────────────────
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = regCode.join("");
    if (code.length < CODE_LENGTH) {
      setError("Введи все цифры кода");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await verifyEmailCode(regEmail, code);
      setRegisterStep("profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неверный код");
      setRegCode(Array(CODE_LENGTH).fill(""));
      setTimeout(() => codeInputRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  // ── REGISTER: Step 3 — create account ────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword !== regPasswordConfirm) {
      setError("Пароли не совпадают");
      return;
    }
    if (regPassword.length < 6) {
      setError("Пароль минимум 6 символов");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result = await register(regUsername, regEmail, regDisplayName, regPassword);
      saveSession(result.user, result.token);
      onAuth(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
    } finally {
      setLoading(false);
    }
  };

  // ── Code input handlers ───────────────────────────────
  const handleCodeChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newCode = [...regCode];
    newCode[index] = digit;
    setRegCode(newCode);
    setError("");

    if (digit && index < CODE_LENGTH - 1) {
      codeInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (digit && index === CODE_LENGTH - 1 && newCode.every((d) => d !== "")) {
      submitCode(newCode.join(""));
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (regCode[index]) {
        const newCode = [...regCode];
        newCode[index] = "";
        setRegCode(newCode);
      } else if (index > 0) {
        codeInputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (pasted.length === CODE_LENGTH) {
      const newCode = pasted.split("");
      setRegCode(newCode);
      codeInputRefs.current[CODE_LENGTH - 1]?.focus();
      submitCode(pasted);
    }
  };

  const submitCode = async (code: string) => {
    setError("");
    setLoading(true);
    try {
      await verifyEmailCode(regEmail, code);
      setRegisterStep("profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неверный код");
      setRegCode(Array(CODE_LENGTH).fill(""));
      setTimeout(() => codeInputRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────
  const stepNumber = registerStep === "email" ? 1 : registerStep === "code" ? 2 : 3;

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#5B8DEF] to-[#3366CC] mb-4 shadow-2xl shadow-blue-500/30">
            <span className="text-3xl font-black text-white">К</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">Кнам</h1>
          <p className="text-[#8b949e] mt-2 text-sm">Общайся быстро и удобно</p>
        </div>

        {/* Card */}
        <div className="bg-[#161b22] rounded-2xl border border-[#30363d] p-8 shadow-xl">

          {/* Tabs — показываем только если не внутри пошаговой регистрации после шага email */}
          <div className="flex bg-[#0d1117] rounded-xl p-1 mb-6">
            <button
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === "login"
                  ? "bg-[#5B8DEF] text-white shadow-lg shadow-blue-500/20"
                  : "text-[#8b949e] hover:text-white"
              }`}
              onClick={() => switchMode("login")}
            >
              Войти
            </button>
            <button
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === "register"
                  ? "bg-[#5B8DEF] text-white shadow-lg shadow-blue-500/20"
                  : "text-[#8b949e] hover:text-white"
              }`}
              onClick={() => switchMode("register")}
            >
              Регистрация
            </button>
          </div>

          {/* ── LOGIN FORM ── */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-[#8b949e] text-xs font-medium uppercase tracking-wider block mb-2">
                  Email или @username
                </label>
                <input
                  type="text"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-white placeholder-[#484f58] focus:outline-none focus:border-[#5B8DEF] focus:ring-1 focus:ring-[#5B8DEF] transition-colors"
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="text-[#8b949e] text-xs font-medium uppercase tracking-wider block mb-2">
                  Пароль
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-white placeholder-[#484f58] focus:outline-none focus:border-[#5B8DEF] focus:ring-1 focus:ring-[#5B8DEF] transition-colors"
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && <ErrorBox message={error} />}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#5B8DEF] to-[#3366CC] hover:from-[#4a7de0] hover:to-[#2255bb] text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 mt-2"
              >
                {loading ? <Spinner text="Входим..." /> : "Войти"}
              </button>
            </form>
          )}

          {/* ── REGISTER: STEP 1 — EMAIL ── */}
          {mode === "register" && registerStep === "email" && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="text-center mb-2">
                <div className="text-[#8b949e] text-sm">Шаг 1 из 3</div>
                <h2 className="text-white font-bold text-lg mt-1">Введи свой email</h2>
                <p className="text-[#8b949e] text-sm mt-1">Мы отправим код подтверждения</p>
              </div>

              <div>
                <label className="text-[#8b949e] text-xs font-medium uppercase tracking-wider block mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => { setRegEmail(e.target.value); setError(""); }}
                  placeholder="you@example.com"
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-white placeholder-[#484f58] focus:outline-none focus:border-[#5B8DEF] focus:ring-1 focus:ring-[#5B8DEF] transition-colors"
                  required
                  autoFocus
                  autoComplete="email"
                />
              </div>

              {error && <ErrorBox message={error} />}

              <button
                type="submit"
                disabled={loading || !regEmail}
                className="w-full bg-gradient-to-r from-[#5B8DEF] to-[#3366CC] hover:from-[#4a7de0] hover:to-[#2255bb] text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
              >
                {loading ? <Spinner text="Отправляем..." /> : "Отправить код"}
              </button>
            </form>
          )}

          {/* ── REGISTER: STEP 2 — CODE ── */}
          {mode === "register" && registerStep === "code" && (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div className="text-center">
                <div className="text-[#8b949e] text-sm">Шаг 2 из 3</div>
                <h2 className="text-white font-bold text-lg mt-1">Введи код из письма</h2>
                <p className="text-[#8b949e] text-sm mt-1">
                  Мы отправили {CODE_LENGTH}-значный код на{" "}
                  <span className="text-[#5B8DEF] font-medium">{regEmail}</span>
                </p>
              </div>

              {/* Code inputs */}
              <div className="flex gap-3 justify-center" onPaste={handleCodePaste}>
                {regCode.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { codeInputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(i, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(i, e)}
                    disabled={loading}
                    className={`w-12 h-14 text-center text-xl font-bold rounded-xl border transition-all bg-[#0d1117] text-white focus:outline-none
                      ${digit ? "border-[#5B8DEF] text-[#5B8DEF]" : "border-[#30363d]"}
                      focus:border-[#5B8DEF] focus:ring-1 focus:ring-[#5B8DEF]
                      disabled:opacity-50`}
                  />
                ))}
              </div>

              {error && <ErrorBox message={error} />}

              <button
                type="submit"
                disabled={loading || regCode.join("").length < CODE_LENGTH}
                className="w-full bg-gradient-to-r from-[#5B8DEF] to-[#3366CC] hover:from-[#4a7de0] hover:to-[#2255bb] text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
              >
                {loading ? <Spinner text="Проверяем..." /> : "Подтвердить"}
              </button>

              {/* Resend + back */}
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => { setRegisterStep("email"); setError(""); setRegCode(Array(CODE_LENGTH).fill("")); }}
                  className="text-[#8b949e] hover:text-white transition-colors"
                >
                  ← Изменить email
                </button>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendTimer > 0 || loading}
                  className="text-[#5B8DEF] disabled:text-[#484f58] disabled:cursor-default hover:text-[#4a7de0] transition-colors"
                >
                  {resendTimer > 0 ? `Повторить через ${resendTimer}с` : "Отправить повторно"}
                </button>
              </div>
            </form>
          )}

          {/* ── REGISTER: STEP 3 — PROFILE ── */}
          {mode === "register" && registerStep === "profile" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="text-center mb-2">
                <div className="text-[#8b949e] text-sm">Шаг 3 из 3</div>
                <h2 className="text-white font-bold text-lg mt-1">Создай профиль</h2>
                <p className="text-[#8b949e] text-sm mt-1">
                  Email <span className="text-green-400">✓</span> подтверждён
                </p>
              </div>

              <div>
                <label className="text-[#8b949e] text-xs font-medium uppercase tracking-wider block mb-2">
                  Имя пользователя
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#484f58] font-medium">@</span>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => { setRegUsername(e.target.value.replace(/[^a-z0-9_]/gi, "").toLowerCase()); setError(""); }}
                    placeholder="username"
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl pl-8 pr-4 py-3 text-white placeholder-[#484f58] focus:outline-none focus:border-[#5B8DEF] focus:ring-1 focus:ring-[#5B8DEF] transition-colors"
                    required
                    autoFocus
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#8b949e] text-xs font-medium uppercase tracking-wider block mb-2">
                  Как тебя зовут?
                </label>
                <input
                  type="text"
                  value={regDisplayName}
                  onChange={(e) => { setRegDisplayName(e.target.value); setError(""); }}
                  placeholder="Имя Фамилия"
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-white placeholder-[#484f58] focus:outline-none focus:border-[#5B8DEF] focus:ring-1 focus:ring-[#5B8DEF] transition-colors"
                  required
                />
              </div>

              <div>
                <label className="text-[#8b949e] text-xs font-medium uppercase tracking-wider block mb-2">
                  Пароль
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => { setRegPassword(e.target.value); setError(""); }}
                  placeholder="Минимум 6 символов"
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-white placeholder-[#484f58] focus:outline-none focus:border-[#5B8DEF] focus:ring-1 focus:ring-[#5B8DEF] transition-colors"
                  required
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className="text-[#8b949e] text-xs font-medium uppercase tracking-wider block mb-2">
                  Повтори пароль
                </label>
                <input
                  type="password"
                  value={regPasswordConfirm}
                  onChange={(e) => { setRegPasswordConfirm(e.target.value); setError(""); }}
                  placeholder="••••••••"
                  className={`w-full bg-[#0d1117] border rounded-xl px-4 py-3 text-white placeholder-[#484f58] focus:outline-none focus:ring-1 transition-colors ${
                    regPasswordConfirm && regPassword !== regPasswordConfirm
                      ? "border-red-500/60 focus:border-red-500 focus:ring-red-500"
                      : "border-[#30363d] focus:border-[#5B8DEF] focus:ring-[#5B8DEF]"
                  }`}
                  required
                  autoComplete="new-password"
                />
              </div>

              {error && <ErrorBox message={error} />}

              <button
                type="submit"
                disabled={loading || !regUsername || !regDisplayName || !regPassword || !regPasswordConfirm}
                className="w-full bg-gradient-to-r from-[#5B8DEF] to-[#3366CC] hover:from-[#4a7de0] hover:to-[#2255bb] text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
              >
                {loading ? <Spinner text="Создаём аккаунт..." /> : "Создать аккаунт"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[#484f58] text-xs mt-6">
          Кнам — мессенджер нового поколения
        </p>
      </div>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
      {message}
    </div>
  );
}

function Spinner({ text }: { text: string }) {
  return (
    <span className="flex items-center justify-center gap-2">
      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      {text}
    </span>
  );
}
