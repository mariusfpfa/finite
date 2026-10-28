import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import FiniteApp from "./finite-app";

const legacy = {
  schemaVersion: 1,
  profile: {
    birthDate: "1990-01-01",
    expectedLifespanYears: 80,
    selectedValues: ["Family", "Health"],
  },
  costItems: [
    {
      id: "walk",
      title: "Evening walk",
      durationMinutes: 30,
      frequency: "daily",
      worthIt: "yes",
    },
  ],
  reflections: [{ date: "2026-06-10", answer: "mostly", tags: [] }],
};
function createRitual() {
  fireEvent.click(screen.getByRole("button", { name: "Create a ritual" }));
  fireEvent.change(screen.getByLabelText("What do you want to protect?"), {
    target: { value: "Floor time" },
  });
  fireEvent.change(screen.getByLabelText("Minutes to make room for"), {
    target: { value: "45" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Protect this ritual" }));
  return within(screen.getByRole("article", { name: "Floor time" }));
}
describe("ritual journey", () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
    vi.setSystemTime(new Date("2026-06-11T12:00:00Z"));
    localStorage.setItem("finite.state.v1", JSON.stringify(legacy));
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });
  it("creates, logs partial minutes, replaces a check-in and reloads without losing old data", () => {
    const first = render(<FiniteApp />);
    const card = createRitual();
    fireEvent.click(card.getByRole("button", { name: "Partly" }));
    fireEvent.change(card.getByLabelText("How many minutes did you protect?"), {
      target: { value: "20" },
    });
    fireEvent.click(card.getByRole("button", { name: "Save minutes" }));
    expect(
      card.getByText("20 minutes protected", { selector: "strong" }),
    ).toBeInTheDocument();
    fireEvent.click(card.getByRole("button", { name: "Yes" }));
    expect(
      card.getByText("45 minutes protected", { selector: "strong" }),
    ).toBeInTheDocument();
    let stored = JSON.parse(localStorage.getItem("finite.state.v1")!);
    expect(stored.ritualCheckIns).toHaveLength(1);
    expect(stored.reflections).toEqual(legacy.reflections);
    expect(stored.costItems).toEqual(legacy.costItems);
    first.unmount();
    render(<FiniteApp />);
    const reloaded = within(
      screen.getByRole("article", { name: "Floor time" }),
    );
    expect(reloaded.getByRole("button", { name: "Yes" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(reloaded.getByRole("button", { name: "Not planned" }));
    expect(
      reloaded.getByText("0 minutes protected", { selector: "strong" }),
    ).toBeInTheDocument();
    expect(reloaded.getByRole("status")).toHaveTextContent(
      "nothing to catch up on",
    );
    stored = JSON.parse(localStorage.getItem("finite.state.v1")!);
    expect(stored.ritualCheckIns).toHaveLength(1);
  });
  it("copies a saved activity, uses a selected value, and preserves paused history", () => {
    render(<FiniteApp />);
    fireEvent.click(screen.getByRole("button", { name: "Create a ritual" }));
    fireEvent.change(screen.getByLabelText(/Start from a saved activity/), {
      target: { value: "walk" },
    });
    expect(screen.getByLabelText("Minutes to make room for")).toHaveValue(30);
    fireEvent.change(screen.getByLabelText("Which value does it support?"), {
      target: { value: "Health" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Protect this ritual" }),
    );
    const card = within(screen.getByRole("article", { name: "Evening walk" }));
    fireEvent.click(card.getByRole("button", { name: "Yes" }));
    fireEvent.click(card.getByRole("button", { name: "Pause Evening walk" }));
    expect(
      screen.queryByRole("article", { name: "Evening walk" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Paused rituals (1)"));
    fireEvent.click(
      screen.getByRole("button", { name: "Resume Evening walk" }),
    );
    expect(
      within(screen.getByRole("article", { name: "Evening walk" })).getByText(
        "30 minutes protected",
        { selector: "strong" },
      ),
    ).toBeInTheDocument();
  });
});
