import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { Portfolio } from '../portfolios/entities/portfolio.entity';
import {
  Transaction,
  TransactionType,
} from '../transactions/entities/transaction.entity';
import { UpdateUserDto, UserProfileResponseDto } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(Portfolio)
    private portfolioRepository: Repository<Portfolio>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  async findById(userId: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateProfile(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    const user = await this.findById(userId);

    // Update only the fields that are provided
    if (updateUserDto.name !== undefined) {
      user.name = updateUserDto.name;
    }
    if (updateUserDto.phone !== undefined) {
      user.phone = updateUserDto.phone;
    }

    return this.userRepository.save(user);
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

  async getUserProfile(userId: string): Promise<UserProfileResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['wallet', 'portfolios'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.wallet) {
      throw new NotFoundException(
        'User wallet not found - this should not happen',
      );
    }

    // Calculate actual balance based on executed transactions
    const actualBalance = await this.calculateActualWalletBalance(
      user.wallet.id,
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        created_at: user.created_at.toISOString(),
        updated_at: user.updated_at.toISOString(),
      },
      wallet: {
        id: user.wallet.id,
        balance: actualBalance,
        currency: user.wallet.currency,
      },
      portfolios:
        user.portfolios?.map((portfolio) => ({
          id: portfolio.id,
          name: portfolio.name,
          description: portfolio.description,
        })) || [],
    };
  }
}
