import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video } from './video.entity';
import * as fs from 'fs';
import * as path from 'path';
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
      sizeInBytes: file.size,
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
   * Trim a video by specifying start and end times.
   */
  async trimVideo(videoId: string, start: string, end: string): Promise<Video> {
    const video = await this.videoRepository.findOne({
      where: { id: videoId },
    });

    if (!video) {
      throw new NotFoundException('Video not found.');
    }

    const trimmedFilePath = this.generateTrimmedFilePath(video.url);
    await this.processVideoTrim(video.url, start || '0', end || video.durationInSeconds.toString(), trimmedFilePath);

    const trimmedVideo = this.videoRepository.create({
      name: `trimmed_${video.name}`,
      sizeInBytes: fs.statSync(trimmedFilePath).size,
      durationInSeconds: await this.getVideoDuration(trimmedFilePath),
      url: trimmedFilePath,
    });
    return this.videoRepository.save(trimmedVideo);
  }

  /**
   * Merge multiple videos into one.
   */
  async mergeVideos(videoIds: string[]): Promise<Video> {
    const videos = await this.videoRepository.findByIds(videoIds);

    if (videos.length !== videoIds.length) {
      throw new NotFoundException('Some videos were not found.');
    }

    const mergedFilePath = this.generateMergedFilePath();
    await this.processVideoMerge(
      videos.map((video) => video.url),
      mergedFilePath,
    );

    const mergedVideo = this.videoRepository.create({
      name: 'merged_video.mp4',
      sizeInBytes: fs.statSync(mergedFilePath).size,
      durationInSeconds: await this.getVideoDuration(mergedFilePath),
      url: mergedFilePath,
    });
    return this.videoRepository.save(mergedVideo);
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

  /**
   * Helper function: Process video trimming using ffmpeg.
   */
  private async processVideoTrim(
    inputPath: string,
    start: string,
    end: string,
    outputPath: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime(start)
        .setDuration(end)
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
  }

  /**
   * Helper function: Process video merging using ffmpeg.
   */
  private async processVideoMerge(
    inputPaths: string[],
    outputPath: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpegCommand = ffmpeg();

      inputPaths.forEach((input) => {
        ffmpegCommand.input(input);
      });

      ffmpegCommand
        .mergeToFile(outputPath)
        .on('end', resolve)
        .on('error', reject);
    });
  }

  /**
   * Generate a unique file path for trimmed videos.
   */
  private generateTrimmedFilePath(originalPath: string): string {
    const ext = path.extname(originalPath);
    const base = path.basename(originalPath, ext);
    return path.join(path.dirname(originalPath), `${base}_trimmed${ext}`);
  }

  /**
   * Generate a unique file path for merged videos.
   */
  private generateMergedFilePath(): string {
    return path.join('uploads', `merged_${Date.now()}.mp4`);
  }
}
