// ─── User & Auth ──────────────────────────────────────────────────────────────

export type UserRole =
  | "STUDENT"
  | "MENTOR"
  | "COORDINATOR"
  | "INTERNAL_JUDGE"
  | "GUEST_JUDGE";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

// ─── Team ─────────────────────────────────────────────────────────────────────

export type TeamStatus = "PENDING" | "APPROVED" | "DISQUALIFIED";

// ─── Round ────────────────────────────────────────────────────────────────────

export type RoundStatus =
  | "SUBMISSION_OPEN"
  | "CALIBRATION"
  | "EVALUATION"
  | "COMPLETED";

// ─── API Generic ──────────────────────────────────────────────────────────────

export interface ApiError {
  message: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
