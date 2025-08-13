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
  @ApiOperation({
    summary: 'Create and execute a new buy/sell order immediately',
  })
  @ApiResponse({
    status: 201,
    description: 'Trade order created and executed successfully',
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
        execution_date: { type: 'string' },
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
              execution_date: { type: 'string' },
              created_at: { type: 'string' },
              status: { type: 'string', enum: ['executed'] },
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
