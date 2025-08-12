import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { TradesService } from './trades.service';
import { CreateTradeOrderSchema } from './schemas/trade-order.schema';
import type { CreateTradeOrderDto } from './schemas/trade-order.schema';

@ApiTags('Stock Trading')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('trades')
export class TradesController {
  constructor(private readonly tradesService: TradesService) {}

  @Post('orders')
  @ApiOperation({ summary: 'Create a new buy/sell order' })
  @ApiResponse({
    status: 201,
    description: 'Trade order created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        wallet_id: { type: 'string' },
        portfolio_id: { type: 'string' },
        stock_id: { type: 'string' },
        type: { type: 'string', enum: ['BUY', 'SELL'] },
        quantity: { type: 'number' },
        price: { type: 'number' },
        execution_date: { type: 'string', nullable: true },
        external_ref_id: { type: 'string', nullable: true },
        created_at: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or insufficient funds/shares',
  })
  @ApiResponse({
    status: 404,
    description: 'User, portfolio, or stock not found',
  })
  async createTradeOrder(
    @Body(new ZodValidationPipe(CreateTradeOrderSchema))
    createTradeOrderDto: CreateTradeOrderDto,
    @Req() req: any,
  ) {
    return this.tradesService.createTradeOrder(
      req.user.id,
      createTradeOrderDto,
    );
  }

  @Put('orders/:id/execute')
  @ApiOperation({ summary: 'Execute a pending trade order' })
  @ApiResponse({
    status: 200,
    description: 'Trade order executed successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        execution_date: { type: 'string' },
        status: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Order already executed or invalid input',
  })
  @ApiResponse({ status: 404, description: 'Trade order not found' })
  async executeTradeOrder(
    @Param('id') orderId: string,
    @Body('execution_date') executionDate: string,
    @Req() req: any,
  ) {
    return this.tradesService.executeTradeOrder(
      orderId,
      req.user.id,
      executionDate,
    );
  }

  @Get('portfolios/:portfolioId/holdings')
  @ApiOperation({ summary: 'Get portfolio holdings and current values' })
  @ApiResponse({
    status: 200,
    description: 'Portfolio holdings retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          stock_id: { type: 'string' },
          symbol: { type: 'string' },
          name: { type: 'string' },
          shares: { type: 'number' },
          investment_amount: { type: 'number' },
          current_value: { type: 'number' },
          current_price: { type: 'number' },
          avg_price: { type: 'number' },
          profit_loss: { type: 'number' },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async getPortfolioHoldings(
    @Param('portfolioId') portfolioId: string,
    @Req() req: any,
  ) {
    return this.tradesService.getPortfolioHoldings(portfolioId, req.user.id);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get user trade orders history' })
  @ApiResponse({
    status: 200,
    description: 'Trade orders retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        orders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              stock_symbol: { type: 'string' },
              stock_name: { type: 'string' },
              quantity: { type: 'number' },
              price: { type: 'number' },
              total_value: { type: 'number' },
              portfolio_name: { type: 'string' },
              execution_date: { type: 'string', nullable: true },
              created_at: { type: 'string' },
              status: { type: 'string' },
            },
          },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
    },
  })
  async getUserTradeOrders(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Req() req: any,
  ) {
    return this.tradesService.getUserTradeOrders(
      req.user.id,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }
}
