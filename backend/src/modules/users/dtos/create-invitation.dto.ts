import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import type { CanonicalRoleId, InvitationChannel } from '../../../common/types/index.js';

export class CreateInvitationDto {
  @IsNotEmpty({ message: 'El canal de invitación es obligatorio (EMAIL o GITHUB).' })
  @IsIn(['EMAIL', 'GITHUB'], { message: 'Canal de invitación inválido. Use EMAIL o GITHUB.' })
  channel!: InvitationChannel;

  @ValidateIf((o) => o.channel === 'EMAIL')
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio cuando el canal es EMAIL.' })
  @IsEmail({}, { message: 'Debe ingresar un correo electrónico válido.' })
  @MaxLength(100)
  email?: string;

  @ValidateIf((o) => o.channel === 'GITHUB')
  @IsNotEmpty({ message: 'El nombre de usuario de GitHub es obligatorio cuando el canal es GITHUB.' })
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/, {
    message: 'El nombre de usuario de GitHub no tiene un formato válido.',
  })
  githubUsername?: string;

  @IsNotEmpty({ message: 'El perfil propuesto es obligatorio.' })
  @IsString()
  intendedRoleCode!: CanonicalRoleId;

  @IsOptional()
  @IsString()
  organizationId?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;

  @IsOptional()
  @IsString()
  expiresAt?: string;
}
