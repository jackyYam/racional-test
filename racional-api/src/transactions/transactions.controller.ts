import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreateTransactionSchema } from './schemas/transaction.schema';
import type {
  CreateTransactionDto,
  TransactionResponseDto,
  TransactionListResponseDto,
} from './schemas/transaction.schema';

@ApiTags('Transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a deposit or withdrawal transaction' })
  @ApiBody({
    description: 'Transaction data',
    schema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['DEPOSIT', 'WITHDRAWAL'] },
        amount: { type: 'number' },
        external_ref_id: { type: 'string', nullable: true },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Transaction created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        wallet_id: { type: 'string', format: 'uuid' },
        type: { type: 'string', enum: ['DEPOSIT', 'WITHDRAWAL'] },
        amount: { type: 'number' },
        execution_date: { type: 'string', nullable: true },
        external_ref_id: { type: 'string', nullable: true },
        created_at: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - insufficient funds or invalid amount',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async createTransaction(
    @Request() req: Request & { user: { id: string } },
    @Body(new ZodValidationPipe(CreateTransactionSchema))
    createTransactionDto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    const userId = req.user.id;
    return this.transactionsService.createTransaction(
      userId,
      createTransactionDto,
    );
  }

  @Put(':id/execute')
  @ApiOperation({
    summary:
      'Update transaction execution date (only for pending transactions)',
  })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiResponse({
    status: 200,
    description: 'Transaction execution date updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        wallet_id: { type: 'string', format: 'uuid' },
        type: { type: 'string', enum: ['DEPOSIT', 'WITHDRAWAL'] },
        amount: { type: 'number' },
        execution_date: { type: 'string', nullable: true },
        external_ref_id: { type: 'string', nullable: true },
        created_at: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - transaction already executed',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async updateTransactionExecutionDate(
    @Request() req: Request & { user: { id: string } },
    @Param('id') transactionId: string,
    @Body() body: { execution_date: string },
  ): Promise<TransactionResponseDto> {
    const userId = req.user.id;
    return this.transactionsService.updateTransactionExecutionDate(
      transactionId,
      userId,
      body.execution_date,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get user transaction history' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction history retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        transactions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              wallet_id: { type: 'string', format: 'uuid' },
              type: { type: 'string', enum: ['DEPOSIT', 'WITHDRAWAL'] },
              amount: { type: 'number' },
              execution_date: { type: 'string', nullable: true },
              external_ref_id: { type: 'string', nullable: true },
              created_at: { type: 'string' },
            },
          },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async getUserTransactions(
    @Request() req: Request & { user: { id: string } },
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<TransactionListResponseDto> {
    const userId = req.user.id;
    return this.transactionsService.getUserTransactions(userId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific transaction by ID' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiResponse({
    status: 200,
    description: 'Transaction retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        wallet_id: { type: 'string', format: 'uuid' },
        type: { type: 'string', enum: ['DEPOSIT', 'WITHDRAWAL'] },
        amount: { type: 'number' },
        execution_date: { type: 'string', nullable: true },
        external_ref_id: { type: 'string', nullable: true },
        created_at: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async getTransaction(
    @Request() req: Request & { user: { id: string } },
    @Param('id') transactionId: string,
  ): Promise<TransactionResponseDto> {
    const userId = req.user.id;
    return this.transactionsService.getTransactionById(transactionId, userId);
  }
}
