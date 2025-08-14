import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portfolio } from './entities/portfolio.entity';
import { PortfolioStock } from './entities/portfolio-stock.entity';
import { User } from '../users/entities/user.entity';
import {
  TradeOrder,
  TradeOrderType,
} from '../trades/entities/trade-order.entity';
import { Stock } from '../stocks/entities/stock.entity';
import { UpdatePortfolioDto } from './schemas/portfolio.schema';

@Injectable()
export class PortfoliosService {
  constructor(
    @InjectRepository(Portfolio)
    private portfolioRepository: Repository<Portfolio>,
    @InjectRepository(PortfolioStock)
    private portfolioStockRepository: Repository<PortfolioStock>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(TradeOrder)
    private tradeOrderRepository: Repository<TradeOrder>,
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
  ) {}

  async createPortfolio(
    userId: string,
    name: string,
    description?: string,
  ): Promise<Portfolio> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const portfolio = this.portfolioRepository.create({
      user_id: user.id,
      name,
      description: description || '',
    });

    return this.portfolioRepository.save(portfolio);
  }

  async getUserPortfolios(userId: string): Promise<Portfolio[]> {
    return this.portfolioRepository.find({
      where: { user_id: userId },
      order: { created_at: 'ASC' },
    });
  }

  async getPortfolioById(
    portfolioId: string,
    userId: string,
  ): Promise<Portfolio> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { id: portfolioId, user_id: userId },
    });

    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }

    return portfolio;
  }

  async updatePortfolio(
    portfolioId: string,
    userId: string,
    updatePortfolioDto: UpdatePortfolioDto,
  ): Promise<Portfolio> {
    const portfolio = await this.getPortfolioById(portfolioId, userId);

    if (updatePortfolioDto.name !== undefined) {
      portfolio.name = updatePortfolioDto.name;
    }
    if (updatePortfolioDto.description !== undefined) {
      portfolio.description = updatePortfolioDto.description;
    }

    portfolio.updated_at = new Date();
    return this.portfolioRepository.save(portfolio);
  }

  async getPortfolioSummary(portfolioId: string, userId: string): Promise<any> {
    const portfolio = await this.getPortfolioById(portfolioId, userId);

    // Get all portfolio stocks with their stock information
    const portfolioStocks = await this.portfolioStockRepository
      .createQueryBuilder('portfolioStock')
      .leftJoinAndSelect('portfolioStock.stock', 'stock')
      .where('portfolioStock.portfolio_id = :portfolioId', { portfolioId })
      .andWhere('portfolioStock.shares > 0')
      .getMany();

    // Calculate totals using PortfolioStock entity data
    const totalInvestment = portfolioStocks.reduce(
      (sum, portfolioStock) => sum + Number(portfolioStock.investment_amount),
      0,
    );
    const totalSellAmount = portfolioStocks.reduce(
      (sum, portfolioStock) => sum + Number(portfolioStock.sell_amount),
      0,
    );

    const totalCurrentValue = portfolioStocks.reduce(
      (sum, portfolioStock) =>
        sum +
        Number(portfolioStock.shares) *
          Number(portfolioStock.stock.current_price),
      0,
    );

    const totalProfitLoss =
      totalCurrentValue + totalSellAmount - totalInvestment;

    return {
      portfolio: {
        id: portfolio.id,
        name: portfolio.name,
        description: portfolio.description,
        created_at: portfolio.created_at,
        updated_at: portfolio.updated_at,
      },
      summary: {
        total_sell_amount: totalSellAmount,
        total_investment: totalInvestment,
        total_current_value: totalCurrentValue,
        total_profit_loss: totalProfitLoss,
        profit_loss_percentage:
          totalInvestment > 0 ? (totalProfitLoss / totalInvestment) * 100 : 0,
      },
      holdings: portfolioStocks.map((portfolioStock) => {
        const shares = Number(portfolioStock.shares);
        const investmentAmount = Number(portfolioStock.investment_amount);
        const sellAmount = Number(portfolioStock.sell_amount);
        const currentPrice = Number(portfolioStock.stock.current_price);
        const currentValue = shares * currentPrice;
        const profitLoss = currentValue + sellAmount - investmentAmount;

        return {
          stock_id: portfolioStock.stock.id,
          symbol: portfolioStock.stock.symbol,
          name: portfolioStock.stock.name,
          shares: shares,
          investment_amount: investmentAmount,
          current_value: currentValue,
          current_price: currentPrice,
          sell_amount: sellAmount,
          profit_loss: profitLoss,
          profit_loss_percentage:
            investmentAmount > 0 ? (profitLoss / investmentAmount) * 100 : 0,
        };
      }),
    };
  }
}
