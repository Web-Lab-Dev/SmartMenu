import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { COLLECTIONS } from '@/lib/constants';
import type { Coupon } from '@/types/schema';

/**
 * POST /api/coupon/verify
 *
 * Verifies a coupon code and returns coupon details if valid
 *
 * Request body:
 * {
 *   restaurantId: string;
 *   code: string; // Coupon code to verify (e.g., "PROMO-ABC12")
 * }
 *
 * Response (valid):
 * {
 *   valid: true;
 *   coupon: Coupon;
 * }
 *
 * Response (invalid):
 * {
 *   valid: false;
 *   error: string; // User-friendly error message
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { restaurantId, code } = body;

    // Validation
    if (!restaurantId || !code) {
      return NextResponse.json(
        { valid: false, error: 'restaurantId et code sont requis' },
        { status: 400 }
      );
    }

    logger.log('[API /coupon/verify] 🎫 Request:', { restaurantId, code: code.toUpperCase() });

    // Initialize Firebase Admin
    const db = getAdminDb();

    // Fetch coupon from Firestore using Admin SDK
    const couponsRef = db.collection(COLLECTIONS.COUPONS);
    const snapshot = await couponsRef
      .where('restaurantId', '==', restaurantId)
      .where('code', '==', code.toUpperCase())
      .limit(1)
      .get();

    if (snapshot.empty) {
      logger.log('[API /coupon/verify] ❌ Coupon not found:', code);
      return NextResponse.json(
        { valid: false, error: 'Code invalide' },
        { status: 404 }
      );
    }

    const couponDoc = snapshot.docs[0];
    const couponData = couponDoc.data();

    // Convert Firestore Timestamp to Date
    const coupon: Coupon = {
      id: couponDoc.id,
      restaurantId: couponData.restaurantId,
      campaignId: couponData.campaignId,
      code: couponData.code,
      status: couponData.status,
      discountType: couponData.discountType,
      discountValue: couponData.discountValue,
      discountDescription: couponData.discountDescription,
      deviceId: couponData.deviceId,
      createdAt: couponData.createdAt?.toDate?.() || new Date(couponData.createdAt),
      validUntil: couponData.validUntil?.toDate?.() || new Date(couponData.validUntil),
      usedAt: couponData.usedAt?.toDate?.() || (couponData.usedAt ? new Date(couponData.usedAt) : undefined),
    };

    // Validate coupon status
    if (coupon.status !== 'active') {
      logger.log('[API /coupon/verify] ❌ Coupon not active:', coupon.status);
      return NextResponse.json(
        { valid: false, error: 'Ce coupon a déjà été utilisé' },
        { status: 400 }
      );
    }

    // Validate coupon expiration
    const now = new Date();
    if (coupon.validUntil < now) {
      logger.log('[API /coupon/verify] ❌ Coupon expired');
      return NextResponse.json(
        { valid: false, error: 'Ce coupon a expiré' },
        { status: 400 }
      );
    }

    // Check if coupon was created today (prevent same-day usage)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const couponCreatedToday = coupon.createdAt >= today;

    if (couponCreatedToday) {
      logger.log('[API /coupon/verify] ❌ Coupon cannot be used on same day');
      return NextResponse.json(
        { valid: false, error: 'Ce coupon ne peut être utilisé que lors de votre prochaine visite (pas le même jour)' },
        { status: 400 }
      );
    }

    // Coupon is valid!
    logger.log('[API /coupon/verify] ✅ Coupon valid:', coupon.code, coupon.discountDescription);

    return NextResponse.json(
      {
        valid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          discountDescription: coupon.discountDescription,
          validUntil: coupon.validUntil,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('[API /coupon/verify] ❌ Error:', error);

    return NextResponse.json(
      { valid: false, error: 'Erreur lors de la vérification du coupon' },
      { status: 500 }
    );
  }
}
