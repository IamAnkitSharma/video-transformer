import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  Query,
  BadRequestException,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VideosService } from './videos.service';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { MergeVideoDTO, TrimVideoDTO, UploadVideoDTO } from './video.dto';

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  /**
   * Upload a video with size and duration constraints.
   */
  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Query() uploadVideoDTO: UploadVideoDTO
  ) {
    const { maxSize, minDuration, maxDuration } = uploadVideoDTO;
    const maxSizeBytes = this.videosService.convertSizeToBytes(
      maxSize || '20mb',
    );
    const minDurationSec = parseInt(minDuration || '5', 10);
    const maxDurationSec = parseInt(maxDuration || '60', 10);

    if (file.size > maxSizeBytes) {
      throw new BadRequestException('File size exceeds the allowed limit.');
    }

    const duration = await this.videosService.getVideoDuration(file.path);

    if (duration < minDurationSec || duration > maxDurationSec) {
      throw new BadRequestException('Video duration is out of bounds.');
    }

    const video = await this.videosService.saveVideo(file, duration);
    return video;
  }

  /**
   * Trim an uploaded video by specifying start and end times.
   */
  @Post('trim')
  async trimVideo(
    @Body() trimVideoDto: TrimVideoDTO
  ) {
    const { videoId, start, end } = trimVideoDto;
    const trimmedVideo = await this.videosService.trimVideo(
      videoId,
      start,
      end,
    );
    return trimmedVideo;
  }

  /**
   * Merge multiple uploaded videos into one.
   */
  @Post('merge')
  async mergeVideos(@Body() mergeVideosDTO: MergeVideoDTO) {
    const { videoIds } = mergeVideosDTO;
    if (!Array.isArray(videoIds) || videoIds.length < 2) {
      throw new BadRequestException(
        'At least two video IDs are required for merging.',
      );
    }

    const mergedVideo = await this.videosService.mergeVideos(videoIds);
    return mergedVideo;
  }

  /**
   * List all videos from the database.
   */
  @Get()
  async listVideos() {
    const videos = await this.videosService.getAllVideos();
    return videos;
  }
}
