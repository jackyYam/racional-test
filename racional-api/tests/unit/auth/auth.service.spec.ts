import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../../src/auth/auth.service';
import { User } from '../../../src/users/entities/user.entity';
import { Wallet } from '../../../src/wallets/entities/wallet.entity';
import { Portfolio } from '../../../src/portfolios/entities/portfolio.entity';

// Mock bcrypt module
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let walletRepository: Repository<Wallet>;
  let jwtService: JwtService;

  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOneBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Wallet),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Portfolio),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOneBy: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    walletRepository = module.get<Repository<Wallet>>(
      getRepositoryToken(Wallet),
    );
    jwtService = module.get<JwtService>(JwtService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(mockUser);

      const result = await service.validateUser(email, password);

      expect(result).not.toHaveProperty('password');
      expect(result?.email).toBe(email);
      expect(userRepository.findOneBy).toHaveBeenCalledWith({ email });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
    });

    it('should return null when user does not exist', async () => {
      const email = 'nonexistent@example.com';
      const password = 'password123';

      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(null);

      const result = await service.validateUser(email, password);

      expect(result).toBeNull();
      expect(userRepository.findOneBy).toHaveBeenCalledWith({ email });
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should return null when password is incorrect', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(mockUser);

      const result = await service.validateUser(email, password);

      expect(result).toBeNull();
      expect(userRepository.findOneBy).toHaveBeenCalledWith({ email });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
    });
  });

  describe('login', () => {
    it('should return access token and user info when credentials are valid', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const user = { ...mockUser };
      const token = 'jwt-token-here';

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(user);
      jest.spyOn(jwtService, 'sign').mockReturnValue(token);

      const result = await service.login(loginDto);

      expect(jwtService.sign).toHaveBeenCalledWith({
        email: user.email,
        id: user.id,
      });
      expect(result).toEqual({
        access_token: token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('should create user and wallet, then return login response', async () => {
      const registerDto = {
        name: 'New User',
        email: 'newuser@example.com',
        phone: '+1234567890',
        password: 'password123',
      };

      const hashedPassword = 'hashedPassword123';
      const newUser = {
        ...mockUser,
        ...registerDto,
        password: hashedPassword,
      };
      const newWallet = { ...mockWallet, user_id: newUser.id };
      const token = 'jwt-token-here';

      // Mock the flow: first check if user exists (should return null)
      jest
        .spyOn(userRepository, 'findOneBy')
        .mockResolvedValueOnce(null) // First call for user existence check
        .mockResolvedValueOnce(newUser); // Second call for login validation

      jest.spyOn(userRepository, 'create').mockReturnValue(newUser);
      jest.spyOn(userRepository, 'save').mockResolvedValue(newUser);
      jest.spyOn(walletRepository, 'create').mockReturnValue(newWallet);
      jest.spyOn(walletRepository, 'save').mockResolvedValue(newWallet);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jest.spyOn(jwtService, 'sign').mockReturnValue(token);

      const result = await service.register(registerDto);

      expect(userRepository.findOneBy).toHaveBeenCalledWith({
        email: registerDto.email,
      });
      expect(userRepository.create).toHaveBeenCalledWith({
        ...registerDto,
        password: hashedPassword,
      });
      expect(userRepository.save).toHaveBeenCalledWith(newUser);
      expect(walletRepository.create).toHaveBeenCalledWith({
        user_id: newUser.id,
        balance: 0,
        currency: 'USD',
      });
      expect(walletRepository.save).toHaveBeenCalledWith(newWallet);
      expect(result.access_token).toBe(token);
    });

    it('should throw UnauthorizedException when user already exists', async () => {
      const registerDto = {
        name: 'Existing User',
        email: 'existing@example.com',
        phone: '+1234567890',
        password: 'password123',
      };

      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(userRepository.create).not.toHaveBeenCalled();
      expect(walletRepository.create).not.toHaveBeenCalled();
    });
  });
});
