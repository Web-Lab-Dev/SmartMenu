// ========================================
// Input Validation Schemas (Zod)
// ========================================

import { z } from 'zod';
import { VALIDATION_LIMITS, ORDER_STATUS, USER_ROLES, SECURITY_MODES } from './constants';

// ========================================
// Product Schemas
// ========================================

export const productSchema = z.object({
  id: z.string().min(1),
  restaurantId: z.string().min(1),
  categoryId: z.string().min(1),
  name: z.string().min(1).max(VALIDATION_LIMITS.PRODUCT_NAME_MAX),
  description: z.string().max(VALIDATION_LIMITS.PRODUCT_DESCRIPTION_MAX),
  price: z.number().int().positive(),
  image: z.string().url().optional(),
  isAvailable: z.boolean(),
  aiTags: z.array(z.string()).default([]),
  allergens: z.array(z.string()).optional(),
  preparationTime: z.number().int().positive().optional(),
  order: z.number().int().nonnegative(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ========================================
// Order Schemas
// ========================================

export const orderItemOptionSchema = z.object({
  name: z.string().min(1).max(VALIDATION_LIMITS.OPTION_NAME_MAX),
  value: z.string().min(1).max(VALIDATION_LIMITS.OPTION_VALUE_MAX),
  priceModifier: z.number().int().optional(),
});

export const orderItemSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1).max(VALIDATION_LIMITS.PRODUCT_NAME_MAX),
  quantity: z.number().int().positive().max(99),
  unitPrice: z.number().int().positive(),
  options: z.array(orderItemOptionSchema).optional(),
  specialInstructions: z.string().max(VALIDATION_LIMITS.SPECIAL_INSTRUCTIONS_MAX).optional(),
});

export const orderStatusSchema = z.enum([
  ORDER_STATUS.PENDING_VALIDATION,
  ORDER_STATUS.PREPARING,
  ORDER_STATUS.READY,
  ORDER_STATUS.SERVED,
  ORDER_STATUS.REJECTED,
] as [string, ...string[]]);

export const createOrderSchema = z.object({
  restaurantId: z.string().min(1),
  tableId: z.string().min(1),
  tableLabelString: z.string().min(1).max(VALIDATION_LIMITS.TABLE_LABEL_MAX),
  items: z.array(orderItemSchema).min(1).max(50),
  customerNote: z.string().max(VALIDATION_LIMITS.ORDER_NOTE_MAX).optional(),
  customerSessionId: z.string().min(1),
  couponId: z.string().min(1).optional(), // Optional coupon ID to apply
});

export const orderSchema = createOrderSchema.extend({
  id: z.string().min(1),
  status: orderStatusSchema,
  totalAmount: z.number().int().nonnegative(),
  subtotalBeforeDiscount: z.number().int().nonnegative().optional(),
  discountAmount: z.number().int().nonnegative().optional(),
  rejectionReason: z.string().max(VALIDATION_LIMITS.REJECTION_REASON_MAX).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  validatedAt: z.date().optional(),
  readyAt: z.date().optional(),
  servedAt: z.date().optional(),
});

// ========================================
// Restaurant Schemas
// ========================================

export const restaurantBrandingSchema = z.object({
  logo: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color').optional(),
  coverImage: z.string().url().optional(),
});

export const securityConfigSchema = z.object({
  mode: z.enum([
    SECURITY_MODES.STRICT,
    SECURITY_MODES.VALIDATION_REQUIRED,
  ] as [string, ...string[]]),
});

export const restaurantSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(VALIDATION_LIMITS.RESTAURANT_NAME_MAX),
  slug: z.string()
    .min(1)
    .max(VALIDATION_LIMITS.RESTAURANT_SLUG_MAX)
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  ownerId: z.string().min(1),
  branding: restaurantBrandingSchema,
  securityConfig: securityConfigSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ========================================
// Table Schemas
// ========================================

export const tableSchema = z.object({
  id: z.string().min(1),
  restaurantId: z.string().min(1),
  label: z.string().min(1).max(VALIDATION_LIMITS.TABLE_LABEL_MAX),
  qrCodeUrl: z.string().url(),
  isActive: z.boolean(),
  section: z.string().max(VALIDATION_LIMITS.SECTION_NAME_MAX).optional(),
  capacity: z.number().int().positive().max(VALIDATION_LIMITS.TABLE_CAPACITY_MAX).optional(),
  createdAt: z.date(),
});

// ========================================
// Category Schema
// ========================================

export const categorySchema = z.object({
  id: z.string().min(1),
  restaurantId: z.string().min(1),
  name: z.string().min(1).max(100),
  order: z.number().int().nonnegative(),
  icon: z.string().optional(),
  isAvailable: z.boolean(),
  createdAt: z.date(),
});

// ========================================
// User Schemas
// ========================================

export const emailSchema = z.string()
  .email('Invalid email format')
  .max(VALIDATION_LIMITS.EMAIL_MAX, 'Email is too long');

export const userRoleSchema = z.enum([
  USER_ROLES.OWNER,
  USER_ROLES.MANAGER,
  USER_ROLES.STAFF,
] as [string, ...string[]]);

export const restaurantUserSchema = z.object({
  uid: z.string().min(1),
  email: emailSchema,
  displayName: z.string().min(1),
  role: userRoleSchema,
  restaurantId: z.string().min(1),
  createdAt: z.date(),
});

// ========================================
// Customer Session Schema
// ========================================

export const customerSessionSchema = z.object({
  id: z.string().min(1),
  restaurantId: z.string().min(1),
  tableId: z.string().min(1),
  startedAt: z.date(),
  lastActivityAt: z.date(),
  orderCount: z.number().int().nonnegative(),
  isActive: z.boolean(),
});

// ========================================
// Form Validation Schemas (for user input)
// ========================================

export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerFormSchema = z.object({
  email: emailSchema,
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  restaurantName: z.string().min(2, 'Restaurant name is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const addProductFormSchema = z.object({
  name: z.string().min(1).max(VALIDATION_LIMITS.PRODUCT_NAME_MAX),
  description: z.string().max(VALIDATION_LIMITS.PRODUCT_DESCRIPTION_MAX),
  price: z.number().positive(),
  categoryId: z.string().min(1),
  image: z.string().url().optional(),
  preparationTime: z.number().int().positive().optional(),
  allergens: z.array(z.string()).optional(),
  aiTags: z.array(z.string()).optional(),
});

// ========================================
// Export inferred types
// ========================================

export type ProductInput = z.infer<typeof productSchema>;
export type OrderItemInput = z.infer<typeof orderItemSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderInput = z.infer<typeof orderSchema>;
export type RestaurantInput = z.infer<typeof restaurantSchema>;
export type TableInput = z.infer<typeof tableSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type RestaurantUserInput = z.infer<typeof restaurantUserSchema>;
export type CustomerSessionInput = z.infer<typeof customerSessionSchema>;
export type LoginFormInput = z.infer<typeof loginFormSchema>;
export type RegisterFormInput = z.infer<typeof registerFormSchema>;
export type AddProductFormInput = z.infer<typeof addProductFormSchema>;

// ========================================
// Validation Helper Functions
// ========================================

/**
 * Validates data against a schema and returns typed result
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(
        (err) => `${err.path.join('.')}: ${err.message}`
      );
      return { success: false, errors };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  try {
    emailSchema.parse(email);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates email and returns detailed result
 */
export function validateEmail(email: string): {
  valid: boolean;
  error?: string;
} {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  try {
    emailSchema.parse(email);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.issues[0]?.message || 'Invalid email' };
    }
    return { valid: false, error: 'Invalid email format' };
  }
}
