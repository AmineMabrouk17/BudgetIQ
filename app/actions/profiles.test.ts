import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateIncomeProfile } from "@/app/actions/profiles";

const getUser = vi.fn();
const createClient = vi.fn();
const updateUser = vi.fn();
const seedDefaultKpis = vi.fn();
const updateIncomeProfileInDb = vi.fn();
const revalidatePath = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClient(),
  getUser: () => getUser(),
}));

vi.mock("@/lib/kpi", () => ({
  seedDefaultKpis: (...args: unknown[]) => seedDefaultKpis(...args),
}));

vi.mock("@/lib/profiles", async () => {
  const actual = await vi.importActual<typeof import("@/lib/profiles")>(
    "@/lib/profiles"
  );
  return {
    ...actual,
    updateIncomeProfileInDb: (...args: unknown[]) =>
      updateIncomeProfileInDb(...args),
  };
});

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
  getUser.mockResolvedValue({ id: "user-1" });
  updateUser.mockResolvedValue({ data: {}, error: null });
  seedDefaultKpis.mockResolvedValue(undefined);
  updateIncomeProfileInDb.mockResolvedValue({ id: "user-1" });
  createClient.mockResolvedValue({ auth: { updateUser } });
});

describe("updateIncomeProfile", () => {
  it("flags the session as onboarded so the layout can skip the profile query", async () => {
    const result = await updateIncomeProfile("salaried");

    expect(result).toEqual({ ok: true });
    expect(updateUser).toHaveBeenCalledWith({ data: { onboarded: true } });
  });

  it("still succeeds when the metadata write fails", async () => {
    updateUser.mockResolvedValue({
      data: {},
      error: { message: "rate limited" },
    });
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const result = await updateIncomeProfile("salaried");

    expect(result).toEqual({ ok: true });
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("rejects an unauthenticated caller", async () => {
    getUser.mockResolvedValue(null);

    expect(await updateIncomeProfile("salaried")).toEqual({
      ok: false,
      error: "Not authenticated.",
    });
    expect(updateUser).not.toHaveBeenCalled();
  });
});
