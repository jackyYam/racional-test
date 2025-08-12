// Test setup file
import 'reflect-metadata';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to suppress console.log in tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock Date.now() for consistent testing
const mockDate = new Date('2024-01-01T00:00:00.000Z');
global.Date.now = jest.fn(() => mockDate.getTime());

// Mock Math.random() for consistent testing
global.Math.random = jest.fn(() => 0.5);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global test utilities
global.testUtils = {
  createMockUser: (overrides = {}) => ({
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    phone: '+1234567890',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }),

  createMockWallet: (overrides = {}) => ({
    id: 'test-wallet-123',
    user_id: 'test-user-123',
    balance: 10000.0,
    currency: 'USD',
    updated_at: new Date(),
    ...overrides,
  }),

  createMockPortfolio: (overrides = {}) => ({
    id: 'test-portfolio-123',
    user_id: 'test-user-123',
    name: 'Test Portfolio',
    description: 'Test Description',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }),

  createMockStock: (overrides = {}) => ({
    id: 'test-stock-123',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    market: 'NASDAQ',
    current_price: 150.0,
    created_at: new Date(),
    ...overrides,
  }),

  createMockTradeOrder: (overrides = {}) => ({
    id: 'test-trade-123',
    wallet_id: 'test-wallet-123',
    portfolio_id: 'test-portfolio-123',
    stock_id: 'test-stock-123',
    type: 'BUY',
    quantity: 10,
    price: 150.0,
    execution_date: null,
    external_ref_id: null,
    created_at: new Date(),
    ...overrides,
  }),

  createMockPortfolioStock: (overrides = {}) => ({
    id: 'test-holding-123',
    portfolio_id: 'test-portfolio-123',
    stock_id: 'test-stock-123',
    shares: 10,
    investment_amount: 1500.0,
    updated_at: new Date(),
    ...overrides,
  }),

  // Helper to create UUID-like strings for testing
  createTestId: (prefix = 'test') =>
    `${prefix}-${Math.random().toString(36).substr(2, 9)}`,

  // Helper to create test dates
  createTestDate: (daysOffset = 0) => {
    const date = new Date('2024-01-01T00:00:00.000Z');
    date.setDate(date.getDate() + daysOffset);
    return date;
  },

  // Helper to create decimal numbers for financial calculations
  createDecimal: (value: number) => Number(value.toFixed(2)),

  // Helper to create mock repository
  createMockRepository: () => ({
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findAndCount: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getOne: jest.fn(),
      getCount: jest.fn(),
    })),
  }),
};

// Extend global types for test utilities
declare global {
  namespace NodeJS {
    interface Global {
      testUtils: {
        createMockUser: (overrides?: any) => any;
        createMockWallet: (overrides?: any) => any;
        createMockPortfolio: (overrides?: any) => any;
        createMockStock: (overrides?: any) => any;
        createMockTradeOrder: (overrides?: any) => any;
        createMockPortfolioStock: (overrides?: any) => any;
        createTestId: (prefix?: string) => string;
        createTestDate: (daysOffset?: number) => Date;
        createDecimal: (value: number) => number;
        createMockRepository: () => any;
      };
    }
  }
}
