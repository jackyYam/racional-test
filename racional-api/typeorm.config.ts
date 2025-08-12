import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(__dirname, '.env.development') });

const configService = new ConfigService();

export default new DataSource({
  type: 'postgres',
  host: configService.get('DB_HOST') || 'localhost',
  port: configService.get('DB_PORT') || 5432,
  username: configService.get('DB_USERNAME') || 'postgres',
  password: configService.get('DB_PASSWORD') || 'password',
  database: configService.get('DB_DATABASE') || 'racional_trading',
  entities: [join(__dirname, 'src/**/*.entity.ts')],
  migrations: [join(__dirname, 'src/database/migrations/*.ts')],
  synchronize: false, // Disable synchronize for migrations
  logging: configService.get('NODE_ENV') === 'development',
});
