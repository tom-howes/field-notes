import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import type { Request } from 'express'
import { AuthService } from './auth.service'
import { PrismaService } from '../prisma/prisma.service'

export interface AuthenticatedRequest extends Request {
  userId: string
}

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const token = request.cookies?.['session'] as string | undefined

    if (!token) {
      throw new UnauthorizedException('No session cookie present')
    }

    const payload = this.authService.verifySessionToken(token)

    // The JWT signature alone doesn't guarantee the account still exists — a
    // session issued before an account was deleted (or, locally, before a dev
    // database reset) would otherwise pass this guard and then blow up as an
    // unhandled 500 the first time a downstream findUniqueOrThrow ran on it.
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true } })
    if (!user) {
      throw new UnauthorizedException('This session no longer refers to a valid account')
    }

    request.userId = payload.sub
    return true
  }
}
