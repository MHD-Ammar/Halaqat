/**
 * Global HTTP Exception Filter
 *
 * Provides consistent error responses across the entire API.
 * Catches all exceptions and formats them into a standard structure.
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Response, Request } from "express";
import { QueryFailedError, EntityNotFoundError } from "typeorm";

export interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "An unexpected error occurred";
    let error = "Internal Server Error";

    // Handle HTTP exceptions (NestJS built-in)
    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === "string") {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === "object") {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message = Array.isArray(responseObj.message)
          ? responseObj.message.join(", ")
          : (responseObj.message as string) || message;
        error = (responseObj.error as string) || error;
      }
    }
    // Handle TypeORM QueryFailedError (database errors)
    else if (exception instanceof QueryFailedError) {
      statusCode = HttpStatus.BAD_REQUEST;
      error = "Database Error";

      // Handle common database errors
      const driverError = (exception as any).driverError;
      if (driverError?.code === "23505") {
        // Unique constraint violation
        message = "A record with this value already exists";
      } else if (driverError?.code === "23503") {
        // Foreign key violation
        message = "Referenced record does not exist";
      } else if (driverError?.code === "22P02") {
        // Invalid UUID format
        message = "Invalid ID format provided";
      } else {
        message = `Database operation failed: ${(exception as any).message}`;
      }

      this.logger.error(
        `Database error: ${exception.message}`,
        exception.stack,
      );
    }
    // Handle TypeORM EntityNotFoundError
    else if (exception instanceof EntityNotFoundError) {
      statusCode = HttpStatus.NOT_FOUND;
      message = "The requested resource was not found";
      error = "Not Found";
    }
    // Handle generic errors
    else if (exception instanceof Error) {
      message = exception.message || message;
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
      );
    }

    const errorResponse: ErrorResponse = {
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Log errors (only for 5xx errors in production, but warn for 4xx)
    if (statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else if (statusCode >= 400) {
      this.logger.warn(
        `${request.method} ${request.url} - ${statusCode} - ${message} | Raw: ${exception instanceof Error ? exception.message : String(exception)}`,
      );
    }

    response.status(statusCode).json(errorResponse);
  }
}
