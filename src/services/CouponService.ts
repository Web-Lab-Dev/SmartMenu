import {
  getDb,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from '@/lib/firebase';
import { COLLECTIONS, CAMPAIGN_CONSTANTS } from '@/lib/constants';
import type { Coupon, Campaign } from '@/types/schema';
import { CampaignService } from './CampaignService';

/**
 * CouponService - Manages coupon generation and usage
 */
export class CouponService {
  /**
   * Generate a random coupon code
   * Format: PROMO-XXXXX (10 characters total)
   */
  private static generateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${CAMPAIGN_CONSTANTS.COUPON_CODE_PREFIX}-${code}`;
  }

  /**
   * Get device fingerprint (simplified - uses localStorage)
   */
  private static getDeviceId(): string {
    if (typeof window === 'undefined') {
      return 'server-device';
    }

    const STORAGE_KEY = 'deviceId';
    let deviceId = localStorage.getItem(STORAGE_KEY);

    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem(STORAGE_KEY, deviceId);
    }

    return deviceId;
  }

  /**
   * Check if device has exceeded coupon generation limit for today
   */
  static async checkDeviceLimit(restaurantId: string, deviceId: string): Promise<boolean> {
    const db = getDb();
    const couponsRef = collection(db, COLLECTIONS.COUPONS);

    // Get start of today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const q = query(
      couponsRef,
      where('restaurantId', '==', restaurantId),
      where('deviceId', '==', deviceId),
      where('createdAt', '>=', today)
    );

    const snapshot = await getDocs(q);
    const count = snapshot.size;

    console.log('[CouponService] 📊 Device coupon count today:', count);
    return count >= CAMPAIGN_CONSTANTS.MAX_COUPONS_PER_DEVICE_PER_DAY;
  }

  /**
   * Generate a coupon based on campaign win probability
   * Returns coupon if user wins, null if user loses
   */
  static async generateCoupon(params: {
    campaignId: string;
    restaurantId: string;
    deviceId?: string;
  }): Promise<{ won: boolean; coupon?: Coupon; message: string }> {
    const { campaignId, restaurantId } = params;
    const deviceId = params.deviceId || this.getDeviceId();

    // 1. Check device limit
    const limitExceeded = await this.checkDeviceLimit(restaurantId, deviceId);
    if (limitExceeded) {
      return {
        won: false,
        message: `Limite de ${CAMPAIGN_CONSTANTS.MAX_COUPONS_PER_DEVICE_PER_DAY} coupons par jour atteinte`,
      };
    }

    // 2. Fetch campaign
    const campaign = await CampaignService.getById(campaignId);
    if (!campaign) {
      throw new Error('Campagne introuvable');
    }

    if (!campaign.isActive) {
      throw new Error('Cette campagne est inactive');
    }

    // 3. Win probability logic
    const randomNumber = Math.random() * 100; // 0-100
    const won = randomNumber < campaign.winProbability;

    console.log('[CouponService] 🎲 Random:', randomNumber.toFixed(2), '| Probability:', campaign.winProbability, '| Won:', won);

    if (!won) {
      return {
        won: false,
        message: 'Dommage ! Réessayez plus tard.',
      };
    }

    // 4. User won! Generate coupon
    const code = this.generateCode();
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + campaign.validityDays);

    const db = getDb();
    const couponsRef = collection(db, COLLECTIONS.COUPONS);

    const couponData = {
      restaurantId,
      campaignId,
      code,
      status: 'active' as const,
      discountType: campaign.rewardType,
      discountValue: campaign.rewardValue,
      discountDescription: campaign.rewardDescription,
      deviceId,
      createdAt: serverTimestamp(),
      validUntil,
    };

    const docRef = await addDoc(couponsRef, couponData);
    console.log('[CouponService] 🎉 Coupon generated:', docRef.id, code);

    const coupon: Coupon = {
      id: docRef.id,
      restaurantId,
      campaignId,
      code,
      status: 'active',
      discountType: campaign.rewardType,
      discountValue: campaign.rewardValue,
      discountDescription: campaign.rewardDescription,
      deviceId,
      createdAt: new Date(),
      validUntil,
    };

    return {
      won: true,
      coupon,
      message: `Félicitations ! Vous avez gagné : ${campaign.rewardDescription}`,
    };
  }

  /**
   * Get coupon by code
   */
  static async getByCode(restaurantId: string, code: string): Promise<Coupon | null> {
    const db = getDb();
    const couponsRef = collection(db, COLLECTIONS.COUPONS);
    const q = query(
      couponsRef,
      where('restaurantId', '==', restaurantId),
      where('code', '==', code.toUpperCase())
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    return {
      id: doc.id,
      restaurantId: data.restaurantId,
      campaignId: data.campaignId,
      code: data.code,
      status: data.status,
      discountType: data.discountType,
      discountValue: data.discountValue,
      discountDescription: data.discountDescription,
      deviceId: data.deviceId,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      validUntil: (data.validUntil as Timestamp)?.toDate() || new Date(),
      usedAt: data.usedAt ? (data.usedAt as Timestamp).toDate() : undefined,
      orderId: data.orderId,
    };
  }

  /**
   * Get all coupons for a device
   */
  static async getByDevice(restaurantId: string, deviceId?: string): Promise<Coupon[]> {
    const finalDeviceId = deviceId || this.getDeviceId();
    const db = getDb();
    const couponsRef = collection(db, COLLECTIONS.COUPONS);
    const q = query(
      couponsRef,
      where('restaurantId', '==', restaurantId),
      where('deviceId', '==', finalDeviceId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        restaurantId: data.restaurantId,
        campaignId: data.campaignId,
        code: data.code,
        status: data.status,
        discountType: data.discountType,
        discountValue: data.discountValue,
        discountDescription: data.discountDescription,
        deviceId: data.deviceId,
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        validUntil: (data.validUntil as Timestamp)?.toDate() || new Date(),
        usedAt: data.usedAt ? (data.usedAt as Timestamp).toDate() : undefined,
        orderId: data.orderId,
      };
    });
  }

  /**
   * Validate coupon (check if active and not expired)
   */
  static validateCoupon(coupon: Coupon): { valid: boolean; reason?: string } {
    if (coupon.status === 'used') {
      return { valid: false, reason: 'Ce coupon a déjà été utilisé' };
    }

    if (coupon.status === 'expired') {
      return { valid: false, reason: 'Ce coupon a expiré' };
    }

    if (new Date() > coupon.validUntil) {
      return { valid: false, reason: 'Ce coupon a expiré' };
    }

    return { valid: true };
  }

  /**
   * Calculate discount amount for a coupon
   *
   * @param coupon - The coupon to calculate discount for
   * @param subtotal - Order subtotal in cents
   * @returns Discount amount in cents
   */
  static calculateDiscount(coupon: Coupon, subtotal: number): number {
    switch (coupon.discountType) {
      case 'percentage':
        // Percentage discount (e.g., 15% off)
        return Math.round((subtotal * coupon.discountValue) / 100);

      case 'fixed_amount':
        // Fixed amount discount (e.g., 500 cents = 5€ off)
        // Don't discount more than the subtotal
        return Math.min(coupon.discountValue, subtotal);

      case 'free_item':
        // Free item - would need product price lookup
        // For now, return the discount value (could be product price)
        return Math.min(coupon.discountValue, subtotal);

      default:
        return 0;
    }
  }

  /**
   * Use a coupon (mark as used)
   */
  static async useCoupon(couponId: string, orderId: string): Promise<void> {
    const db = getDb();
    const couponRef = doc(db, COLLECTIONS.COUPONS, couponId);

    await updateDoc(couponRef, {
      status: 'used',
      usedAt: serverTimestamp(),
      orderId,
    });

    console.log('[CouponService] ✅ Coupon used:', couponId, 'for order:', orderId);
  }

  /**
   * Expire old coupons (can be called via cron job)
   */
  static async expireOldCoupons(restaurantId: string): Promise<number> {
    const db = getDb();
    const couponsRef = collection(db, COLLECTIONS.COUPONS);
    const now = new Date();

    const q = query(
      couponsRef,
      where('restaurantId', '==', restaurantId),
      where('status', '==', 'active'),
      where('validUntil', '<', now)
    );

    const snapshot = await getDocs(q);
    let count = 0;

    for (const docSnapshot of snapshot.docs) {
      await updateDoc(doc(db, COLLECTIONS.COUPONS, docSnapshot.id), {
        status: 'expired',
      });
      count++;
    }

    console.log('[CouponService] 🕐 Expired', count, 'coupons for restaurant:', restaurantId);
    return count;
  }
}
