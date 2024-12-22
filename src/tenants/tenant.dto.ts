import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  name: string;

  @IsString()
  domain: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
