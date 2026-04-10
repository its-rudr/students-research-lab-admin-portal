/**
 * Admin API Client Service
 * Centralized API client for all admin CRUD operations
 */

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000/api";

// Get token from localStorage
const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem("adminToken");
  } catch {
    return null;
  }
};

// Set token in localStorage
export const setAuthToken = (token: string) => {
  try {
    localStorage.setItem("adminToken", token);
  } catch (error) {
    console.error("Failed to save auth token:", error);
  }
};

// Clear token from localStorage
export const clearAuthToken = () => {
  try {
    localStorage.removeItem("adminToken");
  } catch (error) {
    console.error("Failed to clear auth token:", error);
  }
};

// Helper function to make API calls
const apiCall = async (
  endpoint: string,
  method: string = "GET",
  body?: unknown
): Promise<any> => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // In development mode, always send dev-token header
  if (import.meta.env.DEV) {
    headers["x-dev-token"] = "dev-bypass";
    console.log(`[API] ${method} ${endpoint} - Using dev bypass`);
  } else if (token) {
    // In production, use actual token
    headers.Authorization = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `API Error: ${response.statusText}`);
  }

  return response.json();
};

export const adminAPI = {
  // Authentication APIs
  async login(email: string, password: string) {
    return apiCall("/admin/login", "POST", { email, password });
  },

  async verifyToken() {
    return apiCall("/admin/verify", "POST");
  },

  // Students APIs
  async getStudents() {
    return apiCall("/admin/students");
  },

  async getStudent(enrollmentNo: string) {
    return apiCall(`/admin/students/${enrollmentNo}`);
  },

  async createStudent(data: any) {
    return apiCall("/admin/students", "POST", data);
  },

  async updateStudent(enrollmentNo: string, data: any) {
    return apiCall(`/admin/students/${enrollmentNo}`, "PUT", data);
  },

  async deleteStudent(enrollmentNo: string) {
    return apiCall(`/admin/students/${enrollmentNo}`, "DELETE");
  },

  // Activities APIs
  async getActivities() {
    return apiCall("/admin/activities");
  },

  async createActivity(data: any) {
    return apiCall("/admin/activities", "POST", data);
  },

  async updateActivity(id: string, data: any) {
    return apiCall(`/admin/activities/${id}`, "PUT", data);
  },

  async deleteActivity(id: string) {
    return apiCall(`/admin/activities/${id}`, "DELETE");
  },

  // Scores APIs
  async getScores() {
    return apiCall("/admin/scores");
  },

  async getScoresByStudent(enrollmentNo: string) {
    return apiCall(`/admin/scores/${enrollmentNo}`);
  },

  async createScore(data: any) {
    return apiCall("/admin/scores", "POST", data);
  },

  async updateScore(id: string, data: any) {
    return apiCall(`/admin/scores/${id}`, "PUT", data);
  },

  async deleteScore(id: string) {
    return apiCall(`/admin/scores/${id}`, "DELETE");
  },

  // Attendance APIs
  async getAttendance() {
    return apiCall("/admin/attendance");
  },

  async getAttendanceByStudent(enrollmentNo: string) {
    return apiCall(`/admin/attendance/student/${enrollmentNo}`);
  },

  async markAttendance(data: any) {
    return apiCall("/admin/attendance", "POST", data);
  },

  async updateAttendance(id: string, data: any) {
    return apiCall(`/admin/attendance/${id}`, "PUT", data);
  },

  async deleteAttendance(id: string) {
    return apiCall(`/admin/attendance/${id}`, "DELETE");
  },

  // Timeline APIs
  async getTimeline() {
    return apiCall("/admin/timeline");
  },

  async createTimelineEntry(data: any) {
    return apiCall("/admin/timeline", "POST", data);
  },

  async updateTimelineEntry(id: string, data: any) {
    return apiCall(`/admin/timeline/${id}`, "PUT", data);
  },

  async deleteTimelineEntry(id: string) {
    return apiCall(`/admin/timeline/${id}`, "DELETE");
  },

  // Research APIs
  async getResearch() {
    return apiCall("/admin/research");
  },

  async createResearch(data: any) {
    return apiCall("/admin/research", "POST", data);
  },

  async updateResearch(id: string, data: any) {
    return apiCall(`/admin/research/${id}`, "PUT", data);
  },

  async deleteResearch(id: string) {
    return apiCall(`/admin/research/${id}`, "DELETE");
  },

  // Join Requests APIs
  async getJoinRequests() {
    return apiCall("/admin/join-requests");
  },

  async updateJoinRequest(id: string, status: string) {
    return apiCall(`/admin/join-requests/${id}`, "PUT", { status });
  },

  async deleteJoinRequest(id: string) {
    return apiCall(`/admin/join-requests/${id}`, "DELETE");
  },
};

export default adminAPI;
