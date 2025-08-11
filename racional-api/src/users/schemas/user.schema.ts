import { z } from 'zod';

export const UpdateUserSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .optional(),
  phone: z.string().optional(),
});

export const UserResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
  phone: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const UserProfileResponseSchema = z.object({
  user: UserResponseSchema,
  wallet: z.object({
    id: z.uuid(),
    balance: z.number(),
    currency: z.string(),
  }),
  portfolios: z.array(
    z.object({
      id: z.uuid(),
      name: z.string(),
      description: z.string().nullable(),
    }),
  ),
});

// Type inference
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
export type UserResponseDto = z.infer<typeof UserResponseSchema>;
export type UserProfileResponseDto = z.infer<typeof UserProfileResponseSchema>;
