import { useState, useEffect } from "react";
import { User, Chat } from "@/lib/api";
import { loadSession } from "@/lib/store";
import ChatList from "@/components/ChatList";
import ChatWindow from "@/components/ChatWindow";
import Settings from "@/components/Settings";
import { MessageSquare } from "lucide-react";

interface MessengerProps {
  user: User;
  onLogout: () => void;
}

type View = "chats" | "chat" | "settings";

export default function Messenger({ user: initialUser, onLogout }: MessengerProps) {
  const [currentUser, setCurrentUser] = useState<User>(initialUser);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [view, setView] = useState<View>("chats");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
    setView("chat");
  };

  const handleOpenSettings = () => {
    setView("settings");
  };

  const handleBack = () => {
    setView("chats");
  };

  const handleUserUpdate = (updated: User) => {
    setCurrentUser(updated);
  };

  // Reload user from storage if needed
  useEffect(() => {
    const session = loadSession();
    if (session) setCurrentUser(session.user);
  }, []);

  if (isMobile) {
    return (
      <div className="h-screen bg-[#0d1117] overflow-hidden">
        {view === "chats" && (
          <ChatList
            userId={currentUser.id}
            selectedChatId={selectedChat?.id || null}
            onSelectChat={handleSelectChat}
            onOpenSettings={handleOpenSettings}
            currentUser={currentUser}
          />
        )}
        {view === "chat" && selectedChat && (
          <ChatWindow
            chat={selectedChat}
            currentUser={currentUser}
            onBack={handleBack}
          />
        )}
        {view === "settings" && (
          <Settings
            user={currentUser}
            onBack={handleBack}
            onLogout={onLogout}
            onUpdate={handleUserUpdate}
          />
        )}
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0d1117] overflow-hidden flex">
      {/* Sidebar */}
      <div className="w-80 shrink-0 h-full">
        {view === "settings" ? (
          <Settings
            user={currentUser}
            onBack={() => setView("chats")}
            onLogout={onLogout}
            onUpdate={handleUserUpdate}
          />
        ) : (
          <ChatList
            userId={currentUser.id}
            selectedChatId={selectedChat?.id || null}
            onSelectChat={handleSelectChat}
            onOpenSettings={handleOpenSettings}
            currentUser={currentUser}
          />
        )}
      </div>

      {/* Main */}
      <div className="flex-1 h-full">
        {selectedChat ? (
          <ChatWindow chat={selectedChat} currentUser={currentUser} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#5B8DEF] to-[#3366CC] flex items-center justify-center shadow-2xl shadow-blue-500/30">
              <span className="text-4xl font-black text-white">К</span>
            </div>
            <div>
              <h2 className="text-white text-2xl font-bold">Добро пожаловать в Кнам</h2>
              <p className="text-[#8b949e] mt-2">Выберите чат слева или начните новое общение</p>
            </div>
            <div className="flex items-center gap-2 text-[#484f58] text-sm mt-2">
              <MessageSquare size={16} />
              <span>Нажмите <span className="text-[#5B8DEF]">+</span> для поиска пользователей</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
