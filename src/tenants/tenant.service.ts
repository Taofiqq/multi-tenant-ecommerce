import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './tenant.entity';
import { CreateTenantDto } from './tenant.dto';
import { PermitService } from '../permit/permit.service';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    private permitService: PermitService,
  ) {}

  async create(createTenantDto: CreateTenantDto): Promise<Tenant> {
    try {
      const permit = this.permitService.getClient();
      console.log('permit user details', permit.config);
      const permitioTenant = await permit.api.createTenant({
        key: createTenantDto.name.toLowerCase().replace(/\s+/g, '-'),
        name: createTenantDto.name,
        description: `Tenant for ${createTenantDto.name}`,
      });

      console.log('permit io tenant', permitioTenant);

      const tenant = this.tenantRepository.create({
        ...createTenantDto,
        permitKey: permitioTenant.key,
        permitId: permitioTenant.id,
        permitEnvironmentId: permitioTenant.environment_id,
      });

      console.log('tenant db', tenant);
      return this.tenantRepository.save(tenant);
    } catch (error) {
      console.error('Failed to create tenant', error);
      throw new Error('Failed to create tenant. Please try again');
    }
  }

  async findById(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({ where: { id } });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  async update(id: string, updateTenantDto: any): Promise<Tenant> {
    const tenant = await this.findById(id);
    Object.assign(tenant, updateTenantDto);
    return this.tenantRepository.save(tenant);
  }

  async remove(id: string): Promise<void> {
    const tenant = await this.findById(id);
    await this.tenantRepository.remove(tenant);
  }
}
