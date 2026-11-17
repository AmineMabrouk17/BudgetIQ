import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import DashboardSidebar from "@/components/DashboardSidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/salary-planner",
}));

describe("DashboardSidebar", () => {
  it("exposes every section, including Admin, in the compact navigation", () => {
    render(<DashboardSidebar isAdmin />);

    const compactNav = screen.getByRole("navigation", {
      name: /dashboard sections/i,
    });
    const links = within(compactNav).getAllByRole("link");

    expect(links.map((link) => link.textContent)).toEqual([
      "Dashboard",
      "Salary Planner",
      "Admin",
    ]);
    expect(
      within(compactNav).getByRole("link", { name: /salary planner/i })
    ).toHaveAttribute("aria-current", "page");
  });

  it("does not offer Admin to non-admin users in either navigation", () => {
    render(<DashboardSidebar isAdmin={false} />);

    expect(screen.queryByRole("link", { name: /admin/i })).not.toBeInTheDocument();
  });
});
