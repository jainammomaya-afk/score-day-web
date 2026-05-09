import { Capacitor } from "@capacitor/core";

const KEY = "auth_token";

export async function saveToken(token: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const { Preferences } = await import("@capacitor/preferences");
    await Preferences.set({ key: KEY, value: token });
  } else {
    localStorage.setItem(KEY, token);
  }
}

export async function loadToken(): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    const { Preferences } = await import("@capacitor/preferences");
    const { value } = await Preferences.get({ key: KEY });
    return value;
  }
  return localStorage.getItem(KEY);
}

export async function clearToken(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const { Preferences } = await import("@capacitor/preferences");
    await Preferences.remove({ key: KEY });
  } else {
    localStorage.removeItem(KEY);
  }
}
