const AUTH_URL = "https://functions.poehali.dev/030dda61-699b-4607-82a5-54ae9fed59e3";
const MESSAGES_URL = "https://functions.poehali.dev/fc54055b-b286-4afa-838a-92a2cf022b2a";

export interface User {
  id: string;
  username: string;
  display_name: string;
  avatar_color: string;
  bio: string;
  is_online?: boolean;
  last_seen?: string;
}

export interface Chat {
  id: string;
  name: string | null;
  is_group: boolean;
  avatar_color: string;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
  other_user_id: string | null;
  other_user_display_name: string | null;
  other_user_avatar_color: string | null;
  other_user_username: string | null;
  other_user_is_online: boolean | null;
}

export interface Message {
  id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  sender_id: string;
  sender_name: string;
  sender_avatar_color: string;
  sender_username: string;
}

function getHeaders(userId?: string): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (userId) headers["X-User-Id"] = userId;
  return headers;
}

// Auth API
export async function sendEmailCode(email: string) {
  const res = await fetch(`${AUTH_URL}/send-code`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка отправки кода");
  return data as { ok: boolean; message: string };
}

export async function verifyEmailCode(email: string, code: string) {
  const res = await fetch(`${AUTH_URL}/verify-code`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ email, code }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Неверный код");
  return data as { ok: boolean; verified: boolean };
}

export async function register(username: string, email: string, display_name: string, password: string) {
  const res = await fetch(`${AUTH_URL}/register`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ username, email, display_name, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка регистрации");
  return data as { user: User; token: string };
}

export async function login(email: string, password: string) {
  const res = await fetch(`${AUTH_URL}/login`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка входа");
  return data as { user: User; token: string };
}

export async function searchUsers(q: string, userId: string) {
  const res = await fetch(`${AUTH_URL}/search?q=${encodeURIComponent(q)}`, {
    headers: getHeaders(userId),
  });
  const data = await res.json();
  return data as User[];
}

// Messages API
export async function getChats(userId: string) {
  const res = await fetch(`${MESSAGES_URL}/chats`, {
    headers: getHeaders(userId),
  });
  const data = await res.json();
  return data as Chat[];
}

export async function createDirectChat(userId: string, targetUserId: string) {
  const res = await fetch(`${MESSAGES_URL}/chats/direct`, {
    method: "POST",
    headers: getHeaders(userId),
    body: JSON.stringify({ target_user_id: targetUserId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка создания чата");
  return data as { chat_id: string };
}

export async function getMessages(userId: string, chatId: string) {
  const res = await fetch(`${MESSAGES_URL}/chats/${chatId}/messages`, {
    headers: getHeaders(userId),
  });
  const data = await res.json();
  return data as Message[];
}

export async function sendMessage(userId: string, chatId: string, content: string) {
  const res = await fetch(`${MESSAGES_URL}/chats/${chatId}/messages`, {
    method: "POST",
    headers: getHeaders(userId),
    body: JSON.stringify({ content }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка отправки");
  return data as Message;
}

export async function getProfile(userId: string) {
  const res = await fetch(`${MESSAGES_URL}/profile`, {
    headers: getHeaders(userId),
  });
  return res.json() as Promise<User>;
}

export async function updateProfile(userId: string, display_name: string, bio: string) {
  const res = await fetch(`${MESSAGES_URL}/profile`, {
    method: "POST",
    headers: getHeaders(userId),
    body: JSON.stringify({ display_name, bio }),
  });
  return res.json() as Promise<User>;
}