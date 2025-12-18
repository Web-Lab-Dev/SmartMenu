import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { COLLECTIONS, CAMPAIGN_CONSTANTS } from '@/lib/constants';
import type { Coupon } from '@/types/schema';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * POST /api/campaign/generate-coupon
 *
 * Generates a coupon based on campaign win probability
 * Uses Firebase Admin SDK for server-side Firestore operations
 *
 * Request body:
 * {
 *   campaignId: string;
 *   restaurantId: string;
 *   deviceId: string; // Required from client
 * }
 *
 * Response:
 * {
 *   won: boolean;
 *   coupon?: Coupon; // Only if won === true
 *   message: string;
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { campaignId, restaurantId, deviceId } = body;

    // Validation
    if (!campaignId || !restaurantId || !deviceId) {
      return NextResponse.json(
        { error: 'campaignId, restaurantId et deviceId sont requis' },
        { status: 400 }
      );
    }

    logger.log('[API /generate-coupon] 🎲 Request:', { campaignId, restaurantId, deviceId });

    let db;
    try {
      console.log('[API /generate-coupon] 🔧 Initializing Firebase Admin...');
      db = getAdminDb();
      console.log('[API /generate-coupon] ✅ Firebase Admin initialized successfully');
    } catch (adminError) {
      console.error('[API /generate-coupon] ❌ Firebase Admin initialization failed:', adminError);
      return NextResponse.json(
        { error: 'Erreur d\'initialisation Firebase Admin: ' + (adminError instanceof Error ? adminError.message : String(adminError)) },
        { status: 500 }
      );
    }

    // 1. Check device limit (max coupons per device per day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deviceCouponsQuery = await db
      .collection(COLLECTIONS.COUPONS)
      .where('restaurantId', '==', restaurantId)
      .where('deviceId', '==', deviceId)
      .where('createdAt', '>=', today)
      .get();

    const couponCount = deviceCouponsQuery.size;
    logger.log('[API /generate-coupon] 📊 Device coupon count today:', couponCount);

    if (couponCount >= CAMPAIGN_CONSTANTS.MAX_COUPONS_PER_DEVICE_PER_DAY) {
      return NextResponse.json({
        won: false,
        message: `Limite de ${CAMPAIGN_CONSTANTS.MAX_COUPONS_PER_DEVICE_PER_DAY} coupons par jour atteinte`,
      });
    }

    // 2. Fetch campaign
    const campaignDoc = await db.collection(COLLECTIONS.CAMPAIGNS).doc(campaignId).get();

    if (!campaignDoc.exists) {
      return NextResponse.json(
        { error: 'Campagne introuvable' },
        { status: 404 }
      );
    }

    const campaignData = campaignDoc.data()!;

    if (!campaignData.isActive) {
      return NextResponse.json(
        { error: 'Cette campagne est inactive' },
        { status: 400 }
      );
    }

    // 3. Win probability logic
    const randomNumber = Math.random() * 100; // 0-100
    const won = randomNumber < campaignData.winProbability;

    logger.log('[API /generate-coupon] 🎲 Random:', randomNumber.toFixed(2), '| Probability:', campaignData.winProbability, '| Won:', won);

    if (!won) {
      return NextResponse.json({
        won: false,
        message: 'Dommage ! Réessayez plus tard.',
      });
    }

    // 4. User won! Generate coupon
    const code = generateCouponCode();
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + campaignData.validityDays);

    const couponData = {
      restaurantId,
      campaignId,
      code,
      status: 'active',
      discountType: campaignData.rewardType,
      discountValue: campaignData.rewardValue,
      discountDescription: campaignData.rewardDescription,
      deviceId,
      createdAt: FieldValue.serverTimestamp(),
      validUntil,
    };

    const couponRef = await db.collection(COLLECTIONS.COUPONS).add(couponData);
    logger.log('[API /generate-coupon] 🎉 Coupon generated:', couponRef.id, code);

    const coupon: Coupon = {
      id: couponRef.id,
      restaurantId,
      campaignId,
      code,
      status: 'active',
      discountType: campaignData.rewardType,
      discountValue: campaignData.rewardValue,
      discountDescription: campaignData.rewardDescription,
      deviceId,
      createdAt: new Date(),
      validUntil,
    };

    return NextResponse.json({
      won: true,
      coupon,
      message: `Félicitations ! Vous avez gagné : ${campaignData.rewardDescription}`,
    });
  } catch (error) {
    // Utiliser JSON.stringify pour éviter le crash de console.error avec null
    const errorStr = error === null ? 'null' : error === undefined ? 'undefined' : JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
    console.error('[API /generate-coupon] ❌ ERROR OCCURRED:', errorStr);

    if (error instanceof Error) {
      console.error('[API /generate-coupon] Error message:', error.message);
      console.error('[API /generate-coupon] Error stack:', error.stack);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la génération du coupon: ' + errorStr },
      { status: 500 }
    );
  }
}

/**
 * Generate a random coupon code
 * Format: PROMO-XXXXX (10 characters total)
 */
function generateCouponCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${CAMPAIGN_CONSTANTS.COUPON_CODE_PREFIX}-${code}`;
}
