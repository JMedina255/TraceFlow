import { IsInt, Min, Max, IsOptional, IsObject, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AssignTeamRoleDto } from './assign-team-role.dto.js';
import { ConfigureMethodologyDto } from './configure-methodology.dto.js';
import { CreatePhaseDto } from './create-phase.dto.js';
import { CreateMilestoneDto } from './create-milestone.dto.js';
import { CreateDeliverableDto } from './create-deliverable.dto.js';

export class SaveDraftProgressDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  wizardStep?: number;

  @IsOptional()
  @IsObject()
  draftPayload?: Record<string, any>;
}

export class SaveStep2TeamDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssignTeamRoleDto)
  members!: AssignTeamRoleDto[];
}

export class SaveStep3MethodologyDto {
  @ValidateNested()
  @Type(() => ConfigureMethodologyDto)
  methodology!: ConfigureMethodologyDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePhaseDto)
  phases?: CreatePhaseDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMilestoneDto)
  milestones?: CreateMilestoneDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDeliverableDto)
  deliverables?: CreateDeliverableDto[];
}
