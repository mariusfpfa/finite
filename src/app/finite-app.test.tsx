import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FiniteApp from "./finite-app";

const fixedToday = new Date("2026-06-11T12:00:00Z");

describe("Finite web MVP", () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
    vi.setSystemTime(fixedToday);
  });

  it("onboards with date of birth and lifespan, then shows remaining days", async () => {
    render(<FiniteApp />);

    expect(screen.getByRole("heading", { name: /finite/i })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: "1990-01-01" } });
    fireEvent.change(screen.getByLabelText(/lifespan/i), { target: { value: "80" } });
    fireEvent.click(screen.getByRole("button", { name: /enter finite/i }));

    expect(await screen.findByText(/estimated days remaining/i)).toBeInTheDocument();
    expect(screen.getByText(/spend them like they matter/i)).toBeInTheDocument();
  });

  it("saves a recurring life cost locally and shows the calculated cost", async () => {
    render(<FiniteApp />);
    fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: "1990-01-01" } });
    fireEvent.click(screen.getByRole("button", { name: /enter finite/i }));

    fireEvent.click(screen.getByRole("button", { name: /costs/i }));
    fireEvent.change(screen.getByLabelText(/what are you spending time on/i), { target: { value: "Scrolling" } });
    fireEvent.change(screen.getByLabelText(/minutes/i), { target: { value: "120" } });
    fireEvent.click(screen.getByRole("button", { name: /save cost/i }));

    expect(await screen.findByText("Scrolling")).toBeInTheDocument();
    expect(screen.getAllByText(/30\.4 days per year/i).length).toBeGreaterThan(0);
    expect(localStorage.getItem("finite.state.v1")).toContain("Scrolling");
  });

  it("records daily reflection and selected values", async () => {
    render(<FiniteApp />);
    fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: "1990-01-01" } });
    fireEvent.click(screen.getByRole("button", { name: /enter finite/i }));

    fireEvent.click(screen.getByRole("button", { name: /mostly/i }));
    expect(await screen.findByText(/today was marked mostly/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /values/i }));
    const valuesPanel = screen.getByTestId("values-panel");
    fireEvent.click(within(valuesPanel).getByRole("button", { name: /family/i }));

    expect(within(valuesPanel).getByRole("button", { name: /family/i })).toHaveAttribute("aria-pressed", "true");
    expect(localStorage.getItem("finite.state.v1")).toContain("Family");
  });
});
