import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Profile } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface RequestWithProfile {
  headers: Record<string, string | string[] | undefined>;
  profile?: Profile;
}

const SESSION_ERROR_MESSAGE = '세션이 유효하지 않습니다. 다시 시작해주세요.';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithProfile>();
    const sessionId = request.headers['x-session-id'];

    if (!sessionId || typeof sessionId !== 'string') {
      throw new UnauthorizedException(SESSION_ERROR_MESSAGE);
    }

    const profile = await this.prisma.profile.findUnique({ where: { sessionId } });
    if (!profile) {
      throw new UnauthorizedException(SESSION_ERROR_MESSAGE);
    }

    request.profile = profile;
    return true;
  }
}
