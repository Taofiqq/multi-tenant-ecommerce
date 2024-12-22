import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './order.dto';
import { CurrentTenant } from '../tenants/tenant.decorator';
import { Tenant } from '../tenants/tenant.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermitGuard } from '../auth/guards/permit.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard, PermitGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @RequirePermission('create', 'orders')
  create(
    @Body() createOrderDto: CreateOrderDto,
    @CurrentTenant() tenant: Tenant,
  ) {
    return this.orderService.create(createOrderDto, tenant.id);
  }

  @Get()
  findAll(@CurrentTenant() tenant: Tenant) {
    return this.orderService.findAll(tenant.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentTenant() tenant: Tenant) {
    return this.orderService.findOne(id, tenant.id);
  }

  //   @Patch(':id')
  //   update(
  //     @Param('id') id: string,
  //     @Body() updateOrderDto: UpdateOrderDto,
  //     @CurrentTenant() tenant: Tenant,
  //   ) {
  //     return this.orderService.update(id, updateOrderDto, tenant.id);
  //   }
}
