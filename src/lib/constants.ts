// ========================================
// Application Constants
// ========================================

/**
 * Core application configuration
 */
export const APP_CONFIG = {
  DEFAULT_LOCALE: 'fr-FR',
  DEFAULT_CURRENCY: 'XOF', // Franc CFA (West African CFA franc)
  DEFAULT_TIMEZONE: 'Africa/Dakar',
  MAX_CART_ITEMS: 50,
  MAX_ORDER_QUANTITY: 99,
  SESSION_TIMEOUT_MS: 1000 * 60 * 60 * 4, // 4 hours
  CART_STORAGE_KEY: 'cart-storage',
  CART_VERSION: 1,
} as const;

/**
 * Order status constants
 */
export const ORDER_STATUS = {
  PENDING_VALIDATION: 'pending_validation',
  PREPARING: 'preparing',
  READY: 'ready',
  SERVED: 'served',
  REJECTED: 'rejected',
} as const;

export type OrderStatusType = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

/**
 * User role constants
 */
export const USER_ROLES = {
  OWNER: 'owner',
  MANAGER: 'manager',
  STAFF: 'staff',
} as const;

export type UserRoleType = typeof USER_ROLES[keyof typeof USER_ROLES];

/**
 * Security mode constants
 */
export const SECURITY_MODES = {
  STRICT: 'strict',
  VALIDATION_REQUIRED: 'validation_required',
} as const;

export type SecurityModeType = typeof SECURITY_MODES[keyof typeof SECURITY_MODES];

/**
 * Firebase collection names
 */
export const COLLECTIONS = {
  RESTAURANTS: 'restaurants',
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  TABLES: 'tables',
  ORDERS: 'orders',
  CUSTOMER_SESSIONS: 'customerSessions',
  USERS: 'users',
  FEEDBACK: 'feedback', // Module 4: Customer feedback
  CUSTOMERS: 'customers', // Module 4: Email capture
  CAMPAIGNS: 'campaigns', // Marketing: Promotional campaigns
  COUPONS: 'coupons', // Marketing: Generated coupons
  INTERNAL_REVIEWS: 'internal_reviews', // Smart Review System: Negative feedback
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  FIREBASE_NOT_INITIALIZED: 'Firebase not initialized. Make sure you are on the client side.',
  CART_NO_CONTEXT: 'Cannot add items to cart: Restaurant and table context not set. Please scan a QR code first.',
  CART_DIFFERENT_RESTAURANT: 'Cannot add items from different restaurants to the same cart.',
  CART_MAX_ITEMS: (max: number) => `Cannot add more than ${max} items to cart.`,
  CART_MAX_QUANTITY: (max: number) => `Cannot add more than ${max} of the same item.`,
  ORDER_REJECTION_REQUIRED: 'Rejection reason is required when rejecting an order.',
  INVALID_TIMESTAMP: 'Invalid timestamp format',
  ENV_VALIDATION_FAILED: 'Environment validation failed',
} as const;

/**
 * Firebase error message translations (French)
 */
export const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  'auth/user-not-found': 'Utilisateur non trouvé',
  'auth/wrong-password': 'Mot de passe incorrect',
  'auth/email-already-in-use': 'Cet email est déjà utilisé',
  'auth/weak-password': 'Mot de passe trop faible',
  'auth/network-request-failed': 'Erreur de connexion réseau',
  'auth/too-many-requests': 'Trop de tentatives. Veuillez réessayer plus tard',
  'permission-denied': 'Permission refusée',
  'not-found': 'Document non trouvé',
  'already-exists': 'Document existe déjà',
  'failed-precondition': 'Précondition échouée',
  'unavailable': 'Service temporairement indisponible',
  'unauthenticated': 'Authentification requise',
} as const;

/**
 * Validation limits
 */
export const VALIDATION_LIMITS = {
  PRODUCT_NAME_MAX: 100,
  PRODUCT_DESCRIPTION_MAX: 500,
  ORDER_NOTE_MAX: 500,
  OPTION_NAME_MAX: 50,
  OPTION_VALUE_MAX: 100,
  SPECIAL_INSTRUCTIONS_MAX: 200,
  RESTAURANT_NAME_MAX: 100,
  RESTAURANT_SLUG_MAX: 100,
  TABLE_LABEL_MAX: 50,
  SECTION_NAME_MAX: 50,
  TABLE_CAPACITY_MAX: 100,
  EMAIL_MAX: 254,
  REJECTION_REASON_MAX: 200,
  CAMPAIGN_NAME_MAX: 100,
  CAMPAIGN_REWARD_DESCRIPTION_MAX: 200,
  COUPON_CODE_LENGTH: 10, // Format: PROMO-XXXXX (10 chars)
} as const;

/**
 * Campaign & Coupon constants
 */
export const CAMPAIGN_CONSTANTS = {
  MIN_WIN_PROBABILITY: 0,
  MAX_WIN_PROBABILITY: 100,
  MIN_VALIDITY_DAYS: 1,
  MAX_VALIDITY_DAYS: 365,
  MAX_COUPONS_PER_DEVICE_PER_DAY: 5, // Prevent abuse
  COUPON_CODE_PREFIX: 'PROMO',
} as const;
