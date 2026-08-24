import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import AnnouncementBar from "@/components/landing/AnnouncementBar";

describe("AnnouncementBar", () => {
  it("renders the announcement strip copy", () => {
    render(<AnnouncementBar />);

    expect(
      screen.getByText(/free forever · open source · no credit card required/i)
    ).toBeInTheDocument();
  });
});
