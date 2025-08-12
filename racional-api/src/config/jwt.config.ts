import { JwtModuleOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export const getJwtConfig = (
  configService: ConfigService,
): JwtModuleOptions => {
  const secret =
    configService.get('JWT_SECRET') || 'default-secret-key-for-development';
  const expiresIn = configService.get('JWT_EXPIRES_IN') || '24h';

  // Log warning if using default secret in production
  if (
    configService.get('NODE_ENV') === 'production' &&
    !configService.get('JWT_SECRET')
  ) {
    console.warn(
      '⚠️  WARNING: Using default JWT_SECRET in production! Set JWT_SECRET environment variable.',
    );
  }

  return {
    secret,
    signOptions: {
      expiresIn,
    },
  };
};
