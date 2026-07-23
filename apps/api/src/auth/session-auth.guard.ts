import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import type { Request } from 'express'
import { AuthService } from './auth.service'

export interface AuthenticatedRequest extends Request {
  userId: string
}

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const token = request.cookies?.['session'] as string | undefined

    if (!token) {
      throw new UnauthorizedException('No session cookie present')
    }

    const payload = this.authService.verifySessionToken(token)
    request.userId = payload.sub
    return true
  }
}
