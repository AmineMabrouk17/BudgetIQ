import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import LoginPage from "@/app/(auth)/login/login-form";

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({}),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/app/actions/auth", () => ({
  verifyTurnstile: vi.fn(),
  checkLoginRateLimit: vi.fn(),
}));

describe("LoginPage mode switch", () => {
  it("uses pressed-state buttons and a heading that follows the mode", () => {
    render(<LoginPage />);

    expect(
      screen.getByRole("heading", { name: /sign in to budgetiq/i })
    ).toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();

    const modeGroup = screen.getByRole("group", { name: /account mode/i });
    const signInMode = within(modeGroup).getByRole("button", {
      name: "Sign in",
    });
    const signUpMode = within(modeGroup).getByRole("button", {
      name: "Create account",
    });

    expect(signInMode).toHaveAttribute("aria-pressed", "true");
    expect(signUpMode).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(signUpMode);

    expect(
      screen.getByRole("heading", { name: /create your budgetiq account/i })
    ).toBeInTheDocument();
    expect(signUpMode).toHaveAttribute("aria-pressed", "true");
    expect(signInMode).toHaveAttribute("aria-pressed", "false");
  });
});
