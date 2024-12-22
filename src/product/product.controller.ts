import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './product.dto';
import { CurrentTenant } from '../tenants/tenant.decorator';
import { Tenant } from '../tenants/tenant.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermitGuard } from '../auth/guards/permit.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@Controller('products')
@UseGuards(JwtAuthGuard, PermitGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @RequirePermission('create', 'products')
  create(
    @Body() createProductDto: CreateProductDto,
    @CurrentTenant() tenant: Tenant,
  ) {
    console.log('current tenant check', tenant);
    return this.productService.create(createProductDto, tenant.id);
  }

  @Get()
  @RequirePermission('read', 'products')
  findAll(@CurrentTenant() tenant: Tenant) {
    return this.productService.findAll(tenant.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentTenant() tenant: Tenant) {
    return this.productService.findOne(id, tenant.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentTenant() tenant: Tenant) {
    return this.productService.remove(id, tenant.id);
  }
}
