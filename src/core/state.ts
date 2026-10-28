import type { Frequency } from "./life";
import type { Ritual, RitualCheckIn } from "./ritual";

export type ReflectionAnswer = "yes" | "mostly" | "not-really";
export type WorthIt = "yes" | "no" | "sometimes" | "unsure";

export type Profile = {
  birthDate: string;
  expectedLifespanYears: number;
  selectedValues: string[];
};

export type DailyReflection = {
  date: string;
  answer: ReflectionAnswer;
  tags: string[];
  note?: string;
};

export type CostItem = {
  id: string;
  title: string;
  durationMinutes: number;
  frequency: Frequency;
  worthIt: WorthIt;
};

export type FiniteState = {
  schemaVersion: 2;
  profile: Profile;
  costItems: CostItem[];
  reflections: DailyReflection[];
  rituals: Ritual[];
  ritualCheckIns: RitualCheckIn[];
};

export const FINITE_STORAGE_KEY = "finite.state.v1";

export function createInitialFiniteState(profile: Pick<Profile, "birthDate" | "expectedLifespanYears">): FiniteState {
  return {
    schemaVersion: 2,
    profile: {
      birthDate: profile.birthDate,
      expectedLifespanYears: profile.expectedLifespanYears,
      selectedValues: [],
    },
    costItems: [],
    reflections: [],
    rituals: [],
    ritualCheckIns: [],
  };
}

export function serializeFiniteState(state: FiniteState): string {
  return JSON.stringify(state);
}

export function deserializeFiniteState(value: string): FiniteState {
  const parsed = JSON.parse(value);
  if (!parsed || ![1, 2].includes(parsed.schemaVersion)) {
    throw new Error("Unsupported Finite state schema version");
  }
  if (parsed.schemaVersion === 1) return { ...parsed, schemaVersion: 2, rituals: [], ritualCheckIns: [] };
  if (!Array.isArray(parsed.rituals) || !Array.isArray(parsed.ritualCheckIns)) throw new Error("Invalid ritual data");
  return parsed as FiniteState;
}

export function addCostItem(state: FiniteState, item: Omit<CostItem, "id">): FiniteState {
  const id = `cost_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    ...state,
    costItems: [...state.costItems, { id, ...item }],
  };
}

export function upsertReflection(state: FiniteState, reflection: DailyReflection): FiniteState {
  const withoutSameDate = state.reflections.filter((existing) => existing.date !== reflection.date);
  return {
    ...state,
    reflections: [...withoutSameDate, reflection].sort((a, b) => a.date.localeCompare(b.date)),
  };
}

export function toggleValue(state: FiniteState, value: string): FiniteState {
  const selected = state.profile.selectedValues.includes(value)
    ? state.profile.selectedValues.filter((existing) => existing !== value)
    : [...state.profile.selectedValues, value];

  return {
    ...state,
    profile: {
      ...state.profile,
      selectedValues: selected,
    },
  };
}
