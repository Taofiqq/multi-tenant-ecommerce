import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantService } from './tenant.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private tenantService: TenantService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      throw new UnauthorizedException('Missing x-tenant-id header');
    }

    const tenant = await this.tenantService.findById(tenantId);

    if (!tenant) {
      throw new UnauthorizedException('Invalid tenant ID');
    }

    if (!tenant.isActive) {
      throw new UnauthorizedException('Tenant account is inactive');
    }
    req['tenant'] = tenant;
    next();
  }
}
