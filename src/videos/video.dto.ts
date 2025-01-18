import { ApiProperty } from '@nestjs/swagger';

export class UploadVideoDTO {
  @ApiProperty({
    description: 'Maximum size of the video',
    examples: ['100mb', '1gb'],
    nullable: true,
  })
  maxSize?: string;

  @ApiProperty({
    description: 'Minimum duration in seconds',
    nullable: true,
  })
  minDuration?: string;
  @ApiProperty({
    description: 'Maximum duration in seconds',
    nullable: true,
  })
  maxDuration?: string;
}

export class TrimVideoDTO {
  @ApiProperty({
    description: 'ID of the video to be trimmed',
  })
  videoId: string;

  @ApiProperty({
    description: 'Starting point',
    nullable: true,
  })
  start?: string;
  @ApiProperty({
    description: 'Ending point',
    nullable: true,
  })
  end?: string;
}

export class MergeVideoDTO {
  @ApiProperty({
    description: 'IDs of the video to be merged',
  })
  videoIds: string[];
}
