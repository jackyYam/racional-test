import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stock } from '../../stocks/entities/stock.entity';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
  ) {}

  async seedStocks(): Promise<void> {
    try {
      // Check if stocks already exist
      const existingStocks = await this.stockRepository.count();
      if (existingStocks > 0) {
        this.logger.log('Stocks already seeded, skipping...');
        return;
      }

      // Create 5 example stocks
      const stocks = [
        {
          id: 'stock-aapl',
          symbol: 'AAPL',
          name: 'Apple Inc.',
          market: 'NASDAQ',
          current_price: 150.0,
        },
        {
          id: 'stock-msft',
          symbol: 'MSFT',
          name: 'Microsoft Corporation',
          market: 'NASDAQ',
          current_price: 300.0,
        },
        {
          id: 'stock-googl',
          symbol: 'GOOGL',
          name: 'Alphabet Inc.',
          market: 'NASDAQ',
          current_price: 120.0,
        },
        {
          id: 'stock-amzn',
          symbol: 'AMZN',
          name: 'Amazon.com Inc.',
          market: 'NASDAQ',
          current_price: 130.0,
        },
        {
          id: 'stock-tsla',
          symbol: 'TSLA',
          name: 'Tesla Inc.',
          market: 'NASDAQ',
          current_price: 200.0,
        },
      ];

      await this.stockRepository.save(stocks);
      this.logger.log('Successfully seeded 5 stocks');
    } catch (error) {
      this.logger.error('Error seeding stocks:', error);
      throw error;
    }
  }

  async runAllSeeders(): Promise<void> {
    this.logger.log('Starting database seeding...');

    await this.seedStocks();

    this.logger.log('Database seeding completed successfully');
  }
}
