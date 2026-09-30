import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readSessionUser } from "@/lib/auth/session";
import { __resetJwksCache } from "@/lib/auth/jwks";

vi.mock("@/lib/auth/jwks", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/jwks")>(
    "@/lib/auth/jwks"
  );
  return { ...actual, getJwks: vi.fn() };
});

vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co" },
}));

const { getJwks } = await import("@/lib/auth/jwks");

function b64url(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function makeToken(
  claims: Record<string, unknown> = {},
  header: Record<string, unknown> = { alg: "ES256", kid: "key-a" }
): string {
  return `${b64url(header)}.${b64url({
    sub: "user-1",
    email: "a@b.c",
    user_metadata: { onboarded: true },
    app_metadata: {},
    ...claims,
  })}.signature`;
}

function makeClient(
  overrides: {
    session?: { access_token: string } | null;
    claims?: unknown;
    claimsError?: unknown;
    user?: unknown;
    userError?: unknown;
  } = {}
) {
  const getUser = vi.fn().mockResolvedValue({
    data: { user: overrides.user ?? null },
    error: overrides.userError ?? null,
  });
  const getClaims = vi.fn().mockResolvedValue({
    data: overrides.claimsError ? null : (overrides.claims ?? null),
    error: overrides.claimsError ?? null,
  });
  return {
    client: {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: overrides.session },
          error: null,
        }),
        getClaims,
        getUser,
      },
    } as never,
    getClaims,
    getUser,
  };
}

beforeEach(() => {
  __resetJwksCache();
  vi.mocked(getJwks).mockReset();
  vi.mocked(getJwks).mockResolvedValue({ keys: [] });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("readSessionUser", () => {
  it("verifies the token locally and returns the user without calling the Auth API", async () => {
    const { client, getClaims, getUser } = makeClient({
      session: { access_token: makeToken() },
      claims: {
        claims: {
          sub: "user-1",
          email: "a@b.c",
          user_metadata: { full_name: "Ada" },
          app_metadata: { role: "authenticated" },
        },
        header: { alg: "ES256", kid: "key-a" },
        signature: new Uint8Array(),
      },
    });

    const user = await readSessionUser(client);

    expect(user).toEqual({
      id: "user-1",
      email: "a@b.c",
      user_metadata: { full_name: "Ada" },
      app_metadata: { role: "authenticated" },
    });
    expect(getJwks).toHaveBeenCalledWith("https://project.supabase.co", "key-a");
    expect(getClaims).toHaveBeenCalledWith(expect.any(String), {
      jwks: { keys: [] },
    });
    expect(getUser).not.toHaveBeenCalled();
  });

  it("returns null when there is no session", async () => {
    const { client, getUser } = makeClient({ session: null });

    expect(await readSessionUser(client)).toBeNull();
    expect(getUser).not.toHaveBeenCalled();
  });

  it("falls back to the Auth API for symmetrically signed tokens", async () => {
    const { client, getClaims, getUser } = makeClient({
      session: { access_token: makeToken({}, { alg: "HS256" }) },
      user: {
        id: "user-1",
        email: "a@b.c",
        user_metadata: {},
        app_metadata: {},
      },
    });

    const user = await readSessionUser(client);

    expect(user?.id).toBe("user-1");
    expect(getJwks).not.toHaveBeenCalled();
    expect(getClaims).not.toHaveBeenCalled();
    expect(getUser).toHaveBeenCalled();
  });

  it("falls back to the Auth API for tokens with no verifiable header", async () => {
    const { client, getUser } = makeClient({
      session: { access_token: "not-a-jwt" },
      user: { id: "user-1", email: null, user_metadata: {}, app_metadata: {} },
    });

    expect((await readSessionUser(client))?.id).toBe("user-1");
    expect(getUser).toHaveBeenCalled();
  });

  it("lets the Auth API adjudicate a token that fails local verification", async () => {
    const { client, getUser } = makeClient({
      session: { access_token: makeToken() },
      claimsError: new Error("Invalid JWT signature"),
      userError: new Error("invalid claim: missing sub claim"),
    });

    expect(await readSessionUser(client)).toBeNull();
    expect(getUser).toHaveBeenCalled();
  });

  it("falls back to the Auth API when the key set is unreachable", async () => {
    vi.mocked(getJwks).mockRejectedValue(new Error("network down"));
    const { client, getUser } = makeClient({
      session: { access_token: makeToken() },
      user: { id: "user-1", email: null, user_metadata: {}, app_metadata: {} },
    });

    expect((await readSessionUser(client))?.id).toBe("user-1");
    expect(getUser).toHaveBeenCalled();
  });

  it("returns null when the claims carry no subject", async () => {
    const { client } = makeClient({
      session: { access_token: makeToken() },
      claims: {
        claims: { email: "a@b.c" },
        header: { alg: "ES256", kid: "key-a" },
        signature: new Uint8Array(),
      },
    });

    expect(await readSessionUser(client)).toBeNull();
  });

  it("normalises missing email and metadata claims", async () => {
    const { client } = makeClient({
      session: { access_token: makeToken() },
      claims: {
        claims: { sub: "user-1" },
        header: { alg: "ES256", kid: "key-a" },
        signature: new Uint8Array(),
      },
    });

    expect(await readSessionUser(client)).toEqual({
      id: "user-1",
      email: null,
      user_metadata: {},
      app_metadata: {},
    });
  });
});
