import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const getProfile = vi.fn();
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

vi.mock("@/lib/profiles", async () => {
  const actual = await vi.importActual<typeof import("@/lib/profiles")>(
    "@/lib/profiles"
  );
  return { ...actual, getProfile: () => getProfile() };
});

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

const FLAGED_USER = { id: "user-1", user_metadata: { onboarded: true } };
const UNFLAGGED_USER = { id: "user-1", user_metadata: {} };

const ONBOARDED_PROFILE = { id: "user-1", income_type: "salaried" };

beforeEach(() => {
  vi.clearAllMocks();
  getProfile.mockResolvedValue(ONBOARDED_PROFILE);
  isAdminSession.mockResolvedValue(false);
});

describe("DashboardLayout", () => {
  it("does not query profiles when the token carries the onboarded flag", async () => {
    getUser.mockResolvedValue(FLAGED_USER);

    await DashboardLayout({ children: <p>child</p> });

    expect(getProfile).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("passes the admin flag through from the cookie", async () => {
    getUser.mockResolvedValue(FLAGED_USER);
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

    // The unauthenticated path must not touch the database.
    expect(getProfile).not.toHaveBeenCalled();
  });

  it("falls back to the profile row for a token without the flag", async () => {
    getUser.mockResolvedValue(UNFLAGGED_USER);

    const tree = await DashboardLayout({ children: <p>child</p> });

    expect(getProfile).toHaveBeenCalled();
    expect(tree).toBeTruthy();
  });

  it("redirects a token without the flag whose profile is incomplete", async () => {
    getUser.mockResolvedValue(UNFLAGGED_USER);
    getProfile.mockResolvedValue({ id: "user-1", income_type: null });

    await expect(
      DashboardLayout({ children: <p>child</p> })
    ).rejects.toThrow("NEXT_REDIRECT:/onboarding");
  });

  it("lets a flagged user through even if the profile row says otherwise", async () => {
    getUser.mockResolvedValue(FLAGED_USER);
    getProfile.mockResolvedValue({ id: "user-1", income_type: null });

    const tree = await DashboardLayout({ children: <p>child</p> });

    // The token is the source of truth; a stale row must not bounce the user.
    expect(getProfile).not.toHaveBeenCalled();
    expect(tree).toBeTruthy();
  });
});
