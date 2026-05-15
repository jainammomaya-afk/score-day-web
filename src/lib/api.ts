import { Capacitor, CapacitorHttp } from "@capacitor/core";
import type { CategoryStat, Day, HistoryEntry, Stats, Streak, Task, UserProfile } from "./types";
import { loadToken, saveToken, clearToken } from "./token";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";
const IS_NATIVE = Capacitor.isNativePlatform();

let _onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(cb: () => void): void {
  _onUnauthorized = cb;
}

async function handleUnauthorized(path: string, detail: string): Promise<never> {
  // Auth endpoints returning 401 means bad credentials, not an expired session.
  if (!path.startsWith("/auth/")) {
    await clearToken();
    _onUnauthorized?.();
  }
  throw new Error(detail);
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const method = (init?.method ?? "GET").toUpperCase();
  const bodyStr = init?.body as string | undefined;
  const token = await loadToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  if (IS_NATIVE) {
    const response = await CapacitorHttp.request({
      url,
      method,
      headers,
      ...(bodyStr ? { data: JSON.parse(bodyStr) } : {}),
    });
    if (response.status === 401) {
      const detail = (typeof response.data === "object" && response.data?.detail) || "Session expired — please sign in again";
      return handleUnauthorized(path, detail);
    }
    if (response.status >= 400) {
      const detail =
        (typeof response.data === "object" && response.data?.detail) ||
        (response.status >= 500 ? "Server error — please try again in a moment" : response.status.toString());
      throw new Error(detail);
    }
    if (response.status === 204) return undefined as T;
    return response.data as T;
  }

  const res = await fetch(url, {
    headers,
    ...init,
  });
  if (res.status === 401) {
    let detail = "Session expired — please sign in again";
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {}
    return handleUnauthorized(path, detail);
  }
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {}
    throw new Error(detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

async function authReq(path: string, body: object): Promise<{ token: string }> {
  return req<{ token: string }>(path, { method: "POST", body: JSON.stringify(body) });
}

export const auth = {
  register: async (email: string, password: string, username?: string) => {
    const { token } = await authReq("/auth/register", { email, password, username });
    await saveToken(token);
  },
  login: async (email: string, password: string) => {
    const { token } = await authReq("/auth/login", { email, password });
    await saveToken(token);
  },
  logout: clearToken,
};

export const api = {
  today: () => req<Day>("/api/today"),
  addTask: (dayId: number, title: string, weight: number, category: string | null) =>
    req<Task>(`/api/days/${dayId}/tasks`, {
      method: "POST",
      body: JSON.stringify({ title, weight, category }),
    }),
  updateTask: (taskId: number, patch: Partial<Pick<Task, "title" | "weight" | "completed" | "category">>) =>
    req<Task>(`/api/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  deleteTask: (taskId: number) =>
    req<{ ok: boolean }>(`/api/tasks/${taskId}`, { method: "DELETE" }),
  startDay: (dayId: number) =>
    req<Day>(`/api/days/${dayId}/start`, { method: "POST" }),
  lockDay: (dayId: number) =>
    req<Day>(`/api/days/${dayId}/lock`, { method: "POST" }),
  history: (days = 30) => req<HistoryEntry[]>(`/api/history?days=${days}`),
  categoryStats: (days = 30) => req<CategoryStat[]>(`/api/history/categories?days=${days}`),
  streak: (threshold = 80) => req<Streak>(`/api/streak?threshold=${threshold}`),
  dayByDate: (date: string) => req<Day>(`/api/days/by-date/${date}`),
  stats: (threshold = 80) => req<Stats>(`/api/stats?threshold=${threshold}`),
  saveNote: (dayId: number, note: string) =>
    req<Day>(`/api/days/${dayId}/note`, {
      method: "PATCH",
      body: JSON.stringify({ note }),
    }),
  me: () => req<UserProfile>("/api/me"),
  updateMe: (patch: { username: string | null }) =>
    req<UserProfile>("/api/me", { method: "PATCH", body: JSON.stringify(patch) }),
};
