import { IsNotEmpty, IsOptional, IsInt, Min, Max, IsIn, IsObject, IsString } from 'class-validator';

export class ConfigureMethodologyDto {
  @IsNotEmpty({ message: 'El tipo de metodología es obligatorio.' })
  @IsIn(['SCRUM', 'KANBAN', 'CASCADA', 'HIBRIDA', 'UPT_ACADEMICA'], {
    message: 'El tipo de metodología debe ser SCRUM, KANBAN, CASCADA, HIBRIDA o UPT_ACADEMICA.',
  })
  methodologyType!: 'SCRUM' | 'KANBAN' | 'CASCADA' | 'HIBRIDA' | 'UPT_ACADEMICA';

  @IsOptional()
  @IsInt({ message: 'La duración de iteraciones en semanas debe ser un número entero.' })
  @Min(1, { message: 'La duración mínima de iteración es de 1 semana.' })
  @Max(8, { message: 'La duración máxima de iteración es de 8 semanas.' })
  iterationDurationWeeks?: number;

  @IsOptional()
  @IsString()
  activePhaseCode?: string;

  @IsOptional()
  @IsObject()
  configurationParams?: Record<string, any>;
}
