import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import type { CanonicalRoleId } from '../../../common/types/index.js';

export class LoginDto {
  @IsEmail({}, { message: 'Debe ingresar un correo institucional válido.' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio.' })
  email!: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  password!: string;

  @IsOptional()
  @IsString()
  requestedRoleId?: CanonicalRoleId;
}
