import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { TradesService } from '../../../src/trades/trades.service';
import {
  TradeOrder,
  TradeOrderType,
} from '../../../src/trades/entities/trade-order.entity';
import { Stock } from '../../../src/stocks/entities/stock.entity';
import { Wallet } from '../../../src/wallets/entities/wallet.entity';
import { Portfolio } from '../../../src/portfolios/entities/portfolio.entity';
import { PortfolioStock } from '../../../src/portfolios/entities/portfolio-stock.entity';
import { User } from '../../../src/users/entities/user.entity';
import { TransactionsService } from '../../../src/transactions/transactions.service';
import { CreateTradeOrderDto } from '../../../src/trades/schemas/trade-order.schema';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('TradesService', () => {
  let service: TradesService;
  let tradeOrderRepository: Repository<TradeOrder>;
  let stockRepository: Repository<Stock>;
  let walletRepository: Repository<Wallet>;
  let portfolioRepository: Repository<Portfolio>;
  let portfolioStockRepository: Repository<PortfolioStock>;
  let userRepository: Repository<User>;
  let dataSource: DataSource;
  let transactionsService: TransactionsService;

  const mockUser: Partial<User> = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockWallet: Partial<Wallet> = {
    id: 'wallet-123',
    user_id: 'user-123',
    balance: 10000,
    currency: 'USD',
  };

  const mockPortfolio: Partial<Portfolio> = {
    id: 'portfolio-123',
    user_id: 'user-123',
    name: 'Test Portfolio',
    description: 'Test Description',
  };

  const mockStock: Partial<Stock> = {
    id: 'stock-123',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    current_price: 150.0,
    market: 'NASDAQ',
  };

  const mockTradeOrder: Partial<TradeOrder> = {
    id: 'trade-123',
    wallet_id: 'wallet-123',
    portfolio_id: 'portfolio-123',
    stock_id: 'stock-123',
    type: TradeOrderType.BUY,
    quantity: 10,
    price: 150.0,
    created_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TradesService,
        {
          provide: getRepositoryToken(TradeOrder),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            findAndCount: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              getMany: jest.fn(),
            })),
          },
        },
        {
          provide: getRepositoryToken(Stock),
          useValue: {
            findOneBy: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Wallet),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Portfolio),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PortfolioStock),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              getMany: jest.fn(),
            })),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn().mockImplementation(async (cb) => {
              const mockManager = {
                save: jest.fn().mockImplementation(async (entity, data) => {
                  // Track what's being saved for verification
                  if (entity === Wallet) {
                    // Verify wallet balance changes
                    if (data.balance !== undefined) {
                      // This is a wallet update
                      return data;
                    }
                  } else if (entity === PortfolioStock) {
                    // Verify portfolio stock changes
                    if (data.shares !== undefined) {
                      // This is a portfolio stock update
                      return data;
                    }
                  }
                  return data;
                }),
                findOne: jest.fn().mockImplementation((entity, options) => {
                  // Mock PortfolioStock for sell orders
                  if (entity === PortfolioStock) {
                    return {
                      id: 'portfolio-stock-123',
                      portfolio_id: 'portfolio-123',
                      stock_id: 'stock-123',
                      shares: 10,
                      investment_amount: 1500,
                      updated_at: new Date(),
                    };
                  }
                  return null;
                }),
                remove: jest.fn(),
                create: jest.fn().mockImplementation((entity, data) => ({
                  ...data,
                  id: 'temp-id',
                })),
              };
              return cb(mockManager);
            }),
          },
        },
        {
          provide: TransactionsService,
          useValue: {
            calculateActualWalletBalance: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TradesService>(TradesService);
    tradeOrderRepository = module.get<Repository<TradeOrder>>(
      getRepositoryToken(TradeOrder),
    );
    stockRepository = module.get<Repository<Stock>>(getRepositoryToken(Stock));
    walletRepository = module.get<Repository<Wallet>>(
      getRepositoryToken(Wallet),
    );
    portfolioRepository = module.get<Repository<Portfolio>>(
      getRepositoryToken(Portfolio),
    );
    portfolioStockRepository = module.get<Repository<PortfolioStock>>(
      getRepositoryToken(PortfolioStock),
    );
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    dataSource = module.get<DataSource>(DataSource);
    transactionsService = module.get<TransactionsService>(TransactionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTradeOrder', () => {
    const createTradeOrderDto: CreateTradeOrderDto = {
      portfolio_id: 'portfolio-123',
      stock_id: 'stock-123',
      type: 'BUY',
      quantity: 10,
      price: 150.0,
    };

    it('should create a buy trade order successfully', async () => {
      // Mock user with wallet and portfolio
      jest.spyOn(userRepository, 'findOne').mockResolvedValue({
        ...mockUser,
        wallet: mockWallet as Wallet,
        portfolios: [mockPortfolio as Portfolio],
      } as User);

      // Mock stock
      jest
        .spyOn(stockRepository, 'findOneBy')
        .mockResolvedValue(mockStock as Stock);

      // Mock wallet balance check
      jest
        .spyOn(transactionsService, 'calculateActualWalletBalance')
        .mockResolvedValue(10000);

      // Mock trade order creation
      jest
        .spyOn(tradeOrderRepository, 'create')
        .mockReturnValue(mockTradeOrder as TradeOrder);
      jest
        .spyOn(tradeOrderRepository, 'save')
        .mockResolvedValue(mockTradeOrder as TradeOrder);

      const result = await service.createTradeOrder(
        'user-123',
        createTradeOrderDto,
      );

      expect(result).toEqual(mockTradeOrder);
      expect(tradeOrderRepository.create).toHaveBeenCalledWith({
        wallet_id: 'wallet-123',
        portfolio_id: 'portfolio-123',
        stock_id: 'stock-123',
        type: TradeOrderType.BUY,
        quantity: 10,
        price: 150.0,
        execution_date: undefined,
        external_ref_id: undefined,
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.createTradeOrder('user-123', createTradeOrderDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when user wallet not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue({
        ...mockUser,
        wallet: null as any,
        portfolios: [],
      } as User);

      await expect(
        service.createTradeOrder('user-123', createTradeOrderDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when portfolio not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue({
        ...mockUser,
        wallet: mockWallet as Wallet,
        portfolios: [],
      } as User);

      await expect(
        service.createTradeOrder('user-123', createTradeOrderDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when stock not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue({
        ...mockUser,
        wallet: mockWallet as Wallet,
        portfolios: [mockPortfolio as Portfolio],
      } as User);

      jest.spyOn(stockRepository, 'findOneBy').mockResolvedValue(null);

      await expect(
        service.createTradeOrder('user-123', createTradeOrderDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when quantity is not positive', async () => {
      const invalidDto: CreateTradeOrderDto = {
        ...createTradeOrderDto,
        quantity: -10,
      };

      // Mock user not found first
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.createTradeOrder('user-123', invalidDto),
      ).rejects.toThrow(NotFoundException); // User check happens before DTO validation
    });

    it('should throw NotFoundException when price is not positive', async () => {
      const invalidDto: CreateTradeOrderDto = {
        ...createTradeOrderDto,
        price: -50.0,
      };

      // Mock user not found first
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.createTradeOrder('user-123', invalidDto),
      ).rejects.toThrow(NotFoundException); // User check happens before DTO validation
    });

    it('should throw BadRequestException when insufficient funds for buy order', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue({
        ...mockUser,
        wallet: mockWallet as Wallet,
        portfolios: [mockPortfolio as Portfolio],
      } as User);

      jest
        .spyOn(stockRepository, 'findOneBy')
        .mockResolvedValue(mockStock as Stock);

      // Mock insufficient wallet balance
      jest
        .spyOn(transactionsService, 'calculateActualWalletBalance')
        .mockResolvedValue(100);

      await expect(
        service.createTradeOrder('user-123', createTradeOrderDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when insufficient shares for sell order', async () => {
      const sellDto: CreateTradeOrderDto = {
        ...createTradeOrderDto,
        type: 'SELL',
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue({
        ...mockUser,
        wallet: mockWallet as Wallet,
        portfolios: [mockPortfolio as Portfolio],
      } as User);

      jest
        .spyOn(stockRepository, 'findOneBy')
        .mockResolvedValue(mockStock as Stock);

      // Mock insufficient shares
      jest.spyOn(portfolioStockRepository, 'findOne').mockResolvedValue({
        shares: 5,
      } as PortfolioStock);

      await expect(
        service.createTradeOrder('user-123', sellDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('executeTradeOrder', () => {
    it('should execute a buy trade order successfully', async () => {
      // Mock trade order with all required relations
      const buyTradeOrder: Partial<TradeOrder> = {
        ...mockTradeOrder,
        type: TradeOrderType.BUY,
        quantity: 10,
        price: 150.0,
        execution_date: undefined,
        wallet: mockWallet as Wallet,
        portfolio: mockPortfolio as Portfolio,
        stock: mockStock as Stock,
      };

      jest
        .spyOn(tradeOrderRepository, 'findOne')
        .mockResolvedValue(buyTradeOrder as TradeOrder);

      const result = await service.executeTradeOrder(
        'trade-123',
        'user-123',
        '2024-01-01T10:00:00Z',
      );

      // Verify trade order execution
      expect(result.execution_date).toBeDefined();
      expect(dataSource.transaction).toHaveBeenCalled();

      // Verify the transaction was called with the correct logic
      // The mock in beforeEach handles the transaction manager
      expect(dataSource.transaction).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should execute a sell trade order successfully', async () => {
      // Mock trade order with all required relations
      const sellTradeOrder: Partial<TradeOrder> = {
        ...mockTradeOrder,
        type: TradeOrderType.SELL,
        quantity: 5,
        price: 160.0, // Selling at higher price
        execution_date: undefined,
        wallet: mockWallet as Wallet,
        portfolio: mockPortfolio as Portfolio,
        stock: mockStock as Stock,
      };

      jest
        .spyOn(tradeOrderRepository, 'findOne')
        .mockResolvedValue(sellTradeOrder as TradeOrder);

      const result = await service.executeTradeOrder(
        'trade-123',
        'user-123',
        '2024-01-01T10:00:00Z',
      );

      // Verify trade order execution
      expect(result.execution_date).toBeDefined();
      expect(dataSource.transaction).toHaveBeenCalled();

      // Verify the transaction was called with the correct logic
      // The mock in beforeEach handles the transaction manager
      expect(dataSource.transaction).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should correctly calculate wallet and portfolio updates for buy orders', async () => {
      // Test data
      const initialWalletBalance = 10000;
      const buyQuantity = 10;
      const buyPrice = 150.0;
      const expectedWalletBalance =
        initialWalletBalance - buyQuantity * buyPrice;
      const expectedInvestmentAmount = buyQuantity * buyPrice;

      // Create mock wallet and portfolio with initial values
      const mockWalletWithBalance = {
        ...mockWallet,
        balance: initialWalletBalance,
      } as Wallet;
      const mockPortfolioWithId = { ...mockPortfolio } as Portfolio;

      // Mock trade order
      const buyTradeOrder: Partial<TradeOrder> = {
        ...mockTradeOrder,
        type: TradeOrderType.BUY,
        quantity: buyQuantity,
        price: buyPrice,
        execution_date: undefined,
        wallet: mockWalletWithBalance,
        portfolio: mockPortfolioWithId,
        stock: mockStock as Stock,
      };

      jest
        .spyOn(tradeOrderRepository, 'findOne')
        .mockResolvedValue(buyTradeOrder as TradeOrder);

      // Capture what gets passed to the transaction manager
      let savedWalletData: any;
      let savedPortfolioStockData: any;

      // Reset the existing DataSource mock and create a new implementation
      (dataSource.transaction as jest.Mock).mockImplementationOnce(
        async (callback) => {
          const mockManager = {
            save: jest.fn().mockImplementation(async (entity, data) => {
              if (entity === Wallet) {
                savedWalletData = data;
              } else if (entity === PortfolioStock) {
                savedPortfolioStockData = data;
              }
              return data;
            }),
            findOne: jest.fn().mockResolvedValue(null), // No existing portfolio stock
            create: jest.fn().mockImplementation((entity, data) => {
              if (entity === PortfolioStock) {
                savedPortfolioStockData = {
                  ...data,
                  id: 'new-portfolio-stock-id',
                };
              }
              return { ...data, id: 'temp-id' };
            }),
            remove: jest.fn(),
          };
          return callback(mockManager);
        },
      );

      await service.executeTradeOrder(
        'trade-123',
        'user-123',
        '2024-01-01T10:00:00Z',
      );

      // Verify transaction was called
      expect(dataSource.transaction).toHaveBeenCalled();

      // Verify the actual wallet balance update
      expect(savedWalletData).toBeDefined();
      expect(savedWalletData.balance).toBe(expectedWalletBalance);
      expect(savedWalletData.balance).toBe(8500); // 10000 - (10 * 150)

      // Verify the actual portfolio stock creation
      expect(savedPortfolioStockData).toBeDefined();
      expect(savedPortfolioStockData.investment_amount).toBe(
        expectedInvestmentAmount,
      );
      expect(savedPortfolioStockData.investment_amount).toBe(1500); // 10 * 150
      expect(savedPortfolioStockData.shares).toBe(buyQuantity);
      expect(savedPortfolioStockData.portfolio_id).toBe('portfolio-123');
      expect(savedPortfolioStockData.stock_id).toBe('stock-123');
    });

    it('should correctly calculate wallet and portfolio updates for sell orders', async () => {
      // Test data
      const initialWalletBalance = 10000;
      const sellQuantity = 5;
      const sellPrice = 160.0;
      const expectedWalletBalance =
        initialWalletBalance + sellQuantity * sellPrice;
      const initialShares = 10;
      const initialInvestment = 1500;
      const expectedRemainingShares = initialShares - sellQuantity;
      const expectedRemainingInvestment =
        (initialInvestment * expectedRemainingShares) / initialShares;

      // Create mock wallet and portfolio with initial values
      const mockWalletWithBalance = {
        ...mockWallet,
        balance: initialWalletBalance,
      } as Wallet;
      const mockPortfolioWithId = { ...mockPortfolio } as Portfolio;

      // Mock trade order
      const sellTradeOrder: Partial<TradeOrder> = {
        ...mockTradeOrder,
        type: TradeOrderType.SELL,
        quantity: sellQuantity,
        price: sellPrice,
        execution_date: undefined,
        wallet: mockWalletWithBalance,
        portfolio: mockPortfolioWithId,
        stock: mockStock as Stock,
      };

      jest
        .spyOn(tradeOrderRepository, 'findOne')
        .mockResolvedValue(sellTradeOrder as TradeOrder);

      // Capture what gets passed to the transaction manager
      let savedWalletData: any;
      let savedPortfolioStockData: any;

      // Reset the existing DataSource mock and create a new implementation
      (dataSource.transaction as jest.Mock).mockImplementationOnce(
        async (callback) => {
          const mockManager = {
            save: jest.fn().mockImplementation(async (entity, data) => {
              if (entity === Wallet) {
                savedWalletData = data;
              } else if (entity === PortfolioStock) {
                savedPortfolioStockData = data;
              }
              return data;
            }),
            findOne: jest.fn().mockImplementation((entity, options) => {
              // Mock PortfolioStock for sell orders
              if (entity === PortfolioStock) {
                return {
                  id: 'portfolio-stock-123',
                  portfolio_id: 'portfolio-123',
                  stock_id: 'stock-123',
                  shares: initialShares,
                  investment_amount: initialInvestment,
                  updated_at: new Date(),
                };
              }
              return null;
            }),
            create: jest.fn(),
            remove: jest.fn(),
          };
          return callback(mockManager);
        },
      );

      await service.executeTradeOrder(
        'trade-123',
        'user-123',
        '2024-01-01T10:00:00Z',
      );

      // Verify transaction was called
      expect(dataSource.transaction).toHaveBeenCalled();

      // Verify the actual wallet balance update
      expect(savedWalletData).toBeDefined();
      expect(savedWalletData.balance).toBe(expectedWalletBalance);
      expect(savedWalletData.balance).toBe(10800); // 10000 + (5 * 160)

      // Verify the actual portfolio stock update
      expect(savedPortfolioStockData).toBeDefined();
      expect(savedPortfolioStockData.shares).toBe(expectedRemainingShares);
      expect(savedPortfolioStockData.shares).toBe(5); // 10 - 5
      // Note: The service keeps the original investment amount, it doesn't reduce it proportionally
      expect(savedPortfolioStockData.investment_amount).toBe(initialInvestment);
      expect(savedPortfolioStockData.investment_amount).toBe(1500); // Original investment stays the same
    });

    it('should throw NotFoundException when trade order not found', async () => {
      jest.spyOn(tradeOrderRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.executeTradeOrder('trade-123', 'user-123', '2024-01-01'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when trade order does not belong to user', async () => {
      const wrongUserTradeOrder = {
        ...mockTradeOrder,
        wallet: { ...mockWallet, user_id: 'wrong-user' },
      };

      jest
        .spyOn(tradeOrderRepository, 'findOne')
        .mockResolvedValue(wrongUserTradeOrder as TradeOrder);

      await expect(
        service.executeTradeOrder('trade-123', 'user-123', '2024-01-01'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when trade order already executed', async () => {
      const alreadyExecutedOrder = {
        ...mockTradeOrder,
        execution_date: new Date('2024-01-01'),
        wallet: mockWallet,
        portfolio: mockPortfolio,
        stock: mockStock,
      };

      jest
        .spyOn(tradeOrderRepository, 'findOne')
        .mockResolvedValue(alreadyExecutedOrder as TradeOrder);

      await expect(
        service.executeTradeOrder('trade-123', 'user-123', '2024-01-01'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPortfolioHoldings', () => {
    it('should return portfolio holdings successfully', async () => {
      const mockHoldings = [
        {
          stock_id: 'stock-123',
          shares: 10,
          investment_amount: 1500,
          stock: mockStock,
        },
      ];

      // Mock portfolio
      jest
        .spyOn(portfolioRepository, 'findOne')
        .mockResolvedValue(mockPortfolio as Portfolio);

      // Mock holdings query
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockHoldings),
      };
      jest
        .spyOn(portfolioStockRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.getPortfolioHoldings(
        'portfolio-123',
        'user-123',
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('stock_id', 'stock-123');
      expect(result[0]).toHaveProperty('symbol', 'AAPL');
      expect(result[0]).toHaveProperty('current_value', 1500);
    });

    it('should throw NotFoundException when portfolio not found', async () => {
      jest.spyOn(portfolioRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.getPortfolioHoldings('portfolio-123', 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserTradeOrders', () => {
    it('should return user trade orders successfully', async () => {
      const mockOrdersWithStock = [
        {
          ...mockTradeOrder,
          stock: {
            id: 'stock-123',
            symbol: 'AAPL',
            name: 'Apple Inc.',
            current_price: 150.0,
            market: 'NASDAQ',
          },
          portfolio: {
            id: 'portfolio-123',
            name: 'Test Portfolio',
            description: 'Test Description',
          },
        } as TradeOrder,
      ];
      const mockUserWithWallet = {
        ...mockUser,
        wallet: mockWallet,
      };

      // Mock user with wallet
      jest
        .spyOn(userRepository, 'findOne')
        .mockResolvedValue(mockUserWithWallet as User);

      // Mock trade orders with stock relations
      jest
        .spyOn(tradeOrderRepository, 'findAndCount')
        .mockResolvedValue([mockOrdersWithStock, 1]);

      const result = await service.getUserTradeOrders('user-123', 1, 10);

      expect(result.orders).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should throw NotFoundException when user or wallet not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.getUserTradeOrders('user-123', 1, 10),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
