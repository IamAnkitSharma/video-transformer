import { Test, TestingModule } from '@nestjs/testing';
import { ApiTokenGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

describe('ApiTokenGuard', () => {
  let apiTokenGuard: ApiTokenGuard;
  let authService: AuthService;

  beforeEach(async () => {
    const authServiceMock = {
      validateApiToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiTokenGuard,
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compile();

    apiTokenGuard = module.get<ApiTokenGuard>(ApiTokenGuard);
    authService = module.get<AuthService>(AuthService);
  });

  describe('canActivate', () => {
    it('should throw UnauthorizedException if authorization header is missing', () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ headers: {} }),
        }),
      } as ExecutionContext;

      expect(() => apiTokenGuard.canActivate(context)).toThrowError(
        new UnauthorizedException('Authorization header is missing'),
      );
    });

    it('should throw UnauthorizedException if authorization format is invalid', () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ headers: { authorization: 'InvalidToken' } }),
        }),
      } as ExecutionContext;

      expect(() => apiTokenGuard.canActivate(context)).toThrowError(
        new UnauthorizedException('Invalid authorization format'),
      );
    });

    it('should throw UnauthorizedException if token is invalid', () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { authorization: 'Bearer invalid_token' },
          }),
        }),
      } as ExecutionContext;

      jest.spyOn(authService, 'validateApiToken').mockReturnValue(false);

      expect(() => apiTokenGuard.canActivate(context)).toThrowError(
        new UnauthorizedException('Invalid API token'),
      );
    });

    it('should return true if token is valid', () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { authorization: 'Bearer valid_token' },
          }), // Valid token
        }),
      } as ExecutionContext;

      jest.spyOn(authService, 'validateApiToken').mockReturnValue(true);

      expect(apiTokenGuard.canActivate(context)).toBe(true);
    });
  });
});
