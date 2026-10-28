import { useState } from "react";
import type { FiniteState } from "@/core/state";
import {
  addRitual,
  recordRitualCheckIn,
  setRitualArchived,
  summarizeRitual,
  type Ritual,
  type RitualAnswer,
} from "@/core/ritual";

const inputClass =
  "min-w-0 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800";
const answers: [RitualAnswer, string][] = [
  ["yes", "Yes"],
  ["partly", "Partly"],
  ["not-today", "Not today"],
  ["not-planned", "Not planned"],
];

export default function RitualPanel({
  state,
  onChange,
  today,
  valueOptions,
}: {
  state: FiniteState;
  onChange: (state: FiniteState) => void;
  today: string;
  valueOptions: string[];
}) {
  const [creating, setCreating] = useState(false);
  const active = state.rituals.filter((r) => !r.archived),
    paused = state.rituals.filter((r) => r.archived);
  return (
    <section
      className="rounded-[2rem] border border-emerald-900/10 bg-[#edf2e8] p-5 shadow-sm sm:p-8"
      aria-labelledby="rituals-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-900">
            A little time, deliberately yours
          </p>
          <h2
            id="rituals-heading"
            className="mt-3 text-3xl font-semibold tracking-tight"
          >
            Protect a ritual.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-stone-700">
            Not another thing to get right. A little room for something that
            matters.
          </p>
        </div>
        {!creating && active.length > 0 && (
          <button
            className="min-h-11 rounded-xl border border-emerald-900/30 px-4 py-2 text-sm font-semibold text-emerald-950"
            onClick={() => setCreating(true)}
          >
            Add a ritual
          </button>
        )}
      </div>
      {!active.length && !creating && (
        <div className="mt-6 rounded-2xl border border-emerald-900/10 bg-white/70 p-5 sm:p-6">
          <p className="text-lg font-medium">
            What would you like to make room for?
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Uninterrupted floor time. A walk outside. Reading before bed. Choose
            your own amount of time—small is welcome.
          </p>
          <button
            className="mt-5 min-h-12 rounded-xl bg-emerald-900 px-5 py-3 font-semibold text-white hover:bg-emerald-950"
            onClick={() => setCreating(true)}
          >
            Create a ritual
          </button>
        </div>
      )}
      {creating && (
        <RitualForm
          state={state}
          today={today}
          values={
            state.profile.selectedValues.length
              ? state.profile.selectedValues
              : valueOptions
          }
          onCancel={() => setCreating(false)}
          onSave={(next) => {
            onChange(next);
            setCreating(false);
          }}
        />
      )}
      <div className="mt-6 grid gap-4">
        {active.map((ritual) => (
          <RitualCard
            key={ritual.id + today}
            ritual={ritual}
            state={state}
            today={today}
            onChange={onChange}
          />
        ))}
      </div>
      {!!paused.length && (
        <details className="mt-5 rounded-xl border border-emerald-900/15 p-4">
          <summary className="cursor-pointer py-2 text-sm font-semibold text-emerald-950">
            Paused rituals ({paused.length})
          </summary>
          <p className="mt-2 text-xs leading-5 text-stone-600">
            Your past check-ins are kept. Resume whenever it suits your season.
          </p>
          {paused.map((r) => (
            <div
              className="mt-4 flex items-center justify-between gap-4"
              key={r.id}
            >
              <span className="min-w-0 break-words text-sm">{r.title}</span>
              <button
                className="min-h-11 shrink-0 rounded-lg border border-emerald-900/30 px-3 text-sm font-semibold"
                aria-label={`Resume ${r.title}`}
                onClick={() => onChange(setRitualArchived(state, r.id, false))}
              >
                Resume
              </button>
            </div>
          ))}
        </details>
      )}
    </section>
  );
}

function RitualForm({
  state,
  today,
  values,
  onSave,
  onCancel,
}: {
  state: FiniteState;
  today: string;
  values: string[];
  onSave: (s: FiniteState) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(""),
    [minutes, setMinutes] = useState("20"),
    [value, setValue] = useState(values[0] ?? ""),
    [cue, setCue] = useState(""),
    [error, setError] = useState("");
  return (
    <form
      aria-label="Create a ritual"
      className="mt-6 grid gap-4 rounded-2xl bg-white p-5 sm:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        try {
          onSave(
            addRitual(
              state,
              { title, value, targetMinutes: Number(minutes), cue },
              today,
            ),
          );
        } catch (e) {
          setError(
            e instanceof Error ? e.message : "Could not save this ritual.",
          );
        }
      }}
    >
      {!!state.costItems.length && (
        <label className="grid gap-2 text-sm font-medium">
          Start from a saved activity (optional)
          <select
            className={inputClass}
            defaultValue=""
            onChange={(e) => {
              const item = state.costItems.find((i) => i.id === e.target.value);
              if (item) {
                setTitle(item.title);
                setMinutes(String(item.durationMinutes));
              }
            }}
          >
            <option value="">Create something new</option>
            {state.costItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
          <span className="text-xs font-normal text-stone-600">
            Copies its name and minutes. Your original calculation stays
            unchanged.
          </span>
        </label>
      )}
      <label className="grid gap-2 text-sm font-medium">
        What do you want to protect?
        <input
          autoFocus
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={100}
          placeholder="Uninterrupted time with my family"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Minutes to make room for
          <input
            className={inputClass}
            type="number"
            inputMode="numeric"
            min={1}
            max={1440}
            step={1}
            required
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Which value does it support?
          <select
            className={inputClass}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
          >
            {values.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="grid gap-2 text-sm font-medium">
        A moment to anchor it (optional)
        <input
          className={inputClass}
          value={cue}
          onChange={(e) => setCue(e.target.value)}
          maxLength={160}
          placeholder="After dinner, with my phone in another room"
        />
      </label>
      <p className="text-xs leading-5 text-stone-600">
        Check in on days that make sense for you. There is no schedule to fail
        or streak to lose.
      </p>
      {error && (
        <p role="alert" className="text-sm text-red-800">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          className="min-h-12 rounded-xl bg-emerald-900 px-5 py-3 font-semibold text-white"
          type="submit"
        >
          Protect this ritual
        </button>
        <button
          className="min-h-12 rounded-xl border border-stone-300 px-5 py-3 text-sm"
          type="button"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function RitualCard({
  state,
  ritual,
  today,
  onChange,
}: {
  state: FiniteState;
  ritual: Ritual;
  today: string;
  onChange: (s: FiniteState) => void;
}) {
  const entry = state.ritualCheckIns.find(
    (c) => c.ritualId === ritual.id && c.date === today,
  );
  const summary = summarizeRitual(state, ritual.id, today);
  const [partial, setPartial] = useState(false),
    [minutes, setMinutes] = useState(""),
    [error, setError] = useState("");
  function save(answer: RitualAnswer, amount?: number) {
    try {
      onChange(recordRitualCheckIn(state, ritual.id, today, answer, amount));
      setPartial(false);
      setError("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not save your check-in.",
      );
    }
  }
  const recent = state.ritualCheckIns
    .filter((c) => c.ritualId === ritual.id)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);
  return (
    <article
      aria-label={ritual.title}
      className="min-w-0 rounded-2xl border border-stone-200 bg-white p-5 sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-900">
            {ritual.value} · {ritual.targetMinutes} min
          </span>
          <h3 className="mt-3 break-words text-xl font-semibold">
            {ritual.title}
          </h3>
          {ritual.cue && (
            <p className="mt-2 break-words text-sm leading-6 text-stone-600">
              {ritual.cue}
            </p>
          )}
        </div>
        <button
          className="min-h-11 shrink-0 px-2 text-xs text-stone-600 underline underline-offset-4"
          aria-label={`Pause ${ritual.title}`}
          onClick={() => onChange(setRitualArchived(state, ritual.id, true))}
        >
          Pause
        </button>
      </div>
      <fieldset className="mt-6">
        <legend className="text-sm font-medium">
          Did you protect your {ritual.targetMinutes} minutes today?
        </legend>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {answers.map(([answer, label]) => (
            <button
              key={answer}
              type="button"
              aria-pressed={entry?.answer === answer}
              disabled={answer === "partly" && ritual.targetMinutes < 2}
              className={`min-h-12 rounded-xl border px-3 py-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 disabled:opacity-50 ${entry?.answer === answer ? "border-emerald-900 bg-emerald-900 text-white" : "border-stone-300 text-stone-700 hover:bg-stone-50"}`}
              onClick={() => {
                if (answer === "partly") {
                  setPartial(true);
                  setMinutes(
                    entry?.answer === "partly"
                      ? String(entry.protectedMinutes)
                      : "",
                  );
                } else save(answer);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>
      {partial && (
        <form
          className="mt-4 grid gap-3 rounded-xl bg-stone-50 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            save("partly", Number(minutes));
          }}
        >
          <label className="grid gap-2 text-sm">
            How many minutes did you protect?
            <input
              autoFocus
              className={inputClass}
              type="number"
              inputMode="numeric"
              min={1}
              max={ritual.targetMinutes - 1}
              step={1}
              required
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
          </label>
          <button className="min-h-12 rounded-xl bg-emerald-900 px-4 py-3 text-sm font-semibold text-white">
            Save minutes
          </button>
          <button
            type="button"
            className="min-h-12 rounded-xl px-3 py-3 text-sm"
            onClick={() => setPartial(false)}
          >
            Cancel
          </button>
        </form>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-800">
          {error}
        </p>
      )}
      <p role="status" className="mt-4 text-sm leading-6 text-stone-600">
        {entry
          ? entry.answer === "yes" || entry.answer === "partly"
            ? `${entry.protectedMinutes} minutes noted for today. A little room for ${ritual.value.toLowerCase()}.`
            : entry.answer === "not-planned"
              ? "Not planned today. There is nothing to catch up on."
              : "Noted. Today needed something else. You can begin again whenever you choose."
          : "No check-in yet. An unlogged day is unknown, not a missed day."}
      </p>
      <div className="mt-5 border-t border-stone-200 pt-4">
        <p className="text-sm">
          <strong className="text-emerald-950">
            {summary.protectedMinutes} minutes protected
          </strong>{" "}
          this week{" "}
          <span className="text-stone-500">
            · {summary.loggedDays} {summary.loggedDays === 1 ? "day" : "days"}{" "}
            logged
          </span>
        </p>
        <p className="mt-2 text-xs leading-5 text-stone-500">
          Monday–today. Self-reported: Yes counts your planned minutes; Partly
          counts the minutes you enter. Not planned is not a failure.
        </p>
      </div>
      {!!recent.length && (
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer py-2 text-stone-700">
            Recent check-ins
          </summary>
          <ul className="mt-2 space-y-2">
            {recent.map((c) => (
              <li
                key={c.date}
                className="flex flex-wrap justify-between gap-2 border-b border-stone-100 py-2 text-xs text-stone-600"
              >
                <time dateTime={c.date}>{c.date}</time>
                <span>
                  {c.answer === "not-planned"
                    ? "Not planned"
                    : c.answer === "not-today"
                      ? "Not today"
                      : `${c.protectedMinutes} minutes protected`}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}
