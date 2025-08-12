import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../../../src/users/users.service';
import { User } from '../../../src/users/entities/user.entity';
import { Wallet } from '../../../src/wallets/entities/wallet.entity';
import { Portfolio } from '../../../src/portfolios/entities/portfolio.entity';
import {
  Transaction,
  TransactionType,
} from '../../../src/transactions/entities/transaction.entity';
import { NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from './schemas/user.schema';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<User>;
  let walletRepository: Repository<Wallet>;
  let portfolioRepository: Repository<Portfolio>;
  let transactionRepository: Repository<Transaction>;

  const mockUser = {
    id: 'user-123',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    password: 'hashedPassword',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    wallet: null,
    portfolios: [],
  } as unknown as User;

  const mockWallet = {
    id: 'wallet-123',
    user_id: 'user-123',
    balance: 1000,
    currency: 'USD',
    updated_at: new Date('2024-01-01'),
    user: mockUser,
    transactions: [],
    tradeOrders: [],
  } as unknown as Wallet;

  const mockPortfolio = {
    id: 'portfolio-123',
    user_id: 'user-123',
    name: 'Main Portfolio',
    description: 'Primary investment portfolio',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    user: mockUser,
    portfolioStocks: [],
    tradeOrders: [],
  } as unknown as Portfolio;

  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      wallet_id: 'wallet-123',
      type: TransactionType.DEPOSIT,
      amount: 1000,
      execution_date: new Date('2024-01-01'),
      external_ref_id: 'ext-1',
      created_at: new Date('2024-01-01'),
      wallet: mockWallet,
    } as unknown as Transaction,
    {
      id: 'tx-2',
      wallet_id: 'wallet-123',
      type: TransactionType.WITHDRAWAL,
      amount: 200,
      execution_date: new Date('2024-01-02'),
      external_ref_id: 'ext-2',
      created_at: new Date('2024-01-02'),
      wallet: mockWallet,
    } as unknown as Transaction,
    {
      id: 'tx-3',
      wallet_id: 'wallet-123',
      type: TransactionType.DEPOSIT,
      amount: 500,
      execution_date: null, // Pending transaction
      external_ref_id: 'ext-3',
      created_at: new Date('2024-01-03'),
      wallet: mockWallet,
    } as unknown as Transaction,
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOneBy: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Wallet),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Portfolio),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Transaction),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    walletRepository = module.get<Repository<Wallet>>(
      getRepositoryToken(Wallet),
    );
    portfolioRepository = module.get<Repository<Portfolio>>(
      getRepositoryToken(Portfolio),
    );
    transactionRepository = module.get<Repository<Transaction>>(
      getRepositoryToken(Transaction),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return a user when found', async () => {
      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(mockUser);

      const result = await service.findById('user-123');

      expect(result).toEqual(mockUser);
      expect(userRepository.findOneBy).toHaveBeenCalledWith({ id: 'user-123' });
    });

    it('should throw NotFoundException when user not found', async () => {
      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      expect(userRepository.findOneBy).toHaveBeenCalledWith({
        id: 'nonexistent',
      });
    });
  });

  describe('updateProfile', () => {
    it('should update user profile with provided fields', async () => {
      const updateDto: UpdateUserDto = {
        name: 'Jane Doe',
        phone: '+9876543210',
      };

      const updatedUser = { ...mockUser, ...updateDto };
      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(mockUser);
      jest.spyOn(userRepository, 'save').mockResolvedValue(updatedUser);

      const result = await service.updateProfile('user-123', updateDto);

      expect(result).toEqual(updatedUser);
      expect(userRepository.save).toHaveBeenCalledWith(updatedUser);
    });

    it('should update only provided fields', async () => {
      const updateDto: UpdateUserDto = {
        name: 'Jane Doe',
      };

      // Create a fresh copy of mockUser for this test
      const freshMockUser = {
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        password: 'hashedPassword',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01'),
        wallet: null,
        portfolios: [],
      } as unknown as User;

      // The service should only update the name field
      const updatedUser = { ...freshMockUser, name: 'Jane Doe' };
      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(freshMockUser);
      jest.spyOn(userRepository, 'save').mockResolvedValue(updatedUser);

      const result = await service.updateProfile('user-123', updateDto);

      expect(result.name).toBe('Jane Doe');
      expect(result.phone).toBe('+1234567890'); // Original value unchanged
      expect(userRepository.save).toHaveBeenCalledWith(updatedUser);

      // Verify that the service correctly updated only the name field
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      const updateDto: UpdateUserDto = { name: 'Jane Doe' };
      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(null);

      await expect(
        service.updateProfile('nonexistent', updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('calculateActualWalletBalance', () => {
    it('should calculate balance from executed transactions only', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest
          .fn()
          .mockResolvedValue(
            mockTransactions.filter((t) => t.execution_date !== null),
          ),
      };

      jest
        .spyOn(transactionRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.calculateActualWalletBalance('wallet-123');

      // Only executed transactions: DEPOSIT 1000 - WITHDRAWAL 200 = 800
      expect(result).toBe(800);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'transaction.wallet_id = :walletId',
        { walletId: 'wallet-123' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'transaction.execution_date IS NOT NULL',
      );
    });

    it('should return 0 when no executed transactions exist', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      jest
        .spyOn(transactionRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.calculateActualWalletBalance('wallet-123');

      expect(result).toBe(0);
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile with calculated wallet balance', async () => {
      const userWithRelations = {
        ...mockUser,
        wallet: mockWallet,
        portfolios: [mockPortfolio],
      };

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest
          .fn()
          .mockResolvedValue(
            mockTransactions.filter((t) => t.execution_date !== null),
          ),
      };

      jest
        .spyOn(userRepository, 'findOne')
        .mockResolvedValue(userWithRelations);
      jest
        .spyOn(transactionRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.getUserProfile('user-123');

      expect(result.user.id).toBe('user-123');
      expect(result.wallet.id).toBe('wallet-123');
      expect(result.wallet.balance).toBe(800); // Calculated balance
      expect(result.wallet.currency).toBe('USD');
      expect(result.portfolios).toHaveLength(1);
      expect(result.portfolios[0].name).toBe('Main Portfolio');
    });

    it('should throw NotFoundException when user not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getUserProfile('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when wallet not found', async () => {
      const userWithoutWallet = { ...mockUser, wallet: null };
      jest
        .spyOn(userRepository, 'findOne')
        .mockResolvedValue(userWithoutWallet as any);

      await expect(service.getUserProfile('user-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
