import { describe, expect, it } from "vitest";
import {
  createInitialFiniteState,
  deserializeFiniteState,
  serializeFiniteState,
  toggleValue,
  upsertReflection,
  type FiniteState,
} from "./state";

describe("finite state model", () => {
  it("creates a local-first state object with stable schema version", () => {
    const state = createInitialFiniteState({
      birthDate: "1990-01-01",
      expectedLifespanYears: 85,
    });

    expect(state.schemaVersion).toBe(2);
    expect(state.profile.birthDate).toBe("1990-01-01");
    expect(state.profile.expectedLifespanYears).toBe(85);
    expect(state.costItems).toEqual([]);
    expect(state.reflections).toEqual([]);
  });

  it("serializes and deserializes through JSON so Swift can mirror the model later", () => {
    const state: FiniteState = {
      ...createInitialFiniteState({ birthDate: "1990-01-01", expectedLifespanYears: 80 }),
      profile: {
        birthDate: "1990-01-01",
        expectedLifespanYears: 80,
        selectedValues: ["Family", "Health"],
      },
      costItems: [
        {
          id: "cost_1",
          title: "Social media",
          durationMinutes: 120,
          frequency: "daily",
          worthIt: "sometimes",
        },
      ],
    };

    expect(deserializeFiniteState(serializeFiniteState(state))).toEqual(state);
  });

  it("upserts one reflection per day", () => {
    const state = createInitialFiniteState({ birthDate: "1990-01-01", expectedLifespanYears: 80 });
    const first = upsertReflection(state, {
      date: "2026-06-11",
      answer: "mostly",
      tags: ["Family"],
      note: "Dinner together",
    });
    const second = upsertReflection(first, {
      date: "2026-06-11",
      answer: "yes",
      tags: ["Health"],
      note: "Walked outside",
    });

    expect(second.reflections).toHaveLength(1);
    expect(second.reflections[0]).toMatchObject({ answer: "yes", tags: ["Health"] });
  });

  it("toggles values without duplicates", () => {
    const state = createInitialFiniteState({ birthDate: "1990-01-01", expectedLifespanYears: 80 });

    expect(toggleValue(state, "Family").profile.selectedValues).toEqual(["Family"]);
    expect(toggleValue(toggleValue(state, "Family"), "Family").profile.selectedValues).toEqual([]);
  });
});
