import { HttpException, NotFoundException, ForbiddenException } from "@nestjs/common";
import { QueryFailedError } from "typeorm";

import { DomainException, ValidationDomainException } from "../../errors/domain-exception";
import { ERROR_MESSAGES_AR } from "../../errors/error-messages";
import { AllExceptionsFilter } from "../http-exception.filter";

function makeHost(requestId?: string) {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const response = { status };
  const request = { method: "GET", url: "/test", requestId, user: undefined };
  return {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
    json,
    status,
  };
}

describe("AllExceptionsFilter", () => {
  let filter: AllExceptionsFilter;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    jest.spyOn((filter as unknown as { logger: { error: jest.Mock; warn: jest.Mock } }).logger, "error").mockImplementation(() => undefined);
    jest.spyOn((filter as unknown as { logger: { error: jest.Mock; warn: jest.Mock } }).logger, "warn").mockImplementation(() => undefined);
  });

  it("passes DomainException body through unchanged", () => {
    const host = makeHost("req-1") as unknown as Parameters<typeof filter.catch>[1];
    const ex = new DomainException("NOT_FOUND", 404, { message: "Circle not found" });
    filter.catch(ex, host);
    const { status, json } = host as unknown as { status: jest.Mock; json: jest.Mock };
    expect(status).toHaveBeenCalledWith(404);
    const body = json.mock.calls[0][0] as Record<string, unknown>;
    expect(body["code"]).toBe("NOT_FOUND");
    expect(body["messageAr"]).toBe(ERROR_MESSAGES_AR["NOT_FOUND"]);
    expect(body["requestId"]).toBe("req-1");
  });

  it("maps NotFoundException to 404 / NOT_FOUND", () => {
    const host = makeHost() as unknown as Parameters<typeof filter.catch>[1];
    filter.catch(new NotFoundException("Resource not found"), host);
    const { status, json } = host as unknown as { status: jest.Mock; json: jest.Mock };
    expect(status).toHaveBeenCalledWith(404);
    expect((json.mock.calls[0][0] as Record<string, unknown>)["code"]).toBe("NOT_FOUND");
  });

  it("maps ForbiddenException to 403 / FORBIDDEN", () => {
    const host = makeHost() as unknown as Parameters<typeof filter.catch>[1];
    filter.catch(new ForbiddenException(), host);
    const { status, json } = host as unknown as { status: jest.Mock; json: jest.Mock };
    expect(status).toHaveBeenCalledWith(403);
    expect((json.mock.calls[0][0] as Record<string, unknown>)["code"]).toBe("FORBIDDEN");
  });

  it("maps QueryFailedError 23505 to 409 / ALREADY_EXISTS", () => {
    const host = makeHost() as unknown as Parameters<typeof filter.catch>[1];
    const qfe = new QueryFailedError("INSERT", [], new Error("duplicate") as NodeJS.ErrnoException);
    (qfe as unknown as { driverError: { code: string } }).driverError = { code: "23505" };
    filter.catch(qfe, host);
    const { status, json } = host as unknown as { status: jest.Mock; json: jest.Mock };
    expect(status).toHaveBeenCalledWith(409);
    expect((json.mock.calls[0][0] as Record<string, unknown>)["code"]).toBe("ALREADY_EXISTS");
  });

  it("maps QueryFailedError 23503 to 400 / INVALID_INPUT", () => {
    const host = makeHost() as unknown as Parameters<typeof filter.catch>[1];
    const qfe = new QueryFailedError("INSERT", [], new Error("fk") as NodeJS.ErrnoException);
    (qfe as unknown as { driverError: { code: string } }).driverError = { code: "23503" };
    filter.catch(qfe, host);
    const { status } = host as unknown as { status: jest.Mock };
    expect(status).toHaveBeenCalledWith(400);
  });

  it("maps plain Error to 500 / INTERNAL_ERROR", () => {
    const host = makeHost() as unknown as Parameters<typeof filter.catch>[1];
    filter.catch(new Error("something exploded"), host);
    const { status, json } = host as unknown as { status: jest.Mock; json: jest.Mock };
    expect(status).toHaveBeenCalledWith(500);
    expect((json.mock.calls[0][0] as Record<string, unknown>)["code"]).toBe("INTERNAL_ERROR");
  });

  it("maps ValidationDomainException to 422 with details", () => {
    const host = makeHost() as unknown as Parameters<typeof filter.catch>[1];
    const ex = new ValidationDomainException("VALIDATION_ERROR", {
      details: [{ property: "email", constraints: { isEmail: "must be email" } }],
    });
    filter.catch(ex, host);
    const { status, json } = host as unknown as { status: jest.Mock; json: jest.Mock };
    expect(status).toHaveBeenCalledWith(422);
    const body = json.mock.calls[0][0] as Record<string, unknown>;
    expect(body["code"]).toBe("VALIDATION_ERROR");
    expect(body["details"]).toBeDefined();
  });

  it("attaches requestId from request to every response", () => {
    const host = makeHost("abc-123") as unknown as Parameters<typeof filter.catch>[1];
    filter.catch(new HttpException("oops", 400), host);
    const { json } = host as unknown as { json: jest.Mock };
    expect((json.mock.calls[0][0] as Record<string, unknown>)["requestId"]).toBe("abc-123");
  });
});
