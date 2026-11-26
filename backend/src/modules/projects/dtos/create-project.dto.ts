import { IsNotEmpty, IsString, Matches, MaxLength, MinLength, IsOptional } from 'class-validator';

export class CreateProjectDto {
  @IsNotEmpty({ message: 'El código del proyecto es obligatorio' })
  @IsString()
  @MinLength(3, { message: 'El código debe tener al menos 3 caracteres' })
  @MaxLength(30, { message: 'El código no puede exceder 30 caracteres' })
  @Matches(/^[A-Z0-9_-]+$/, { message: 'El código debe contener solo mayúsculas, números, guiones y guiones bajos' })
  code!: string;

  @IsNotEmpty({ message: 'La clave nemotécnica del proyecto es obligatoria' })
  @IsString()
  @MinLength(2, { message: 'La clave debe tener al menos 2 caracteres' })
  @MaxLength(30, { message: 'La clave no puede exceder 30 caracteres' })
  @Matches(/^[A-Z0-9_-]+$/, { message: 'La clave debe contener solo mayúsculas, números, guiones y guiones bajos' })
  projectKey!: string;

  @IsNotEmpty({ message: 'El nombre del proyecto es obligatorio' })
  @IsString()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(120, { message: 'El nombre no puede exceder 120 caracteres' })
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty({ message: 'El nombre del cliente o entidad destinataria es obligatorio' })
  @IsString()
  @MaxLength(120)
  clientName!: string;

  @IsNotEmpty({ message: 'La organización propietaria es obligatoria (DA-02)' })
  @IsString()
  organizationId!: string;
}
