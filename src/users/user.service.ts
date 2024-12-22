import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { Tenant } from '../tenants/tenant.entity';
import { PermitService } from '../permit/permit.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    private permitService: PermitService,
  ) {}

  async create(createUserDto: CreateUserDto, tenantId: string): Promise<User> {
    try {
      const tenant = await this.tenantRepository.findOne({
        where: { id: tenantId },
      });

      const existingUser = await this.findByEmail(
        createUserDto.email,
        tenantId,
      );
      if (existingUser) {
        throw new ConflictException('Email already exists in this tenant');
      }

      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      const user = this.usersRepository.create({
        ...createUserDto,
        password: hashedPassword,
        tenantId,
      });

      const savedUser = await this.usersRepository.save(user);

      try {
        const permit = this.permitService.getClient();
        await permit.api.syncUser({
          key: savedUser.id,
          email: savedUser.email,
          first_name: savedUser.firstName,
          last_name: savedUser.lastName,
          attributes: {
            tenantId: savedUser.tenantId,
          },
          role_assignments: [
            {
              role: savedUser.role,
              tenant: tenant.permitKey,
            },
          ],
        });
      } catch (permitError) {
        await this.usersRepository.remove(savedUser);

        throw new Error('Failed to set up user permissions. Please try again.');
      }

      return savedUser;
    } catch (error) {
      if (
        error.message === 'Failed to set up user permissions. Please try again.'
      ) {
        throw error;
      }
      throw new Error('Failed to create user. Please try again.');
    }
  }

  async findAll(tenantId: string): Promise<User[]> {
    return this.usersRepository.find({
      where: { tenantId },
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'role',
        'isActive',
        'createdAt',
      ],
    });
  }

  async findOne(id: string, tenantId: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id, tenantId },
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'role',
        'isActive',
        'createdAt',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string, tenantId?: string): Promise<User> {
    const whereClause: any = { email };
    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    return this.usersRepository.findOne({
      where: whereClause,
    });
  }

  async update(
    id: string,
    updateData: Partial<User>,
    tenantId: string,
  ): Promise<User> {
    const user = await this.findOne(id, tenantId);

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const updatedUser = {
      ...user,
      ...updateData,
    };

    await this.usersRepository.save(updatedUser);

    // Sync updated user with Permit.io
    const permit = this.permitService.getClient();
    await permit.api.syncUser({
      key: updatedUser.id,
      email: updatedUser.email,
      first_name: updatedUser.firstName,
      last_name: updatedUser.lastName,
      role_assignments: [{ role: updatedUser.role }],
      attributes: {
        tenantId: updatedUser.tenantId,
      },
    });

    return this.findOne(id, tenantId);
  }
}
