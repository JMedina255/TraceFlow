import { IsNotEmpty, IsString, Matches, MaxLength, MinLength, IsOptional } from 'class-validator';

export class CreateOrganizationDto {
  @IsNotEmpty({ message: 'El código de la organización es obligatorio' })
  @IsString()
  @MinLength(3, { message: 'El código debe tener al menos 3 caracteres' })
  @MaxLength(30, { message: 'El código no puede exceder 30 caracteres' })
  @Matches(/^[A-Z0-9_-]+$/, { message: 'El código debe contener solo mayúsculas, números, guiones y guiones bajos' })
  code!: string;

  @IsNotEmpty({ message: 'El nombre de la organización es obligatorio' })
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(120, { message: 'El nombre no puede exceder 120 caracteres' })
  name!: string;

  @IsNotEmpty({ message: 'El slug de la organización es obligatorio' })
  @IsString()
  @MinLength(2, { message: 'El slug debe tener al menos 2 caracteres' })
  @MaxLength(60, { message: 'El slug no puede exceder 60 caracteres' })
  @Matches(/^[a-z0-9-]+$/, { message: 'El slug debe contener solo minúsculas, números y guiones' })
  slug!: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  legalName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  taxId?: string;
}
