import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(OptionalJwtAuthGuard.name);

  handleRequest(err, user, info) {
    // If error or no user, we just return null so the request continues as unauthenticated.
    if (err || !user) {
      this.logger.debug(`Optional auth: No user found or token invalid. Continuing as guest.`);
      return null;
    }
    return user;
  }
}
