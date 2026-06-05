/**
 * Request ID Middleware
 *
 * Attaches a unique request ID to every incoming request so log lines can
 * be correlated with the request that produced them.
 *
 * - Reads `x-request-id` header if provided by a upstream proxy / API gateway.
 * - Falls back to a freshly generated UUID v4.
 * - Echoes the ID back as `x-request-id` on the response.
 * - Attaches it to `req.requestId` for use in the exception filter and services.
 */

import { randomUUID } from "crypto";

import { Injectable, NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";

export type RequestWithId = Request & { requestId?: string };

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: RequestWithId, res: Response, next: NextFunction): void {
    const incoming  = req.header("x-request-id");
    req.requestId   = incoming ?? randomUUID();
    res.setHeader("x-request-id", req.requestId);
    next();
  }
}
