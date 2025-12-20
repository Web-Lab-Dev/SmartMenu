// ========================================
// useActiveCampaign Hook
// ========================================
// Real-time hook to detect active timed promotions (Happy Hour, etc.)

import { useState, useEffect, useMemo } from 'react';
import {
  getDb,
  collection,
  query,
  where,
  onSnapshot,
  type Unsubscribe,
} from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/constants';
import type { Campaign, Product } from '@/types/schema';
import { isPromotionActive, getProductPrice, getTimeUntilEnd, formatTimeRemaining } from '@/lib/promo-utils';
import { logger } from '@/lib/logger';

export interface ActiveCampaignData {
  campaign: Campaign | null;
  isActive: boolean;
  loading: boolean;
  timeRemaining: number | null; // milliseconds until promotion ends
  timeRemainingFormatted: string | null; // human-readable format
  getProductPrice: (product: Product) => {
    price: number;
    originalPrice: number | null;
    hasDiscount: boolean;
  };
}

/**
 * Hook to get the currently active timed promotion for a restaurant
 * Automatically checks time and updates when promotion becomes active/inactive
 */
export function useActiveCampaign(restaurantId: string): ActiveCampaignData {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Subscribe to timed_promotion campaigns for this restaurant
  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    let unsubscribe: Unsubscribe | null = null;
    let mounted = true;

    const setupListener = async () => {
      try {
        const db = getDb();
        const campaignsRef = collection(db, COLLECTIONS.CAMPAIGNS);

        // Query for active timed promotions
        const q = query(
          campaignsRef,
          where('restaurantId', '==', restaurantId),
          where('isActive', '==', true)
          // Note: Can't filter by type in query if some campaigns don't have the field
          // Will filter client-side instead
        );

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            if (!mounted) return;

            const campaignsList = snapshot.docs
              .map((doc) => {
                const data = doc.data();
                return {
                  id: doc.id,
                  ...data,
                  createdAt: data.createdAt?.toDate() || new Date(),
                  updatedAt: data.updatedAt?.toDate() || new Date(),
                  rules: data.rules
                    ? {
                        ...data.rules,
                        startDate: data.rules.startDate?.toDate(),
                        endDate: data.rules.endDate?.toDate(),
                      }
                    : undefined,
                } as Campaign;
              })
              // Filter for timed_promotion type only (client-side)
              .filter((c) => c.type === 'timed_promotion');

            setCampaigns(campaignsList);
            setLoading(false);
          },
          (error) => {
            logger.error('[useActiveCampaign] Snapshot error:', error);
            if (mounted) {
              setCampaigns([]);
              setLoading(false);
            }
          }
        );
      } catch (error) {
        logger.error('[useActiveCampaign] Setup error:', error);
        if (mounted) {
          setCampaigns([]);
          setLoading(false);
        }
      }
    };

    setupListener();

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [restaurantId]);

  // Update current time every minute to re-check promotion status
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Every 60 seconds

    return () => clearInterval(interval);
  }, []);

  // Find the active promotion (there should only be one at a time)
  const activeCampaign = useMemo(() => {
    return campaigns.find((c) => isPromotionActive(c, currentTime)) || null;
  }, [campaigns, currentTime]);

  // Calculate time remaining
  const timeRemaining = useMemo(() => {
    if (!activeCampaign) return null;
    return getTimeUntilEnd(activeCampaign, currentTime);
  }, [activeCampaign, currentTime]);

  // Format time remaining
  const timeRemainingFormatted = useMemo(() => {
    if (timeRemaining === null) return null;
    return formatTimeRemaining(timeRemaining);
  }, [timeRemaining]);

  // Function to get product price with promotion applied
  const getPrice = useMemo(() => {
    return (product: Product) => getProductPrice(product, activeCampaign);
  }, [activeCampaign]);

  return {
    campaign: activeCampaign,
    isActive: !!activeCampaign,
    loading,
    timeRemaining,
    timeRemainingFormatted,
    getProductPrice: getPrice,
  };
}
