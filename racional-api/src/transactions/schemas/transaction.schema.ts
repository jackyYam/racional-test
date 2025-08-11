import { z } from 'zod';
import { TransactionType } from '../entities/transaction.entity';

export const CreateTransactionSchema = z.object({
  type: z.enum(['DEPOSIT', 'WITHDRAWAL']),
  amount: z.number().positive('Amount must be positive'),
  execution_date: z.date().optional(),
  external_ref_id: z.string().optional(),
});

export const MarkTransactionAsExecutedSchema = z.object({
  execution_date: z.date(),
});

export const TransactionResponseSchema = z.object({
  id: z.uuid(),
  wallet_id: z.uuid(),
  type: z.enum(['DEPOSIT', 'WITHDRAWAL']),
  amount: z.number(),
  execution_date: z.string().nullable(),
  external_ref_id: z.string().nullable(),
  created_at: z.string(),
});

export const TransactionListResponseSchema = z.object({
  transactions: z.array(TransactionResponseSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

// Type inference
export type CreateTransactionDto = z.infer<typeof CreateTransactionSchema>;
export type TransactionResponseDto = z.infer<typeof TransactionResponseSchema>;
export type TransactionListResponseDto = z.infer<
  typeof TransactionListResponseSchema
>;
export type MarkTransactionAsExecutedDto = z.infer<
  typeof MarkTransactionAsExecutedSchema
>;
