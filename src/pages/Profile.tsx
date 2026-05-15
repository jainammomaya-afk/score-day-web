import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Stats } from "../lib/types";

export default function ProfilePage() {
  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsErr, setStatsErr] = useState<string | null>(null);

  useEffect(() => {
    api.me().then((u) => { setUsername(u.username); setEmail(u.email); }).catch(() => {});
    api.stats().then(setStats).catch((e) => setStatsErr((e as Error).message));
  }, []);

  function startEditName() {
    setDraftName(username ?? "");
    setEditingName(true);
  }

  async function saveName() {
    const trimmed = draftName.trim();
    const updated = await api.updateMe({ username: trimmed || null });
    setUsername(updated.username);
    setEditingName(false);
  }

  const displayName = username || "Scorer";

  return (
    <div className="space-y-8 max-w-md">
      {/* ── Identity ── */}
      <section>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-2xl font-bold text-zinc-300 select-none">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveName();
                    if (e.key === "Escape") setEditingName(false);
                  }}
                  className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500 w-40"
                  placeholder="Your name"
                  maxLength={40}
                />
                <button
                  onClick={saveName}
                  className="text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingName(false)}
                  className="text-xs text-zinc-600 hover:text-zinc-400"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-zinc-100">{displayName}</span>
                <button
                  onClick={startEditName}
                  className="text-xs text-zinc-600 hover:text-zinc-400 underline"
                >
                  edit
                </button>
              </div>
            )}
            {email && <div className="text-xs text-zinc-600 mt-0.5">{email}</div>}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section>
        <div className="text-xs uppercase tracking-wider text-zinc-500 mb-4">All-time stats</div>
        {statsErr && <div className="text-sm text-red-400">{statsErr}</div>}
        {!stats && !statsErr && <div className="text-sm text-zinc-500">Loading…</div>}
        {stats && (
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Days scored" value={String(stats.total_days)} />
            <StatCard label="Longest streak" value={`${stats.longest_streak} days`} />
            <StatCard label="7-day avg" value={`${stats.avg_7d}%`} />
            <StatCard label="30-day avg" value={`${stats.avg_30d}%`} />
          </div>
        )}
      </section>

      {/* ── About ── */}
      <section className="border-t border-zinc-800 pt-6">
        <div className="text-xs uppercase tracking-wider text-zinc-500 mb-3">About</div>
        <div className="space-y-1 text-sm text-zinc-500">
          <p>Score Day — rate your productivity, one day at a time.</p>
          <p className="text-zinc-700 text-xs mt-2">v2.0.0</p>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="text-xs text-zinc-500 mb-1">{label}</div>
      <div className="text-xl font-semibold tabular-nums text-zinc-100">{value}</div>
    </div>
  );
}
