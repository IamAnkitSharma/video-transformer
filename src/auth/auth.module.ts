import { Module } from '@nestjs/common';
import { ApiTokenGuard } from './auth.guard';
import { AuthService } from './auth.service';

@Module({
  providers: [AuthService, ApiTokenGuard],
  exports: [ApiTokenGuard],
})
export class AuthModule {}
