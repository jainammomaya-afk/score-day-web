const THRESHOLD_KEY = "daily-score-streak-threshold";

export function getThreshold(): number {
  const v = parseInt(localStorage.getItem(THRESHOLD_KEY) ?? "80", 10);
  return isNaN(v) ? 80 : Math.max(1, Math.min(100, v));
}

export function setThreshold(v: number): void {
  localStorage.setItem(THRESHOLD_KEY, String(v));
}
