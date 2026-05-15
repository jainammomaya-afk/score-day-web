import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { getTemplates, saveTemplate, deleteTemplate, loadTemplates } from "../lib/templates";
import type { Day, Task, Template } from "../lib/types";

const CATEGORIES = ["Work", "Personal", "Health", "Learning", "Other"] as const;

const CAT_BADGE: Record<string, string> = {
  Work:     "bg-blue-500/20 text-blue-300",
  Personal: "bg-violet-500/20 text-violet-300",
  Health:   "bg-emerald-500/20 text-emerald-300",
  Learning: "bg-amber-500/20 text-amber-300",
  Other:    "bg-zinc-500/20 text-zinc-400",
};

function CategoryBadge({ category }: { category: string | null }) {
  if (!category) return null;
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded mr-2 shrink-0 ${CAT_BADGE[category] ?? "bg-zinc-500/20 text-zinc-400"}`}>
      {category}
    </span>
  );
}

export default function DayPage({ day, onChange }: { day: Day; onChange: () => void }) {
  if (day.status === "planning") return <PlanView day={day} onChange={onChange} />;
  return <ActiveView day={day} onChange={onChange} />;
}

// ---------- planning ----------

function PlanView({ day, onChange }: { day: Day; onChange: () => void }) {
  const [title, setTitle] = useState("");
  const [weight, setWeight] = useState<number | "">("");
  const [category, setCategory] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [templates, setTemplates] = useState<Template[]>(() => getTemplates());
  const [saving, setSaving] = useState(false);
  const [saveName, setSaveName] = useState("");

  useEffect(() => {
    loadTemplates().then(() => setTemplates(getTemplates()));
  }, []);

  // inline edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editWeight, setEditWeight] = useState<number | "">(1);
  const [editCategory, setEditCategory] = useState("");

  const used = day.tasks.reduce((s, t) => s + t.weight, 0);
  const canStart = day.tasks.length > 0;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || weight === "") return;
    setBusy(true);
    setErr(null);
    try {
      await api.addTask(day.id, title.trim(), Number(weight), category || null);
      setTitle("");
      setWeight("");
      setCategory("");
      onChange();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(t: Task) {
    setBusy(true);
    try {
      await api.deleteTask(t.id);
      onChange();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleStart() {
    setBusy(true);
    setErr(null);
    try {
      await api.startDay(day.id);
      onChange();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function handleEditStart(t: Task) {
    setEditingId(t.id);
    setEditTitle(t.title);
    setEditWeight(t.weight);
    setEditCategory(t.category ?? "");
  }

  function handleEditCancel() {
    setEditingId(null);
  }

  async function handleEditSave(t: Task) {
    if (!editTitle.trim() || editWeight === "" || Number(editWeight) < 1) return;
    setBusy(true);
    setErr(null);
    try {
      await api.updateTask(t.id, {
        title: editTitle.trim(),
        weight: Number(editWeight),
        category: editCategory || null,
      });
      setEditingId(null);
      onChange();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleLoadTemplate(tpl: Template) {
    const slots = 12 - day.tasks.length;
    if (tpl.tasks.length > slots) {
      setErr(`Only ${slots} slot${slots !== 1 ? "s" : ""} remaining; template has ${tpl.tasks.length} tasks`);
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await Promise.all(tpl.tasks.map((t) => api.addTask(day.id, t.title, t.weight, t.category)));
      onChange();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function handleSaveTemplate() {
    if (!saveName.trim() || day.tasks.length === 0) return;
    const tpl: Template = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      name: saveName.trim(),
      tasks: day.tasks.map((t) => ({ title: t.title, weight: t.weight, category: t.category })),
    };
    saveTemplate(tpl);
    setTemplates(getTemplates());
    setSaveName("");
    setSaving(false);
  }

  function handleDeleteTemplate(id: string) {
    deleteTemplate(id);
    setTemplates(getTemplates());
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-zinc-500">Plan your day · {day.date}</div>
        <div className="mt-1 flex items-baseline gap-3">
          <div className="text-3xl font-semibold tabular-nums">
            {used} <span className="text-zinc-500 text-xl">pts planned</span>
          </div>
          {used > 0 && (
            <div className="text-sm text-zinc-400">
              {day.tasks.length} task{day.tasks.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      <section>
        <h2 className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Today's tasks</h2>
        {day.tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-10 text-center">
            <div className="text-3xl mb-3">📋</div>
            <div className="text-base font-medium text-zinc-300 mb-1">Plan your day</div>
            <p className="text-sm text-zinc-500 max-w-xs mx-auto">
              Add tasks below and assign each a weight. Your daily score will be
              <span className="text-zinc-300"> completed weight ÷ total weight × 100%</span>.
            </p>
            <div className="mt-4 text-xs text-zinc-600">↓ Start adding tasks below</div>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-800 rounded-md border border-zinc-800">
            {day.tasks.map((t) =>
              editingId === t.id ? (
                // ── edit mode ──
                <li key={t.id} className="px-3 py-3 space-y-2 bg-zinc-900/60">
                  <div className="flex gap-2">
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Escape" && handleEditCancel()}
                      className="flex-1 bg-zinc-900 border border-zinc-700 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-500"
                      autoFocus
                    />
                    <input
                      type="number"
                      min={1}
                      value={editWeight}
                      onChange={(e) => setEditWeight(e.target.value === "" ? "" : Number(e.target.value))}
                      onKeyDown={(e) => e.key === "Escape" && handleEditCancel()}
                      className="w-20 bg-zinc-900 border border-zinc-700 rounded-md px-3 py-1.5 text-sm tabular-nums focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                  <div className="flex gap-2 items-center">
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="bg-zinc-900 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-zinc-500"
                    >
                      <option value="">No category</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleEditSave(t)}
                      disabled={busy || !editTitle.trim() || editWeight === ""}
                      className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500 disabled:opacity-40"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleEditCancel}
                      className="px-3 py-1.5 rounded-md text-zinc-400 text-xs hover:text-zinc-100"
                    >
                      Cancel
                    </button>
                  </div>
                </li>
              ) : (
                // ── display mode ──
                <li key={t.id} className="flex items-center px-3 py-2 group">
                  <CategoryBadge category={t.category} />
                  <span className="flex-1">{t.title}</span>
                  <span className="text-sm tabular-nums w-8 text-right mr-4">{t.weight}</span>
                  <button
                    onClick={() => handleEditStart(t)}
                    disabled={busy}
                    className="text-xs text-zinc-600 hover:text-zinc-300 mr-3 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    edit
                  </button>
                  <button
                    onClick={() => handleDelete(t)}
                    className="text-xs text-zinc-500 hover:text-red-400"
                    disabled={busy}
                  >
                    remove
                  </button>
                </li>
              )
            )}
          </ul>
        )}
      </section>

      {/* ── Templates ── */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs uppercase tracking-wider text-zinc-500">Templates</h2>
          {day.tasks.length > 0 && !saving && (
            <button
              onClick={() => setSaving(true)}
              className="text-xs text-zinc-400 hover:text-zinc-100"
            >
              + Save current
            </button>
          )}
        </div>

        {saving && (
          <div className="flex gap-2 mb-3">
            <input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Template name"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSaveTemplate()}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-600"
            />
            <button
              onClick={handleSaveTemplate}
              disabled={!saveName.trim()}
              className="px-3 py-1.5 rounded-md bg-zinc-700 text-zinc-100 text-xs hover:bg-zinc-600 disabled:opacity-40"
            >
              Save
            </button>
            <button
              onClick={() => { setSaving(false); setSaveName(""); }}
              className="px-3 py-1.5 text-zinc-500 text-xs hover:text-zinc-300"
            >
              Cancel
            </button>
          </div>
        )}

        {templates.length === 0 ? (
          <div className="text-sm text-zinc-600 italic">No templates saved yet.</div>
        ) : (
          <ul className="divide-y divide-zinc-800 rounded-md border border-zinc-800">
            {templates.map((tpl) => (
              <li key={tpl.id} className="flex items-center px-3 py-2 gap-3">
                <span className="flex-1 text-sm text-zinc-300">{tpl.name}</span>
                <span className="text-xs text-zinc-600">{tpl.tasks.length} tasks</span>
                <button
                  onClick={() => handleLoadTemplate(tpl)}
                  disabled={busy}
                  className="text-xs text-zinc-400 hover:text-zinc-100 disabled:opacity-40"
                >
                  Load
                </button>
                <button
                  onClick={() => handleDeleteTemplate(tpl.id)}
                  className="text-xs text-zinc-600 hover:text-red-400"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Add task form ── */}
      <form onSubmit={handleAdd} className="space-y-2">
        <div className="flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task name"
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-zinc-600"
            disabled={busy}
          />
          <input
            type="number"
            min={1}
            value={weight}
            onChange={(e) => setWeight(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="pts"
            className="w-20 bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm tabular-nums focus:outline-none focus:border-zinc-600"
            disabled={busy}
          />
        </div>
        <div className="flex gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600"
            disabled={busy}
          >
            <option value="">No category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-zinc-100 text-zinc-900 text-sm font-medium hover:bg-white disabled:opacity-50"
            disabled={busy || !title.trim() || weight === "" || day.tasks.length >= 12}
          >
            Add
          </button>
        </div>
      </form>

      {err && <div className="text-sm text-red-400">{err}</div>}

      <div className="pt-4 border-t border-zinc-800">
        <button
          onClick={handleStart}
          disabled={!canStart || busy}
          className={
            "w-full py-3 rounded-md text-sm font-medium transition " +
            (canStart
              ? "bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
              : "bg-zinc-800 text-zinc-500 cursor-not-allowed")
          }
        >
          {canStart ? "Start day" : "Add at least one task to start"}
        </button>
      </div>
    </div>
  );
}

// ---------- active / locked ----------

function ActiveView({ day, onChange }: { day: Day; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showLockModal, setShowLockModal] = useState(false);
  const isLocked = day.status === "locked";

  async function toggle(t: Task) {
    if (isLocked) return;
    setBusy(true);
    setErr(null);
    try {
      await api.updateTask(t.id, { completed: !t.completed });
      onChange();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleLock(note: string) {
    setShowLockModal(false);
    setBusy(true);
    try {
      if (note.trim()) await api.saveNote(day.id, note.trim());
      await api.lockDay(day.id);
      onChange();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const score = day.tasks.filter((t) => t.completed).reduce((s, t) => s + t.weight, 0);
  const pct = day.total > 0 ? Math.round((score / day.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-zinc-500">
          {isLocked ? "Final score" : "Today"} · {day.date}
        </div>
        <div className="mt-1 flex items-baseline gap-3">
          <div
            className={
              "text-5xl font-semibold tabular-nums " +
              (pct >= 80 ? "text-emerald-400" : pct >= 50 ? "text-amber-400" : "text-zinc-100")
            }
          >
            {pct}%
          </div>
          <div className="text-zinc-500 text-xl tabular-nums">{score}/{day.total} pts</div>
          {isLocked && (
            <span className="text-xs text-zinc-500 px-2 py-1 rounded bg-zinc-900 border border-zinc-800">
              locked
            </span>
          )}
        </div>
      </div>

      <ul className="divide-y divide-zinc-800 rounded-md border border-zinc-800">
        {day.tasks.map((t) => (
          <li
            key={t.id}
            className={"flex items-center px-3 py-3 " + (t.completed ? "opacity-60" : "")}
          >
            <button
              onClick={() => toggle(t)}
              disabled={busy || isLocked}
              className={
                "w-5 h-5 mr-3 shrink-0 rounded border flex items-center justify-center transition " +
                (t.completed
                  ? "bg-emerald-500 border-emerald-500 text-zinc-950"
                  : "border-zinc-700 hover:border-zinc-500")
              }
              aria-label={t.completed ? "uncheck" : "check"}
            >
              {t.completed && (
                <svg viewBox="0 0 16 16" className="w-3 h-3" fill="currentColor">
                  <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                </svg>
              )}
            </button>
            <CategoryBadge category={t.category} />
            <span className={"flex-1 " + (t.completed ? "line-through" : "")}>
              {t.title}
            </span>
            <span className="text-sm tabular-nums w-8 text-right">{t.weight}</span>
          </li>
        ))}
      </ul>

      {err && <div className="text-sm text-red-400">{err}</div>}

      {!isLocked && (
        <div className="pt-4 border-t border-zinc-800">
          <button
            onClick={() => setShowLockModal(true)}
            disabled={busy}
            className="w-full py-3 rounded-md bg-zinc-800 text-zinc-200 text-sm hover:bg-zinc-700"
          >
            End day & lock score
          </button>
        </div>
      )}

      {isLocked && day.note && (
        <div className="rounded-md border border-zinc-800 bg-zinc-900/50 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">Reflection</div>
          <p className="text-sm text-zinc-300 leading-relaxed">{day.note}</p>
        </div>
      )}

      {showLockModal && (
        <LockModal onLock={handleLock} onCancel={() => setShowLockModal(false)} />
      )}
    </div>
  );
}

function LockModal({ onLock, onCancel }: { onLock: (note: string) => void; onCancel: () => void }) {
  const [note, setNote] = useState("");
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md p-6 space-y-4">
        <div>
          <div className="text-base font-semibold text-zinc-100">Lock today's score</div>
          <div className="text-sm text-zinc-500 mt-0.5">How did the day go? (optional)</div>
        </div>
        <textarea
          autoFocus
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Write a quick reflection — wins, blockers, how you felt…"
          rows={4}
          maxLength={500}
          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:border-zinc-500"
        />
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-100"
          >
            Cancel
          </button>
          <button
            onClick={() => onLock("")}
            className="px-4 py-2 text-sm rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          >
            Skip & lock
          </button>
          <button
            onClick={() => onLock(note)}
            disabled={!note.trim()}
            className="px-4 py-2 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-40"
          >
            Save & lock
          </button>
        </div>
      </div>
    </div>
  );
}
