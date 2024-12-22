// src/orders/order.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './order.dto';
import { ProductService } from '../product/product.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    private productService: ProductService,
  ) {}

  async create(createOrderDto: CreateOrderDto, tenantId: string) {
    // Generate order number
    const orderNumber = await this.generateOrderNumber(tenantId);

    // Calculate totals and create order items
    const items = await Promise.all(
      createOrderDto.items.map(async (item) => {
        const product = await this.productService.findOne(
          item.productId,
          tenantId,
        );
        console.log('product', product);
        if (!product) {
          throw new NotFoundException(`Product ${item.productId} not found`);
        }

        return this.orderItemRepository.create({
          productId: product.id,
          quantity: item.quantity,
          unitPrice: product.price,
          totalPrice: product.price * item.quantity,
        });
      }),
    );

    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

    // Create order
    const order = this.orderRepository.create({
      ...createOrderDto,
      orderNumber,
      tenantId,
      items,
      totalAmount,
    });

    return this.orderRepository.save(order);
  }

  findAll(tenantId: string) {
    return this.orderRepository.find({
      where: { tenantId },
      relations: ['items', 'items.product'],
    });
  }

  findOne(id: string, tenantId: string) {
    return this.orderRepository.findOne({
      where: { id, tenantId },
      relations: ['items', 'items.product'],
    });
  }

  //   async update(id: string, updateOrderDto: UpdateOrderDto, tenantId: string) {
  //     const order = await this.findOne(id, tenantId);
  //     if (!order) {
  //       throw new NotFoundException(`Order ${id} not found`);
  //     }

  //     Object.assign(order, updateOrderDto);
  //     return this.orderRepository.save(order);
  //   }

  private async generateOrderNumber(tenantId: string): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();

    // Get count of orders for this tenant this year
    const count = await this.orderRepository.count({
      where: {
        tenantId,
        createdAt: Between(
          new Date(year, 0, 1),
          new Date(year, 11, 31, 23, 59, 59),
        ),
      },
    });

    // Format: ORD-2024-0001
    return `ORD-${year}-${(count + 1).toString().padStart(4, '0')}`;
  }
}
