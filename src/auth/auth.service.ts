import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  private readonly apiToken = process.env.STATIC_API_TOKEN;

  validateApiToken(token: string): boolean {
    return token === this.apiToken;
  }
}
