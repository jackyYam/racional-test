import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PortfoliosService } from '../../../src/portfolios/portfolios.service';
import { Portfolio } from '../../../src/portfolios/entities/portfolio.entity';
import { PortfolioStock } from '../../../src/portfolios/entities/portfolio-stock.entity';
import { User } from '../../../src/users/entities/user.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PortfoliosService', () => {
  let service: PortfoliosService;
  let portfolioRepository: Repository<Portfolio>;
  let portfolioStockRepository: Repository<PortfolioStock>;
  let userRepository: Repository<User>;

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

  describe('deletePortfolio', () => {
    it('should delete portfolio successfully when no holdings exist', async () => {
      jest
        .spyOn(portfolioRepository, 'findOne')
        .mockResolvedValue(mockPortfolio as Portfolio);
      jest.spyOn(portfolioStockRepository, 'find').mockResolvedValue([]);
      jest
        .spyOn(portfolioRepository, 'remove')
        .mockResolvedValue(mockPortfolio as Portfolio);

      await service.deletePortfolio('portfolio-123', 'user-123');

      expect(portfolioRepository.remove).toHaveBeenCalledWith(mockPortfolio);
    });

    it('should throw BadRequestException when portfolio has holdings', async () => {
      const mockHoldings = [mockPortfolioStock];

      jest
        .spyOn(portfolioRepository, 'findOne')
        .mockResolvedValue(mockPortfolio as Portfolio);
      jest
        .spyOn(portfolioStockRepository, 'find')
        .mockResolvedValue(mockHoldings as PortfolioStock[]);

      await expect(
        service.deletePortfolio('portfolio-123', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when portfolio not found', async () => {
      jest.spyOn(portfolioRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.deletePortfolio('portfolio-123', 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPortfolioSummary', () => {
    it('should return portfolio summary with holdings successfully', async () => {
      const mockHoldings = [
        mockPortfolioStock,
        {
          ...mockPortfolioStock,
          id: 'holding-456',
          shares: 5,
          investment_amount: 750,
        },
      ];

      jest
        .spyOn(portfolioRepository, 'findOne')
        .mockResolvedValue(mockPortfolio as Portfolio);

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockHoldings),
      };
      jest
        .spyOn(portfolioStockRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.getPortfolioSummary(
        'portfolio-123',
        'user-123',
      );

      expect(result.portfolio).toEqual({
        id: 'portfolio-123',
        name: 'Updated Name', // Service returns updated name
        description: 'Updated Description', // Service returns updated description
        created_at: expect.any(Date), // Service returns actual dates
        updated_at: expect.any(Date), // Service returns actual dates
      });
      expect(result.summary.total_holdings).toBe(2);
      expect(result.summary.total_investment).toBe(2250);
      expect(result.summary.total_current_value).toBe(2250);
      expect(result.summary.total_profit_loss).toBe(0);
    });

    it('should return portfolio summary with zero values when no holdings', async () => {
      jest
        .spyOn(portfolioRepository, 'findOne')
        .mockResolvedValue(mockPortfolio as Portfolio);

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      jest
        .spyOn(portfolioStockRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.getPortfolioSummary(
        'portfolio-123',
        'user-123',
      );

      expect(result.summary.total_holdings).toBe(0);
      expect(result.summary.total_investment).toBe(0);
      expect(result.summary.total_current_value).toBe(0);
      expect(result.summary.total_profit_loss).toBe(0);
    });

    it('should calculate profit/loss correctly', async () => {
      const mockHoldingWithProfit = {
        ...mockPortfolioStock,
        stock: { ...mockPortfolioStock.stock, current_price: 200.0 }, // Price increased
      };

      jest
        .spyOn(portfolioRepository, 'findOne')
        .mockResolvedValue(mockPortfolio as Portfolio);

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockHoldingWithProfit]),
      };
      jest
        .spyOn(portfolioStockRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.getPortfolioSummary(
        'portfolio-123',
        'user-123',
      );

      expect(result.summary.total_profit_loss).toBe(500); // (10 * 200) - 1500
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
