import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { VideosModule } from './videos.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Video } from './entities/video.entity';
import { SharedLink } from './entities/shared-link.entity';

const getAuthToken = () => `Bearer ${process.env.STATIC_API_TOKEN}`;

describe('VideosController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          dropSchema: true,
          entities: [Video, SharedLink],
          synchronize: true,
        }),
        VideosModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /videos/upload', () => {
    it('should upload a video successfully', async () => {
      const filePath = `${__dirname}/test-files/sample-1.mp4`;

      const queryParams = new URLSearchParams({
        maxSize: '100mb',
        minDuration: '1',
        maxDuration: '60',
      });

      const response = await request(app.getHttpServer())
        .post('/videos/upload?' + queryParams)
        .set('Authorization', getAuthToken())
        .set('Content-Type', 'multipart/form-data')
        .attach('file', filePath);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('url');
    });

    it('should throw error if file is not attached', async () => {
      const queryParams = new URLSearchParams({
        maxSize: '100mb',
        minDuration: '1',
        maxDuration: '60',
      });

      const response = await request(app.getHttpServer())
        .post('/videos/upload?' + queryParams)
        .set('Authorization', getAuthToken())
        .set('Content-Type', 'multipart/form-data');

      expect(response.status).toBe(400);
    });

    it('should throw an error if video exceeds size limit', async () => {
      const filePath = `${__dirname}/test-files/sample-1.mp4`;

      const queryParams = new URLSearchParams({
        maxSize: '1mb',
        minDuration: '1',
        maxDuration: '60',
      });

      const response = await request(app.getHttpServer())
        .post('/videos/upload?' + queryParams)
        .set('Authorization', getAuthToken())
        .set('Content-Type', 'multipart/form-data')
        .attach('file', filePath);

      expect(response.status).toBe(400);
      expect(response.body.message).toEqual(
        'File size exceeds the allowed limit.',
      );
    });

    it('should throw an error if video duration is out of bounds', async () => {
      const filePath = `${__dirname}/test-files/sample-1.mp4`;

      const queryParams = new URLSearchParams({
        maxSize: '100mb',
        minDuration: '1000',
        maxDuration: '10000',
      });

      const response = await request(app.getHttpServer())
        .post('/videos/upload?' + queryParams)
        .set('Authorization', getAuthToken())
        .set('Content-Type', 'multipart/form-data')
        .attach('file', filePath);

      expect(response.status).toBe(400);
      expect(response.body.message).toEqual('Video duration is out of bounds.');
    });

    it('should throw an error if invalid size format is provided', async () => {
      const filePath = `${__dirname}/test-files/sample-1.mp4`;

      const queryParams = new URLSearchParams({
        maxSize: '1mab', // incorrect format
        minDuration: '1',
        maxDuration: '60',
      });

      const response = await request(app.getHttpServer())
        .post('/videos/upload?' + queryParams)
        .set('Authorization', getAuthToken())
        .set('Content-Type', 'multipart/form-data')
        .attach('file', filePath);

      expect(response.status).toBe(400);
      expect(response.body.message).toEqual('Invalid size format.');
    });
  });

  describe('POST /videos/trim', () => {
    let videoId: string;

    beforeEach(async () => {
      const filePath = `${__dirname}/test-files/sample-1.mp4`;

      const queryParams = new URLSearchParams({
        maxSize: '100mb',
        minDuration: '1',
        maxDuration: '60',
      });

      const uploadResponse = await request(app.getHttpServer())
        .post('/videos/upload?' + queryParams)
        .set('Authorization', getAuthToken())
        .set('Content-Type', 'multipart/form-data')
        .attach('file', filePath);

      videoId = uploadResponse.body.id;
    });

    it('should trim the video successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/videos/trim')
        .set('Authorization', getAuthToken())
        .send({ videoId, start: 0, end: 5 });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toContain('trimmed');
    }, 20000);

    it('should trim the video successfully if start is not provided', async () => {
      const response = await request(app.getHttpServer())
        .post('/videos/trim')
        .set('Authorization', getAuthToken())
        .send({ videoId, end: 5 });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toContain('trimmed');
    }, 20000);

    it('should trim the video successfully if end is not provided', async () => {
      const response = await request(app.getHttpServer())
        .post('/videos/trim')
        .set('Authorization', getAuthToken())
        .send({ videoId, start: 5 });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toContain('trimmed');
    }, 20000);

    it('should throw an error if no start or end is provided', async () => {
      const response = await request(app.getHttpServer())
        .post('/videos/trim')
        .set('Authorization', getAuthToken())
        .send({ videoId });

      expect(response.status).toBe(400);
      expect(response.body.message).toEqual(
        'atleast one of start or end is required',
      );
    });
  });

  describe('POST /videos/merge', () => {
    let videoIds: string[];

    beforeEach(async () => {
      const file1Path = `${__dirname}/test-files/sample-1.mp4`;
      const file2Path = `${__dirname}/test-files/sample-2.mp4`;

      const queryParams = new URLSearchParams({
        maxSize: '100mb',
        minDuration: '1',
        maxDuration: '60',
      });

      const uploadResponse1 = await request(app.getHttpServer())
        .post('/videos/upload?' + queryParams)
        .set('Authorization', getAuthToken())
        .set('Content-Type', 'multipart/form-data')
        .attach('file', file1Path);

      const uploadResponse2 = await request(app.getHttpServer())
        .post('/videos/upload?' + queryParams)
        .set('Authorization', getAuthToken())
        .set('Content-Type', 'multipart/form-data')
        .attach('file', file2Path);

      videoIds = [uploadResponse1.body.id, uploadResponse2.body.id];
    });

    it('should merge videos successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/videos/merge')
        .set('Authorization', getAuthToken())
        .send({ videoIds });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toContain('merged');
    }, 20000);

    it('should throw an error if fewer than two video IDs are provided', async () => {
      const response = await request(app.getHttpServer())
        .post('/videos/merge')
        .set('Authorization', getAuthToken())
        .send({ videoIds: [videoIds[0]] });

      expect(response.status).toBe(400);
      expect(response.body.message).toEqual(
        'At least two video IDs are required for merging.',
      );
    });

    it('should throw an error if invalid video IDs are provided', async () => {
      const response = await request(app.getHttpServer())
        .post('/videos/merge')
        .set('Authorization', getAuthToken())
        .send({ videoIds: [videoIds[0], 123] });

      expect(response.status).toBe(404);
      expect(response.body.message).toEqual('Some videos were not found.');
    });
  });

  describe('GET /videos', () => {
    it('should list all videos', async () => {
      const response = await request(app.getHttpServer())
        .get('/videos')
        .set('Authorization', getAuthToken());
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /videos/share', () => {
    let videoId: string;

    beforeEach(async () => {
      const filePath = `${__dirname}/test-files/sample-1.mp4`;

      const uploadResponse = await request(app.getHttpServer())
        .post('/videos/upload')
        .set('Authorization', getAuthToken())
        .set('Content-Type', 'multipart/form-data')
        .attach('file', filePath);

      videoId = uploadResponse.body.id;
    });

    it('should generate a shared link', async () => {
      const response = await request(app.getHttpServer())
        .post('/videos/share')
        .set('Authorization', getAuthToken())
        .send({ videoId, expiryInSeconds: 3600 });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('link');
    });

    it('should generate a shared link event if expiry is not provided', async () => {
      const response = await request(app.getHttpServer())
        .post('/videos/share')
        .set('Authorization', getAuthToken())
        .send({ videoId });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('link');
    });
  });

  describe('GET /videos/shared/:id', () => {
    let sharedLinkId: string;
    let expiryDate: Date;

    beforeEach(async () => {
      const queryParams = new URLSearchParams({
        maxSize: '100mb',
        minDuration: '1',
        maxDuration: '60',
      });

      const filePath = `${__dirname}/test-files/sample-1.mp4`;

      const uploadResponse = await request(app.getHttpServer())
        .post('/videos/upload?' + queryParams)
        .set('Authorization', getAuthToken())
        .set('Content-Type', 'multipart/form-data')
        .attach('file', filePath);

      const videoId = uploadResponse.body.id;

      const shareResponse = await request(app.getHttpServer())
        .post('/videos/share')
        .set('Authorization', getAuthToken())
        .send({ videoId, expiryInSeconds: 3600 });

      sharedLinkId = shareResponse.body.link.split('/').pop();
      expiryDate = new Date(shareResponse.body.expiry);
    });

    it('should return the shared video link', async () => {
      const response = await request(app.getHttpServer())
        .get(`/videos/shared/${sharedLinkId}`)
        .set('Authorization', getAuthToken());
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('link');
    });

    it('should return a 404 error if the link has expired', async () => {
      const mockDate = new Date();
      mockDate.setHours(expiryDate.getHours() + 2); // mocking current hours as 2 hours ahead of expiry

      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      const response = await request(app.getHttpServer())
        .get(`/videos/shared/${sharedLinkId}`)
        .set('Authorization', getAuthToken());
      expect(response.status).toBe(404);
      expect(response.body.message).toEqual('The video link has expired');
    });
  });
});
