import { ArrayNotEmpty, IsArray, IsOptional, IsString } from 'class-validator';
import type { CanonicalRoleId } from '../../../common/types/index.js';

export class UpdateUserRolesDto {
  @IsArray({ message: 'Debe proporcionar una lista de perfiles.' })
  @ArrayNotEmpty({ message: 'Debe mantener al menos un perfil activo asignado.' })
  @IsString({ each: true })
  roleCodes!: CanonicalRoleId[];

  @IsOptional()
  @IsString()
  primaryRoleCode?: CanonicalRoleId;
}
