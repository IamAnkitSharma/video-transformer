import { Test, TestingModule } from '@nestjs/testing';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Video } from './entities/video.entity';
import { AuthService } from '../auth/auth.service';

describe('VideosController', () => {
  let controller: VideosController;
  let service: VideosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideosController],
      providers: [
        {
          provide: VideosService,
          useValue: {
            convertSizeToBytes: jest.fn(),
            getVideoDuration: jest.fn(),
            saveVideo: jest.fn(),
            trimVideo: jest.fn(),
            mergeVideos: jest.fn(),
            getAllVideos: jest.fn(),
            generateSharedLink: jest.fn(),
            getSharedVideoLinkById: jest.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            validateApiToken: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<VideosController>(VideosController);
    service = module.get<VideosService>(VideosService);
  });

  describe('uploadVideo', () => {
    it('should upload a video successfully', async () => {
      const mockFile = {
        originalname: 'test.mp4',
        size: 1024,
        path: 'uploads/test.mp4',
      } as Express.Multer.File;
      const mockVideo = {
        id: '1',
        name: 'test.mp4',
        url: 'uploads/test.mp4',
        durationInSeconds: 10,
        sizeInBytes: 1024,
      } as Video;

      jest.spyOn(service, 'convertSizeToBytes').mockReturnValue(2000000); // 2 MB
      jest.spyOn(service, 'getVideoDuration').mockResolvedValue(10);
      jest.spyOn(service, 'saveVideo').mockResolvedValue(mockVideo);

      const result = await controller.uploadVideo(mockFile, {
        maxSize: '2mb',
        minDuration: '5',
        maxDuration: '60',
      });

      expect(result).toEqual(mockVideo);
      expect(service.convertSizeToBytes).toHaveBeenCalledWith('2mb');
      expect(service.saveVideo).toHaveBeenCalledWith(mockFile, 10);
    });

    it('should throw an error if file size exceeds limit', async () => {
      const mockFile = {
        originalname: 'test.mp4',
        size: 3000000,
        path: 'uploads/test.mp4',
      } as Express.Multer.File;

      jest.spyOn(service, 'convertSizeToBytes').mockReturnValue(2000000); // 2 MB

      await expect(
        controller.uploadVideo(mockFile, {
          maxSize: '2mb',
          minDuration: '5',
          maxDuration: '60',
        }),
      ).rejects.toThrow(
        new BadRequestException('File size exceeds the allowed limit.'),
      );
    });

    it('should throw an error if video duration is out of bounds', async () => {
      const mockFile = {
        originalname: 'test.mp4',
        size: 1024,
        path: 'uploads/test.mp4',
      } as Express.Multer.File;

      jest.spyOn(service, 'convertSizeToBytes').mockReturnValue(2000000); // 2 MB
      jest.spyOn(service, 'getVideoDuration').mockResolvedValue(3);

      await expect(
        controller.uploadVideo(mockFile, {
          maxSize: '2mb',
          minDuration: '5',
          maxDuration: '60',
        }),
      ).rejects.toThrow(
        new BadRequestException('Video duration is out of bounds.'),
      );
    });
  });

  describe('trimVideo', () => {
    it('should trim a video successfully', async () => {
      const mockTrimmedVideo = {
        id: '1',
        name: 'trimmed_test.mp4',
        url: 'uploads/trimmed_test.mp4',
        durationInSeconds: 5,
        sizeInBytes: 512,
      } as Video;

      jest.spyOn(service, 'trimVideo').mockResolvedValue(mockTrimmedVideo);

      const result = await controller.trimVideo({
        videoId: '1',
        start: 0,
        end: 5,
      });
      expect(result).toEqual(mockTrimmedVideo);
      expect(service.trimVideo).toHaveBeenCalledWith('1', 0, 5);
    });

    it('should throw an error if neither start nor end is provided', async () => {
      await expect(controller.trimVideo({ videoId: '1' })).rejects.toThrow(
        new BadRequestException('atleast one of start or end is required'),
      );
    });
  });

  describe('mergeVideos', () => {
    it('should merge videos successfully', async () => {
      const mockMergedVideo = {
        id: 'merged_1',
        name: 'merged_video.mp4',
        url: 'uploads/merged_video.mp4',
        durationInSeconds: 180,
        sizeInBytes: 2048,
      } as Video;

      jest.spyOn(service, 'mergeVideos').mockResolvedValue(mockMergedVideo);

      const result = await controller.mergeVideos({ videoIds: ['1', '2'] });
      expect(result).toEqual(mockMergedVideo);
      expect(service.mergeVideos).toHaveBeenCalledWith(['1', '2']);
    });

    it('should throw an error if fewer than two video IDs are provided', async () => {
      await expect(controller.mergeVideos({ videoIds: ['1'] })).rejects.toThrow(
        new BadRequestException(
          'At least two video IDs are required for merging.',
        ),
      );
    });
  });

  describe('listVideos', () => {
    it('should list all videos', async () => {
      const mockVideos = [
        {
          id: '1',
          name: 'Video 1',
          url: 'url1',
          durationInSeconds: 60,
          sizeInBytes: 1024,
        } as Video,
        {
          id: '2',
          name: 'Video 2',
          url: 'url2',
          durationInSeconds: 120,
          sizeInBytes: 2048,
        } as Video,
      ];

      jest.spyOn(service, 'getAllVideos').mockResolvedValue(mockVideos);

      const result = await controller.listVideos();
      expect(result).toEqual(mockVideos);
      expect(service.getAllVideos).toHaveBeenCalled();
    });
  });

  describe('shareVideo', () => {
    it('should generate a shared link', async () => {
      const mockLink = `${process.env.BASE_URL}/videos/shared/123`;

      jest.spyOn(service, 'generateSharedLink').mockResolvedValue({
        link: mockLink,
        expiry: new Date(),
      });

      const result = await controller.shareVideo({
        videoId: '1',
        expiryInSeconds: 3600,
      });
      expect(result).toEqual({
        link: expect.any(String),
        expiry: expect.any(Date),
      });
    });
  });

  describe('getSharedVideo', () => {
    it('should return a shared video link', async () => {
      const mockShared = {
        expiry: new Date(Date.now() + 3600 * 1000),
        video: { id: '1', url: process.env.BASE_URL + '/uploads/test.mp4' },
      };

      jest
        .spyOn(service, 'getSharedVideoLinkById')
        .mockResolvedValue(mockShared);

      const result = await controller.getSharedVideo('123');
      expect(result).toEqual({ link: expect.any(String) });
      expect(service.getSharedVideoLinkById).toHaveBeenCalledWith('123');
    });

    it('should throw an error if the link has expired', async () => {
      const mockShared = {
        expiry: new Date(Date.now() - 3600 * 1000),
        video: { id: '1', url: process.env.BASE_URL + '/uploads/test.mp4' },
      };

      jest
        .spyOn(service, 'getSharedVideoLinkById')
        .mockResolvedValue(mockShared);

      await expect(controller.getSharedVideo('123')).rejects.toThrow(
        new NotFoundException('The video link has expired'),
      );
    });

    it('should throw an error if the invalid video id is passed', async () => {
      const invalidVideoId = '999'; // An ID that doesn't exist in the system

      jest.spyOn(service, 'getSharedVideoLinkById').mockResolvedValue(null); // Assuming that the service returns null for an invalid ID

      await expect(controller.getSharedVideo(invalidVideoId)).rejects.toThrow(
        new NotFoundException('Video not found'),
      );
    });
  });
});
