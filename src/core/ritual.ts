import type { FiniteState } from "./state";

export type Ritual = {
  id: string;
  title: string;
  value: string;
  targetMinutes: number;
  cue: string;
  createdDate: string;
  archived: boolean;
};
export type RitualAnswer = "yes" | "partly" | "not-today" | "not-planned";
export type RitualCheckIn = {
  ritualId: string;
  date: string;
  answer: RitualAnswer;
  protectedMinutes: number;
};

export function localDateKey(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
function calendarDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new Error("Choose a valid date.");
  const date = new Date(`${value}T12:00:00Z`);
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  )
    throw new Error("Choose a valid date.");
  return date;
}
export function addRitual(
  state: FiniteState,
  input: { title: string; value: string; targetMinutes: number; cue?: string },
  date = localDateKey(),
): FiniteState {
  calendarDate(date);
  const title = input.title.trim(),
    value = input.value.trim(),
    cue = (input.cue ?? "").trim();
  if (!title || title.length > 100)
    throw new Error("Give your ritual a name (up to 100 characters).");
  if (!value || value.length > 60)
    throw new Error("Choose a value this ritual supports.");
  if (cue.length > 160)
    throw new Error("Keep your reminder under 160 characters.");
  if (
    !Number.isInteger(input.targetMinutes) ||
    input.targetMinutes < 1 ||
    input.targetMinutes > 1440
  )
    throw new Error("Choose between 1 and 1,440 whole minutes.");
  const ritual: Ritual = {
    id: crypto.randomUUID(),
    title,
    value,
    cue,
    targetMinutes: input.targetMinutes,
    createdDate: date,
    archived: false,
  };
  return { ...state, rituals: [...state.rituals, ritual] };
}
export function recordRitualCheckIn(
  state: FiniteState,
  ritualId: string,
  date: string,
  answer: RitualAnswer,
  minutes?: number,
): FiniteState {
  calendarDate(date);
  const ritual = state.rituals.find((r) => r.id === ritualId);
  if (!ritual || ritual.archived) throw new Error("Choose an active ritual.");
  if (date < ritual.createdDate)
    throw new Error("This ritual had not started yet.");
  if (!["yes", "partly", "not-today", "not-planned"].includes(answer))
    throw new Error("Choose a check-in option.");
  if (
    answer === "partly" &&
    (!Number.isInteger(minutes) ||
      minutes! <= 0 ||
      minutes! >= ritual.targetMinutes)
  )
    throw new Error(
      `Enter whole minutes between 1 and ${ritual.targetMinutes - 1}, or choose Yes for the full ritual.`,
    );
  const protectedMinutes =
    answer === "yes"
      ? ritual.targetMinutes
      : answer === "partly"
        ? minutes!
        : 0;
  const entry: RitualCheckIn = { ritualId, date, answer, protectedMinutes };
  return {
    ...state,
    ritualCheckIns: [
      ...state.ritualCheckIns.filter(
        (c) => !(c.ritualId === ritualId && c.date === date),
      ),
      entry,
    ],
  };
}
export function setRitualArchived(
  state: FiniteState,
  id: string,
  archived: boolean,
): FiniteState {
  if (!state.rituals.some((r) => r.id === id))
    throw new Error("Ritual not found.");
  return {
    ...state,
    rituals: state.rituals.map((r) => (r.id === id ? { ...r, archived } : r)),
  };
}
export function summarizeRitual(
  state: FiniteState,
  id: string,
  today = localDateKey(),
) {
  const end = calendarDate(today),
    start = new Date(end);
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
  const startKey = start.toISOString().slice(0, 10);
  const logs = state.ritualCheckIns.filter(
    (c) => c.ritualId === id && c.date >= startKey && c.date <= today,
  );
  return {
    protectedMinutes: logs.reduce((sum, c) => sum + c.protectedMinutes, 0),
    loggedDays: logs.length,
    protectedDays: logs.filter((c) => c.protectedMinutes > 0).length,
    notPlannedDays: logs.filter((c) => c.answer === "not-planned").length,
  };
}
