import { describe, expect, it } from "vitest";
import {
  calculateLifeCost,
  estimateLifeLedger,
  generateLifeMonths,
  type Frequency,
} from "./life";

describe("life core calculations", () => {
  it("estimates lived and remaining days from birth date and lifespan", () => {
    const ledger = estimateLifeLedger({
      birthDate: "1990-01-01",
      expectedLifespanYears: 80,
      today: "2020-01-01",
    });

    expect(ledger.daysLived).toBe(10957);
    expect(ledger.totalEstimatedDays).toBe(29220);
    expect(ledger.daysRemaining).toBe(18263);
    expect(ledger.weeksRemaining).toBe(2609);
    expect(ledger.percentLived).toBeCloseTo(37.5, 1);
  });

  it.each<[Frequency, number]>([
    ["daily", 30.42],
    ["weekdays", 21.75],
    ["weekly", 4.33],
    ["monthly", 1],
  ])("calculates annual life-cost days for %s habits", (frequency, expectedAnnualDays) => {
    const cost = calculateLifeCost({
      title: "Scrolling",
      durationMinutes: 120,
      frequency,
      years: 20,
    });

    expect(cost.daysPerYear).toBeCloseTo(expectedAnnualDays, 2);
  });

  it("calculates long-term cost without moral judgement", () => {
    const cost = calculateLifeCost({
      title: "Scrolling",
      durationMinutes: 120,
      frequency: "daily",
      years: 20,
    });

    expect(cost.daysOverYears).toBeCloseTo(608.33, 2);
    expect(cost.yearsOverYears).toBeCloseTo(1.67, 2);
    expect(cost.copy).toBe("That is 30.4 days per year. Over 20 years, that is 1.7 years of your life.");
  });

  it("generates Swift-portable month cells for the mortality calendar", () => {
    const months = generateLifeMonths({
      birthDate: "2000-01-15",
      expectedLifespanYears: 2,
      today: "2001-01-20",
    });

    expect(months).toHaveLength(24);
    expect(months.filter((month) => month.state === "past")).toHaveLength(12);
    expect(months.filter((month) => month.state === "current")).toHaveLength(1);
    expect(months[12]).toMatchObject({ index: 12, state: "current" });
  });
});
