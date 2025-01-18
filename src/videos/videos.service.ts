import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video } from './video.entity';
import * as ffmpeg from 'fluent-ffmpeg';

@Injectable()
export class VideosService {
  constructor(
    @InjectRepository(Video) private videoRepository: Repository<Video>,
  ) {}

  /**
   * Get all videos
   */
  async getAllVideos(): Promise<Video[]> {
    return this.videoRepository.find();
  }

  /**
   * Save a video to the database.
   */
  async saveVideo(file: Express.Multer.File, duration: number): Promise<Video> {
    const video = this.videoRepository.create({
      name: file.originalname,
      size: file.size,
      durationInSeconds: duration,
      url: file.path,
    });
    return this.videoRepository.save(video);
  }

  /**
   * Get the duration of a video file in seconds.
   */
  async getVideoDuration(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          return reject(err);
        }
        resolve(metadata.format.duration);
      });
    });
  }
  /**
   * Convert human-readable size (e.g., "5mb") to bytes.
   */
  convertSizeToBytes(size: string): number {
    const units = { kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
    const match = size.toLowerCase().match(/^(\d+)(kb|mb|gb)$/);

    if (!match) {
      throw new BadRequestException('Invalid size format.');
    }

    const [_, value, unit] = match;
    return parseInt(value, 10) * units[unit];
  }
}
