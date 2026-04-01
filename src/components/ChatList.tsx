import { useEffect, useState, useCallback } from "react";
import { getChats, searchUsers, createDirectChat, Chat, User } from "@/lib/api";
import Avatar from "./Avatar";
import { Search, MessageSquarePlus, X, Settings } from "lucide-react";

interface ChatListProps {
  userId: string;
  selectedChatId: string | null;
  onSelectChat: (chat: Chat) => void;
  onOpenSettings: () => void;
  currentUser: User;
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export default function ChatList({
  userId,
  selectedChatId,
  onSelectChat,
  onOpenSettings,
  currentUser,
}: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchChats = useCallback(async () => {
    try {
      const result = await getChats(userId);
      setChats(result);
    } catch (err) {
      console.error(err);
    }
  }, [userId]);

  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 3000);
    return () => clearInterval(interval);
  }, [fetchChats]);

  useEffect(() => {
    if (!showSearch || !search.trim()) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchUsers(search, userId);
        setSearchResults(results.filter((u) => u.id !== userId));
      } catch {
        // ignore
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [search, showSearch, userId]);

  const handleStartChat = async (user: User) => {
    try {
      const { chat_id } = await createDirectChat(userId, user.id);
      const newChat: Chat = {
        id: chat_id,
        name: user.display_name,
        is_group: false,
        avatar_color: user.avatar_color,
        last_message: null,
        last_message_time: null,
        unread_count: 0,
        other_user_id: user.id,
        other_user_display_name: user.display_name,
        other_user_avatar_color: user.avatar_color,
        other_user_username: user.username,
        other_user_is_online: null,
      };
      setShowSearch(false);
      setSearch("");
      onSelectChat(newChat);
      await fetchChats();
    } catch (err) {
      console.error(err);
    }
  };

  const getChatName = (chat: Chat) => chat.other_user_display_name || chat.name || "Чат";
  const getChatColor = (chat: Chat) => chat.other_user_avatar_color || chat.avatar_color;

  return (
    <div className="flex flex-col h-full bg-[#161b22] border-r border-[#30363d]">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-[#30363d]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5B8DEF] to-[#3366CC] flex items-center justify-center shadow-md">
              <span className="text-sm font-black text-white">К</span>
            </div>
            <h1 className="text-white font-bold text-lg">Кнам</h1>
          </div>
          <div className="flex items-center gap-1">
            <button
              className="w-8 h-8 rounded-lg hover:bg-[#21262d] text-[#8b949e] hover:text-white transition-colors flex items-center justify-center"
              onClick={() => setShowSearch(!showSearch)}
              title="Новый чат"
            >
              <MessageSquarePlus size={16} />
            </button>
            <button
              className="w-8 h-8 rounded-lg hover:bg-[#21262d] text-[#8b949e] hover:text-white transition-colors flex items-center justify-center"
              onClick={onOpenSettings}
              title="Настройки"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>

        {/* Search / New Chat */}
        {showSearch ? (
          <div className="space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#484f58]" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Найти пользователя..."
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl pl-9 pr-9 py-2 text-white text-sm placeholder-[#484f58] focus:outline-none focus:border-[#5B8DEF] transition-colors"
              />
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#484f58] hover:text-white"
                onClick={() => { setShowSearch(false); setSearch(""); }}
              >
                <X size={14} />
              </button>
            </div>
            {searching && (
              <div className="text-center text-[#484f58] text-xs py-2">Поиск...</div>
            )}
            {searchResults.map((user) => (
              <button
                key={user.id}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#21262d] transition-colors"
                onClick={() => handleStartChat(user)}
              >
                <Avatar name={user.display_name} color={user.avatar_color} size="sm" />
                <div className="text-left">
                  <div className="text-white text-sm font-medium">{user.display_name}</div>
                  <div className="text-[#8b949e] text-xs">@{user.username}</div>
                </div>
              </button>
            ))}
            {search && !searching && searchResults.length === 0 && (
              <div className="text-center text-[#484f58] text-xs py-2">Пользователи не найдены</div>
            )}
          </div>
        ) : (
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#484f58]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск чатов..."
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl pl-9 pr-4 py-2 text-white text-sm placeholder-[#484f58] focus:outline-none focus:border-[#5B8DEF] transition-colors"
            />
          </div>
        )}
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto py-1">
        {chats.length === 0 && !showSearch ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#21262d] flex items-center justify-center">
              <MessageSquarePlus size={24} className="text-[#484f58]" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">Нет чатов</p>
              <p className="text-[#484f58] text-xs mt-1">Нажмите + чтобы начать общение</p>
            </div>
          </div>
        ) : (
          chats
            .filter((c) => {
              if (!search || showSearch) return true;
              const name = getChatName(c).toLowerCase();
              return name.includes(search.toLowerCase());
            })
            .map((chat) => {
              const name = getChatName(chat);
              const color = getChatColor(chat);
              const isSelected = selectedChatId === chat.id;

              return (
                <button
                  key={chat.id}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                    isSelected
                      ? "bg-[#5B8DEF]/10 border-r-2 border-[#5B8DEF]"
                      : "hover:bg-[#21262d]"
                  }`}
                  onClick={() => onSelectChat(chat)}
                >
                  <Avatar
                    name={name}
                    color={color}
                    size="md"
                    isOnline={chat.other_user_is_online ?? undefined}
                  />
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <span className={`font-semibold text-sm truncate ${isSelected ? "text-[#5B8DEF]" : "text-white"}`}>
                        {name}
                      </span>
                      <span className="text-[#484f58] text-xs shrink-0 ml-2">
                        {formatTime(chat.last_message_time)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[#8b949e] text-xs truncate">
                        {chat.last_message || "Нет сообщений"}
                      </span>
                      {chat.unread_count > 0 && (
                        <span className="bg-[#5B8DEF] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shrink-0 ml-1 font-bold">
                          {chat.unread_count > 9 ? "9+" : chat.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
        )}
      </div>

      {/* Current User Footer */}
      <div className="border-t border-[#30363d] px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar name={currentUser.display_name} color={currentUser.avatar_color} size="sm" isOnline={true} />
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-medium truncate">{currentUser.display_name}</div>
            <div className="text-[#484f58] text-xs">@{currentUser.username}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
