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
      user_id: userId,
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

  async deletePortfolio(portfolioId: string, userId: string): Promise<void> {
    const portfolio = await this.getPortfolioById(portfolioId, userId);

    // Check if portfolio has any holdings
    const holdings = await this.portfolioStockRepository.find({
      where: { portfolio_id: portfolioId },
    });

    if (holdings.length > 0) {
      throw new BadRequestException(
        'Cannot delete portfolio with existing holdings. Please sell all stocks first.',
      );
    }

    await this.portfolioRepository.remove(portfolio);
  }

  async getPortfolioSummary(portfolioId: string, userId: string): Promise<any> {
    const portfolio = await this.getPortfolioById(portfolioId, userId);

    const holdings = await this.portfolioStockRepository
      .createQueryBuilder('ps')
      .leftJoinAndSelect('ps.stock', 'stock')
      .where('ps.portfolio_id = :portfolioId', { portfolioId })
      .getMany();

    const totalInvestment = holdings.reduce(
      (sum, holding) => sum + holding.investment_amount,
      0,
    );
    const totalCurrentValue = holdings.reduce(
      (sum, holding) => sum + holding.shares * holding.stock.current_price,
      0,
    );
    const totalProfitLoss = totalCurrentValue - totalInvestment;

    return {
      portfolio: {
        id: portfolio.id,
        name: portfolio.name,
        description: portfolio.description,
        created_at: portfolio.created_at,
        updated_at: portfolio.updated_at,
      },
      summary: {
        total_holdings: holdings.length,
        total_investment: totalInvestment,
        total_current_value: totalCurrentValue,
        total_profit_loss: totalProfitLoss,
        profit_loss_percentage:
          totalInvestment > 0 ? (totalProfitLoss / totalInvestment) * 100 : 0,
      },
      holdings: holdings.map((holding) => ({
        stock_id: holding.stock_id,
        symbol: holding.stock.symbol,
        name: holding.stock.name,
        shares: holding.shares,
        investment_amount: holding.investment_amount,
        current_value: holding.shares * holding.stock.current_price,
        current_price: holding.stock.current_price,
        avg_price: holding.investment_amount / holding.shares,
        profit_loss:
          holding.shares * holding.stock.current_price -
          holding.investment_amount,
        profit_loss_percentage:
          ((holding.shares * holding.stock.current_price -
            holding.investment_amount) /
            holding.investment_amount) *
          100,
      })),
    };
  }
}
