"use client";

import axios from "axios";
import { getAuthToken } from "@/lib/auth-storage";

export const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    (process.env.NODE_ENV === "production" ? "/api" : "http://localhost:3001"),
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window === "undefined") {
    return config;
  }

  const token = getAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const token = getAuthToken();
    const role = token ? readRoleFromToken(token) : "";

    if (
      typeof window !== "undefined" &&
      error.response?.status === 401 &&
      window.location.pathname !== "/login" &&
      role !== "SUPERADMIN"
    ) {
      window.location.assign("/login");
    }

    return Promise.reject(error);
  },
);

function readRoleFromToken(token: string): string {
  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const parsed = JSON.parse(window.atob(normalized)) as { role?: string };
    return parsed.role ?? "";
  } catch {
    return "";
  }
}
