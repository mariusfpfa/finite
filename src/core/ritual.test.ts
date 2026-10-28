import { describe, expect, it } from "vitest";
import {
  createInitialFiniteState,
  deserializeFiniteState,
  serializeFiniteState,
} from "./state";
import {
  addRitual,
  recordRitualCheckIn,
  setRitualArchived,
  summarizeRitual,
  localDateKey,
} from "./ritual";

const initial = () =>
  createInitialFiniteState({
    birthDate: "1990-01-01",
    expectedLifespanYears: 80,
  });
const withRitual = () =>
  addRitual(
    initial(),
    { title: "Floor time", value: "Family", targetMinutes: 45 },
    "2026-06-11",
  );

describe("protect a ritual", () => {
  it("migrates old data without inventing ritual check-ins", () => {
    const old = {
      ...initial(),
      schemaVersion: 1,
      rituals: undefined,
      ritualCheckIns: undefined,
      profile: {
        birthDate: "1990-01-01",
        expectedLifespanYears: 80,
        selectedValues: ["Family"],
      },
      reflections: [{ date: "2026-06-10", answer: "mostly", tags: [] }],
    };
    const migrated = deserializeFiniteState(JSON.stringify(old));
    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.rituals).toEqual([]);
    expect(migrated.ritualCheckIns).toEqual([]);
    expect(migrated.profile).toEqual(old.profile);
    expect(migrated.reflections).toEqual(old.reflections);
  });
  it("creates a value-linked ritual and round-trips it", () => {
    const state = withRitual();
    expect(state.rituals[0]).toMatchObject({
      title: "Floor time",
      value: "Family",
      targetMinutes: 45,
      archived: false,
      createdDate: "2026-06-11",
    });
    expect(deserializeFiniteState(serializeFiniteState(state))).toEqual(state);
  });
  it("upserts one check-in per ritual and local date", () => {
    const state = withRitual(),
      id = state.rituals[0].id;
    const yes = recordRitualCheckIn(state, id, "2026-06-11", "yes");
    expect(yes.ritualCheckIns[0].protectedMinutes).toBe(45);
    const part = recordRitualCheckIn(yes, id, "2026-06-11", "partly", 20);
    expect(part.ritualCheckIns).toHaveLength(1);
    expect(part.ritualCheckIns[0].protectedMinutes).toBe(20);
    expect(
      recordRitualCheckIn(part, id, "2026-06-11", "not-planned")
        .ritualCheckIns[0].protectedMinutes,
    ).toBe(0);
  });
  it("requires actual minutes for partial completion, never assumes half", () => {
    const state = withRitual(),
      id = state.rituals[0].id;
    for (const minutes of [undefined, 0, -1, 45, 46, 1.5, NaN])
      expect(() =>
        recordRitualCheckIn(state, id, "2026-06-11", "partly", minutes),
      ).toThrow();
  });
  it("summarizes only recorded days within the calendar week", () => {
    let state = withRitual();
    const id = state.rituals[0].id;
    state = recordRitualCheckIn(state, id, "2026-06-11", "yes");
    state = recordRitualCheckIn(state, id, "2026-06-12", "partly", 15);
    state = recordRitualCheckIn(state, id, "2026-06-13", "not-today");
    state = recordRitualCheckIn(state, id, "2026-06-14", "not-planned");
    const summary = summarizeRitual(state, id, "2026-06-14");
    expect(summary).toMatchObject({
      protectedMinutes: 60,
      loggedDays: 4,
      protectedDays: 2,
      notPlannedDays: 1,
    });
    expect(summarizeRitual(state, id, "2026-06-21").protectedMinutes).toBe(0);
  });
  it("archives without deleting history and permits resuming", () => {
    const state = withRitual(),
      id = state.rituals[0].id;
    const logged = recordRitualCheckIn(state, id, "2026-06-11", "yes");
    const archived = setRitualArchived(logged, id, true);
    expect(archived.ritualCheckIns).toEqual(logged.ritualCheckIns);
    expect(() =>
      recordRitualCheckIn(archived, id, "2026-06-12", "yes"),
    ).toThrow();
    expect(setRitualArchived(archived, id, false).rituals[0].archived).toBe(
      false,
    );
  });
  it("rejects invalid targets, unknown rituals and impossible dates", () => {
    for (const n of [0, -1, 1441, 2.5, NaN])
      expect(() =>
        addRitual(
          initial(),
          { title: "Walk", value: "Health", targetMinutes: n },
          "2026-06-11",
        ),
      ).toThrow();
    expect(() =>
      addRitual(
        initial(),
        { title: " ", value: "Health", targetMinutes: 10 },
        "2026-06-11",
      ),
    ).toThrow();
    expect(() =>
      recordRitualCheckIn(withRitual(), "unknown", "2026-06-11", "yes"),
    ).toThrow();
    const state = withRitual();
    expect(() =>
      recordRitualCheckIn(state, state.rituals[0].id, "2026-02-30", "yes"),
    ).toThrow();
  });
  it("uses local calendar dates instead of UTC dates", () => {
    const d = new Date(2026, 5, 11, 23, 59);
    expect(localDateKey(d)).toBe("2026-06-11");
  });
});
