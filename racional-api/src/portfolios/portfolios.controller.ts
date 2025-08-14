import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
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
import { PortfoliosService } from './portfolios.service';
import { UpdatePortfolioSchema } from './schemas/portfolio.schema';
import type { UpdatePortfolioDto } from './schemas/portfolio.schema';

@ApiTags('Portfolios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('portfolios')
export class PortfoliosController {
  constructor(private readonly portfoliosService: PortfoliosService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new portfolio' })
  @ApiResponse({
    status: 201,
    description: 'Portfolio created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        user_id: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        created_at: { type: 'string' },
        updated_at: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async createPortfolio(
    @Body('name') name: string,
    @Body('description') description: string | undefined,
    @Req() req: any,
  ) {
    return this.portfoliosService.createPortfolio(
      req.user.id,
      name,
      description,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get user portfolios' })
  @ApiResponse({
    status: 200,
    description: 'User portfolios retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          user_id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          created_at: { type: 'string' },
          updated_at: { type: 'string' },
        },
      },
    },
  })
  async getUserPortfolios(@Req() req: any) {
    return this.portfoliosService.getUserPortfolios(req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update portfolio information' })
  @ApiResponse({
    status: 200,
    description: 'Portfolio updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        updated_at: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async updatePortfolio(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdatePortfolioSchema))
    updatePortfolioDto: UpdatePortfolioDto,
    @Req() req: any,
  ) {
    return this.portfoliosService.updatePortfolio(
      id,
      req.user.id,
      updatePortfolioDto,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get portfolio summary with holdings and performance',
  })
  @ApiResponse({
    status: 200,
    description: 'Portfolio summary retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        portfolio: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            created_at: { type: 'string' },
            updated_at: { type: 'string' },
          },
        },
        summary: {
          type: 'object',
          properties: {
            total_holdings: { type: 'number' },
            total_investment: { type: 'number' },
            total_current_value: { type: 'number' },
            total_profit_loss: { type: 'number' },
            profit_loss_percentage: { type: 'number' },
          },
        },
        holdings: {
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
              profit_loss_percentage: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async getPortfolioSummary(@Param('id') id: string, @Req() req: any) {
    return this.portfoliosService.getPortfolioSummary(id, req.user.id);
  }
}
