import { useState } from "react";
import { updateProfile, User } from "@/lib/api";
import { clearSession, updateStoredUser } from "@/lib/store";
import Avatar from "./Avatar";
import { ArrowLeft, LogOut, Save } from "lucide-react";

interface SettingsProps {
  user: User;
  onBack: () => void;
  onLogout: () => void;
  onUpdate: (user: User) => void;
}

export default function Settings({ user, onBack, onLogout, onUpdate }: SettingsProps) {
  const [displayName, setDisplayName] = useState(user.display_name);
  const [bio, setBio] = useState(user.bio || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!displayName.trim()) return;
    setSaving(true);
    setError("");
    try {
      const updated = await updateProfile(user.id, displayName.trim(), bio.trim());
      updateStoredUser(updated);
      onUpdate(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    onLogout();
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      {/* Header */}
      <div className="bg-[#161b22] border-b border-[#30363d] px-4 py-3 flex items-center gap-3">
        <button
          className="w-8 h-8 rounded-lg hover:bg-[#21262d] text-[#8b949e] hover:text-white transition-colors flex items-center justify-center"
          onClick={onBack}
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-white font-semibold text-base flex-1">Настройки</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-4 py-4">
          <Avatar name={user.display_name} color={user.avatar_color} size="lg" isOnline />
          <div className="text-center">
            <div className="text-white font-bold text-xl">{user.display_name}</div>
            <div className="text-[#8b949e] text-sm">@{user.username}</div>
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <div className="bg-[#161b22] rounded-2xl border border-[#30363d] overflow-hidden">
            <div className="px-4 pt-3 pb-1">
              <label className="text-[#8b949e] text-xs font-medium uppercase tracking-wider">
                Отображаемое имя
              </label>
            </div>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-transparent px-4 pb-3 pt-1 text-white text-sm focus:outline-none placeholder-[#484f58]"
              placeholder="Ваше имя"
            />
          </div>

          <div className="bg-[#161b22] rounded-2xl border border-[#30363d] overflow-hidden">
            <div className="px-4 pt-3 pb-1">
              <label className="text-[#8b949e] text-xs font-medium uppercase tracking-wider">
                О себе
              </label>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full bg-transparent px-4 pb-3 pt-1 text-white text-sm focus:outline-none resize-none placeholder-[#484f58]"
              placeholder="Расскажите о себе..."
            />
          </div>

          <div className="bg-[#161b22] rounded-2xl border border-[#30363d] px-4 py-3">
            <div className="text-[#8b949e] text-xs font-medium uppercase tracking-wider mb-1">
              Имя пользователя
            </div>
            <div className="text-white text-sm">@{user.username}</div>
            <div className="text-[#484f58] text-xs mt-0.5">Нельзя изменить</div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !displayName.trim()}
          className="w-full bg-gradient-to-r from-[#5B8DEF] to-[#3366CC] hover:from-[#4a7de0] hover:to-[#2255bb] disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
        >
          {saving ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Сохраняем...
            </>
          ) : saved ? (
            <>
              <span>✓</span> Сохранено!
            </>
          ) : (
            <>
              <Save size={16} />
              Сохранить
            </>
          )}
        </button>
      </div>

      {/* Logout */}
      <div className="border-t border-[#30363d] p-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors font-semibold"
        >
          <LogOut size={18} />
          Выйти
        </button>
      </div>
    </div>
  );
}
