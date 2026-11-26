import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  Matches,
  MaxLength,
  IsArray,
  IsBoolean,
} from 'class-validator';

export class CreateRepoDraftDto {
  @IsString({ message: 'repoOwner debe ser una cadena de texto válida' })
  @IsNotEmpty({ message: 'repoOwner no puede estar vacío' })
  @MaxLength(100, { message: 'repoOwner no puede superar los 100 caracteres' })
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message: 'repoOwner contiene caracteres inválidos',
  })
  repoOwner!: string;

  @IsString({ message: 'repoName debe ser una cadena de texto válida' })
  @IsNotEmpty({ message: 'repoName no puede estar vacío' })
  @MaxLength(100, { message: 'repoName no puede superar los 100 caracteres' })
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message: 'repoName contiene caracteres inválidos. Solo se permiten caracteres alfanuméricos, guiones y puntos.',
  })
  repoName!: string;

  @IsString({ message: 'visibility debe ser public o private' })
  @IsIn(['public', 'private', 'internal'], {
    message: 'visibility debe ser public, private o internal',
  })
  visibility!: 'public' | 'private' | 'internal';

  @IsOptional()
  @IsString({ message: 'description debe ser una cadena' })
  @MaxLength(350, { message: 'description no puede superar los 350 caracteres' })
  description?: string;

  @IsOptional()
  @IsArray({ message: 'initBranches debe ser un arreglo de cadenas' })
  initBranches?: string[];

  @IsOptional()
  @IsBoolean({ message: 'autoInit debe ser un booleano' })
  autoInit?: boolean;
}
