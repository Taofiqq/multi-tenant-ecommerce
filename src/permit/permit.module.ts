import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PermitService } from './permit.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [PermitService],
  exports: [PermitService],
})
export class PermitModule {}
