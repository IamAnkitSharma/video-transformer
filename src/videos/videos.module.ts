import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { Video } from './entities/video.entity';
import { SharedLink } from './entities/shared-link.entity';
import { AuthModule } from '../auth/auth.module';
import { AuthService } from '../auth/auth.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Video, SharedLink]),
    MulterModule.register({
      dest: './uploads', // Directory to store uploaded files
    }),
    AuthModule,
  ],
  controllers: [VideosController],
  providers: [VideosService, AuthService],
  exports: [VideosService],
})
export class VideosModule {}
