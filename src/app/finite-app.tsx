"use client";

import { FormEvent, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  calculateLifeCost,
  estimateLifeBattery,
  estimateLifeLedger,
  formatRemainingSeconds,
  generateLifeMonths,
  type Frequency,
} from "@/core/life";
import {
  FINITE_STORAGE_KEY,
  addCostItem,
  createInitialFiniteState,
  deserializeFiniteState,
  serializeFiniteState,
  toggleValue,
  upsertReflection,
  type FiniteState,
  type ReflectionAnswer,
  type WorthIt,
} from "@/core/state";

import RitualPanel from "./ritual-panel";
import { localDateKey } from "@/core/ritual";

type Tab = "today" | "life" | "costs" | "values";

const VALUE_OPTIONS = ["Family", "Health", "Love", "Creating", "Learning", "Freedom", "Friendship", "Rest", "Adventure", "Peace"];
const TAG_OPTIONS = ["Work", "Family", "Health", "Learning", "Love", "Rest", "Distraction", "Worry", "Meaningful progress"];
const subscribeToLocalState = () => () => {};
const emptyServerSnapshot = () => null;

function todayKey() {
  return localDateKey();
}

function useCurrentTime() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return now;
}

let lastStoredValue: string | null = null;
let lastStoredState: FiniteState | null = null;

function getLocalStateSnapshot(): FiniteState | null {
  if (typeof window === "undefined") return null;
  const saved = window.localStorage.getItem(FINITE_STORAGE_KEY);
  if (saved === lastStoredValue) return lastStoredState;
  lastStoredValue = saved;
  lastStoredState = saved ? deserializeFiniteState(saved) : null;
  return lastStoredState;
}

function saveState(state: FiniteState) {
  const serialized = serializeFiniteState(state);
  lastStoredValue = serialized;
  lastStoredState = state;
  window.localStorage.setItem(FINITE_STORAGE_KEY, serialized);
}

export default function FiniteApp() {
  const storedState = useSyncExternalStore(subscribeToLocalState, getLocalStateSnapshot, emptyServerSnapshot);
  const [draftState, setDraftState] = useState<FiniteState | null>(null);
  const state = draftState ?? storedState;
  const [activeTab, setActiveTab] = useState<Tab>("today");
  const [birthDate, setBirthDate] = useState("");
  const [lifespan, setLifespan] = useState(80);
  const now = useCurrentTime();

  useEffect(() => {
    if (state) saveState(state);
  }, [state]);

  function updateState(next: FiniteState) {
    setDraftState(next);
  }

  if (!state) {
    return (
      <main className="min-h-screen bg-[#17130f] px-5 py-8 text-stone-100 sm:px-8">
        <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col justify-center">
          <p className="mb-4 text-sm uppercase tracking-[0.45em] text-amber-300/80">Finite</p>
          <h1 className="max-w-2xl text-5xl font-semibold tracking-tight sm:text-7xl">Finite</h1>
          <p className="mt-5 max-w-xl text-xl leading-8 text-stone-300">Your time is your life. See where it goes.</p>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-stone-300">
            Time is not something you have. Time is something you spend. This app gives you perspective without judgement.
          </p>

          <form
            className="mt-10 grid gap-4 rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/30 sm:grid-cols-[1fr_160px_auto]"
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              if (!birthDate) return;
              updateState(createInitialFiniteState({ birthDate, expectedLifespanYears: lifespan }));
            }}
          >
            <label className="grid gap-2 text-sm text-stone-300">
              Date of birth
              <input
                required
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-base text-white outline-none ring-amber-300/30 focus:ring-4"
                type="date"
                value={birthDate}
                onChange={(event) => setBirthDate(event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm text-stone-300">
              Lifespan
              <input
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-base text-white outline-none ring-amber-300/30 focus:ring-4"
                min={1}
                max={130}
                type="number"
                value={lifespan}
                onChange={(event) => setLifespan(Number(event.target.value))}
              />
            </label>
            <button className="self-end rounded-2xl bg-amber-300 px-6 py-3 font-semibold text-stone-950 transition hover:bg-amber-200">
              Enter Finite
            </button>
          </form>
          <p className="mt-4 text-sm text-stone-500">This is not a prediction. It is perspective.</p>
        </section>
      </main>
    );
  }

  const ledger = estimateLifeLedger({
    birthDate: state.profile.birthDate,
    expectedLifespanYears: state.profile.expectedLifespanYears,
  });
  const battery = estimateLifeBattery({
    birthDate: state.profile.birthDate,
    expectedLifespanYears: state.profile.expectedLifespanYears,
    now: now.toISOString(),
  });

  return (
    <main className="min-h-screen bg-[#f3eee4] text-stone-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="rounded-[2rem] bg-[#17130f] p-6 text-stone-100 shadow-xl shadow-stone-300/50 sm:p-8">
          <p className="text-sm uppercase tracking-[0.4em] text-amber-300">Finite</p>
          <div className="mt-5 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-6xl">Spend your life like it matters.</h1>
              <p className="mt-4 max-w-2xl text-stone-300">Estimated days remaining: <strong className="text-amber-200">{ledger.daysRemaining.toLocaleString()}</strong>. Spend them like they matter.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.07] p-5 text-right">
              <p className="text-4xl font-semibold text-amber-200">{ledger.percentLived.toFixed(1)}%</p>
              <p className="text-sm text-stone-400">estimated life spent</p>
            </div>
          </div>
          <LifeBattery battery={battery} />
        </header>

        <nav aria-label="Main sections" className="grid grid-cols-4 gap-2 rounded-3xl bg-white/70 p-2 shadow-sm">
          {(["today", "life", "costs", "values"] as Tab[]).map((tab) => (
            <button
              key={tab}
              className={`rounded-2xl px-3 py-3 text-sm font-semibold capitalize transition ${activeTab === tab ? "bg-stone-950 text-white" : "text-stone-600 hover:bg-stone-100"}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>

        {activeTab === "today" && <>
          <RitualPanel state={state} onChange={updateState} today={localDateKey(now)} valueOptions={VALUE_OPTIONS} />
          <TodayPanel state={state} onChange={updateState} />
        </>}
        {activeTab === "life" && <LifePanel state={state} ledger={ledger} />}
        {activeTab === "costs" && <CostsPanel state={state} onChange={updateState} />}
        {activeTab === "values" && <ValuesPanel state={state} onChange={updateState} />}
      </div>
    </main>
  );
}

function LifeBattery({ battery }: { battery: ReturnType<typeof estimateLifeBattery> }) {
  const remainingPercent = Math.max(0, Math.min(100, battery.percentRemaining));

  return (
    <section className="mt-8 rounded-[1.75rem] border border-white/10 bg-black/20 p-4 sm:p-5" aria-label="Life battery">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-amber-300">Life battery</p>
          <p className="mt-2 text-stone-300">Discharging in real time. Every second is part of the battery.</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-sm text-stone-400">Seconds remaining</p>
          <p data-testid="life-seconds-countdown" className="font-mono text-3xl font-semibold text-amber-200 sm:text-4xl">
            {formatRemainingSeconds(battery.secondsRemaining)}
          </p>
        </div>
      </div>
      <div className="mt-5 rounded-2xl border border-white/15 bg-stone-950 p-2">
        <div className="relative h-10 overflow-hidden rounded-xl bg-stone-800">
          <div
            className="absolute inset-y-0 left-0 rounded-xl bg-gradient-to-r from-emerald-400 via-amber-300 to-red-400 transition-[width] duration-700 ease-linear"
            style={{ width: `${remainingPercent}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center font-mono text-sm font-semibold text-white drop-shadow">
            {remainingPercent.toFixed(6)}% remaining
          </div>
        </div>
      </div>
      <p className="mt-3 text-sm text-stone-500">Not a prediction — a visceral clock for perspective.</p>
    </section>
  );
}

function Panel({ children, title, intro }: { children: React.ReactNode; title: string; intro: string }) {
  return (
    <section className="rounded-[2rem] bg-white p-5 shadow-xl shadow-stone-300/40 sm:p-8">
      <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-2xl text-stone-600">{intro}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function TodayPanel({ state, onChange }: { state: FiniteState; onChange: (state: FiniteState) => void }) {
  const today = todayKey();
  const reflection = state.reflections.find((item) => item.date === today);

  function answer(answer: ReflectionAnswer) {
    onChange(upsertReflection(state, { date: today, answer, tags: reflection?.tags ?? [], note: reflection?.note }));
  }

  return (
    <Panel title="Today cost one day of your life." intro="Did you spend it in a way you respect? Not perfect. Just conscious.">
      <div className="grid gap-3 sm:grid-cols-3">
        {(["yes", "mostly", "not-really"] as ReflectionAnswer[]).map((option) => (
          <button key={option} className="rounded-2xl border border-stone-200 px-4 py-4 text-left font-semibold hover:border-stone-950" onClick={() => answer(option)}>
            {option === "not-really" ? "Not really" : option[0].toUpperCase() + option.slice(1)}
          </button>
        ))}
      </div>
      {reflection && <p className="mt-5 rounded-2xl bg-amber-50 px-4 py-3 text-amber-950">Today was marked {reflection.answer.replace("-", " ")}.</p>}
      <div className="mt-6 flex flex-wrap gap-2">
        {TAG_OPTIONS.map((tag) => <span key={tag} className="rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-600">{tag}</span>)}
      </div>
    </Panel>
  );
}

function LifePanel({ state, ledger }: { state: FiniteState; ledger: ReturnType<typeof estimateLifeLedger> }) {
  const months = useMemo(() => generateLifeMonths({ birthDate: state.profile.birthDate, expectedLifespanYears: state.profile.expectedLifespanYears }), [state.profile.birthDate, state.profile.expectedLifespanYears]);

  return (
    <Panel title="You are here." intro="A month-by-month view of one possible life. It is not a prediction. It is perspective.">
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Days lived" value={ledger.daysLived.toLocaleString()} />
        <Metric label="Days remaining" value={ledger.daysRemaining.toLocaleString()} />
        <Metric label="Weeks remaining" value={ledger.weeksRemaining.toLocaleString()} />
      </div>
      <div className="mt-8 grid grid-cols-12 gap-1 sm:grid-cols-24">
        {months.map((month) => <span key={month.index} title={`${month.year}-${String(month.month).padStart(2, "0")}`} className={`aspect-square rounded-[3px] ${month.state === "past" ? "bg-stone-900" : month.state === "current" ? "bg-amber-400 ring-2 ring-amber-700" : "bg-stone-200"}`} />)}
      </div>
    </Panel>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-3xl bg-stone-100 p-5"><p className="text-3xl font-semibold">{value}</p><p className="mt-1 text-sm text-stone-500">{label}</p></div>;
}

function CostsPanel({ state, onChange }: { state: FiniteState; onChange: (state: FiniteState) => void }) {
  const [title, setTitle] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [frequency, setFrequency] = useState<Frequency>("daily");
  const [worthIt, setWorthIt] = useState<WorthIt>("sometimes");
  const years = Math.max(1, Math.ceil(estimateLifeLedger({ birthDate: state.profile.birthDate, expectedLifespanYears: state.profile.expectedLifespanYears }).daysRemaining / 365));
  const preview = calculateLifeCost({ title: title || "This", durationMinutes, frequency, years });

  return (
    <Panel title="Life cost calculator" intro="Name a recurring choice. The app shows the cost. You decide whether it is worth it.">
      <form className="grid gap-4 rounded-3xl bg-stone-50 p-4 sm:grid-cols-[1fr_140px_160px_160px_auto]" onSubmit={(event) => { event.preventDefault(); if (!title.trim()) return; onChange(addCostItem(state, { title: title.trim(), durationMinutes, frequency, worthIt })); setTitle(""); }}>
        <label className="grid gap-2 text-sm text-stone-600">What are you spending time on?
          <input className="rounded-2xl border border-stone-200 px-4 py-3 text-base" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Scrolling" />
        </label>
        <label className="grid gap-2 text-sm text-stone-600">Minutes
          <input className="rounded-2xl border border-stone-200 px-4 py-3 text-base" min={1} type="number" value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))} />
        </label>
        <label className="grid gap-2 text-sm text-stone-600">Frequency
          <select className="rounded-2xl border border-stone-200 px-4 py-3 text-base" value={frequency} onChange={(event) => setFrequency(event.target.value as Frequency)}>
            <option value="daily">Daily</option><option value="weekdays">Weekdays</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm text-stone-600">Worth it?
          <select className="rounded-2xl border border-stone-200 px-4 py-3 text-base" value={worthIt} onChange={(event) => setWorthIt(event.target.value as WorthIt)}>
            <option value="yes">Yes</option><option value="no">No</option><option value="sometimes">Sometimes</option><option value="unsure">I’m not sure</option>
          </select>
        </label>
        <button className="self-end rounded-2xl bg-stone-950 px-5 py-3 font-semibold text-white">Save cost</button>
      </form>
      <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-amber-950">{preview.copy}</p>
      <div className="mt-6 grid gap-3">
        {state.costItems.map((item) => {
          const cost = calculateLifeCost({ ...item, years });
          return <article key={item.id} className="rounded-3xl border border-stone-200 p-4"><h3 className="font-semibold">{item.title}</h3><p className="mt-1 text-stone-600">{cost.copy}</p><p className="mt-2 text-sm text-stone-500">Worth it: {item.worthIt}</p></article>;
        })}
      </div>
    </Panel>
  );
}

function ValuesPanel({ state, onChange }: { state: FiniteState; onChange: (state: FiniteState) => void }) {
  return (
    <Panel title="What is worth spending life on?" intro="Choose the values that make time feel respected." >
      <div data-testid="values-panel" className="flex flex-wrap gap-2">
        {VALUE_OPTIONS.map((value) => {
          const selected = state.profile.selectedValues.includes(value);
          return <button key={value} aria-pressed={selected} className={`rounded-full border px-4 py-2 font-medium ${selected ? "border-stone-950 bg-stone-950 text-white" : "border-stone-200 bg-white text-stone-700"}`} onClick={() => onChange(toggleValue(state, value))}>{value}</button>;
        })}
      </div>
    </Panel>
  );
}
