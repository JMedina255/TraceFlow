import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import type { UserAccountStatus } from '../../../common/types/index.js';

export class UpdateUserStatusDto {
  @IsNotEmpty({ message: 'El estado objetivo es obligatorio.' })
  @IsIn(['ACTIVE', 'INACTIVE', 'SUSPENDED'], { message: 'Estado de cuenta inválido.' })
  status!: UserAccountStatus;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  reason?: string;
}
