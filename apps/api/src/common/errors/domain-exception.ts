/**
 * Domain Exception
 *
 * A subclass of HttpException that carries a stable ErrorCode and an
 * Arabic message alongside the English message.  The global exception
 * filter recognises this shape and forwards it unchanged to the client.
 *
 * Usage:
 *   throw new DomainException("NOT_FOUND", 404, { message: "Circle not found" });
 *   throw new NotFoundDomainException("STUDENT_NOT_IN_CIRCLE");
 *   throw new ConflictDomainException("ALREADY_EXISTS");
 */

import { HttpException } from "@nestjs/common";

import { type ErrorCode } from "./error-codes";
import { ERROR_MESSAGES_AR } from "./error-messages";

export interface DomainExceptionOptions {
  message?: string;
  messageAr?: string;
  details?: unknown;
  cause?: unknown;
}

export class DomainException extends HttpException {
  constructor(
    public readonly code: ErrorCode,
    status: number,
    options?: DomainExceptionOptions,
  ) {
    super(
      {
        code,
        message: options?.message ?? code,
        messageAr: options?.messageAr ?? ERROR_MESSAGES_AR[code],
        details: options?.details,
      },
      status,
      { cause: options?.cause },
    );
  }
}

// ── Convenience factories ───────────────────────────────────────────────────

export class NotFoundDomainException extends DomainException {
  constructor(
    code: ErrorCode = "NOT_FOUND",
    opts?: DomainExceptionOptions,
  ) {
    super(code, 404, opts);
  }
}

export class ConflictDomainException extends DomainException {
  constructor(
    code: ErrorCode = "CONFLICT",
    opts?: DomainExceptionOptions,
  ) {
    super(code, 409, opts);
  }
}

export class ValidationDomainException extends DomainException {
  constructor(
    code: ErrorCode = "VALIDATION_ERROR",
    opts?: DomainExceptionOptions,
  ) {
    super(code, 422, opts);
  }
}

export class ForbiddenDomainException extends DomainException {
  constructor(
    code: ErrorCode = "FORBIDDEN",
    opts?: DomainExceptionOptions,
  ) {
    super(code, 403, opts);
  }
}

export class UnauthorizedDomainException extends DomainException {
  constructor(
    code: ErrorCode = "UNAUTHORIZED",
    opts?: DomainExceptionOptions,
  ) {
    super(code, 401, opts);
  }
}
