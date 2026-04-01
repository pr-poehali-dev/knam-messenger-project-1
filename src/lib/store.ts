import { User } from "./api";

const USER_KEY = "knam_user";
const TOKEN_KEY = "knam_token";

export function saveSession(user: User, token: string) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_KEY, token);
}

export function loadSession(): { user: User; token: string } | null {
  try {
    const userStr = localStorage.getItem(USER_KEY);
    const token = localStorage.getItem(TOKEN_KEY);
    if (!userStr || !token) return null;
    const user = JSON.parse(userStr) as User;
    return { user, token };
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export function updateStoredUser(user: User) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}
