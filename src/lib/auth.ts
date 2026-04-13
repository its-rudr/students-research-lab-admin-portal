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
    
    // In development, allow access without token
    if (import.meta.env.DEV && !adminToken && !authToken) {
      // Auto-save dev session
      saveSession({
        email: "adminsrl@gmail.com",
        name: "Admin (Dev)",
        enrollmentNo: "Admin@SRL",
        role: "admin",
      });
      return true;
    }
    
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

export const saveSession = (user: UserSession, token?: string) => {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
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
