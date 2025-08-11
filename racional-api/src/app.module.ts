import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TransactionsModule } from './transactions/transactions.module';
import { getDatabaseConfig } from './config/database.config';

// Entities
import { User } from './users/entities/user.entity';
import { Wallet } from './wallets/entities/wallet.entity';
import { Portfolio } from './portfolios/entities/portfolio.entity';
import { PortfolioStock } from './portfolios/entities/portfolio-stock.entity';
import { Stock } from './stocks/entities/stock.entity';
import { Transaction } from './transactions/entities/transaction.entity';
import { TradeOrder } from './trades/entities/trade-order.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.development',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      User,
      Wallet,
      Portfolio,
      PortfolioStock,
      Stock,
      Transaction,
      TradeOrder,
    ]),
    AuthModule,
    UsersModule,
    TransactionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
