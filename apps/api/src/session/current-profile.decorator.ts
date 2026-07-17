import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { Profile } from '@prisma/client';
import type { RequestWithProfile } from './session.guard';

export const CurrentProfile = createParamDecorator((_: unknown, ctx: ExecutionContext): Profile => {
  const request = ctx.switchToHttp().getRequest<RequestWithProfile>();
  return request.profile as Profile;
});
