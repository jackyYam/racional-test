import { z } from 'zod';
import { TradeOrderType } from '../entities/trade-order.entity';

export const CreateTradeOrderSchema = z.object({
  portfolio_id: z.uuid('Invalid portfolio ID'),
  stock_id: z.uuid('Invalid stock ID'),
  type: z.enum(['BUY', 'SELL']),
  quantity: z.number().positive('Quantity must be positive'),
  price: z.number().positive('Price must be positive'),
  execution_date: z.string().optional(),
  external_ref_id: z.string().optional(),
});

export const TradeOrderResponseSchema = z.object({
  id: z.uuid(),
  wallet_id: z.uuid(),
  portfolio_id: z.uuid(),
  stock_id: z.uuid(),
  type: z.enum(['BUY', 'SELL']),
  quantity: z.number(),
  price: z.number(),
  execution_date: z.string().nullable(),
  external_ref_id: z.string().nullable(),
  created_at: z.string(),
});

export const TradeOrderListResponseSchema = z.object({
  trades: z.array(TradeOrderResponseSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

// Type inference
export type CreateTradeOrderDto = z.infer<typeof CreateTradeOrderSchema>;
export type TradeOrderResponseDto = z.infer<typeof TradeOrderResponseSchema>;
export type TradeOrderListResponseDto = z.infer<typeof TradeOrderListResponseSchema>;
