import { IsNotEmpty, IsString, IsIn, MinLength } from 'class-validator';
import type { Priority } from '../../../common/types/index.js';

export class CreateRfcDto {
  @IsString({ message: 'El identificador del proyecto es obligatorio.' })
  @IsNotEmpty({ message: 'El proyecto no puede estar vacío.' })
  projectId!: string;

  @IsString({ message: 'El elemento de configuración (ECS) afectado es obligatorio.' })
  @IsNotEmpty({ message: 'El ECS afectado no puede estar vacío.' })
  targetEcsId!: string;

  @IsString({ message: 'El título de la RFC debe ser una cadena de texto.' })
  @MinLength(10, { message: 'El título debe tener al menos 10 caracteres.' })
  title!: string;

  @IsString({ message: 'La descripción técnica es obligatoria.' })
  @MinLength(20, { message: 'La descripción debe tener al menos 20 caracteres.' })
  description!: string;

  @IsString({ message: 'La justificación del cambio es obligatoria.' })
  @MinLength(20, { message: 'La justificación debe tener al menos 20 caracteres.' })
  justification!: string;

  @IsIn(['BAJA', 'MEDIA', 'ALTA', 'CRITICA'], {
    message: 'La prioridad debe ser BAJA, MEDIA, ALTA o CRITICA.',
  })
  priority!: Priority;
}
