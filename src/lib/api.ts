import { Capacitor, CapacitorHttp } from "@capacitor/core";
import type { CategoryStat, Day, HistoryEntry, Stats, Streak, Task } from "./types";
import { loadToken, saveToken, clearToken } from "./token";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";
const IS_NATIVE = Capacitor.isNativePlatform();

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
    if (response.status >= 400) {
      const detail = response.data?.detail ?? response.status.toString();
      throw new Error(detail);
    }
    if (response.status === 204) return undefined as T;
    return response.data as T;
  }

  const res = await fetch(url, {
    headers,
    ...init,
  });
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
  register: async (email: string, password: string) => {
    const { token } = await authReq("/auth/register", { email, password });
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
};
