import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermitService } from '../../permit/permit.service';

@Injectable()
export class PermitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permitService: PermitService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenant = request.tenant;

    if (!user || !tenant) {
      throw new UnauthorizedException('No user or tenant context found');
    }

    const permission = this.reflector.get<{ action: string; resource: string }>(
      'permission',
      context.getHandler(),
    );

    if (!permission) {
      return true;
    }

    try {
      const permit = this.permitService.getClient();
      const permitted = await permit.check(user.id, permission.action, {
        type: permission.resource,
        tenant: tenant.permitKey,
      });

      if (!permitted) {
        throw new UnauthorizedException('Insufficient permissions');
      }

      return true;
    } catch (error) {
      throw new UnauthorizedException(
        'You are not allowed to access this resource. Kindly contact your admin to upgrade your permission',
        error,
      );
    }
  }
}
