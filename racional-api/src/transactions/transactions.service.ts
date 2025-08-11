import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Transaction, TransactionType } from './entities/transaction.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { User } from '../users/entities/user.entity';
import {
  CreateTransactionDto,
  TransactionResponseDto,
} from './schemas/transaction.schema';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async createTransaction(
    userId: string,
    createTransactionDto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    // Find user's wallet
    const wallet = await this.walletRepository.findOne({
      where: { user_id: userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    // Validate transaction amount
    if (createTransactionDto.amount <= 0) {
      throw new BadRequestException('Transaction amount must be positive');
    }

    // Check if user has sufficient funds for withdrawal (only executed transactions)
    if (createTransactionDto.type === TransactionType.WITHDRAWAL) {
      const actualBalance = await this.calculateActualWalletBalance(wallet.id);
      if (actualBalance < createTransactionDto.amount) {
        throw new BadRequestException('Insufficient funds for withdrawal');
      }
    }

    // Use transaction to ensure data consistency
    return this.dataSource.transaction(async (manager) => {
      // Create transaction record
      const transactionData = {
        wallet_id: wallet.id,
        type: createTransactionDto.type as TransactionType,
        amount: createTransactionDto.amount,
        execution_date: createTransactionDto.execution_date,
        external_ref_id: createTransactionDto.external_ref_id,
      };

      const transaction = manager.create(Transaction, transactionData);
      const savedTransaction = await manager.save(Transaction, transaction);

      // Update wallet balance only if transaction is executed
      if (createTransactionDto.execution_date) {
        if (createTransactionDto.type === TransactionType.DEPOSIT) {
          wallet.balance = Number(wallet.balance) + createTransactionDto.amount;
        } else {
          wallet.balance = Number(wallet.balance) - createTransactionDto.amount;
        }
        await manager.save(Wallet, wallet);
      }

      return {
        id: savedTransaction.id,
        wallet_id: savedTransaction.wallet_id,
        type: savedTransaction.type,
        amount: savedTransaction.amount,
        execution_date: savedTransaction.execution_date?.toISOString() || null,
        external_ref_id: savedTransaction.external_ref_id,
        created_at: savedTransaction.created_at.toISOString(),
      };
    });
  }

  async calculateActualWalletBalance(walletId: string): Promise<number> {
    // Use raw query to find transactions with non-null execution_date
    const transactions = await this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.wallet_id = :walletId', { walletId })
      .andWhere('transaction.execution_date IS NOT NULL')
      .getMany();

    let balance = 0;
    for (const transaction of transactions) {
      if (transaction.type === TransactionType.DEPOSIT) {
        balance += transaction.amount;
      } else {
        balance -= transaction.amount;
      }
    }

    return balance;
  }

  async updateTransactionExecutionDate(
    transactionId: string,
    userId: string,
    executionDate: string,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['wallet'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Verify the transaction belongs to the user
    if (transaction.wallet.user_id !== userId) {
      throw new NotFoundException('Transaction not found');
    }

    // Only allow updating transactions with null execution_date
    if (transaction.execution_date !== null) {
      throw new BadRequestException(
        'Cannot update execution date for already executed transactions',
      );
    }

    // Use transaction to ensure data consistency
    return this.dataSource.transaction(async (manager) => {
      const newExecutionDate = new Date(executionDate);

      // Update transaction execution date
      transaction.execution_date = newExecutionDate;
      const updatedTransaction = await manager.save(Transaction, transaction);

      // Recalculate wallet balance based on all executed transactions
      const wallet = transaction.wallet;
      const actualBalance = await this.calculateActualWalletBalance(wallet.id);
      wallet.balance = actualBalance;
      await manager.save(Wallet, wallet);

      return {
        id: updatedTransaction.id,
        wallet_id: updatedTransaction.wallet_id,
        type: updatedTransaction.type,
        amount: updatedTransaction.amount,
        execution_date:
          updatedTransaction.execution_date?.toISOString() || null,
        external_ref_id: updatedTransaction.external_ref_id,
        created_at: updatedTransaction.created_at.toISOString(),
      };
    });
  }

  async getUserTransactions(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    transactions: TransactionResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const wallet = await this.walletRepository.findOne({
      where: { user_id: userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const [transactions, total] = await this.transactionRepository.findAndCount(
      {
        where: { wallet_id: wallet.id },
        order: { created_at: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      },
    );

    const transactionResponses = transactions.map((transaction) => ({
      id: transaction.id,
      wallet_id: transaction.wallet_id,
      type: transaction.type,
      amount: transaction.amount,
      execution_date: transaction.execution_date?.toISOString() || null,
      external_ref_id: transaction.external_ref_id,
      created_at: transaction.created_at.toISOString(),
    }));

    return {
      transactions: transactionResponses,
      total,
      page,
      limit,
    };
  }

  async getTransactionById(
    transactionId: string,
    userId: string,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['wallet'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Verify the transaction belongs to the user
    if (transaction.wallet.user_id !== userId) {
      throw new NotFoundException('Transaction not found');
    }

    return {
      id: transaction.id,
      wallet_id: transaction.wallet_id,
      type: transaction.type,
      amount: transaction.amount,
      execution_date: transaction.execution_date?.toISOString() || null,
      external_ref_id: transaction.external_ref_id,
      created_at: transaction.created_at.toISOString(),
    };
  }
}
