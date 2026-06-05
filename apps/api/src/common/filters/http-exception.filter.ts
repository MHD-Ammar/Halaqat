/**
 * Global Exception Filter
 *
 * Maps every thrown value to a stable JSON shape:
 *   { code, message, messageAr, details?, requestId? }
 *
 * Priority:
 *   1. DomainException  – forwarded as-is (already has code + messageAr)
 *   2. HttpException    – status mapped to generic ErrorCode
 *   3. QueryFailedError – mapped to DATABASE_ERROR (or CONFLICT / INVALID_INPUT for PG codes)
 *   4. Anything else    – INTERNAL_ERROR
 *
 * Stack traces are stripped from the response body in production.
 */

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { QueryFailedError } from "typeorm";

import { DomainException } from "../errors/domain-exception";
import { type ErrorCode, mapStatusToCode } from "../errors/error-codes";
import { ERROR_MESSAGES_AR } from "../errors/error-messages";

export interface ApiErrorResponse {
  code: ErrorCode;
  message: string;
  messageAr: string;
  details?: unknown;
  requestId?: string;
}

/** @deprecated Use ApiErrorResponse */
export type ErrorResponse = ApiErrorResponse;

type AuthedRequest = Request & {
  user?: { sub: string };
  requestId?: string;
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger("ExceptionFilter");

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx      = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request  = ctx.getRequest<AuthedRequest>();

    let status: number;
    let body: ApiErrorResponse;

    // ── 1. DomainException ─────────────────────────────────────────────
    if (exception instanceof DomainException) {
      status = exception.getStatus();
      body   = exception.getResponse() as ApiErrorResponse;

    // ── 2. Generic HttpException (NestJS built-ins: NotFoundException etc.)
    } else if (exception instanceof HttpException) {
      status     = exception.getStatus();
      const raw  = exception.getResponse();
      const code = mapStatusToCode(status);
      let message: string;
      let details: unknown;

      if (typeof raw === "string") {
        message = raw;
      } else {
        const obj = raw as Record<string, unknown>;
        message = Array.isArray(obj["message"])
          ? (obj["message"] as string[]).join(", ")
          : (typeof obj["message"] === "string" ? obj["message"] : code);
        details = obj;
      }

      body = {
        code,
        message,
        messageAr: ERROR_MESSAGES_AR[code],
        details,
      };

    // ── 3. TypeORM QueryFailedError ─────────────────────────────────────
    } else if (exception instanceof QueryFailedError) {
      const pgCode = (exception as QueryFailedError & { driverError?: { code?: string } })
        .driverError?.code;

      if (pgCode === "23505") {
        status = 409;
        body   = {
          code:      "ALREADY_EXISTS",
          message:   "A record with this value already exists",
          messageAr: ERROR_MESSAGES_AR["ALREADY_EXISTS"],
        };
      } else if (pgCode === "23503") {
        status = 400;
        body   = {
          code:      "INVALID_INPUT",
          message:   "Referenced record does not exist",
          messageAr: ERROR_MESSAGES_AR["INVALID_INPUT"],
        };
      } else if (pgCode === "22P02") {
        status = 400;
        body   = {
          code:      "INVALID_INPUT",
          message:   "Invalid ID format provided",
          messageAr: ERROR_MESSAGES_AR["INVALID_INPUT"],
        };
      } else {
        status = 500;
        body   = {
          code:      "DATABASE_ERROR",
          message:   "Database operation failed",
          messageAr: ERROR_MESSAGES_AR["DATABASE_ERROR"],
        };
      }

    // ── 4. Unknown ──────────────────────────────────────────────────────
    } else {
      status = 500;
      body   = {
        code:      "INTERNAL_ERROR",
        message:   "Internal Server Error",
        messageAr: ERROR_MESSAGES_AR["INTERNAL_ERROR"],
      };
    }

    // Attach correlation id
    if (request.requestId) {
      body.requestId = request.requestId;
    }

    // Structured logging
    const logPayload = {
      requestId: request.requestId,
      userId:    request.user?.sub,
      method:    request.method,
      url:       request.url,
      status,
      code:      body.code,
      message:   body.message,
    };

    if (status >= 500) {
      this.logger.error({
        ...logPayload,
        stack: exception instanceof Error ? exception.stack : String(exception),
      });
    } else {
      this.logger.warn(logPayload);
    }

    // Scrub internals from 5xx in production
    if (process.env["NODE_ENV"] === "production" && status >= 500) {
      delete body.details;
    }

    response.status(status).json(body);
  }
}

/** @deprecated Use AllExceptionsFilter */
export { AllExceptionsFilter as GlobalExceptionFilter };
