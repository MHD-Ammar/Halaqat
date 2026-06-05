// @vitest-environment node
import { describe, expect, it } from "vitest";

import { createUserSchema, editUserSchema, resetPasswordSchema } from "../user";

// ── createUserSchema ──────────────────────────────────────────────────────────

describe("createUserSchema", () => {
  const valid = {
    fullName: "أحمد محمد الغامدي",
    email: "ahmed@example.com",
    phoneNumber: "0501234567",
    password: "secret123",
    role: "TEACHER" as const,
  };

  it("accepts a valid payload", () => {
    expect(createUserSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects name shorter than 2 characters", () => {
    const result = createUserSchema.safeParse({ ...valid, fullName: "أ" });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result)).toContain("الاسم الكامل");
  });

  it("rejects empty name", () => {
    const result = createUserSchema.safeParse({ ...valid, fullName: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = createUserSchema.safeParse({ ...valid, email: "not-an-email" });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result)).toContain("البريد الإلكتروني");
  });

  it("rejects empty email", () => {
    const result = createUserSchema.safeParse({ ...valid, email: "" });
    expect(result.success).toBe(false);
  });

  it("rejects phone shorter than 10 digits", () => {
    const result = createUserSchema.safeParse({ ...valid, phoneNumber: "050" });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result)).toContain("هاتف");
  });

  it("rejects phone with letters", () => {
    const result = createUserSchema.safeParse({ ...valid, phoneNumber: "abc1234567" });
    expect(result.success).toBe(false);
  });

  it("accepts international phone with +", () => {
    const result = createUserSchema.safeParse({
      ...valid,
      phoneNumber: "+966501234567",
    });
    expect(result.success).toBe(true);
  });

  it("rejects password shorter than 6 characters", () => {
    const result = createUserSchema.safeParse({ ...valid, password: "abc" });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result)).toContain("كلمة المرور");
  });

  it("rejects invalid role", () => {
    const result = createUserSchema.safeParse({ ...valid, role: "STUDENT" });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result)).toContain("دوراً");
  });

  it("accepts all valid roles", () => {
    const roles = ["ADMIN", "SUPERVISOR", "TEACHER", "EXAMINER"] as const;
    for (const role of roles) {
      expect(createUserSchema.safeParse({ ...valid, role }).success).toBe(true);
    }
  });
});

// ── editUserSchema ────────────────────────────────────────────────────────────

describe("editUserSchema", () => {
  const valid = {
    fullName: "فاطمة الزهراء",
    email: "fatima@example.com",
    phoneNumber: "0551234567",
    role: "SUPERVISOR" as const,
  };

  it("accepts a full valid payload", () => {
    expect(editUserSchema.safeParse(valid).success).toBe(true);
  });

  it("does not require password", () => {
    // editUserSchema has no password field — extra keys are stripped by Zod
    const result = editUserSchema.safeParse({ ...valid, password: "new-pass" });
    // Zod strips unknown keys — parse should succeed either way
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = editUserSchema.safeParse({ ...valid, email: "bad-email" });
    expect(result.success).toBe(false);
  });

  it("rejects missing role", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { role, ...rest } = valid;
    const result = editUserSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

// ── resetPasswordSchema ───────────────────────────────────────────────────────

describe("resetPasswordSchema", () => {
  it("accepts a valid password", () => {
    expect(resetPasswordSchema.safeParse({ password: "newPass1" }).success).toBe(true);
  });

  it("rejects a password shorter than 6 characters", () => {
    const result = resetPasswordSchema.safeParse({ password: "abc" });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result)).toContain("كلمة المرور");
  });

  it("rejects empty password", () => {
    const result = resetPasswordSchema.safeParse({ password: "" });
    expect(result.success).toBe(false);
  });
});
