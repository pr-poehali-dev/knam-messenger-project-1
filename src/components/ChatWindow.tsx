import { useEffect, useRef, useState, useCallback } from "react";
import { getMessages, sendMessage, Message, Chat, User } from "@/lib/api";
import Avatar from "./Avatar";
import { Send, ArrowLeft, MoreVertical, Phone, Video } from "lucide-react";

interface ChatWindowProps {
  chat: Chat;
  currentUser: User;
  onBack?: () => void;
}

function formatMessageTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function formatDateDivider(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  if (isToday) return "Сегодня";
  if (isYesterday) return "Вчера";
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

export default function ChatWindow({ chat, currentUser, onBack }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prevMessagesLength = useRef(0);

  const chatName = chat.other_user_display_name || chat.name || "Чат";
  const chatColor = chat.other_user_avatar_color || chat.avatar_color;
  const chatUsername = chat.other_user_username;

  const fetchMessages = useCallback(async () => {
    try {
      const result = await getMessages(currentUser.id, chat.id);
      setMessages(result);
    } catch (err) {
      console.error(err);
    }
  }, [currentUser.id, chat.id]);

  useEffect(() => {
    setMessages([]);
    prevMessagesLength.current = 0;
    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [chat.id, fetchMessages]);

  useEffect(() => {
    if (messages.length !== prevMessagesLength.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      prevMessagesLength.current = messages.length;
    }
  }, [messages]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || sending) return;

    setSending(true);
    setInput("");

    // Оптимистичное обновление
    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      content,
      created_at: new Date().toISOString(),
      is_read: false,
      sender_id: currentUser.id,
      sender_name: currentUser.display_name,
      sender_avatar_color: currentUser.avatar_color,
      sender_username: currentUser.username,
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      await sendMessage(currentUser.id, chat.id, content);
      await fetchMessages();
    } catch (err) {
      console.error(err);
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setInput(content);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  messages.forEach((msg) => {
    const dateStr = new Date(msg.created_at).toDateString();
    const last = groupedMessages[groupedMessages.length - 1];
    if (!last || last.date !== dateStr) {
      groupedMessages.push({ date: dateStr, messages: [msg] });
    } else {
      last.messages.push(msg);
    }
  });

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      {/* Header */}
      <div className="bg-[#161b22] border-b border-[#30363d] px-4 py-3 flex items-center gap-3">
        {onBack && (
          <button
            className="w-8 h-8 rounded-lg hover:bg-[#21262d] text-[#8b949e] hover:text-white transition-colors flex items-center justify-center"
            onClick={onBack}
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <Avatar
          name={chatName}
          color={chatColor}
          size="sm"
          isOnline={chat.other_user_is_online ?? undefined}
        />
        <div className="flex-1 min-w-0">
          <div className="text-white font-semibold text-sm">{chatName}</div>
          <div className="text-[#484f58] text-xs">
            {chat.other_user_is_online ? (
              <span className="text-green-400">онлайн</span>
            ) : chatUsername ? (
              `@${chatUsername}`
            ) : "оффлайн"}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="w-8 h-8 rounded-lg hover:bg-[#21262d] text-[#8b949e] hover:text-white transition-colors flex items-center justify-center" title="Голосовой звонок">
            <Phone size={16} />
          </button>
          <button className="w-8 h-8 rounded-lg hover:bg-[#21262d] text-[#8b949e] hover:text-white transition-colors flex items-center justify-center" title="Видеозвонок">
            <Video size={16} />
          </button>
          <button className="w-8 h-8 rounded-lg hover:bg-[#21262d] text-[#8b949e] hover:text-white transition-colors flex items-center justify-center">
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg"
              style={{ backgroundColor: chatColor }}
            >
              {chatName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white font-semibold">{chatName}</p>
              <p className="text-[#484f58] text-sm mt-1">Начните общение прямо сейчас!</p>
            </div>
          </div>
        ) : (
          groupedMessages.map((group) => (
            <div key={group.date}>
              {/* Date divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-[#21262d]" />
                <span className="text-[#484f58] text-xs px-2">
                  {formatDateDivider(group.messages[0].created_at)}
                </span>
                <div className="flex-1 h-px bg-[#21262d]" />
              </div>
              {/* Messages in group */}
              {group.messages.map((msg, idx) => {
                const isOwn = msg.sender_id === currentUser.id;
                const prevMsg = idx > 0 ? group.messages[idx - 1] : null;
                const isFirstInSequence = !prevMsg || prevMsg.sender_id !== msg.sender_id;
                const isTemp = msg.id.startsWith("temp-");

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"} ${
                      isFirstInSequence ? "mt-3" : "mt-0.5"
                    }`}
                  >
                    {!isOwn && (
                      <div className="w-7 shrink-0">
                        {isFirstInSequence && (
                          <Avatar name={msg.sender_name} color={msg.sender_avatar_color} size="sm" />
                        )}
                      </div>
                    )}
                    <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                      {!isOwn && isFirstInSequence && (
                        <span className="text-[#5B8DEF] text-xs font-semibold mb-1 ml-3">
                          {msg.sender_name}
                        </span>
                      )}
                      <div
                        className={`px-4 py-2.5 rounded-2xl relative ${
                          isOwn
                            ? "bg-gradient-to-br from-[#5B8DEF] to-[#3366CC] text-white rounded-br-sm shadow-lg shadow-blue-500/10"
                            : "bg-[#21262d] text-white rounded-bl-sm"
                        } ${isTemp ? "opacity-70" : ""}`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                        <div className={`flex items-center gap-1 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}>
                          <span className={`text-[10px] ${isOwn ? "text-blue-200/70" : "text-[#484f58]"}`}>
                            {formatMessageTime(msg.created_at)}
                          </span>
                          {isOwn && !isTemp && (
                            <span className={`text-[10px] ${msg.is_read ? "text-blue-200" : "text-blue-200/50"}`}>
                              {msg.is_read ? "✓✓" : "✓"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-[#161b22] border-t border-[#30363d] px-4 py-3">
        <div className="flex items-end gap-3">
          <div className="flex-1 bg-[#21262d] rounded-2xl border border-[#30363d] focus-within:border-[#5B8DEF] transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Написать сообщение..."
              rows={1}
              className="w-full bg-transparent px-4 py-3 text-white text-sm placeholder-[#484f58] focus:outline-none resize-none max-h-32 overflow-y-auto"
              style={{ minHeight: "44px" }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-11 h-11 bg-gradient-to-br from-[#5B8DEF] to-[#3366CC] hover:from-[#4a7de0] hover:to-[#2255bb] disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-blue-500/20 shrink-0"
          >
            <Send size={18} className="text-white translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
