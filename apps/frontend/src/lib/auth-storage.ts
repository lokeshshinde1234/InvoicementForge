"use client";

const AUTH_TOKEN_KEY = "token";
export const AUTH_CHANGED_EVENT = "invoiceforge-auth-changed";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const sessionToken = window.sessionStorage.getItem(AUTH_TOKEN_KEY);

  if (sessionToken) {
    return sessionToken;
  }

  const legacyToken = window.localStorage.getItem(AUTH_TOKEN_KEY);

  if (legacyToken) {
    window.sessionStorage.setItem(AUTH_TOKEN_KEY, legacyToken);
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    return legacyToken;
  }

  return null;
}

export function setAuthToken(token: string): void {
  window.sessionStorage.setItem(AUTH_TOKEN_KEY, token);
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  notifyAuthChanged();
}

export function clearAuthToken(): void {
  window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  notifyAuthChanged();
}

export function notifyAuthChanged(): void {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}
