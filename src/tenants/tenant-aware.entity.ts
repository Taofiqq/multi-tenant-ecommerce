import { Column } from 'typeorm';

export class TenantAwareEntity {
  @Column()
  tenantId: string;
}
