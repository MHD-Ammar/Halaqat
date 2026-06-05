// @vitest-environment node
import { describe, expect, it } from "vitest";

import { createCircleSchema, editCircleSchema } from "../circle";

// ── createCircleSchema ────────────────────────────────────────────────────────

describe("createCircleSchema", () => {
  const valid = {
    name: "حلقة النور",
    description: "",
    gender: "MALE" as const,
    teacherId: "550e8400-e29b-41d4-a716-446655440000",
  };

  it("accepts a valid payload", () => {
    expect(createCircleSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects name shorter than 2 characters", () => {
    const result = createCircleSchema.safeParse({ ...valid, name: "ح" });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result)).toContain("اسم الحلقة");
  });

  it("rejects empty name", () => {
    const result = createCircleSchema.safeParse({ ...valid, name: "" });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result)).toContain("اسم الحلقة");
  });

  it("rejects invalid gender", () => {
    const result = createCircleSchema.safeParse({ ...valid, gender: "OTHER" });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result)).toContain("اختر نوع الحلقة");
  });

  it("accepts FEMALE gender", () => {
    const result = createCircleSchema.safeParse({ ...valid, gender: "FEMALE" });
    expect(result.success).toBe(true);
  });

  it("rejects non-UUID teacherId", () => {
    const result = createCircleSchema.safeParse({ ...valid, teacherId: "not-a-uuid" });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result)).toContain("المعلم");
  });

  it("rejects empty teacherId", () => {
    const result = createCircleSchema.safeParse({ ...valid, teacherId: "" });
    expect(result.success).toBe(false);
  });

  it("accepts description as optional empty string", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { description, ...rest } = valid;
    expect(createCircleSchema.safeParse(rest).success).toBe(true);
  });

  it("accepts a non-empty description", () => {
    const result = createCircleSchema.safeParse({
      ...valid,
      description: "حلقة تحفيظ للأطفال",
    });
    expect(result.success).toBe(true);
  });
});

// ── editCircleSchema ──────────────────────────────────────────────────────────

describe("editCircleSchema", () => {
  // editCircleSchema is an alias of createCircleSchema — just verify alias works
  const valid = {
    name: "حلقة الفجر",
    description: "للكبار",
    gender: "FEMALE" as const,
    teacherId: "550e8400-e29b-41d4-a716-446655440001",
  };

  it("accepts a full valid payload", () => {
    expect(editCircleSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects short name", () => {
    const result = editCircleSchema.safeParse({ ...valid, name: "ف" });
    expect(result.success).toBe(false);
  });

  it("rejects missing gender", () => {
    const { gender, ...rest } = valid;
    const result = editCircleSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});
