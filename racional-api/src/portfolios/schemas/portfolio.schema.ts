import { z } from 'zod';

export const UpdatePortfolioSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long').optional(),
  description: z.string().optional(),
});

export const PortfolioResponseSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const PortfolioTotalResponseSchema = z.object({
  portfolio_id: z.uuid(),
  name: z.string(),
  total_value: z.number(),
  total_investment: z.number(),
  total_unrealized_pl: z.number(),
  stocks: z.array(z.object({
    stock_id: z.uuid(),
    symbol: z.string(),
    name: z.string(),
    shares: z.number(),
    current_price: z.number(),
    investment_amount: z.number(),
    current_value: z.number(),
    unrealized_pl: z.number(),
  })),
});

export const PortfolioListResponseSchema = z.object({
  portfolios: z.array(PortfolioResponseSchema),
  total: z.number(),
});

// Type inference
export type UpdatePortfolioDto = z.infer<typeof UpdatePortfolioSchema>;
export type PortfolioResponseDto = z.infer<typeof PortfolioResponseSchema>;
export type PortfolioTotalResponseDto = z.infer<typeof PortfolioTotalResponseSchema>;
export type PortfolioListResponseDto = z.infer<typeof PortfolioListResponseSchema>;
