/**
 * Current User Decorator
 *
 * Parameter decorator to extract the authenticated user from the request.
 * Provides cleaner access to req.user in controllers.
 */

import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
