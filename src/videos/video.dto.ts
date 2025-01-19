import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class UploadVideoDTO {
  @ApiProperty({
    description: 'Maximum size of the video',
    nullable: true,
    example: '100mb',
  })
  @IsOptional()
  maxSize?: string;

  @ApiProperty({
    description: 'Minimum duration in seconds',
    nullable: true,
    example: '1',
  })
  @IsOptional()
  minDuration?: string;

  @ApiProperty({
    description: 'Maximum duration in seconds',
    nullable: true,
    example: '21600',
  })
  @IsOptional()
  maxDuration?: string;
}

export class TrimVideoDTO {
  @ApiProperty({
    description: 'ID of the video to be trimmed',
  })
  videoId: string;

  @ApiProperty({
    description: 'Starting point',
    example: '1',
    nullable: true,
  })
  @IsOptional()
  start?: number;
  @ApiProperty({
    description: 'Ending point',
    example: '5',
    nullable: true,
  })
  @IsOptional()
  end?: number;
}

export class MergeVideoDTO {
  @ApiProperty({
    description: 'IDs of the video to be merged',
  })
  videoIds: string[];
}

export class ShareVideoLinkDTO {
  @ApiProperty({
    description: 'ID of the video to be trimmed',
  })
  videoId: string;

  @ApiProperty({
    description: 'Expiry in seconds',
    nullable: true,
    example: '7200',
  })
  @IsOptional()
  expiryInSeconds?: number;
}
