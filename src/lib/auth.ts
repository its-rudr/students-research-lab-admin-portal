export type UserRole = "admin" | "member";

export interface UserSession {
  email: string;
  name: string;
  enrollmentNo?: string;
  role: UserRole;
}

const AUTH_TOKEN_KEY = "authToken";
const USER_DATA_KEY = "userData";

export const isAuthenticated = (): boolean => {
  try {
    return Boolean(localStorage.getItem(AUTH_TOKEN_KEY));
  } catch {
    return false;
  }
};

export const getStoredUser = (): UserSession | null => {
  try {
    const raw = localStorage.getItem(USER_DATA_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<UserSession>;
    if (!parsed.email) {
      return null;
    }

    return {
      email: parsed.email,
      name: parsed.name || parsed.email,
      enrollmentNo: parsed.enrollmentNo,
      role: parsed.role === "admin" ? "admin" : "member",
    };
  } catch {
    return null;
  }
};

export const hasWriteAccess = (): boolean => {
  const user = getStoredUser();
  return user?.role === "admin";
};

export const saveSession = (user: UserSession) => {
  localStorage.setItem(AUTH_TOKEN_KEY, `session-${Date.now()}`);
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
  localStorage.setItem("userEmail", user.email);
};

export const clearSession = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(USER_DATA_KEY);
  localStorage.removeItem("userEmail");
};
