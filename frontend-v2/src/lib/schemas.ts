import { z } from 'zod'

export const actorRoleSchema = z.enum(['merchant', 'customer', 'insurer'])

// Receipt schemas
export const itemSchema = z.object({
  name: z.string(),
  price: z.number().positive(),
  eligible: z.boolean().default(true),
})

export const receiptSchema = z.object({
  merchant: z.string().default('Unknown'),
  category: z.enum(['Electronics', 'Grocery', 'Clothing', 'Pharmacy', 'Other']),
  items: z.array(itemSchema).default([]),
  total: z.number().nonnegative().default(0),
  date: z.string().nullable().optional(),
  confidence: z.number().min(0).max(1).default(0.5),
  eligibility: z.enum(['APPROVED', 'DENIED', 'PENDING']).default('PENDING'),
  raw_text: z.string().nullable().optional(),

  pos_qr_verified: z.boolean().default(false),
  pos_qr_reason: z.string().nullable().optional(),
  pos_qr_payload: z
    .object({
      tenant_id: z.string(),
      transaction_id: z.string(),
      timestamp: z.number().int(),
      nonce: z.string(),
      merchant_id: z.string().nullable().optional(),
      plan_id: z.string().nullable().optional(),
      amount_cents: z.number().int().nullable().optional(),
      currency: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),

  trust_rating: z.number().int().min(1).max(5).default(3),
  trust_confidence: z.number().min(0).max(1).default(0.5),
})

// Coverage schemas
export const coverageOptionSchema = z.object({
  coverage_period: z.string(),
  premium: z.number().positive(),
  protection_type: z.string(),
  features: z.array(z.string()),
})

export const recommendationSchema = z.object({
  options: z.array(coverageOptionSchema),
  suggested: coverageOptionSchema.optional(),
})

// Policy schemas
export const policyConfirmationSchema = z.object({
  policy_id: z.string(),
  status: z.string(),
  premium: z.number().positive(),
  coverage_period: z.string(),
})

// Chat schema
export const chatMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  actor_role: actorRoleSchema.optional(),
})

// Types
export type Item = z.infer<typeof itemSchema>
export type Receipt = z.infer<typeof receiptSchema>
export type CoverageOption = z.infer<typeof coverageOptionSchema>
export type Recommendation = z.infer<typeof recommendationSchema>
export type PolicyConfirmation = z.infer<typeof policyConfirmationSchema>
export type ChatMessage = z.infer<typeof chatMessageSchema>
export type ActorRole = z.infer<typeof actorRoleSchema>
