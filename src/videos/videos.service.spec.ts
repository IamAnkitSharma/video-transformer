import { Test, TestingModule } from '@nestjs/testing';
import { VideosService } from './videos.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Video } from './entities/video.entity';
import { SharedLink } from './entities/shared-link.entity';
import * as fs from 'fs';
import * as ffmpeg from 'fluent-ffmpeg';

jest.mock('fs');
jest.mock('fluent-ffmpeg');

describe('VideosService', () => {
  let service: VideosService;
  let videoRepository: jest.Mocked<Repository<Video>>;
  let sharedLinkRepository: jest.Mocked<Repository<SharedLink>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideosService,
        {
          provide: getRepositoryToken(Video),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(SharedLink),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<VideosService>(VideosService);
    videoRepository = module.get(getRepositoryToken(Video));
    sharedLinkRepository = module.get(getRepositoryToken(SharedLink));
  });

  describe('getAllVideos', () => {
    it('should return all videos sorted by createdAt', async () => {
      const mockVideos = [
        { id: '1', name: 'Video 1', createdAt: new Date() },
        { id: '2', name: 'Video 2', createdAt: new Date() },
      ];
      jest
        .spyOn(videoRepository, 'find')
        .mockResolvedValue(mockVideos as Video[]);

      const result = await service.getAllVideos();
      expect(result).toEqual(mockVideos);
      expect(videoRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'desc' },
      });
    });
  });

  describe('saveVideo', () => {
    it('should save a video and return the saved entity', async () => {
      const mockVideo = {
        name: 'test.mp4',
        sizeInBytes: 1024,
        durationInSeconds: 120,
        url: 'uploads/test.mp4',
      };
      jest.spyOn(videoRepository, 'create').mockReturnValue(mockVideo as Video);
      jest.spyOn(videoRepository, 'save').mockResolvedValue(mockVideo as Video);

      const result = await service.saveVideo(
        {
          originalname: 'test.mp4',
          size: 1024,
          path: 'uploads/test.mp4',
        } as any,
        120,
      );

      expect(result).toEqual(mockVideo);
      expect(videoRepository.create).toHaveBeenCalledWith(mockVideo);
      expect(videoRepository.save).toHaveBeenCalledWith(mockVideo);
    });
  });

  describe('getVideoDuration', () => {
    it('should return video duration using ffmpeg', async () => {
      jest.spyOn(ffmpeg, 'ffprobe').mockImplementation((_, callback) => {
        callback(null, { format: { duration: 120 } } as any);
      });

      const duration = await service.getVideoDuration('path/to/video.mp4');
      expect(duration).toBe(120);
    });

    it('should throw an error if ffprobe fails', async () => {
      jest.spyOn(ffmpeg, 'ffprobe').mockImplementation((_, callback) => {
        callback(new Error('ffprobe error'), null);
      });

      await expect(
        service.getVideoDuration('path/to/video.mp4'),
      ).rejects.toThrow('ffprobe error');
    });
  });

  describe('trimVideo', () => {
    it('should trim the video and save the result', async () => {
      const mockVideo = {
        id: '1',
        name: 'test.mp4',
        url: 'uploads/test.mp4',
        durationInSeconds: 120,
      };
      jest
        .spyOn(videoRepository, 'findOne')
        .mockResolvedValue(mockVideo as Video);
      jest.spyOn(fs, 'statSync').mockReturnValue({ size: 1024 } as any);
      jest.spyOn(service, 'getVideoDuration').mockResolvedValue(60);
      jest.spyOn(videoRepository, 'create').mockReturnValue({
        name: 'trimmed_test.mp4',
        url: 'uploads/test_trimmed.mp4',
        sizeInBytes: 1024,
        durationInSeconds: 60,
      } as Video);
      jest.spyOn(videoRepository, 'save').mockResolvedValue(mockVideo as Video);

      jest
        .spyOn(service as any, 'processVideoTrim')
        .mockResolvedValue(undefined);

      const result = await service.trimVideo(mockVideo.id, 0, 60);
      expect(result).toBeDefined();
      expect(videoRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockVideo.id },
      });
      expect(service['processVideoTrim']).toHaveBeenCalledWith(
        'uploads/test.mp4',
        '0',
        '60',
        'uploads/test_trimmed.mp4',
      );
      expect(videoRepository.save).toHaveBeenCalled();
    });

    it('should throw an error if video is not found', async () => {
      jest.spyOn(videoRepository, 'findOne').mockResolvedValue(null);

      await expect(service.trimVideo('invalid_id', 0, 60)).rejects.toThrow(
        'Video not found.',
      );
    });
  });

  describe('generateSharedLink', () => {
    it('should generate and return a shared link', async () => {
      const mockVideo = { id: '1', name: 'test.mp4' };
      const mockLink = {
        id: 'link1',
        video: mockVideo,
        expiry: new Date(),
      };

      jest
        .spyOn(videoRepository, 'findOneBy')
        .mockResolvedValue(mockVideo as Video);
      jest
        .spyOn(sharedLinkRepository, 'save')
        .mockResolvedValue(mockLink as SharedLink);

      const result = await service.generateSharedLink(mockVideo.id, new Date());
      expect(result).toEqual({
        link: expect.any(String),
        expiry: expect.any(Date),
      });
      expect(sharedLinkRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          video: mockVideo,
        }),
      );
    });
  });
});
