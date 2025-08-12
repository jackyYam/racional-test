import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StocksService } from '../../../src/stocks/stocks.service';
import { Stock } from '../../../src/stocks/entities/stock.entity';
import { NotFoundException } from '@nestjs/common';

describe('StocksService', () => {
  let service: StocksService;
  let stockRepository: Repository<Stock>;

  const mockStock: Partial<Stock> = {
    id: 'stock-123',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    current_price: 150.0,
    market: 'NASDAQ',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockStocks = [
    mockStock,
    {
      id: 'stock-456',
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      current_price: 2800.0,
      market: 'NASDAQ',
      created_at: new Date(),
    },
    {
      id: 'stock-789',
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      current_price: 300.0,
      market: 'NASDAQ',
      created_at: new Date(),
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StocksService,
        {
          provide: getRepositoryToken(Stock),
          useValue: {
            find: jest.fn(),
            findOneBy: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StocksService>(StocksService);
    stockRepository = module.get<Repository<Stock>>(getRepositoryToken(Stock));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all stocks successfully', async () => {
      jest
        .spyOn(stockRepository, 'find')
        .mockResolvedValue(mockStocks as Stock[]);

      const result = await service.findAll();

      expect(result).toEqual(mockStocks);
      expect(result).toHaveLength(3);
      expect(stockRepository.find).toHaveBeenCalledWith({
        order: { symbol: 'ASC' },
      });
    });

    it('should return empty array when no stocks exist', async () => {
      jest.spyOn(stockRepository, 'find').mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('should return stock by id successfully', async () => {
      jest
        .spyOn(stockRepository, 'findOneBy')
        .mockResolvedValue(mockStock as Stock);

      const result = await service.findById('stock-123');

      expect(result).toEqual(mockStock);
      expect(stockRepository.findOneBy).toHaveBeenCalledWith({
        id: 'stock-123',
      });
    });

    it('should throw NotFoundException when stock not found', async () => {
      jest.spyOn(stockRepository, 'findOneBy').mockResolvedValue(null);

      await expect(service.findById('stock-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findBySymbol', () => {
    it('should return stock by symbol successfully', async () => {
      jest
        .spyOn(stockRepository, 'findOneBy')
        .mockResolvedValue(mockStock as Stock);

      const result = await service.findBySymbol('AAPL');

      expect(result).toEqual(mockStock);
      expect(stockRepository.findOneBy).toHaveBeenCalledWith({
        symbol: 'AAPL',
      });
    });

    it('should throw NotFoundException when stock symbol not found', async () => {
      jest.spyOn(stockRepository, 'findOneBy').mockResolvedValue(null);

      await expect(service.findBySymbol('INVALID')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updatePrice', () => {
    it('should update stock price successfully', async () => {
      const newPrice = 160.0;
      const updatedStock = { ...mockStock, current_price: newPrice };

      jest
        .spyOn(stockRepository, 'findOneBy')
        .mockResolvedValue(mockStock as Stock);
      jest
        .spyOn(stockRepository, 'save')
        .mockResolvedValue(updatedStock as Stock);

      const result = await service.updatePrice('stock-123', newPrice);

      expect(result).toEqual(updatedStock);
      expect(stockRepository.save).toHaveBeenCalledWith(updatedStock);
    });

    it('should throw NotFoundException when stock not found', async () => {
      jest.spyOn(stockRepository, 'findOneBy').mockResolvedValue(null);

      await expect(service.updatePrice('stock-123', 160.0)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw Error when new price is not positive', async () => {
      jest
        .spyOn(stockRepository, 'findOneBy')
        .mockResolvedValue(mockStock as Stock);

      await expect(service.updatePrice('stock-123', -100)).rejects.toThrow(
        Error,
      );
    });

    it('should throw Error when new price is zero', async () => {
      jest
        .spyOn(stockRepository, 'findOneBy')
        .mockResolvedValue(mockStock as Stock);

      await expect(service.updatePrice('stock-123', 0)).rejects.toThrow(Error);
    });
  });

  describe('getStockInfo', () => {
    it('should return stock info successfully', async () => {
      const freshMockStock = {
        id: 'stock-123',
        symbol: 'AAPL',
        name: 'Apple Inc.',
        current_price: 150.0,
        market: 'NASDAQ',
        created_at: new Date(),
        updated_at: new Date(),
      };

      jest
        .spyOn(stockRepository, 'findOneBy')
        .mockResolvedValue(freshMockStock as Stock);

      const result = await service.getStockInfo('stock-123');

      expect(result).toEqual({
        id: 'stock-123',
        symbol: 'AAPL',
        name: 'Apple Inc.',
        market: 'NASDAQ',
        current_price: 150.0,
        created_at: freshMockStock.created_at,
        updated_at: freshMockStock.updated_at,
      });
    });

    it('should throw NotFoundException when stock not found', async () => {
      jest.spyOn(stockRepository, 'findOneBy').mockResolvedValue(null);

      await expect(service.getStockInfo('stock-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle stock with very high price', async () => {
      const highPriceStock = { ...mockStock, current_price: 999999.99 };

      jest
        .spyOn(stockRepository, 'findOneBy')
        .mockResolvedValue(highPriceStock as Stock);
      jest
        .spyOn(stockRepository, 'save')
        .mockResolvedValue(highPriceStock as Stock);

      const result = await service.updatePrice('stock-123', 999999.99);

      expect(result.current_price).toBe(999999.99);
    });

    it('should handle stock with very long name', async () => {
      const longName = 'A'.repeat(200); // Very long company name
      const longNameStock = { ...mockStock, name: longName };

      jest
        .spyOn(stockRepository, 'findOneBy')
        .mockResolvedValue(longNameStock as Stock);

      const result = await service.getStockInfo('stock-123');

      expect(result.name).toBe(longName);
    });

    it('should handle stock with special characters in symbol', async () => {
      const specialSymbol = 'ST@CK';
      const specialStock = { ...mockStock, symbol: specialSymbol };

      jest
        .spyOn(stockRepository, 'findOneBy')
        .mockResolvedValue(specialStock as Stock);

      const result = await service.findBySymbol('ST@CK');

      expect(result.symbol).toBe(specialSymbol);
    });
  });
});
