import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const isAdminSession = vi.fn();
const redirect = vi.fn((path: string) => {
  // The real `redirect` never returns, so neither does this: it keeps the
  // assertions below honest about which code runs after the gate.
  throw new Error(`NEXT_REDIRECT:${path}`);
});

vi.mock("next/navigation", () => ({
  redirect: (...args: [string]) => redirect(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  getUser: () => getUser(),
}));

vi.mock("@/lib/auth/admin-session", () => ({
  isAdminSession: () => isAdminSession(),
}));

vi.mock("@/components/Navbar", () => ({ default: () => <nav /> }));
vi.mock("@/components/DashboardSidebar", () => ({
  default: ({ isAdmin }: { isAdmin: boolean }) => (
    <aside data-testid="sidebar" data-admin={String(isAdmin)} />
  ),
}));

import DashboardLayout from "@/app/(dashboard)/layout";

beforeEach(() => {
  vi.clearAllMocks();
  isAdminSession.mockResolvedValue(false);
});

describe("DashboardLayout", () => {
  it("renders the shell for a signed-in user", async () => {
    getUser.mockResolvedValue({ id: "user-1" });

    const tree = await DashboardLayout({ children: <p>child</p> });

    expect(redirect).not.toHaveBeenCalled();
    expect(tree).toBeTruthy();
  });

  it("passes the admin flag through from the cookie", async () => {
    getUser.mockResolvedValue({ id: "user-1" });
    isAdminSession.mockResolvedValue(true);

    const tree = await DashboardLayout({ children: <p>child</p> });

    expect(isAdminSession).toHaveBeenCalled();
    expect(tree.props.children[1].props.children[0].props.isAdmin).toBe(true);
  });

  it("redirects an unauthenticated visitor to /login", async () => {
    getUser.mockResolvedValue(null);

    await expect(
      DashboardLayout({ children: <p>child</p> })
    ).rejects.toThrow("NEXT_REDIRECT:/login");
  });
});
