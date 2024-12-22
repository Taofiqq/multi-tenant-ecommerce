import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from './config/database.config';
import { ConfigService } from '@nestjs/config';
import { TenantModule } from './tenants/tenant.module';
import { TenantMiddleware } from './tenants/tenant.middleware';
import { ProductModule } from './product/product.module';
import { OrderModule } from './order/order.module';
import { UsersModule } from './users/user.module';
import { AuthModule } from './auth/auth.module';
import { PermitModule } from './permit/permit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...configService.get('database'),
      }),
    }),
    TenantModule,
    ProductModule,
    OrderModule,
    UsersModule,
    AuthModule,
    PermitModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude(
        { path: 'tenants(.*)', method: RequestMethod.ALL },
        { path: 'auth(.*)', method: RequestMethod.ALL },
      )
      .forRoutes('*');
  }
}
