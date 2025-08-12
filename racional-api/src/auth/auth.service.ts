import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { Portfolio } from '../portfolios/entities/portfolio.entity';
import * as bcrypt from 'bcrypt';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

export interface LoginResponseDto {
  access_token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(Portfolio)
    private portfolioRepository: Repository<Portfolio>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOneBy({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email: user.email, id: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<LoginResponseDto> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOneBy({
      email: registerDto.email,
    });
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create user
    const user = this.userRepository.create({
      ...registerDto,
      password: hashedPassword,
    });
    const savedUser = await this.userRepository.save(user);

    // Create wallet for the user
    const wallet = this.walletRepository.create({
      user_id: savedUser.id,
      balance: 0,
      currency: 'USD',
    });
    await this.walletRepository.save(wallet);

    // Create default portfolio for the user
    const portfolio = this.portfolioRepository.create({
      user_id: savedUser.id,
      name: 'Main Portfolio',
      description: 'Default trading portfolio',
    });
    await this.portfolioRepository.save(portfolio);

    // Return login response
    return this.login({
      email: registerDto.email,
      password: registerDto.password,
    });
  }
}
