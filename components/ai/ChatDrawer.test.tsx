import { beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ChatDrawer from "@/components/ai/ChatDrawer";

vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-anon-key",
  },
}));

beforeAll(() => {
  Element.prototype.scrollTo = () => {};
});

describe("ChatDrawer", () => {
  it("states the real capability and the text data flow", () => {
    render(
      <ChatDrawer>
        <div>Dashboard content</div>
      </ChatDrawer>
    );

    expect(
      screen.getByText(/describe an income, expense, or asset to log it/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/I spent \$15 on coffee/i)).toBeInTheDocument();
    expect(
      screen.getByText(/sent to the AI assistant/i)
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/describe a transaction/i)
    ).toBeInTheDocument();

    expect(
      screen.queryByText(/anything about your finances/i)
    ).not.toBeInTheDocument();
  });
});
