import { useEffect, useState } from "react";
import { api, auth } from "./lib/api";
import { loadToken } from "./lib/token";
import { getThreshold, setThreshold as saveThreshold } from "./lib/settings";
import type { Day, Streak } from "./lib/types";
import DayPage from "./pages/Day";
import HistoryPage from "./pages/History";
import ProfilePage from "./pages/Profile";
import AuthPage from "./pages/Auth";
import Onboarding, { hasOnboarded } from "./components/Onboarding";

type Tab = "day" | "history" | "profile";

export default function App() {
  const [tab, setTab] = useState<Tab>("day");
  const [showOnboarding, setShowOnboarding] = useState(() => !hasOnboarded());
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [day, setDay] = useState<Day | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [threshold, setThreshold] = useState<number>(() => getThreshold());

  useEffect(() => {
    loadToken().then((t) => setAuthed(!!t));
  }, []);

  async function refresh() {
    try {
      const [d, s] = await Promise.all([api.today(), api.streak(threshold)]);
      setDay(d);
      setStreak(s);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    if (authed) refresh();
  }, [authed]);

  function handleThresholdChange(v: number) {
    saveThreshold(v);
    setThreshold(v);
    api.streak(v).then(setStreak).catch(() => {});
  }

  if (authed === null) return null;
  if (!authed) return <AuthPage onAuth={() => setAuthed(true)} />;

  async function handleLogout() {
    await auth.logout();
    setAuthed(false);
    setDay(null);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {showOnboarding && <Onboarding onDone={() => setShowOnboarding(false)} />}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center gap-6">
        <h1 className="text-lg font-semibold tracking-tight">Score Day</h1>
        <nav className="flex gap-1">
          <TabButton active={tab === "day"} onClick={() => setTab("day")}>Today</TabButton>
          <TabButton active={tab === "history"} onClick={() => setTab("history")}>History</TabButton>
          <TabButton active={tab === "profile"} onClick={() => setTab("profile")}>Profile</TabButton>
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          {streak && streak.streak > 0 && (
            <span className="px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800">
              🔥 {streak.streak}-day streak
            </span>
          )}
          <button
            onClick={handleLogout}
            className="text-zinc-500 hover:text-zinc-300 transition text-xs"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="px-6 py-8 max-w-3xl mx-auto">
        {error && (
          <div className="mb-4 rounded-md border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}
        {tab === "day" && day && <DayPage day={day} onChange={refresh} />}
        {tab === "day" && !day && <div className="text-zinc-500">Loading…</div>}
        {tab === "history" && (
          <HistoryPage
            threshold={threshold}
            onThresholdChange={handleThresholdChange}
            onGoToToday={() => setTab("day")}
          />
        )}
        {tab === "profile" && <ProfilePage />}
      </main>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "px-3 py-1.5 rounded-md text-sm transition " +
        (active
          ? "bg-zinc-800 text-zinc-100"
          : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900")
      }
    >
      {children}
    </button>
  );
}
