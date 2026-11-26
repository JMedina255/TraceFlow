import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'El nombre completo debe tener al menos 3 caracteres.' })
  @MaxLength(120)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  position?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  organization?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^(|[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?)$/, {
    message: 'El usuario de GitHub no tiene un formato válido.',
  })
  githubUsername?: string;
}
