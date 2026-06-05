/**
 * API Client Configuration
 *
 * Axios instance with base URL and auth interceptor.
 */

import axios from "axios";
import Cookies from "js-cookie";

import { TOKEN_COOKIE_NAME } from "./constants/auth";
import { env } from "./env";

// Re-export for backwards compatibility so existing imports don't break
export { TOKEN_COOKIE_NAME };

// Create axios instance
export const api = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth interceptor - automatically attach JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get(TOKEN_COOKIE_NAME);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      // Remove invalid token
      Cookies.remove(TOKEN_COOKIE_NAME);

      // Redirect to login if we're in the browser
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default api;
