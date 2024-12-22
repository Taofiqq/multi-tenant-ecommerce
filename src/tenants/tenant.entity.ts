import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  domain: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ unique: true })
  permitKey: string;

  @Column({ unique: true })
  permitId: string;

  @Column()
  permitEnvironmentId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
