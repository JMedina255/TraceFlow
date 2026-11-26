import { IsNotEmpty, IsString, IsIn, IsOptional } from 'class-validator';
import type { OrganizationRole } from '../../../common/types/index.js';

export class AddMemberDto {
  @IsNotEmpty({ message: 'El identificador, código o email del usuario es obligatorio' })
  @IsString()
  userCodeOrEmailOrId!: string;

  @IsOptional()
  @IsIn(['OWNER', 'ADMIN', 'MEMBER', 'AUDITOR'], { message: 'Rol organizacional inválido' })
  roleInOrg?: OrganizationRole = 'MEMBER';
}
