import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PortfoliosService } from '../../../src/portfolios/portfolios.service';
import { Portfolio } from '../../../src/portfolios/entities/portfolio.entity';
import { PortfolioStock } from '../../../src/portfolios/entities/portfolio-stock.entity';
import { User } from '../../../src/users/entities/user.entity';
import {
  TradeOrder,
  TradeOrderType,
} from '../../../src/trades/entities/trade-order.entity';
import { Stock } from '../../../src/stocks/entities/stock.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PortfoliosService', () => {
  let service: PortfoliosService;
  let portfolioRepository: Repository<Portfolio>;
  let portfolioStockRepository: Repository<PortfolioStock>;
  let userRepository: Repository<User>;
  let tradeOrderRepository: Repository<TradeOrder>;
  let stockRepository: Repository<Stock>;

  const mockUser: Partial<User> = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockPortfolio: Partial<Portfolio> = {
    id: 'portfolio-123',
    user_id: 'user-123',
    name: 'Test Portfolio',
    description: 'Test Description',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockPortfolioStock: Partial<PortfolioStock> = {
    id: 'holding-123',
    portfolio_id: 'portfolio-123',
    stock_id: 'stock-123',
    shares: 10,
    investment_amount: 1500,
    sell_amount: 0,
    stock: {
      id: 'stock-123',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      market: 'NASDAQ',
      current_price: 150.0,
      created_at: new Date(),
    } as any,
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfoliosService,
        {
          provide: getRepositoryToken(Portfolio),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PortfolioStock),
          useValue: {
            find: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getMany: jest.fn(),
            })),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOneBy: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(TradeOrder),
          useValue: {
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
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PortfoliosService>(PortfoliosService);
    portfolioRepository = module.get<Repository<Portfolio>>(
      getRepositoryToken(Portfolio),
    );
    portfolioStockRepository = module.get<Repository<PortfolioStock>>(
      getRepositoryToken(PortfolioStock),
    );
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    tradeOrderRepository = module.get<Repository<TradeOrder>>(
      getRepositoryToken(TradeOrder),
    );
    stockRepository = module.get<Repository<Stock>>(getRepositoryToken(Stock));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPortfolio', () => {
    it('should create portfolio with name only successfully', async () => {
      const portfolioName = 'New Portfolio';
      const portfolioDescription = undefined;

      jest
        .spyOn(userRepository, 'findOneBy')
        .mockResolvedValue(mockUser as User);
      jest
        .spyOn(portfolioRepository, 'create')
        .mockReturnValue(mockPortfolio as Portfolio);
      jest
        .spyOn(portfolioRepository, 'save')
        .mockResolvedValue(mockPortfolio as Portfolio);

      const result = await service.createPortfolio(
        'user-123',
        portfolioName,
        portfolioDescription,
      );

      expect(result).toEqual(mockPortfolio);
      expect(portfolioRepository.create).toHaveBeenCalledWith({
        user_id: 'user-123',
        name: portfolioName,
        description: '', // Service defaults undefined to empty string
      });
      expect(portfolioRepository.save).toHaveBeenCalledWith(mockPortfolio);
    });

    it('should create portfolio with name and description successfully', async () => {
      const portfolioName = 'New Portfolio';
      const portfolioDescription = 'Portfolio Description';

      jest
        .spyOn(userRepository, 'findOneBy')
        .mockResolvedValue(mockUser as User);
      jest
        .spyOn(portfolioRepository, 'create')
        .mockReturnValue(mockPortfolio as Portfolio);
      jest
        .spyOn(portfolioRepository, 'save')
        .mockResolvedValue(mockPortfolio as Portfolio);

      const result = await service.createPortfolio(
        'user-123',
        portfolioName,
        portfolioDescription,
      );

      expect(result).toEqual(mockPortfolio);
      expect(portfolioRepository.create).toHaveBeenCalledWith({
        user_id: 'user-123',
        name: portfolioName,
        description: portfolioDescription,
      });
      expect(portfolioRepository.save).toHaveBeenCalledWith(mockPortfolio);
    });

    it('should throw NotFoundException when user not found', async () => {
      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(null);

      await expect(
        service.createPortfolio('user-123', 'New Portfolio'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserPortfolios', () => {
    it('should return user portfolios successfully', async () => {
      const mockPortfolios = [
        mockPortfolio,
        { ...mockPortfolio, id: 'portfolio-456', name: 'Portfolio 2' },
      ];

      jest
        .spyOn(portfolioRepository, 'find')
        .mockResolvedValue(mockPortfolios as Portfolio[]);

      const result = await service.getUserPortfolios('user-123');

      expect(result).toEqual(mockPortfolios);
      expect(result).toHaveLength(2);
      expect(portfolioRepository.find).toHaveBeenCalledWith({
        where: { user_id: 'user-123' },
        order: { created_at: 'ASC' }, // Service uses ASC, not DESC
      });
    });

    it('should return empty array when user has no portfolios', async () => {
      jest.spyOn(portfolioRepository, 'find').mockResolvedValue([]);

      const result = await service.getUserPortfolios('user-123');

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('getPortfolioById', () => {
    it('should return portfolio by id successfully', async () => {
      jest
        .spyOn(portfolioRepository, 'findOne')
        .mockResolvedValue(mockPortfolio as Portfolio);

      const result = await service.getPortfolioById(
        'portfolio-123',
        'user-123',
      );

      expect(result).toEqual(mockPortfolio);
      expect(portfolioRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'portfolio-123', user_id: 'user-123' },
      });
    });

    it('should throw NotFoundException when portfolio not found', async () => {
      jest.spyOn(portfolioRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.getPortfolioById('portfolio-123', 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when portfolio belongs to different user', async () => {
      jest.spyOn(portfolioRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.getPortfolioById('portfolio-123', 'different-user'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updatePortfolio', () => {
    it('should update portfolio successfully', async () => {
      const updatePortfolioDto = {
        name: 'Updated Portfolio',
        description: 'Updated Description',
      };
      const updatedPortfolio = { ...mockPortfolio, ...updatePortfolioDto };

      jest
        .spyOn(portfolioRepository, 'findOne')
        .mockResolvedValue(mockPortfolio as Portfolio);
      jest
        .spyOn(portfolioRepository, 'save')
        .mockResolvedValue(updatedPortfolio as Portfolio);

      const result = await service.updatePortfolio(
        'portfolio-123',
        'user-123',
        updatePortfolioDto,
      );

      expect(result.name).toBe(updatePortfolioDto.name);
      expect(result.description).toBe(updatePortfolioDto.description);
    });

    it('should update only portfolio name when description not provided', async () => {
      const updateDto = { name: 'Updated Name' };
      const updatedPortfolio = { ...mockPortfolio, name: updateDto.name };

      jest
        .spyOn(portfolioRepository, 'findOne')
        .mockResolvedValue(mockPortfolio as Portfolio);
      jest
        .spyOn(portfolioRepository, 'save')
        .mockResolvedValue(updatedPortfolio as Portfolio);

      const result = await service.updatePortfolio(
        'portfolio-123',
        'user-123',
        updateDto,
      );

      expect(result.name).toBe(updateDto.name);
      expect(result.description).toBe(mockPortfolio.description); // Unchanged
    });

    it('should update only portfolio description when name not provided', async () => {
      const updateDto = { description: 'Updated Description' };
      const updatedPortfolio = {
        ...mockPortfolio,
        description: updateDto.description,
      };

      jest
        .spyOn(portfolioRepository, 'findOne')
        .mockResolvedValue(mockPortfolio as Portfolio);
      jest
        .spyOn(portfolioRepository, 'save')
        .mockResolvedValue(updatedPortfolio as Portfolio);

      const result = await service.updatePortfolio(
        'portfolio-123',
        'user-123',
        updateDto,
      );

      expect(result.name).toBe(mockPortfolio.name); // Unchanged
      expect(result.description).toBe(updateDto.description);
    });

    it('should throw NotFoundException when portfolio not found', async () => {
      jest.spyOn(portfolioRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.updatePortfolio('portfolio-123', 'user-123', {
          name: 'Updated Name',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPortfolioSummary', () => {
    const mockStock = {
      id: 'stock-123',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      market: 'NASDAQ',
      current_price: 150.0,
      created_at: new Date(),
      updated_at: new Date(),
    };

    it('should return portfolio summary with holdings successfully', async () => {
      const mockPortfolioStocks = [
        {
          id: 'portfolio-stock-1',
          portfolio_id: 'portfolio-123',
          stock_id: 'stock-123',
          shares: 15,
          investment_amount: 1600, // Total investment
          sell_amount: 0,
          stock: mockStock,
        },
      ];

      jest
        .spyOn(portfolioRepository, 'findOne')
        .mockResolvedValue(mockPortfolio as Portfolio);

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockPortfolioStocks),
      };
      jest
        .spyOn(portfolioStockRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.getPortfolioSummary(
        'portfolio-123',
        'user-123',
      );

      expect(result.portfolio).toEqual({
        id: mockPortfolio.id,
        name: mockPortfolio.name,
        description: mockPortfolio.description,
        created_at: mockPortfolio.created_at,
        updated_at: mockPortfolio.updated_at,
      });
      expect(result.summary.total_investment).toBe(1600);
      expect(result.summary.total_current_value).toBe(2250); // 15 * 150
      expect(result.summary.total_profit_loss).toBe(650); // 2250 - 1600
      expect(result.holdings).toHaveLength(1);
      expect(result.holdings[0].shares).toBe(15);
    });

    it('should return portfolio summary with zero values when no holdings', async () => {
      jest
        .spyOn(portfolioRepository, 'findOne')
        .mockResolvedValue(mockPortfolio as Portfolio);

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      jest
        .spyOn(portfolioStockRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.getPortfolioSummary(
        'portfolio-123',
        'user-123',
      );

      expect(result.summary.total_investment).toBe(0);
      expect(result.summary.total_current_value).toBe(0);
      expect(result.summary.total_profit_loss).toBe(0);
      expect(result.holdings).toHaveLength(0);
    });

    it('should handle buy and sell trades correctly', async () => {
      const mockPortfolioStocks = [
        {
          id: 'portfolio-stock-1',
          portfolio_id: 'portfolio-123',
          stock_id: 'stock-123',
          shares: 7, // 10 bought - 3 sold
          investment_amount: 640, // (10 * 100) - (3 * 120)
          sell_amount: 360, // 3 * 120
          stock: mockStock,
        },
      ];

      jest
        .spyOn(portfolioRepository, 'findOne')
        .mockResolvedValue(mockPortfolio as Portfolio);

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockPortfolioStocks),
      };
      jest
        .spyOn(portfolioStockRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.getPortfolioSummary(
        'portfolio-123',
        'user-123',
      );

      expect(result.holdings).toHaveLength(1);
      expect(result.holdings[0].shares).toBe(7); // 10 - 3
      expect(result.summary.total_investment).toBe(640); // (10 * 100) - (3 * 120)
    });

    it('should filter out stocks with zero shares after selling', async () => {
      // When all shares are sold, the query with andWhere('portfolioStock.shares > 0')
      // would return empty array since there are no stocks with shares > 0
      jest
        .spyOn(portfolioRepository, 'findOne')
        .mockResolvedValue(mockPortfolio as Portfolio);

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]), // No stocks with shares > 0
      };
      jest
        .spyOn(portfolioStockRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.getPortfolioSummary(
        'portfolio-123',
        'user-123',
      );

      expect(result.holdings).toHaveLength(0); // No holdings after selling all shares
      expect(result.summary.total_investment).toBe(0);
      expect(result.summary.total_current_value).toBe(0);
    });

    it('should throw NotFoundException when portfolio not found', async () => {
      jest.spyOn(portfolioRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.getPortfolioSummary('portfolio-123', 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Edge Cases', () => {
    it('should handle portfolio with very long name', async () => {
      const longName = 'A'.repeat(200); // Very long portfolio name
      const longNamePortfolio = { ...mockPortfolio, name: longName };

      jest
        .spyOn(userRepository, 'findOneBy')
        .mockResolvedValue(mockUser as User);
      jest
        .spyOn(portfolioRepository, 'create')
        .mockReturnValue(longNamePortfolio as Portfolio);
      jest
        .spyOn(portfolioRepository, 'save')
        .mockResolvedValue(longNamePortfolio as Portfolio);

      const result = await service.createPortfolio('user-123', longName);

      expect(result.name).toBe(longName); // Expect the actual long name, not hardcoded value
    });

    it('should handle portfolio with special characters in name', async () => {
      const specialName = 'Portfolio @#$%^&*()';
      const specialPortfolio = { ...mockPortfolio, name: specialName };

      jest
        .spyOn(portfolioRepository, 'create')
        .mockReturnValue(specialPortfolio as Portfolio);
      jest
        .spyOn(portfolioRepository, 'save')
        .mockResolvedValue(specialPortfolio as Portfolio);
      jest
        .spyOn(userRepository, 'findOneBy')
        .mockResolvedValue(mockUser as User);

      const result = await service.createPortfolio('user-123', specialName);

      expect(result.name).toBe(specialName);
    });
  });
});
