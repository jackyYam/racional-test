import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stock } from './entities/stock.entity';

@Injectable()
export class StocksService {
  constructor(
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
  ) {}

  async findAll(): Promise<Stock[]> {
    return this.stockRepository.find({
      order: { symbol: 'ASC' },
    });
  }

  async findById(id: string): Promise<Stock> {
    const stock = await this.stockRepository.findOneBy({ id });
    if (!stock) {
      throw new NotFoundException('Stock not found');
    }
    return stock;
  }

  async findBySymbol(symbol: string): Promise<Stock> {
    const stock = await this.stockRepository.findOneBy({ symbol });
    if (!stock) {
      throw new NotFoundException('Stock not found');
    }
    return stock;
  }

  async updatePrice(id: string, newPrice: number): Promise<Stock> {
    if (newPrice <= 0) {
      throw new Error('Price must be positive');
    }

    const stock = await this.findById(id);
    stock.current_price = newPrice;

    return this.stockRepository.save(stock);
  }

  async getStockInfo(id: string): Promise<any> {
    const stock = await this.findById(id);

    return {
      id: stock.id,
      symbol: stock.symbol,
      name: stock.name,
      market: stock.market,
      current_price: stock.current_price,
      created_at: stock.created_at,
      updated_at: stock.updated_at,
    };
  }
}
