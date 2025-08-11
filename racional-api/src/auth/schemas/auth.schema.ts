import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.email('Invalid email format'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const LoginResponseSchema = z.object({
  access_token: z.string(),
  user: z.object({
    id: z.uuid(),
    name: z.string(),
    email: z.email(),
  }),
});

// Type inference
export type LoginDto = z.infer<typeof LoginSchema>;
export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginResponseDto = z.infer<typeof LoginResponseSchema>;
