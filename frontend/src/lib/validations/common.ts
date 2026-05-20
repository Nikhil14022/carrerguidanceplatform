import { z } from 'zod';

// Reusable Zod schemas for common entity fields

export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId');

export const paginationSchema = z.object({
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(10),
});

export const authTokensSchema = z.object({
    accessToken: z.string(),
    refreshToken: z.string()
});
