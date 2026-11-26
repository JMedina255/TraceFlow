import { IsString, IsNotEmpty, IsInt, Min, Matches, IsIn, IsOptional } from 'class-validator';

export class CreatePhaseDto {
  @IsNotEmpty({ message: 'El código de fase es obligatorio.' })
  @IsString()
  phaseCode!: string;

  @IsNotEmpty({ message: 'El nombre de la fase es obligatorio.' })
  @IsString()
  name!: string;

  @IsInt({ message: 'El orden de secuencia debe ser un entero.' })
  @Min(1, { message: 'El orden de secuencia debe ser mayor o igual a 1.' })
  sequenceOrder!: number;

  @IsNotEmpty({ message: 'La fecha de inicio es obligatoria.' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha de inicio debe tener formato YYYY-MM-DD.' })
  startDate!: string;

  @IsNotEmpty({ message: 'La fecha de fin es obligatoria.' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha de fin debe tener formato YYYY-MM-DD.' })
  endDate!: string;

  @IsOptional()
  @IsIn(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'], {
    message: 'El estado de la fase debe ser PLANNED, IN_PROGRESS, COMPLETED o BLOCKED.',
  })
  status?: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
}
