export type Frequency = "daily" | "weekdays" | "weekly" | "monthly";

export type LifeLedgerInput = {
  birthDate: string;
  expectedLifespanYears: number;
  today?: string;
};

export type LifeLedger = {
  daysLived: number;
  daysRemaining: number;
  weeksRemaining: number;
  totalEstimatedDays: number;
  percentLived: number;
};

export type LifeCostInput = {
  title: string;
  durationMinutes: number;
  frequency: Frequency;
  years: number;
};

export type LifeCost = {
  daysPerYear: number;
  daysOverYears: number;
  yearsOverYears: number;
  copy: string;
};

export type LifeMonthCell = {
  index: number;
  year: number;
  month: number;
  state: "past" | "current" | "future";
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_PER_YEAR = 365.25;

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    throw new Error(`Invalid date: ${value}`);
  }
  return new Date(Date.UTC(year, month - 1, day));
}

function dateOnlyFromDate(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function todayDateOnly(today?: string): Date {
  return today ? parseDateOnly(today) : dateOnlyFromDate(new Date());
}

export function estimateLifeLedger(input: LifeLedgerInput): LifeLedger {
  const birth = parseDateOnly(input.birthDate);
  const current = todayDateOnly(input.today);
  const totalEstimatedDays = Math.round(input.expectedLifespanYears * DAYS_PER_YEAR);
  const daysLived = Math.max(0, Math.floor((current.getTime() - birth.getTime()) / MS_PER_DAY));
  const daysRemaining = Math.max(0, totalEstimatedDays - daysLived);

  return {
    daysLived,
    daysRemaining,
    weeksRemaining: Math.floor(daysRemaining / 7),
    totalEstimatedDays,
    percentLived: totalEstimatedDays === 0 ? 0 : (daysLived / totalEstimatedDays) * 100,
  };
}

function yearlyOccurrences(frequency: Frequency): number {
  switch (frequency) {
    case "daily":
      return 365;
    case "weekdays":
      return 261;
    case "weekly":
      return 52;
    case "monthly":
      return 12;
  }
}

function formatNumber(value: number, digits = 1): string {
  return value.toFixed(digits).replace(/\.0$/, "");
}

export function calculateLifeCost(input: LifeCostInput): LifeCost {
  const daysPerYear = (input.durationMinutes * yearlyOccurrences(input.frequency)) / 60 / 24;
  const daysOverYears = daysPerYear * input.years;
  const yearsOverYears = daysOverYears / 365;

  return {
    daysPerYear,
    daysOverYears,
    yearsOverYears,
    copy: `That is ${formatNumber(daysPerYear)} days per year. Over ${input.years} years, that is ${formatNumber(yearsOverYears)} years of your life.`,
  };
}

export function generateLifeMonths(input: LifeLedgerInput): LifeMonthCell[] {
  const birth = parseDateOnly(input.birthDate);
  const current = todayDateOnly(input.today);
  const totalMonths = Math.max(0, Math.round(input.expectedLifespanYears * 12));
  const currentIndex = Math.max(
    0,
    (current.getUTCFullYear() - birth.getUTCFullYear()) * 12 + current.getUTCMonth() - birth.getUTCMonth(),
  );

  return Array.from({ length: totalMonths }, (_, index) => {
    const absoluteMonth = birth.getUTCMonth() + index;
    const year = birth.getUTCFullYear() + Math.floor(absoluteMonth / 12);
    const month = (absoluteMonth % 12) + 1;
    const state = index < currentIndex ? "past" : index === currentIndex ? "current" : "future";

    return { index, year, month, state };
  });
}
