import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { TradeOrder, TradeOrderType } from './entities/trade-order.entity';
import { Stock } from '../stocks/entities/stock.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { Portfolio } from '../portfolios/entities/portfolio.entity';
import { PortfolioStock } from '../portfolios/entities/portfolio-stock.entity';
import { User } from '../users/entities/user.entity';
import { CreateTradeOrderDto } from './schemas/trade-order.schema';
import { TransactionsService } from '../transactions/transactions.service';

@Injectable()
export class TradesService {
  constructor(
    @InjectRepository(TradeOrder)
    private tradeOrderRepository: Repository<TradeOrder>,
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(Portfolio)
    private portfolioRepository: Repository<Portfolio>,
    @InjectRepository(PortfolioStock)
    private portfolioStockRepository: Repository<PortfolioStock>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
    private transactionsService: TransactionsService,
  ) {}

  async createTradeOrder(
    userId: string,
    createTradeOrderDto: CreateTradeOrderDto,
  ): Promise<TradeOrder> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['wallet', 'portfolios'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.wallet) {
      throw new NotFoundException('User wallet not found');
    }

    const portfolio = user.portfolios.find(
      (p) => p.id === createTradeOrderDto.portfolio_id,
    );
    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }

    const stock = await this.stockRepository.findOneBy({
      id: createTradeOrderDto.stock_id,
    });
    if (!stock) {
      throw new NotFoundException('Stock not found');
    }

    if (createTradeOrderDto.quantity <= 0) {
      throw new BadRequestException('Quantity must be positive');
    }

    if (createTradeOrderDto.price <= 0) {
      throw new BadRequestException('Price must be positive');
    }

    const totalCost = createTradeOrderDto.quantity * createTradeOrderDto.price;

    // Check if user has enough funds for buy orders
    if (createTradeOrderDto.type === TradeOrderType.BUY) {
      const walletBalance =
        await this.transactionsService.calculateActualWalletBalance(
          user.wallet.id,
        );
      if (walletBalance < totalCost) {
        throw new BadRequestException('Insufficient funds for this trade');
      }
    }

    // Check if user has enough shares for sell orders
    if (createTradeOrderDto.type === TradeOrderType.SELL) {
      const currentHolding = await this.getCurrentStockHolding(
        portfolio.id,
        createTradeOrderDto.stock_id,
      );
      if (currentHolding < createTradeOrderDto.quantity) {
        throw new BadRequestException('Insufficient shares for this sale');
      }
    }

    // Create the trade order
    const tradeOrder = this.tradeOrderRepository.create({
      wallet_id: user.wallet.id,
      portfolio_id: portfolio.id,
      stock_id: stock.id,
      type: createTradeOrderDto.type as TradeOrderType,
      quantity: createTradeOrderDto.quantity,
      price: createTradeOrderDto.price,
      execution_date: createTradeOrderDto.execution_date,
      external_ref_id: createTradeOrderDto.external_ref_id,
    });

    return this.tradeOrderRepository.save(tradeOrder);
  }

  async executeTradeOrder(
    tradeOrderId: string,
    userId: string,
    executionDate: string,
  ): Promise<TradeOrder> {
    const tradeOrder = await this.tradeOrderRepository.findOne({
      where: { id: tradeOrderId },
      relations: ['wallet', 'portfolio', 'stock'],
    });

    if (!tradeOrder) {
      throw new NotFoundException('Trade order not found');
    }

    if (tradeOrder.wallet.user_id !== userId) {
      throw new NotFoundException('Trade order does not belong to user');
    }

    if (tradeOrder.execution_date) {
      throw new BadRequestException('Trade order already executed');
    }

    const executionDateObj = new Date(executionDate);
    const totalValue = tradeOrder.quantity * tradeOrder.price;

    return this.dataSource.transaction(async (manager) => {
      // Update trade order execution date
      tradeOrder.execution_date = executionDateObj;
      await manager.save(TradeOrder, tradeOrder);

      if (tradeOrder.type === TradeOrderType.BUY) {
        // Deduct money from wallet
        tradeOrder.wallet.balance -= totalValue;
        await manager.save(Wallet, tradeOrder.wallet);

        // Add shares to portfolio
        await this.addSharesToPortfolio(
          manager,
          tradeOrder.portfolio_id,
          tradeOrder.stock_id,
          tradeOrder.quantity,
          totalValue,
        );
      } else {
        // Add money to wallet
        tradeOrder.wallet.balance += totalValue;
        await manager.save(Wallet, tradeOrder.wallet);

        // Remove shares from portfolio
        await this.removeSharesFromPortfolio(
          manager,
          tradeOrder.portfolio_id,
          tradeOrder.stock_id,
          tradeOrder.quantity,
        );
      }

      return tradeOrder;
    });
  }

  private async addSharesToPortfolio(
    manager: any,
    portfolioId: string,
    stockId: string,
    quantity: number,
    totalValue: number,
  ): Promise<void> {
    let portfolioStock = await manager.findOne(PortfolioStock, {
      where: { portfolio_id: portfolioId, stock_id: stockId },
    });

    if (portfolioStock) {
      // Update existing holding
      const newTotalShares = portfolioStock.shares + quantity;
      const newTotalInvestment = portfolioStock.investment_amount + totalValue;
      portfolioStock.shares = newTotalShares;
      portfolioStock.investment_amount = newTotalInvestment;
      portfolioStock.updated_at = new Date();
    } else {
      // Create new holding
      portfolioStock = manager.create(PortfolioStock, {
        portfolio_id: portfolioId,
        stock_id: stockId,
        shares: quantity,
        investment_amount: totalValue,
        updated_at: new Date(),
      });
    }

    await manager.save(PortfolioStock, portfolioStock);
  }

  private async removeSharesFromPortfolio(
    manager: any,
    portfolioId: string,
    stockId: string,
    quantity: number,
  ): Promise<void> {
    const portfolioStock = await manager.findOne(PortfolioStock, {
      where: { portfolio_id: portfolioId, stock_id: stockId },
    });

    if (!portfolioStock) {
      throw new BadRequestException(
        'No shares found for this stock in portfolio',
      );
    }

    if (portfolioStock.shares < quantity) {
      throw new BadRequestException('Insufficient shares to sell');
    }

    const newShares = portfolioStock.shares - quantity;
    if (newShares === 0) {
      // Remove the holding if no shares left
      await manager.remove(PortfolioStock, portfolioStock);
    } else {
      // Update the holding
      portfolioStock.shares = newShares;
      portfolioStock.updated_at = new Date();
      await manager.save(PortfolioStock, portfolioStock);
    }
  }

  async getPortfolioHoldings(
    portfolioId: string,
    userId: string,
  ): Promise<any[]> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { id: portfolioId, user_id: userId },
      relations: ['portfolioStocks', 'portfolioStocks.stock'],
    });

    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }

    const holdings = await this.portfolioStockRepository
      .createQueryBuilder('ps')
      .leftJoinAndSelect('ps.stock', 'stock')
      .where('ps.portfolio_id = :portfolioId', { portfolioId })
      .getMany();

    return holdings.map((holding) => ({
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
    }));
  }

  async getUserTradeOrders(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['wallet'],
    });

    if (!user || !user.wallet) {
      throw new NotFoundException('User or wallet not found');
    }

    const [orders, total] = await this.tradeOrderRepository.findAndCount({
      where: { wallet_id: user.wallet.id },
      relations: ['stock', 'portfolio'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      orders: orders.map((order) => ({
        id: order.id,
        type: order.type,
        stock_symbol: order.stock.symbol,
        stock_name: order.stock.name,
        quantity: order.quantity,
        price: order.price,
        total_value: order.quantity * order.price,
        portfolio_name: order.portfolio.name,
        execution_date: order.execution_date,
        created_at: order.created_at,
        status: order.execution_date ? 'executed' : 'pending',
      })),
      total,
      page,
      limit,
    };
  }

  private async getCurrentStockHolding(
    portfolioId: string,
    stockId: string,
  ): Promise<number> {
    const holding = await this.portfolioStockRepository.findOne({
      where: { portfolio_id: portfolioId, stock_id: stockId },
    });
    return holding ? holding.shares : 0;
  }
}
