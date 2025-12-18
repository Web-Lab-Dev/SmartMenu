// ========================================
// Utility Functions
// ========================================

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { v4 as uuidv4 } from 'uuid';
import type { Timestamp } from 'firebase/firestore';
import type { OrderItem, OrderItemOption } from '@/types/schema';
import { APP_CONFIG } from './constants';
import { convertFirestoreTimestamp } from './firebase-helpers';

/**
 * Merges Tailwind CSS classes with proper precedence
 * Usage: cn('text-red-500', condition && 'text-blue-500')
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats price in cents to currency string
 * @param cents - Price in cents
 * @param currency - Currency code (default: XOF - Franc CFA)
 * @param locale - Locale for formatting (default: fr-FR)
 * @returns Formatted currency string (e.g., "5 000 FCFA")
 *
 * Note: FCFA has no decimal places, so we format whole numbers only
 */
export function formatCurrency(
  cents: number,
  currency: string = APP_CONFIG.DEFAULT_CURRENCY,
  locale: string = APP_CONFIG.DEFAULT_LOCALE
): string {
  const amount = cents / 100;

  // FCFA (XOF) has no decimal places
  const isFCFA = currency === 'XOF';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: isFCFA ? 0 : 2,
    maximumFractionDigits: isFCFA ? 0 : 2,
  }).format(amount);
}

/**
 * Formats date to readable string
 * @param date - Date object or Firestore Timestamp
 * @param locale - Locale for formatting (default: fr-FR)
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | Timestamp | undefined,
  locale: string = APP_CONFIG.DEFAULT_LOCALE
): string {
  const dateObj = convertFirestoreTimestamp(date);

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}

/**
 * Formats relative time (e.g., "Il y a 5 minutes")
 * @param date - Date object or Firestore Timestamp
 * @returns Relative time string in French
 */
export function formatRelativeTime(date: Date | Timestamp | undefined): string {
  const dateObj = convertFirestoreTimestamp(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "À l'instant";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
  }
}

/**
 * Generates URL-friendly slug from string
 * @param text - Input text
 * @returns Slugified string
 *
 * @example
 * slugify("Chez Ali") // "chez-ali"
 * slugify("Café Crème") // "cafe-creme"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generates a cryptographically secure session ID using uuid
 * @returns Random session ID string
 *
 * @example
 * generateSessionId() // "session_a3f2c8b1-4d5e-6789-0abc-def123456789"
 */
export function generateSessionId(): string {
  return `session_${uuidv4()}`;
}

/**
 * Calculates order total from items including options
 * @param items - Array of order items
 * @returns Total in cents
 *
 * @example
 * const items = [
 *   { unitPrice: 1000, quantity: 2, options: [{ priceModifier: 100 }] }
 * ];
 * calculateOrderTotal(items) // 2200 (2 * 1000 + 2 * 100)
 */
export function calculateOrderTotal(items: OrderItem[]): number {
  return items.reduce((total, item) => {
    const itemBase = item.unitPrice * item.quantity;
    const optionsTotal =
      item.options?.reduce(
        (sum, opt) => sum + (opt.priceModifier || 0) * item.quantity,
        0
      ) || 0;
    return total + itemBase + optionsTotal;
  }, 0);
}

/**
 * Deep equality check for order item options
 * Sorts options by name before comparison to handle different orderings
 *
 * @param opts1 - First options array
 * @param opts2 - Second options array
 * @returns True if options are equal
 *
 * @example
 * const opts1 = [{ name: "Sauce", value: "Mayo" }, { name: "Cuisson", value: "À point" }];
 * const opts2 = [{ name: "Cuisson", value: "À point" }, { name: "Sauce", value: "Mayo" }];
 * areOptionsEqual(opts1, opts2) // true
 */
export function areOptionsEqual(
  opts1: OrderItemOption[] | undefined,
  opts2: OrderItemOption[] | undefined
): boolean {
  // Both undefined or null
  if (opts1 === opts2) return true;

  // One is undefined/null and the other isn't
  if (!opts1 || !opts2) return false;

  // Different lengths
  if (opts1.length !== opts2.length) return false;

  // Sort options by name for consistent comparison
  const sorted1 = [...opts1].sort((a, b) => a.name.localeCompare(b.name));
  const sorted2 = [...opts2].sort((a, b) => a.name.localeCompare(b.name));

  // Compare each option
  return sorted1.every((opt1, i) => {
    const opt2 = sorted2[i];
    if (!opt2) return false;
    return (
      opt1.name === opt2.name &&
      opt1.value === opt2.value &&
      opt1.priceModifier === opt2.priceModifier
    );
  });
}

/**
 * Truncates text to specified length with ellipsis
 * @param text - Input text
 * @param maxLength - Maximum length
 * @returns Truncated text
 *
 * @example
 * truncate("Hello World", 8) // "Hello..."
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Capitalizes first letter of string
 * @param text - Input text
 * @returns Capitalized text
 *
 * @example
 * capitalize("hello world") // "Hello world"
 */
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Formats phone number to French format
 * @param phone - Phone number string
 * @returns Formatted phone number
 *
 * @example
 * formatPhone("0612345678") // "06 12 34 56 78"
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);

  if (match) {
    return `${match[1]} ${match[2]} ${match[3]} ${match[4]} ${match[5]}`;
  }

  return phone;
}

/**
 * Debounce function to limit execution rate
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Sleep/delay utility for async functions
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after delay
 *
 * @example
 * await sleep(1000); // Wait 1 second
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Clamps a number between min and max values
 * @param value - Number to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped number
 *
 * @example
 * clamp(15, 0, 10) // 10
 * clamp(-5, 0, 10) // 0
 * clamp(5, 0, 10) // 5
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Get product images with backward compatibility
 * Handles migration from single `image` field to `images` array
 *
 * @param product - Product object
 * @returns Array of image URLs (empty if no images)
 *
 * @example
 * // Legacy product with single image
 * getProductImages({ image: 'url.jpg', images: undefined }) // ['url.jpg']
 *
 * // New product with multiple images
 * getProductImages({ image: undefined, images: ['1.jpg', '2.jpg'] }) // ['1.jpg', '2.jpg']
 *
 * // Product with both (images takes precedence)
 * getProductImages({ image: 'old.jpg', images: ['new1.jpg', 'new2.jpg'] }) // ['new1.jpg', 'new2.jpg']
 */
export function getProductImages(product: {
  image?: string;
  images?: string[];
}): string[] {
  // Prefer new images array if it exists and is not empty
  if (product.images && product.images.length > 0) {
    return product.images;
  }

  // Fall back to legacy single image
  if (product.image) {
    return [product.image];
  }

  // No images
  return [];
}

/**
 * Get primary product image (first image in array)
 *
 * @param product - Product object
 * @returns Primary image URL or undefined
 */
export function getPrimaryProductImage(product: {
  image?: string;
  images?: string[];
}): string | undefined {
  const images = getProductImages(product);
  return images[0];
}

/**
 * Gets or creates a customer session ID from localStorage
 * Session IDs are used to track customer orders and prevent spam
 *
 * @returns Customer session ID string
 *
 * @example
 * const sessionId = getOrCreateCustomerSessionId();
 * // Returns existing: "session_a3f2c8b1-4d5e-6789-0abc-def123456789"
 * // Or creates new one if not found
 */
export function getOrCreateCustomerSessionId(): string {
  if (typeof window === 'undefined') {
    return 'server-session'; // Fallback for SSR
  }

  const STORAGE_KEY = 'customerSessionId';
  let sessionId = localStorage.getItem(STORAGE_KEY);

  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem(STORAGE_KEY, sessionId);
  }

  return sessionId;
}
