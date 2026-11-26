import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import type { CanonicalRoleId, UserAccountStatus } from '../../../common/types/index.js';

export class CreateUserDto {
  @IsNotEmpty({ message: 'El nombre completo es obligatorio.' })
  @IsString()
  @MinLength(3, { message: 'El nombre completo debe tener al menos 3 caracteres.' })
  @MaxLength(120)
  fullName!: string;

  @IsNotEmpty({ message: 'El correo institucional es obligatorio.' })
  @IsEmail({}, { message: 'Debe ingresar un correo institucional válido.' })
  @MaxLength(100)
  email!: string;

  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'El nombre de usuario debe tener al menos 3 caracteres.' })
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message: 'El nombre de usuario solo puede contener letras, números, puntos, guiones y guiones bajos.',
  })
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  position?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  organization?: string;

  @IsOptional()
  @IsString()
  organizationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^(|[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?)$/, {
    message: 'El usuario de GitHub no tiene un formato válido.',
  })
  githubUsername?: string;

  @IsNotEmpty({ message: 'La contraseña inicial temporal es obligatoria.' })
  @IsString()
  @MinLength(8, { message: 'La contraseña inicial debe tener al menos 8 caracteres.' })
  @MaxLength(128)
  password!: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'SUSPENDED'], { message: 'Estado de cuenta inválido.' })
  status?: UserAccountStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleCodes?: CanonicalRoleId[];

  @IsOptional()
  @IsString()
  primaryRoleCode?: CanonicalRoleId;

  @IsOptional()
  @IsBoolean()
  authorizeProjectCreation?: boolean;
}
