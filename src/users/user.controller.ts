import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CurrentTenant } from '../tenants/tenant.decorator';
import { Tenant } from '../tenants/tenant.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermitGuard } from '../auth/guards/permit.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { User } from './entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard, PermitGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequirePermission('create', 'users')
  create(
    @Body() createUserDto: CreateUserDto,
    @CurrentTenant() tenant: Tenant,
  ) {
    return this.usersService.create(createUserDto, tenant.id);
  }

  @Get()
  @RequirePermission('read', 'users')
  findAll(@CurrentTenant() tenant: Tenant) {
    return this.usersService.findAll(tenant.id);
  }

  @Get(':id')
  @RequirePermission('read', 'users')
  findOne(@Param('id') id: string, @CurrentTenant() tenant: Tenant) {
    return this.usersService.findOne(id, tenant.id);
  }

  @Put(':id')
  @RequirePermission('update', 'users')
  update(
    @Param('id') id: string,
    @Body() updateData: Partial<User>,
    @CurrentTenant() tenant: Tenant,
  ) {
    return this.usersService.update(id, updateData, tenant.id);
  }
}
