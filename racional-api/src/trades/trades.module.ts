import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TradesService } from './trades.service';
import { TradesController } from './trades.controller';
import { TradeOrder } from './entities/trade-order.entity';
import { Stock } from '../stocks/entities/stock.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { Portfolio } from '../portfolios/entities/portfolio.entity';
import { PortfolioStock } from '../portfolios/entities/portfolio-stock.entity';
import { User } from '../users/entities/user.entity';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TradeOrder,
      Stock,
      Wallet,
      Portfolio,
      PortfolioStock,
      User,
    ]),
    TransactionsModule,
  ],
  controllers: [TradesController],
  providers: [TradesService],
  exports: [TradesService],
})
export class TradesModule {}
