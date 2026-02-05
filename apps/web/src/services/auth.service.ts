/**
 * Auth Service
 *
 * Handles authentication API calls.
 */

import { api } from "@/lib/api";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  inviteCode: string;
}

export interface AuthResponse {
  accessToken: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: string;
  mosqueId: string | null;
}

/**
 * Login user with email and password
 */
export async function login(
  credentials: LoginCredentials,
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/login", credentials);
  return response.data;
}

/**
 * Register a new user
 */
export async function register(
  credentials: RegisterCredentials,
): Promise<{ message: string; user: UserProfile }> {
  const response = await api.post<{ message: string; user: UserProfile }>(
    "/auth/register",
    credentials,
  );
  return response.data;
}

/**
 * Get current user profile
 */
export async function getProfile(): Promise<{
  message: string;
  user: UserProfile;
}> {
  const response = await api.get<{ message: string; user: UserProfile }>(
    "/auth/profile",
  );
  return response.data;
}

export const authService = {
  login,
  register,
  getProfile,
};

export default authService;
