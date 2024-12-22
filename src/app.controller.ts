import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller()
export class AppController {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    private readonly appService: AppService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test-db')
  async testDB() {
    try {
      await this.dataSource.query('SELECT NOW()');
      return { message: 'Database connection is working!' };
    } catch (error) {
      return { error: 'Database connection failed', details: error.message };
    }
  }
}
