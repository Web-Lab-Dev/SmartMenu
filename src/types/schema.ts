// ========================================
// Core Database Schema Types
// ========================================

export interface Restaurant {
  id: string;
  name: string;
  slug: string; // URL-friendly identifier (e.g., "chez-ali")
  ownerId: string; // Firebase Auth UID
  branding: RestaurantBranding;
  securityConfig: SecurityConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface RestaurantBranding {
  logo?: string; // Firebase Storage URL (DEPRECATED: use logoUrl)
  logoUrl?: string; // Firebase Storage URL
  primaryColor: string; // Hex color (e.g., "#FF5733")
  secondaryColor?: string; // Light version of primary (e.g., "#FFF5F0")
  coverImage?: string; // DEPRECATED: use coverUrl
  coverUrl?: string; // Hero image URL - Firebase Storage
  fontFamily?: 'sans' | 'serif' | 'mono'; // Typography choice
  radius?: 'none' | 'sm' | 'md' | 'full'; // Button/card border radius
  socials?: {
    instagram?: string;
    facebook?: string;
    website?: string;
  };
}

export interface SecurityConfig {
  mode: 'strict' | 'validation_required';
  // strict: Orders require admin approval before preparation
  // validation_required: Orders go directly to kitchen but can be rejected
}

// ========================================
// Product & Category Types
// ========================================

export interface ProductOption {
  name: string; // e.g., "Cuisson", "Taille"
  required: boolean;
  values: ProductOptionValue[];
}

export interface ProductOptionValue {
  name: string; // e.g., "Saignant", "À point"
  priceModifier?: number; // Additional cost in cents (can be negative for discount)
}

export interface Product {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number; // In cents to avoid floating point issues
  image?: string; // DEPRECATED: Legacy single image URL (kept for backward compatibility)
  images?: string[]; // NEW: Array of Firebase Storage URLs (up to 3 images)
  isAvailable: boolean;
  aiTags: string[]; // For AI recommendations (e.g., ["épicé", "vegan", "populaire"])
  allergens?: string[]; // (e.g., ["gluten", "lactose"])
  options?: ProductOption[]; // Product customization options
  preparationTime?: number; // In minutes
  order: number; // Display order within category
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  restaurantId: string;
  name: string;
  order: number; // Display order
  icon?: string; // Lucide icon name or emoji
  isAvailable: boolean;
  createdAt: Date;
}

// ========================================
// Table & QR Code Types
// ========================================

export interface Table {
  id: string;
  restaurantId: string;
  label: string; // Display name (e.g., "Table 12", "Terrasse 3")
  qrCodeUrl: string; // Firebase Storage URL for QR code image
  isActive: boolean;
  section?: string; // Optional: "Intérieur", "Terrasse", etc.
  capacity?: number;
  createdAt: Date;
}

// ========================================
// Order & Order Item Types
// ========================================

export type OrderStatus =
  | 'pending_validation' // Waiting for restaurant approval (strict mode)
  | 'preparing'          // Being prepared in kitchen
  | 'ready'              // Ready to be served
  | 'served'             // Delivered to customer
  | 'rejected';          // Rejected by restaurant

export interface Order {
  id: string;
  restaurantId: string;
  tableId: string;
  tableLabelString: string; // Denormalized for quick display
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number; // In cents (final amount after discount)
  subtotalBeforeDiscount?: number; // Original amount before coupon (if coupon applied)
  customerSessionId: string; // To prevent spam and track customer session
  customerNote?: string;
  couponId?: string; // Applied coupon ID (if any)
  discountAmount?: number; // Discount amount in cents (if coupon applied)
  rejectionReason?: string; // If status is 'rejected'
  createdAt: Date;
  updatedAt: Date;
  validatedAt?: Date; // When moved from pending to preparing
  readyAt?: Date; // When marked as ready
  servedAt?: Date; // When marked as served
}

export interface OrderItem {
  productId: string;
  productName: string; // Denormalized for history
  quantity: number;
  unitPrice: number; // In cents (snapshot at order time)
  options?: OrderItemOption[]; // Customizations
  specialInstructions?: string;
}

export interface OrderItemOption {
  name: string; // (e.g., "Cuisson", "Sauce")
  value: string; // (e.g., "À point", "Sans sauce")
  priceModifier?: number; // Additional cost in cents
}

// ========================================
// Customer Session Types
// ========================================

export interface CustomerSession {
  id: string;
  restaurantId: string;
  tableId: string;
  startedAt: Date;
  lastActivityAt: Date;
  orderCount: number;
  isActive: boolean;
}

// ========================================
// AI Recommendation Types (For Phase 2)
// ========================================

export interface AIRecommendation {
  productId: string;
  score: number; // 0-1 confidence score
  reason: string; // Explanation (e.g., "Populaire ce soir")
}

// ========================================
// User Types (Restaurant Owners/Staff)
// ========================================

export interface RestaurantUser {
  uid: string; // Firebase Auth UID
  email: string;
  displayName: string;
  role: 'owner' | 'manager' | 'staff';
  restaurantId: string;
  createdAt: Date;
}

// ========================================
// Feedback & Customer Types (Module 4)
// ========================================

export interface Feedback {
  id: string;
  restaurantId: string;
  orderId: string;
  customerSessionId: string;
  rating: number; // 1-5 stars
  message?: string; // Only for rating <= 3
  createdAt: Date;
}

export interface CustomerEmail {
  id: string;
  restaurantId: string;
  email: string;
  orderId: string;
  rewardClaimed: string; // Reward text (e.g., "1 Café offert")
  visitDate: Date;
  createdAt: Date;
}

export interface SplitBillItem extends OrderItem {
  itemId: string; // Unique ID for split tracking
  selectedQuantity: number; // How much of this item the current user is paying for
  isFullyPaid: boolean; // Whether this item is fully allocated
}

// ========================================
// Tombola & Coupons Types
// ========================================

export type CampaignRewardType = 'percentage' | 'fixed_amount' | 'free_item';

// Campaign types: lottery (scratch card) or timed_promotion (Happy Hour)
export type CampaignType = 'lottery' | 'timed_promotion';

// Recurrence for timed promotions
export type RecurrenceType = 'one_shot' | 'recurring';

// Discount configuration for timed promotions
export interface DiscountConfig {
  type: 'percentage' | 'fixed';
  value: number; // Percentage (20 for 20%) or fixed amount in FCFA
}

// Time-based promotion rules
export interface TimedPromotionRules {
  // For one-shot events (Christmas, New Year, etc.)
  startDate?: Date;
  endDate?: Date;

  // For recurring events (Happy Hour every Friday)
  daysOfWeek?: number[]; // [0-6] where 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime?: string; // "17:00" (24h format)
  endTime?: string; // "20:00" (24h format)
}

export interface Campaign {
  id: string;
  restaurantId: string;
  name: string;
  isActive: boolean;

  // Campaign type
  type?: CampaignType; // Optional for backward compatibility - defaults to 'lottery'

  // For lottery campaigns
  winProbability?: number; // 0-100 (e.g., 20 = 20% chance to win)
  rewardType?: CampaignRewardType;
  rewardValue?: number; // Percentage (e.g., 10 for 10% off) or amount in cents or productId
  rewardDescription?: string; // Human-readable description (e.g., "10% de réduction", "Café offert")
  validityDays?: number; // How many days the coupon is valid after generation

  // For timed_promotion campaigns
  recurrence?: RecurrenceType;
  rules?: TimedPromotionRules;
  discount?: DiscountConfig;
  targetCategories?: string[]; // Category IDs that get the discount
  bannerText?: string; // Message to display on banner (e.g., "-50% sur les Cocktails jusqu'à 20h!")

  createdAt: Date;
  updatedAt: Date;
}

export type CouponStatus = 'active' | 'used' | 'expired';

export interface Coupon {
  id: string;
  restaurantId: string;
  campaignId: string;
  code: string; // Unique code (e.g., "PROMO-ABC123")
  status: CouponStatus;
  discountType: CampaignRewardType; // Denormalized from campaign
  discountValue: number; // Denormalized from campaign
  discountDescription: string; // Denormalized (e.g., "10% de réduction")
  deviceId: string; // To prevent abuse (same device can't generate infinite coupons)
  createdAt: Date;
  validUntil: Date;
  usedAt?: Date;
  orderId?: string; // If used, which order it was applied to
}

// ========================================
// Helper Types
// ========================================

export type Timestamp = Date | { toDate: () => Date }; // Firestore Timestamp compatibility

export interface PaginationParams {
  limit: number;
  lastDoc?: unknown; // Firestore DocumentSnapshot
}
