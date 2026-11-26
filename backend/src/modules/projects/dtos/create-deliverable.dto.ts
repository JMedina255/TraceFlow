import { IsString, IsNotEmpty, IsOptional, Matches, IsIn } from 'class-validator';

export class CreateDeliverableDto {
  @IsNotEmpty({ message: 'El código del entregable es obligatorio.' })
  @IsString()
  code!: string;

  @IsNotEmpty({ message: 'El nombre del entregable es obligatorio.' })
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty({ message: 'El tipo esperado de entregable es obligatorio.' })
  @IsIn(['SOFTWARE_RELEASE', 'TECHNICAL_DOCUMENT', 'SOURCE_BRANCH', 'TEST_REPORT', 'DB_MIGRATION'], {
    message: 'El tipo esperado debe ser SOFTWARE_RELEASE, TECHNICAL_DOCUMENT, SOURCE_BRANCH, TEST_REPORT o DB_MIGRATION.',
  })
  expectedType!: 'SOFTWARE_RELEASE' | 'TECHNICAL_DOCUMENT' | 'SOURCE_BRANCH' | 'TEST_REPORT' | 'DB_MIGRATION';

  @IsOptional()
  @IsString()
  phaseId?: string;

  @IsOptional()
  @IsString()
  milestoneId?: string;

  @IsOptional()
  @IsString()
  responsibleUserId?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha objetivo debe tener formato YYYY-MM-DD.' })
  targetDate?: string;

  @IsOptional()
  @IsString()
  associatedEcsId?: string;

  @IsOptional()
  @IsIn(['PENDING', 'SUBMITTED', 'ACCEPTED', 'REJECTED'], {
    message: 'El estado del entregable debe ser PENDING, SUBMITTED, ACCEPTED o REJECTED.',
  })
  status?: 'PENDING' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED';
}
