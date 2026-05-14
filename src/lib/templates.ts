import { Capacitor } from "@capacitor/core";
import type { Template } from "./types";

const KEY = "daily-score-templates";
const IS_NATIVE = Capacitor.isNativePlatform();

let _templates: Template[] = [];

async function persist(): Promise<void> {
  const json = JSON.stringify(_templates);
  if (IS_NATIVE) {
    const { Preferences } = await import("@capacitor/preferences");
    await Preferences.set({ key: KEY, value: json });
  } else {
    localStorage.setItem(KEY, json);
  }
}

export async function loadTemplates(): Promise<void> {
  try {
    if (IS_NATIVE) {
      const { Preferences } = await import("@capacitor/preferences");
      const { value } = await Preferences.get({ key: KEY });
      _templates = JSON.parse(value ?? "[]");
    } else {
      _templates = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    }
  } catch {
    _templates = [];
  }
}

export function getTemplates(): Template[] {
  return _templates;
}

export function saveTemplate(t: Template): void {
  _templates = [..._templates.filter((x) => x.id !== t.id), t];
  persist();
}

export function deleteTemplate(id: string): void {
  _templates = _templates.filter((x) => x.id !== id);
  persist();
}
