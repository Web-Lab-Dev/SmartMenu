// ========================================
// Promotion Utilities
// ========================================
// Helper functions for Happy Hour and timed promotions

import type { Campaign, Product, TimedPromotionRules, DiscountConfig } from '@/types/schema';

/**
 * Check if a timed promotion campaign is currently active
 */
export function isPromotionActive(campaign: Campaign, currentTime: Date = new Date()): boolean {
  // Must be a timed promotion and active
  if (campaign.type !== 'timed_promotion' || !campaign.isActive || !campaign.rules) {
    return false;
  }

  const rules = campaign.rules;

  if (campaign.recurrence === 'one_shot') {
    // One-time event (Christmas, New Year, etc.)
    if (!rules.startDate || !rules.endDate) return false;

    const start = rules.startDate instanceof Date ? rules.startDate : new Date(rules.startDate);
    const end = rules.endDate instanceof Date ? rules.endDate : new Date(rules.endDate);

    return currentTime >= start && currentTime <= end;
  }

  if (campaign.recurrence === 'recurring') {
    // Recurring event (Happy Hour every Friday)
    if (!rules.daysOfWeek || !rules.startTime || !rules.endTime) return false;

    // Check day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const currentDay = currentTime.getDay();
    if (!rules.daysOfWeek.includes(currentDay)) {
      return false;
    }

    // Check time range
    const currentTimeStr = `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`;

    return currentTimeStr >= rules.startTime && currentTimeStr <= rules.endTime;
  }

  return false;
}

/**
 * Calculate discounted price for a product
 */
export function calculateDiscountedPrice(
  originalPrice: number,
  discount: DiscountConfig
): number {
  if (discount.type === 'percentage') {
    const discountAmount = Math.round((originalPrice * discount.value) / 100);
    return Math.max(0, originalPrice - discountAmount);
  }

  if (discount.type === 'fixed') {
    return Math.max(0, originalPrice - discount.value);
  }

  return originalPrice;
}

/**
 * Check if a product is eligible for a promotion
 */
export function isProductEligible(
  product: Product,
  campaign: Campaign
): boolean {
  if (!campaign.targetCategories || campaign.targetCategories.length === 0) {
    // No category filter = all products eligible
    return true;
  }

  return campaign.targetCategories.includes(product.categoryId);
}

/**
 * Get discounted price for a product if eligible
 */
export function getProductPrice(
  product: Product,
  activeCampaign: Campaign | null
): { price: number; originalPrice: number | null; hasDiscount: boolean } {
  // No active campaign or not a timed promotion
  if (!activeCampaign || activeCampaign.type !== 'timed_promotion' || !activeCampaign.discount) {
    return {
      price: product.price,
      originalPrice: null,
      hasDiscount: false,
    };
  }

  // Check if product is eligible
  if (!isProductEligible(product, activeCampaign)) {
    return {
      price: product.price,
      originalPrice: null,
      hasDiscount: false,
    };
  }

  // Calculate discounted price
  const discountedPrice = calculateDiscountedPrice(product.price, activeCampaign.discount);

  return {
    price: discountedPrice,
    originalPrice: product.price,
    hasDiscount: true,
  };
}

/**
 * Calculate time remaining until promotion ends (in milliseconds)
 * Returns null if promotion has no end time or is not active
 */
export function getTimeUntilEnd(campaign: Campaign, currentTime: Date = new Date()): number | null {
  if (!campaign.rules) return null;

  const rules = campaign.rules;

  if (campaign.recurrence === 'one_shot' && rules.endDate) {
    const end = rules.endDate instanceof Date ? rules.endDate : new Date(rules.endDate);
    return Math.max(0, end.getTime() - currentTime.getTime());
  }

  if (campaign.recurrence === 'recurring' && rules.endTime) {
    // Calculate end time for today
    const [endHour, endMinute] = rules.endTime.split(':').map(Number);
    const endToday = new Date(currentTime);
    endToday.setHours(endHour, endMinute, 0, 0);

    if (endToday > currentTime) {
      return endToday.getTime() - currentTime.getTime();
    }
  }

  return null;
}

/**
 * Format time remaining as human-readable string
 */
export function formatTimeRemaining(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}min`;
  }

  if (minutes > 0) {
    return `${minutes}min`;
  }

  return `${seconds}s`;
}

/**
 * Get day name from day number
 */
export function getDayName(dayNumber: number): string {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  return days[dayNumber] || '';
}

/**
 * Format promotion schedule for display
 */
export function formatPromotionSchedule(campaign: Campaign): string {
  if (!campaign.rules) return '';

  const rules = campaign.rules;

  if (campaign.recurrence === 'one_shot') {
    if (!rules.startDate || !rules.endDate) return '';

    const start = rules.startDate instanceof Date ? rules.startDate : new Date(rules.startDate);
    const end = rules.endDate instanceof Date ? rules.endDate : new Date(rules.endDate);

    const startStr = start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const endStr = end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

    return `Du ${startStr} au ${endStr}`;
  }

  if (campaign.recurrence === 'recurring') {
    if (!rules.daysOfWeek || !rules.startTime || !rules.endTime) return '';

    const dayNames = rules.daysOfWeek.map(getDayName).join(', ');
    return `${dayNames} de ${rules.startTime} à ${rules.endTime}`;
  }

  return '';
}
