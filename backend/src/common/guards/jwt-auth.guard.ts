import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  canActivate(context: ExecutionContext) {
    // Add your custom authentication logic here
    // for example, call super.logIn(request) to establish a session.
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      this.logger.error(`
        Authentication Failed Details:
        - Error: ${err}
        - User: ${JSON.stringify(user)}
        - Info: ${JSON.stringify(info)}
        - Message: ${info?.message}
      `);
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
