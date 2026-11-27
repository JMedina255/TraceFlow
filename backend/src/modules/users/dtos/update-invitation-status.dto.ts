import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import type { InvitationStatus } from '../../../common/types/index.js';

export class UpdateInvitationStatusDto {
  @IsNotEmpty({ message: 'El nuevo estado de la invitación es obligatorio.' })
  @IsIn(['PENDING', 'CANCELLED', 'EXPIRED', 'ACCEPTED'], {
    message: 'Estado de invitación inválido.',
  })
  status!: InvitationStatus;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  reason?: string;
}
