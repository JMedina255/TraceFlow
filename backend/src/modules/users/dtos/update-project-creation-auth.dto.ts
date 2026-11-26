import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProjectCreationAuthDto {
  @IsNotEmpty({ message: 'El indicador authorized es obligatorio.' })
  @IsBoolean({ message: 'authorized debe ser booleano.' })
  authorized!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  reason?: string;
}
