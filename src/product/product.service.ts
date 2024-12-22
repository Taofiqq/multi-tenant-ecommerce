import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  create(createProductDto: CreateProductDto, tenantId: string) {
    const product = this.productRepository.create({
      ...createProductDto,
      tenantId,
    });
    return this.productRepository.save(product);
  }

  findAll(tenantId: string) {
    return this.productRepository.find({
      where: { tenantId },
    });
  }

  findOne(id: string, tenantId: string) {
    return this.productRepository.findOne({
      where: { id, tenantId },
    });
  }

  async remove(id: string, tenantId: string) {
    const product = await this.findOne(id, tenantId);
    if (product) {
      await this.productRepository.remove(product);
    }
    return product;
  }
}
