import { useState } from "react";

const ONBOARDED_KEY = "score-day-onboarded";

export function hasOnboarded(): boolean {
  return localStorage.getItem(ONBOARDED_KEY) === "1";
}

function markOnboarded() {
  localStorage.setItem(ONBOARDED_KEY, "1");
}

interface Props {
  onDone: () => void;
}

const STEPS = [
  {
    emoji: "👋",
    title: "Welcome to Score Day",
    content: (
      <p className="text-zinc-400 text-sm leading-relaxed">
        Score Day helps you measure how productive your day actually was — not just how busy you felt.
        Plan tasks in the morning, tick them off through the day, and lock your score at the end.
      </p>
    ),
  },
  {
    emoji: "⚖️",
    title: "How scoring works",
    content: (
      <div className="space-y-3">
        <p className="text-zinc-400 text-sm leading-relaxed">
          Every task gets a <span className="text-zinc-200">weight</span> — a number that reflects how important or demanding it is.
          Your daily score is a simple percentage:
        </p>
        <div className="rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-3 text-center">
          <div className="text-zinc-400 text-xs mb-1">Score formula</div>
          <div className="text-zinc-100 text-sm font-mono">
            completed weight ÷ total weight × 100
          </div>
        </div>
        <div className="rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-3 space-y-2">
          <div className="text-xs text-zinc-500 mb-2">Example day</div>
          {[
            { title: "Deep work session", weight: 5, done: true },
            { title: "Reply to emails", weight: 2, done: true },
            { title: "Gym", weight: 3, done: false },
          ].map((t) => (
            <div key={t.title} className="flex items-center gap-2 text-sm">
              <span className={t.done ? "text-emerald-400" : "text-zinc-600"}>
                {t.done ? "✓" : "○"}
              </span>
              <span className={`flex-1 ${t.done ? "text-zinc-300" : "text-zinc-600"}`}>{t.title}</span>
              <span className="text-zinc-500 tabular-nums">{t.weight}pt</span>
            </div>
          ))}
          <div className="border-t border-zinc-800 pt-2 flex justify-between text-xs">
            <span className="text-zinc-500">7 completed / 10 total</span>
            <span className="text-emerald-400 font-semibold">70%</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    emoji: "🔄",
    title: "The daily loop",
    content: (
      <div className="space-y-4">
        <p className="text-zinc-400 text-sm">Three simple steps, every day:</p>
        <div className="space-y-3">
          {[
            { step: "1", label: "Plan", desc: "Add 1–12 tasks with weights. Use categories to organise.", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
            { step: "2", label: "Execute", desc: "Tick tasks as you complete them. Score updates live.", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
            { step: "3", label: "Lock", desc: "End the day, write a quick reflection, and lock your score.", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
          ].map((s) => (
            <div key={s.step} className={`flex gap-3 rounded-lg border px-4 py-3 ${s.color}`}>
              <div className="text-lg font-bold w-5 shrink-0">{s.step}</div>
              <div>
                <div className="font-medium text-sm">{s.label}</div>
                <div className="text-xs opacity-70 mt-0.5">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    emoji: "🔥",
    title: "Build your streak",
    content: (
      <div className="space-y-4">
        <p className="text-zinc-400 text-sm leading-relaxed">
          Score <span className="text-zinc-200">80% or above</span> on consecutive days to build a streak.
          One sub-threshold day resets it — so make your days count.
        </p>
        <div className="rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-4">
          <div className="text-xs text-zinc-500 mb-3">Last 7 days</div>
          <div className="flex gap-1.5 justify-center">
            {[92, 85, 78, 91, 88, 95, null].map((pct, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={`w-7 h-7 rounded border text-xs flex items-center justify-center font-medium ${
                  pct === null ? "bg-zinc-900 border-zinc-700 text-zinc-600" :
                  pct >= 80 ? "bg-emerald-500/80 border-emerald-500 text-zinc-950" :
                  "bg-red-900/60 border-red-800 text-red-300"
                }`}>
                  {pct === null ? "·" : "✓"}
                </div>
                <div className="text-[10px] text-zinc-600">{pct === null ? "—" : `${pct}%`}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-center text-xs text-zinc-500">
            5-day streak · today not yet locked
          </div>
        </div>
        <p className="text-xs text-zinc-600 text-center">
          You can adjust the 80% threshold in History settings any time.
        </p>
      </div>
    ),
  },
];

export default function Onboarding({ onDone }: Props) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function handleDone() {
    markOnboarded();
    onDone();
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl">

        {/* header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-1">
          <div className="text-xs text-zinc-600 tabular-nums">{step + 1} / {STEPS.length}</div>
          <button
            onClick={handleDone}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition"
          >
            Skip
          </button>
        </div>

        {/* body */}
        <div className="px-6 pb-6 pt-3 space-y-4">
          <div className="text-4xl text-center">{current.emoji}</div>
          <h2 className="text-lg font-semibold text-zinc-100 text-center">{current.title}</h2>
          {current.content}
        </div>

        {/* progress dots */}
        <div className="flex justify-center gap-1.5 pb-4">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all ${
                i === step ? "w-4 h-1.5 bg-emerald-500" : "w-1.5 h-1.5 bg-zinc-700"
              }`}
            />
          ))}
        </div>

        {/* footer */}
        <div className="border-t border-zinc-800 px-6 py-4 flex justify-between items-center">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="text-sm text-zinc-500 hover:text-zinc-300 disabled:opacity-0 transition"
          >
            ← Back
          </button>
          {isLast ? (
            <button
              onClick={handleDone}
              className="px-6 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition"
            >
              Start planning →
            </button>
          ) : (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="px-6 py-2 rounded-lg bg-zinc-800 text-zinc-100 text-sm font-medium hover:bg-zinc-700 transition"
            >
              Next →
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
