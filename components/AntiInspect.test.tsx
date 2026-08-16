import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import AntiInspect from "@/components/AntiInspect";

function setup() {
  render(<AntiInspect />);
}

describe("AntiInspect", () => {
  it("prevents the right-click context menu", () => {
    setup();
    const event = new MouseEvent("contextmenu", { cancelable: true });
    const prevented = !document.dispatchEvent(event);
    expect(prevented).toBe(true);
  });

  it("blocks the F12 devtools hotkey", () => {
    setup();
    const event = new KeyboardEvent("keydown", {
      key: "F12",
      cancelable: true,
    });
    const prevented = !document.dispatchEvent(event);
    expect(prevented).toBe(true);
  });

  it("blocks Ctrl+Shift+I", () => {
    setup();
    const event = new KeyboardEvent("keydown", {
      key: "i",
      ctrlKey: true,
      shiftKey: true,
      cancelable: true,
    });
    const prevented = !document.dispatchEvent(event);
    expect(prevented).toBe(true);
  });

  it("blocks Ctrl+U (view source)", () => {
    setup();
    const event = new KeyboardEvent("keydown", {
      key: "u",
      ctrlKey: true,
      cancelable: true,
    });
    const prevented = !document.dispatchEvent(event);
    expect(prevented).toBe(true);
  });

  it("does not block normal typing", () => {
    setup();
    const onKeyDown = vi.fn();
    document.addEventListener("keydown", onKeyDown);
    const event = new KeyboardEvent("keydown", {
      key: "a",
      cancelable: true,
    });
    const prevented = !document.dispatchEvent(event);
    expect(prevented).toBe(false);
    expect(onKeyDown).toHaveBeenCalledTimes(1);
    document.removeEventListener("keydown", onKeyDown);
  });

  it("does not block Ctrl+C copy", () => {
    setup();
    const event = new KeyboardEvent("keydown", {
      key: "c",
      ctrlKey: true,
      cancelable: true,
    });
    const prevented = !document.dispatchEvent(event);
    expect(prevented).toBe(false);
  });

  it("cleans up listeners on unmount", () => {
    const { unmount } = render(<AntiInspect />);
    unmount();
    const event = new MouseEvent("contextmenu", { cancelable: true });
    const prevented = !document.dispatchEvent(event);
    expect(prevented).toBe(false);
  });
});
