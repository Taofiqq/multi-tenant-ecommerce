import { IsEmail, IsString } from 'class-validator';

export class RegisterTenantDto {
  @IsString()
  tenantName: string;

  @IsString()
  domain: string;

  @IsString()
  adminFirstName: string;

  @IsString()
  adminLastName: string;

  @IsEmail()
  adminEmail: string;

  @IsString()
  adminPassword: string;
}
