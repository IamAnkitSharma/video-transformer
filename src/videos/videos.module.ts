import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { Video } from './video.entity';
import { SharedLink } from './shared-link.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Video, SharedLink]),
    MulterModule.register({
      dest: './uploads', // Directory to store uploaded files
    }),
  ],
  controllers: [VideosController],
  providers: [VideosService],
  exports: [VideosService],
})
export class VideosModule {}
