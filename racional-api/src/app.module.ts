import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppService } from './app.service';
import { getDatabaseConfig } from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TransactionsModule } from './transactions/transactions.module';
import { TradesModule } from './trades/trades.module';
import { StocksModule } from './stocks/stocks.module';
import { PortfoliosModule } from './portfolios/portfolios.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const baseConfig = getDatabaseConfig(configService);
        // Disable synchronize in production, enable only in development
        if (configService.get('NODE_ENV') === 'production') {
          return { ...baseConfig, synchronize: false };
        }
        return baseConfig;
      },
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    TransactionsModule,
    TradesModule,
    StocksModule,
    PortfoliosModule,
  ],
  providers: [AppService],
})
export class AppModule {}
