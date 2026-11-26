import { IsString, IsNotEmpty, IsOptional, Matches, IsIn } from 'class-validator';

export class CreateMilestoneDto {
  @IsNotEmpty({ message: 'El código del hito es obligatorio.' })
  @IsString()
  code!: string;

  @IsNotEmpty({ message: 'El título del hito es obligatorio.' })
  @IsString()
  title!: string;

  @IsNotEmpty({ message: 'La fecha objetivo es obligatoria.' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha objetivo debe tener formato YYYY-MM-DD.' })
  targetDate!: string;

  @IsOptional()
  @IsString()
  phaseId?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha de completitud debe tener formato YYYY-MM-DD.' })
  completionDate?: string;

  @IsOptional()
  @IsIn(['PENDING', 'ACHIEVED', 'DELAYED', 'CANCELLED'], {
    message: 'El estado del hito debe ser PENDING, ACHIEVED, DELAYED o CANCELLED.',
  })
  status?: 'PENDING' | 'ACHIEVED' | 'DELAYED' | 'CANCELLED';
}
