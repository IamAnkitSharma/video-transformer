import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Query,
  BadRequestException,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VideosService } from './videos.service';

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  /**
   * Upload a video with size and duration constraints.
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Query('maxSize') maxSize: string,
    @Query('minDuration') minDuration: string,
    @Query('maxDuration') maxDuration: string,
  ) {
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
   * List all videos
   */
  @Get()
  async listVideos() {
    const videos = await this.videosService.getAllVideos();
    return videos;
  }
}
