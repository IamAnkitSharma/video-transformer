import {
    Controller,
    Post,
    Body,
    UploadedFile,
    UseInterceptors,
    Query,
    BadRequestException,
    Get,
    NotFoundException,
    Param,
    UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VideosService } from './videos.service';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { MergeVideoDTO, ShareVideoLinkDTO, TrimVideoDTO, UploadVideoDTO } from './video.dto';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { ApiTokenGuard } from '../auth/auth.guard';

@Controller('videos')
@ApiBearerAuth()
@UseGuards(ApiTokenGuard)
export class VideosController {

    DEFAULT_VIDEO_SHARING_EXPIRY_IN_SECONDS: number = 86400;
    constructor(private readonly videosService: VideosService) { }

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
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, callback) => {
              const uniqueName = `${randomUUID()}${extname(file.originalname)}`;
              callback(null, uniqueName);
            },
        }),
    }))
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
        if (!start && !end) throw new BadRequestException('atleast one of start or end is required')
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

    /**
    * Generate a shared link for an uploaded video with an expiry time.
    */
    @Post('share')
    async shareVideo(
        @Body() shareVideoLinkDTO: ShareVideoLinkDTO
    ) {
        const { videoId, expiryInSeconds } = shareVideoLinkDTO;

        const expiryDate = new Date(new Date().getTime() + (expiryInSeconds || this.DEFAULT_VIDEO_SHARING_EXPIRY_IN_SECONDS) * 1000);

        const sharedLink = await this.videosService.generateSharedLink(
            videoId,
            expiryDate,
        );
        return { link: sharedLink.link, expiry: sharedLink.expiry };
    }

    @Get('shared/:id')
    async getSharedVideo(@Param('id') id: string) {
        const shared = await this.videosService.getSharedVideoLinkById(id);
        if (!shared) {
            throw new NotFoundException('Video not found');
        }

        if (new Date(shared.expiry).getTime() <= new Date().getTime()) {
            throw new NotFoundException('The video link has expired');
        }

        return { 
            link: `${process.env.BASE_URL}/${shared.video.url}`
        };
    }
}
