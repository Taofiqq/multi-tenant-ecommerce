import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Permit } from 'permitio';

@Injectable()
export class PermitService {
  private permitClient: Permit;

  constructor(private configService: ConfigService) {
    this.permitClient = new Permit({
      pdp:
        this.configService.get<string>('PERMIT_PDP_URL') ||
        'https://cloudpdp.api.permit.io',
      token: this.configService.get<string>('PERMIT_API_KEY'),
    });
  }

  getClient(): Permit {
    return this.permitClient;
  }
}
