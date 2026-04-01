import { useState, useEffect } from "react";
import { User } from "@/lib/api";
import { loadSession } from "@/lib/store";
import Auth from "./Auth";
import Messenger from "./Messenger";

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = loadSession();
    if (session) {
      setUser(session.user);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#5B8DEF] to-[#3366CC] flex items-center justify-center shadow-2xl shadow-blue-500/30 animate-pulse">
            <span className="text-3xl font-black text-white">К</span>
          </div>
          <div className="text-[#8b949e] text-sm">Загрузка...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onAuth={(u) => setUser(u)} />;
  }

  return (
    <Messenger
      user={user}
      onLogout={() => setUser(null)}
    />
  );
}
