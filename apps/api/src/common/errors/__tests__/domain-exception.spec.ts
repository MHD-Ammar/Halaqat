import { DomainException, NotFoundDomainException, ConflictDomainException, ValidationDomainException, ForbiddenDomainException } from "../domain-exception";
import { ERROR_MESSAGES_AR } from "../error-messages";

describe("DomainException", () => {
  it("auto-populates messageAr from ERROR_MESSAGES_AR", () => {
    const ex = new DomainException("NOT_FOUND", 404);
    const body = ex.getResponse() as Record<string, unknown>;
    expect(body["code"]).toBe("NOT_FOUND");
    expect(body["messageAr"]).toBe(ERROR_MESSAGES_AR["NOT_FOUND"]);
    expect(ex.getStatus()).toBe(404);
  });

  it("allows overriding messageAr", () => {
    const ex = new DomainException("NOT_FOUND", 404, { messageAr: "خطأ مخصص" });
    const body = ex.getResponse() as Record<string, unknown>;
    expect(body["messageAr"]).toBe("خطأ مخصص");
  });

  it("carries details in response body", () => {
    const ex = new DomainException("VALIDATION_ERROR", 422, { details: [{ field: "name" }] });
    const body = ex.getResponse() as Record<string, unknown>;
    expect(body["details"]).toEqual([{ field: "name" }]);
  });

  it("uses code as message fallback when message is omitted", () => {
    const ex = new DomainException("FORBIDDEN", 403);
    const body = ex.getResponse() as Record<string, unknown>;
    expect(body["message"]).toBe("FORBIDDEN");
  });

  describe("NotFoundDomainException", () => {
    it("defaults to 404 and NOT_FOUND code", () => {
      const ex = new NotFoundDomainException();
      expect(ex.getStatus()).toBe(404);
      const body = ex.getResponse() as Record<string, unknown>;
      expect(body["code"]).toBe("NOT_FOUND");
    });

    it("accepts a custom code", () => {
      const ex = new NotFoundDomainException("STUDENT_NOT_IN_CIRCLE");
      const body = ex.getResponse() as Record<string, unknown>;
      expect(body["code"]).toBe("STUDENT_NOT_IN_CIRCLE");
      expect(body["messageAr"]).toBe(ERROR_MESSAGES_AR["STUDENT_NOT_IN_CIRCLE"]);
    });
  });

  describe("ConflictDomainException", () => {
    it("defaults to 409 and CONFLICT code", () => {
      const ex = new ConflictDomainException();
      expect(ex.getStatus()).toBe(409);
      expect((ex.getResponse() as Record<string, unknown>)["code"]).toBe("CONFLICT");
    });
  });

  describe("ValidationDomainException", () => {
    it("defaults to 422 and VALIDATION_ERROR code", () => {
      const ex = new ValidationDomainException();
      expect(ex.getStatus()).toBe(422);
    });
  });

  describe("ForbiddenDomainException", () => {
    it("defaults to 403 and FORBIDDEN code", () => {
      const ex = new ForbiddenDomainException();
      expect(ex.getStatus()).toBe(403);
    });
  });
});
