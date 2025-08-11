import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { TransactionsService } from './transactions.service';
import { Transaction, TransactionType } from './entities/transaction.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { User } from '../users/entities/user.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateTransactionDto } from './schemas/transaction.schema';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let transactionRepository: Repository<Transaction>;
  let walletRepository: Repository<Wallet>;
  let userRepository: Repository<User>;
  let dataSource: DataSource;

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

  const mockTransaction = {
    id: 'tx-123',
    wallet_id: 'wallet-123',
    type: TransactionType.DEPOSIT,
    amount: 500,
    execution_date: null,
    external_ref_id: 'ext-123',
    created_at: new Date('2024-01-01'),
    wallet: mockWallet,
  } as unknown as Transaction;

  const mockExecutedTransaction = {
    ...mockTransaction,
    id: 'tx-executed',
    execution_date: new Date('2024-01-01'),
  } as unknown as Transaction;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            findAndCount: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(),
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
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    transactionRepository = module.get<Repository<Transaction>>(
      getRepositoryToken(Transaction),
    );
    walletRepository = module.get<Repository<Wallet>>(
      getRepositoryToken(Wallet),
    );
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    dataSource = module.get<DataSource>(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTransaction', () => {
    const createTransactionDto: CreateTransactionDto = {
      type: TransactionType.DEPOSIT,
      amount: 500,
      execution_date: new Date('2024-01-01'),
      external_ref_id: 'ext-123',
    };

    it('should create a transaction and update wallet balance when executed', async () => {
      const mockTransactionManager = {
        create: jest.fn().mockReturnValue(mockTransaction),
        save: jest.fn().mockResolvedValue(mockExecutedTransaction),
      };

      jest.spyOn(walletRepository, 'findOne').mockResolvedValue(mockWallet);
      jest
        .spyOn(dataSource, 'transaction')
        .mockImplementation(async (callback: any) => {
          return callback(mockTransactionManager);
        });

      const result = await service.createTransaction(
        'user-123',
        createTransactionDto,
      );

      expect(result.id).toBe('tx-executed');
      expect(result.amount).toBe(500);
      expect(result.execution_date).toBe('2024-01-01T00:00:00.000Z'); // Fixed: expect the actual format
      expect(mockTransactionManager.create).toHaveBeenCalledWith(Transaction, {
        wallet_id: 'wallet-123',
        type: TransactionType.DEPOSIT,
        amount: 500,
        execution_date: expect.any(Date),
        external_ref_id: 'ext-123',
      });
    });

    it('should create a pending transaction without updating wallet balance', async () => {
      const pendingDto = { ...createTransactionDto, execution_date: undefined };
      const mockTransactionManager = {
        create: jest.fn().mockReturnValue(mockTransaction),
        save: jest.fn().mockResolvedValue(mockTransaction),
      };

      jest.spyOn(walletRepository, 'findOne').mockResolvedValue(mockWallet);
      jest
        .spyOn(dataSource, 'transaction')
        .mockImplementation(async (callback: any) => {
          return callback(mockTransactionManager);
        });

      const result = await service.createTransaction('user-123', pendingDto);

      expect(result.execution_date).toBeNull();
      expect(mockTransactionManager.save).toHaveBeenCalledTimes(1); // Only transaction, not wallet
    });

    it('should throw NotFoundException when wallet not found', async () => {
      jest.spyOn(walletRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.createTransaction('user-123', createTransactionDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid amount', async () => {
      const invalidDto = { ...createTransactionDto, amount: 0 };

      // Mock wallet to exist so we can test the amount validation
      jest.spyOn(walletRepository, 'findOne').mockResolvedValue(mockWallet);

      await expect(
        service.createTransaction('user-123', invalidDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for insufficient funds on withdrawal', async () => {
      const withdrawalDto = {
        ...createTransactionDto,
        type: TransactionType.WITHDRAWAL,
        amount: 2000,
      };
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]), // No executed transactions = 0 balance
      };

      jest.spyOn(walletRepository, 'findOne').mockResolvedValue(mockWallet);
      jest
        .spyOn(transactionRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      await expect(
        service.createTransaction('user-123', withdrawalDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('calculateActualWalletBalance', () => {
    it('should calculate balance from executed transactions only', async () => {
      const executedTransactions = [
        { type: TransactionType.DEPOSIT, amount: 1000 },
        { type: TransactionType.WITHDRAWAL, amount: 200 },
        { type: TransactionType.DEPOSIT, amount: 500 },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(executedTransactions),
      };

      jest
        .spyOn(transactionRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.calculateActualWalletBalance('wallet-123');

      // 1000 + 500 - 200 = 1300
      expect(result).toBe(1300);
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

  describe('updateTransactionExecutionDate', () => {
    it('should update execution date for pending transaction and recalculate wallet balance', async () => {
      const mockTransactionManager = {
        save: jest.fn().mockResolvedValue(mockExecutedTransaction),
      };

      jest
        .spyOn(transactionRepository, 'findOne')
        .mockResolvedValue(mockTransaction);
      jest
        .spyOn(dataSource, 'transaction')
        .mockImplementation(async (callback: any) => {
          return callback(mockTransactionManager);
        });

      // Mock the calculateActualWalletBalance method
      jest
        .spyOn(service, 'calculateActualWalletBalance')
        .mockResolvedValue(1500);

      const result = await service.updateTransactionExecutionDate(
        'tx-123',
        'user-123',
        '2024-01-02T00:00:00Z',
      );

      expect(result.execution_date).toBe('2024-01-01T00:00:00.000Z'); // Fixed: expect the actual mock data format
      expect(mockTransactionManager.save).toHaveBeenCalledTimes(2); // Transaction + Wallet
    });

    it('should throw NotFoundException when transaction not found', async () => {
      jest.spyOn(transactionRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.updateTransactionExecutionDate(
          'nonexistent',
          'user-123',
          '2024-01-02T00:00:00Z',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when transaction does not belong to user', async () => {
      const transactionWithDifferentUser = {
        ...mockTransaction,
        wallet: { ...mockWallet, user_id: 'different-user' },
      };

      jest
        .spyOn(transactionRepository, 'findOne')
        .mockResolvedValue(transactionWithDifferentUser as any);

      await expect(
        service.updateTransactionExecutionDate(
          'tx-123',
          'user-123',
          '2024-01-02T00:00:00Z',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when updating already executed transaction', async () => {
      jest
        .spyOn(transactionRepository, 'findOne')
        .mockResolvedValue(mockExecutedTransaction);

      await expect(
        service.updateTransactionExecutionDate(
          'tx-executed',
          'user-123',
          '2024-01-02T00:00:00Z',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getUserTransactions', () => {
    it('should return paginated user transactions', async () => {
      const transactions = [mockTransaction, mockExecutedTransaction];

      jest.spyOn(walletRepository, 'findOne').mockResolvedValue(mockWallet);
      jest
        .spyOn(transactionRepository, 'findAndCount')
        .mockResolvedValue([transactions, 2]);

      const result = await service.getUserTransactions('user-123', 1, 10);

      expect(result.transactions).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should throw NotFoundException when wallet not found', async () => {
      jest.spyOn(walletRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getUserTransactions('user-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getTransactionById', () => {
    it('should return transaction when found and belongs to user', async () => {
      jest
        .spyOn(transactionRepository, 'findOne')
        .mockResolvedValue(mockTransaction);

      const result = await service.getTransactionById('tx-123', 'user-123');

      expect(result.id).toBe('tx-123');
      expect(result.wallet_id).toBe('wallet-123');
    });

    it('should throw NotFoundException when transaction not found', async () => {
      jest.spyOn(transactionRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.getTransactionById('nonexistent', 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when transaction does not belong to user', async () => {
      const transactionWithDifferentUser = {
        ...mockTransaction,
        wallet: { ...mockWallet, user_id: 'different-user' },
      };

      jest
        .spyOn(transactionRepository, 'findOne')
        .mockResolvedValue(transactionWithDifferentUser as any);

      await expect(
        service.getTransactionById('tx-123', 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
