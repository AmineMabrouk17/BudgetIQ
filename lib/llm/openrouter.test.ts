import { describe, expect, it } from "vitest";
import {
  extractJsonObject,
  renderSchemaInstruction,
} from "@/lib/llm/openrouter";
import type { LlmRequest } from "@/lib/llm/types";

const request: LlmRequest = {
  systemInstruction: "You are a test.",
  prompt: "hello",
  schema: { type: "object", properties: { message: { type: "string" } } },
};

describe("extractJsonObject", () => {
  it("passes through a bare JSON object", () => {
    expect(extractJsonObject('{"a":1}')).toBe('{"a":1}');
  });

  it("strips a json code fence", () => {
    expect(extractJsonObject('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it("strips an unlabelled code fence", () => {
    expect(extractJsonObject('```\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it("recovers JSON wrapped in preamble", () => {
    const text = 'Here is the result:\n{"a":1}\nHope that helps!';
    expect(extractJsonObject(text)).toBe('{"a":1}');
  });

  it("trims surrounding whitespace", () => {
    expect(extractJsonObject('  \n {"a":1} \n ')).toBe('{"a":1}');
  });

  it("keeps an array-returning reply intact", () => {
    expect(extractJsonObject('[{"a":1}]')).toBe('[{"a":1}]');
  });

  it("returns prose unchanged so the caller can fall back to text", () => {
    expect(extractJsonObject("Your budget looks fine.")).toBe(
      "Your budget looks fine."
    );
  });

  it("returns an empty string unchanged", () => {
    expect(extractJsonObject("   ")).toBe("");
  });
});

describe("renderSchemaInstruction", () => {
  it("always states the mandatory formatting rules", () => {
    const out = renderSchemaInstruction(request);

    expect(out).toContain("single JSON object");
    expect(out).toContain("no prose");
    expect(out).toContain("no markdown code fences");
  });

  it("includes the schema so a model without structured output can follow it", () => {
    expect(renderSchemaInstruction(request)).toContain('"message"');
  });

  it("keeps the original system instruction", () => {
    expect(renderSchemaInstruction(request)).toContain("You are a test.");
  });

  it("tells the model how to express a figure the user did not give", () => {
    expect(renderSchemaInstruction(request)).toMatch(/0, false or \[\]/);
  });

  it("still states the format rules when no schema is given", () => {
    const out = renderSchemaInstruction({ systemInstruction: "Be terse.", prompt: "hi" });

    expect(out).toContain("Be terse.");
    expect(out).toContain("single JSON object");
  });

  it("puts the formatting rules after the system instruction", () => {
    const out = renderSchemaInstruction({ systemInstruction: "Be terse.", prompt: "hi" });

    expect(out.indexOf("Be terse.")).toBeLessThan(
      out.indexOf("Formatting requirements")
    );
  });
});

describe("extractJsonObject nesting", () => {
  it("keeps a nested object whole", () => {
    expect(extractJsonObject('{"a":{"b":{"c":1}}}')).toBe('{"a":{"b":{"c":1}}}');
  });

  it("ignores a closing brace that only appears inside a string", () => {
    const text = '{"message":"spend on rent } not food","n":1}';
    expect(extractJsonObject(text)).toBe(text);
  });

  it("handles an escaped quote inside a string", () => {
    const text = '{"message":"he said \\"hi\\" to me","n":1}';
    expect(extractJsonObject(text)).toBe(text);
  });

  it("stops at the balanced close when trailing prose follows", () => {
    const text = 'Result: {"a":[1,2,{"b":3}]} -- let me know!';
    expect(extractJsonObject(text)).toBe('{"a":[1,2,{"b":3}]}');
  });

  it("returns the text unchanged when braces are unbalanced", () => {
    const text = '{"a": 1';
    expect(extractJsonObject(text)).toBe(text);
  });

  it("recovers a bare array from a preamble", () => {
    expect(extractJsonObject('items: [{"a":1}] done')).toBe('[{"a":1}]');
  });
});
