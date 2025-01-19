import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Video } from './videos/entities/video.entity';
import { VideosModule } from './videos/videos.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';
import { SharedLink } from './videos/entities/shared-link.entity';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: path.join(__dirname, '..', 'uploads'), // Directory for the uploaded files
      serveRoot: '/uploads', // URL path to access the uploaded files
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'video-api.db',
      entities: [Video, SharedLink],
      synchronize: true, // Use only in development
    }),
    VideosModule,
  ],
})
export class AppModule {}
