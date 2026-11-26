import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class AssignTeamRoleDto {
  @IsNotEmpty({ message: 'El identificador o código de usuario es obligatorio.' })
  @IsString()
  userId!: string;

  @IsNotEmpty({ message: 'El rol funcional (código PU-01..PU-07 o ID numérico) es obligatorio.' })
  roleIdOrCode!: number | string;

  @IsOptional()
  @IsString()
  functionalTitle?: string;

  @IsOptional()
  @IsBoolean()
  isLead?: boolean;
}
