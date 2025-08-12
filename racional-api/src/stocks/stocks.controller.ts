import { Controller, Get, Param, Put, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StocksService } from './stocks.service';

@ApiTags('Stocks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stocks')
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  @Get()
  @ApiOperation({ summary: 'Get all available stocks' })
  @ApiResponse({
    status: 200,
    description: 'List of all stocks',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          symbol: { type: 'string' },
          name: { type: 'string' },
          market: { type: 'string' },
          current_price: { type: 'number' },
          created_at: { type: 'string' },
          updated_at: { type: 'string' },
        },
      },
    },
  })
  async getAllStocks() {
    return this.stocksService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get stock information by ID' })
  @ApiResponse({
    status: 200,
    description: 'Stock information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        symbol: { type: 'string' },
        name: { type: 'string' },
        market: { type: 'string' },
        current_price: { type: 'number' },
        created_at: { type: 'string' },
        updated_at: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Stock not found' })
  async getStockById(@Param('id') id: string) {
    return this.stocksService.getStockInfo(id);
  }

  @Get('symbol/:symbol')
  @ApiOperation({ summary: 'Get stock information by symbol' })
  @ApiResponse({
    status: 200,
    description: 'Stock information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        symbol: { type: 'string' },
        name: { type: 'string' },
        market: { type: 'string' },
        current_price: { type: 'number' },
        created_at: { type: 'string' },
        updated_at: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Stock not found' })
  async getStockBySymbol(@Param('symbol') symbol: string) {
    return this.stocksService.findBySymbol(symbol);
  }

  @Put(':id/price')
  @ApiOperation({ summary: 'Update stock price (admin function)' })
  @ApiResponse({
    status: 200,
    description: 'Stock price updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        current_price: { type: 'number' },
        updated_at: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid price' })
  @ApiResponse({ status: 404, description: 'Stock not found' })
  async updateStockPrice(
    @Param('id') id: string,
    @Body('price') price: number,
  ) {
    return this.stocksService.updatePrice(id, price);
  }
}
