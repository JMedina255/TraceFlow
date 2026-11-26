import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Matches,
  MaxLength,
} from 'class-validator';

export class LinkRepoDto {
  @IsString({ message: 'repoOwner debe ser una cadena de texto válida' })
  @IsNotEmpty({ message: 'repoOwner no puede estar vacío' })
  @MaxLength(100, { message: 'repoOwner no puede superar los 100 caracteres' })
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message: 'repoOwner contiene caracteres inválidos para cuentas/organizaciones GitHub',
  })
  repoOwner!: string;

  @IsString({ message: 'repoName debe ser una cadena de texto válida' })
  @IsNotEmpty({ message: 'repoName no puede estar vacío' })
  @MaxLength(100, { message: 'repoName no puede superar los 100 caracteres' })
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message: 'repoName contiene caracteres inválidos para repositorios GitHub',
  })
  repoName!: string;

  @IsNumber({}, { message: 'installationId debe ser un número entero válido' })
  @IsNotEmpty({ message: 'installationId es obligatorio' })
  installationId!: number;

  @IsOptional()
  @IsString({ message: 'defaultBranch debe ser una cadena de texto válida' })
  @MaxLength(50, { message: 'defaultBranch no puede superar los 50 caracteres' })
  defaultBranch?: string;
}
