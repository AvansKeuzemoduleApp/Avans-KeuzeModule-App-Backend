import { IsOptional, IsString } from 'class-validator';

/**
 * Query DTO for log filtering
 * Accepts a JSON string representing filter conditions
 */
export class LogFilterQueryDto {
  @IsOptional()
  @IsString()
  filter?: string;
}
