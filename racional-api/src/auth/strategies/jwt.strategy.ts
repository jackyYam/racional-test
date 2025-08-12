import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const jwtSecret =
      configService.get('JWT_SECRET') || 'default-secret-key-for-development';

    // Log warning if using default secret in production
    if (
      configService.get('NODE_ENV') === 'production' &&
      !configService.get('JWT_SECRET')
    ) {
      console.warn(
        '⚠️  WARNING: Using default JWT_SECRET in production! Set JWT_SECRET environment variable.',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: any) {
    if (!payload.id) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      userId: payload.id,
      email: payload.email,
    };
  }
}
