export type UserRole = "admin" | "member";

export interface UserSession {
  email: string;
  name: string;
  enrollmentNo?: string;
  role: UserRole;
}

const AUTH_TOKEN_KEY = "authToken";
const ADMIN_TOKEN_KEY = "adminToken";
const USER_DATA_KEY = "userData";

export const isAuthenticated = (): boolean => {
  try {
    const adminToken = localStorage.getItem(ADMIN_TOKEN_KEY);
    const authToken = localStorage.getItem(AUTH_TOKEN_KEY);
    
    return Boolean(adminToken || authToken);
  } catch {
    return false;
  }
};

export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY) || localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
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
  // Note: Admin token is saved separately by setAuthToken() in adminApi.ts
};

export const clearSession = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(USER_DATA_KEY);
  localStorage.removeItem("userEmail");
};
