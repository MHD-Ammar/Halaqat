// @vitest-environment node
import { describe, expect, it } from "vitest";

import { createStudentSchema, editStudentSchema } from "../student";

// ── createStudentSchema ───────────────────────────────────────────────────────

describe("createStudentSchema", () => {
  const valid = {
    name: "أحمد محمد",
    circleId: "circle-1",
    guardianName: "",
    guardianPhone: "",
  };

  it("accepts a valid payload", () => {
    expect(createStudentSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = createStudentSchema.safeParse({ ...valid, name: "أ" });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result)).toContain("اسم الطالب");
  });

  it("rejects missing circleId", () => {
    const result = createStudentSchema.safeParse({ ...valid, circleId: "" });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result)).toContain("اختر الحلقة");
  });

  it("accepts optional fields omitted", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { guardianName, guardianPhone, ...rest } = valid;
    expect(createStudentSchema.safeParse(rest).success).toBe(true);
  });

  it("rejects invalid phone format", () => {
    const result = createStudentSchema.safeParse({
      ...valid,
      guardianPhone: "not-a-phone!!!",
    });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result)).toContain("هاتف");
  });

  it("accepts valid international phone", () => {
    const result = createStudentSchema.safeParse({
      ...valid,
      guardianPhone: "+966501234567",
    });
    expect(result.success).toBe(true);
  });
});

// ── editStudentSchema ─────────────────────────────────────────────────────────

describe("editStudentSchema", () => {
  const valid = {
    name: "فاطمة علي",
    circleId: "circle-2",
    phone: "",
    dob: "",
    address: "",
    notes: "",
    guardianName: "",
    guardianPhone: "",
  };

  it("accepts a full valid payload", () => {
    expect(editStudentSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts a valid dob in YYYY-MM-DD", () => {
    const result = editStudentSchema.safeParse({ ...valid, dob: "2010-05-15" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid dob format", () => {
    const result = editStudentSchema.safeParse({ ...valid, dob: "15/05/2010" });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result)).toContain("YYYY-MM-DD");
  });

  it("rejects name shorter than 2 characters", () => {
    const result = editStudentSchema.safeParse({ ...valid, name: "ف" });
    expect(result.success).toBe(false);
  });
});
