import { useState } from "react";
import { register, login } from "@/lib/api";
import { saveSession } from "@/lib/store";
import { User } from "@/lib/api";

interface AuthProps {
  onAuth: (user: User) => void;
}

export default function Auth({ onAuth }: AuthProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "register") {
        const result = await register(username, email, displayName, password);
        saveSession(result.user, result.token);
        onAuth(result.user);
      } else {
        const result = await login(email, password);
        saveSession(result.user, result.token);
        onAuth(result.user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
    } finally {
      setLoading(false);
    }
  };

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
          {/* Tabs */}
          <div className="flex bg-[#0d1117] rounded-xl p-1 mb-6">
            <button
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === "login"
                  ? "bg-[#5B8DEF] text-white shadow-lg shadow-blue-500/20"
                  : "text-[#8b949e] hover:text-white"
              }`}
              onClick={() => { setMode("login"); setError(""); }}
            >
              Войти
            </button>
            <button
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === "register"
                  ? "bg-[#5B8DEF] text-white shadow-lg shadow-blue-500/20"
                  : "text-[#8b949e] hover:text-white"
              }`}
              onClick={() => { setMode("register"); setError(""); }}
            >
              Регистрация
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="text-[#8b949e] text-xs font-medium uppercase tracking-wider block mb-2">
                  Имя пользователя
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="@username"
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-white placeholder-[#484f58] focus:outline-none focus:border-[#5B8DEF] focus:ring-1 focus:ring-[#5B8DEF] transition-colors"
                  required
                  autoComplete="username"
                />
              </div>
            )}

            <div>
              <label className="text-[#8b949e] text-xs font-medium uppercase tracking-wider block mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-white placeholder-[#484f58] focus:outline-none focus:border-[#5B8DEF] focus:ring-1 focus:ring-[#5B8DEF] transition-colors"
                required
                autoComplete="email"
              />
            </div>

            {mode === "register" && (
              <div>
                <label className="text-[#8b949e] text-xs font-medium uppercase tracking-wider block mb-2">
                  Отображаемое имя
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ваше имя"
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-white placeholder-[#484f58] focus:outline-none focus:border-[#5B8DEF] focus:ring-1 focus:ring-[#5B8DEF] transition-colors"
                  required
                />
              </div>
            )}

            <div>
              <label className="text-[#8b949e] text-xs font-medium uppercase tracking-wider block mb-2">
                Пароль
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-white placeholder-[#484f58] focus:outline-none focus:border-[#5B8DEF] focus:ring-1 focus:ring-[#5B8DEF] transition-colors"
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#5B8DEF] to-[#3366CC] hover:from-[#4a7de0] hover:to-[#2255bb] text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {mode === "login" ? "Входим..." : "Регистрируем..."}
                </span>
              ) : (
                mode === "login" ? "Войти" : "Создать аккаунт"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[#484f58] text-xs mt-6">
          Кнам — мессенджер нового поколения
        </p>
      </div>
    </div>
  );
}
