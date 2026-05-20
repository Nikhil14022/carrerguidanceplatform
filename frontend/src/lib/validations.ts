import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['CLIENT', 'PARENT', 'ADMIN', 'EXPERT']).default('CLIENT'),
  parentId: z.string().optional()
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
})

export const moduleResponseSchema = z.object({
  data: z.record(z.string(), z.any())
})

export const moduleReviewSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'SAVE_NOTES', 'UNLOCK', 'UNLOCK_BATCH', 'EDIT_RESPONSE']),
  notes: z.string().optional(),
  data: z.record(z.string(), z.any()).optional()
})

export const reportUpdateSchema = z.object({
  content: z.string().optional(),
  careerOptions: z.array(z.object({
    id: z.string().optional(),
    title: z.string(),
    reasoning: z.string().optional(),
    match: z.number().min(0).max(100)
  })).optional()
})

export const clientManageSchema = z.object({
  action: z.enum(['REORDER', 'SKIP', 'ADD', 'REMOVE', 'EDIT_RESPONSE']),
  moduleId: z.string().optional(),
  newOrder: z.number().optional(),
  data: z.record(z.string(), z.any()).optional()
})

export const reorderSchema = z.array(z.object({
  moduleId: z.string(),
  order: z.number()
}))
