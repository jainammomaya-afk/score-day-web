import type { Template } from "./types";

const KEY = "daily-score-templates";

export function getTemplates(): Template[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveTemplate(t: Template): void {
  const all = getTemplates().filter((x) => x.id !== t.id);
  localStorage.setItem(KEY, JSON.stringify([...all, t]));
}

export function deleteTemplate(id: string): void {
  localStorage.setItem(KEY, JSON.stringify(getTemplates().filter((x) => x.id !== id)));
}
