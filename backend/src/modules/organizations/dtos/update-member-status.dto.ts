import { IsNotEmpty, IsIn } from 'class-validator';
import type { MemberStatus } from '../../../common/types/index.js';

export class UpdateMemberStatusDto {
  @IsNotEmpty({ message: 'El estado del miembro es obligatorio' })
  @IsIn(['ACTIVE', 'SUSPENDED'], { message: 'Estado de membresía inválido (solo ACTIVE o SUSPENDED)' })
  status!: MemberStatus;
}
