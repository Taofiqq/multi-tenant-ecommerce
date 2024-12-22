import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/user.service';
import { TenantService } from '../tenants/tenant.service';
import { LoginDto } from './dto/login.dto';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../users/entities/user.entity';
import { PermitService } from '../permit/permit.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private tenantService: TenantService,
    private jwtService: JwtService,
    private permitService: PermitService,
  ) {}

  async registerTenant(registerTenantDto: RegisterTenantDto) {
    const tenant = await this.tenantService.create({
      name: registerTenantDto.tenantName,
      domain: registerTenantDto.domain,
    });

    const user = await this.usersService.create(
      {
        firstName: registerTenantDto.adminFirstName,
        lastName: registerTenantDto.adminLastName,
        email: registerTenantDto.adminEmail,
        password: registerTenantDto.adminPassword,
        role: UserRole.ADMIN,
      },
      tenant.id,
    );

    // Sync user with Permit.io
    const permit = this.permitService.getClient();
    await permit.api.syncUser({
      key: user.id,
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      role_assignments: [
        {
          role: UserRole.ADMIN,
          tenant: tenant.permitKey,
        },
      ],
      attributes: {
        tenantId: tenant.id,
        permitTenantId: tenant.permitId,
        environmentId: tenant.permitEnvironmentId,
      },
    });

    return this.login({
      email: user.email,
      password: registerTenantDto.adminPassword,
    });
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tenant = await this.tenantService.findById(user.tenantId);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
      },
    };
  }
}
