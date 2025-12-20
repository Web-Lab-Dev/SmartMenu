import {
  getDb,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from '@/lib/firebase';
import { COLLECTIONS, CAMPAIGN_CONSTANTS, VALIDATION_LIMITS } from '@/lib/constants';
import type { Campaign, CampaignRewardType } from '@/types/schema';

/**
 * CampaignService - CRUD operations for promotional campaigns
 */
export class CampaignService {
  /**
   * Create a new campaign
   */
  static async create(data: {
    restaurantId: string;
    name: string;
    winProbability: number;
    rewardType: CampaignRewardType;
    rewardValue: number;
    rewardDescription: string;
    validityDays: number;
    isActive?: boolean;
  }): Promise<string> {
    // Validation
    if (!data.name?.trim()) {
      throw new Error('Le nom de la campagne est requis');
    }
    if (data.name.length > VALIDATION_LIMITS.CAMPAIGN_NAME_MAX) {
      throw new Error(`Le nom ne peut pas dépasser ${VALIDATION_LIMITS.CAMPAIGN_NAME_MAX} caractères`);
    }
    if (data.winProbability < CAMPAIGN_CONSTANTS.MIN_WIN_PROBABILITY || data.winProbability > CAMPAIGN_CONSTANTS.MAX_WIN_PROBABILITY) {
      throw new Error(`La probabilité de gain doit être entre ${CAMPAIGN_CONSTANTS.MIN_WIN_PROBABILITY} et ${CAMPAIGN_CONSTANTS.MAX_WIN_PROBABILITY}%`);
    }
    if (data.validityDays < CAMPAIGN_CONSTANTS.MIN_VALIDITY_DAYS || data.validityDays > CAMPAIGN_CONSTANTS.MAX_VALIDITY_DAYS) {
      throw new Error(`La validité doit être entre ${CAMPAIGN_CONSTANTS.MIN_VALIDITY_DAYS} et ${CAMPAIGN_CONSTANTS.MAX_VALIDITY_DAYS} jours`);
    }
    if (data.rewardDescription.length > VALIDATION_LIMITS.CAMPAIGN_REWARD_DESCRIPTION_MAX) {
      throw new Error(`La description ne peut pas dépasser ${VALIDATION_LIMITS.CAMPAIGN_REWARD_DESCRIPTION_MAX} caractères`);
    }

    const db = getDb();
    const campaignsRef = collection(db, COLLECTIONS.CAMPAIGNS);

    const campaignData = {
      restaurantId: data.restaurantId,
      name: data.name.trim(),
      isActive: data.isActive ?? true,
      winProbability: data.winProbability,
      rewardType: data.rewardType,
      rewardValue: data.rewardValue,
      rewardDescription: data.rewardDescription.trim(),
      validityDays: data.validityDays,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(campaignsRef, campaignData);
    console.log('[CampaignService] ✅ Campaign created:', docRef.id);
    return docRef.id;
  }

  /**
   * Get campaign by ID
   */
  static async getById(campaignId: string): Promise<Campaign | null> {
    const db = getDb();
    const campaignRef = doc(db, COLLECTIONS.CAMPAIGNS, campaignId);
    const snapshot = await getDoc(campaignRef);

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();
    return {
      id: snapshot.id,
      restaurantId: data.restaurantId,
      name: data.name,
      isActive: data.isActive,
      winProbability: data.winProbability,
      rewardType: data.rewardType,
      rewardValue: data.rewardValue,
      rewardDescription: data.rewardDescription,
      validityDays: data.validityDays,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    };
  }

  /**
   * Get all campaigns for a restaurant
   */
  static async getByRestaurant(restaurantId: string): Promise<Campaign[]> {
    const db = getDb();
    const campaignsRef = collection(db, COLLECTIONS.CAMPAIGNS);
    const q = query(
      campaignsRef,
      where('restaurantId', '==', restaurantId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        restaurantId: data.restaurantId,
        name: data.name,
        isActive: data.isActive,
        // Lottery fields (optional for timed_promotion)
        winProbability: data.winProbability,
        rewardType: data.rewardType,
        rewardValue: data.rewardValue,
        rewardDescription: data.rewardDescription,
        validityDays: data.validityDays,
        // Timed promotion fields (optional for lottery)
        type: data.type,
        recurrence: data.recurrence,
        rules: data.rules,
        discount: data.discount,
        targetCategories: data.targetCategories,
        bannerText: data.bannerText,
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
      };
    });
  }

  /**
   * Get active campaigns for a restaurant
   */
  static async getActiveCampaigns(restaurantId: string): Promise<Campaign[]> {
    const db = getDb();
    const campaignsRef = collection(db, COLLECTIONS.CAMPAIGNS);

    // ⚠️ TEMPORARY: Remove orderBy to avoid composite index requirement
    // TODO: Create composite index and add back orderBy('createdAt', 'desc')
    const q = query(
      campaignsRef,
      where('restaurantId', '==', restaurantId),
      where('isActive', '==', true)
    );

    const snapshot = await getDocs(q);
    const campaigns = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        restaurantId: data.restaurantId,
        name: data.name,
        isActive: data.isActive,
        // Lottery fields (optional for timed_promotion)
        winProbability: data.winProbability,
        rewardType: data.rewardType,
        rewardValue: data.rewardValue,
        rewardDescription: data.rewardDescription,
        validityDays: data.validityDays,
        // Timed promotion fields (optional for lottery)
        type: data.type,
        recurrence: data.recurrence,
        rules: data.rules,
        discount: data.discount,
        targetCategories: data.targetCategories,
        bannerText: data.bannerText,
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
      };
    });

    // Sort client-side by createdAt desc
    return campaigns.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Update campaign
   */
  static async update(
    campaignId: string,
    updates: Partial<{
      name: string;
      isActive: boolean;
      winProbability: number;
      rewardType: CampaignRewardType;
      rewardValue: number;
      rewardDescription: string;
      validityDays: number;
    }>
  ): Promise<void> {
    // Validation
    if (updates.name !== undefined) {
      if (!updates.name.trim()) {
        throw new Error('Le nom de la campagne ne peut pas être vide');
      }
      if (updates.name.length > VALIDATION_LIMITS.CAMPAIGN_NAME_MAX) {
        throw new Error(`Le nom ne peut pas dépasser ${VALIDATION_LIMITS.CAMPAIGN_NAME_MAX} caractères`);
      }
    }
    if (updates.winProbability !== undefined) {
      if (updates.winProbability < CAMPAIGN_CONSTANTS.MIN_WIN_PROBABILITY || updates.winProbability > CAMPAIGN_CONSTANTS.MAX_WIN_PROBABILITY) {
        throw new Error(`La probabilité de gain doit être entre ${CAMPAIGN_CONSTANTS.MIN_WIN_PROBABILITY} et ${CAMPAIGN_CONSTANTS.MAX_WIN_PROBABILITY}%`);
      }
    }
    if (updates.validityDays !== undefined) {
      if (updates.validityDays < CAMPAIGN_CONSTANTS.MIN_VALIDITY_DAYS || updates.validityDays > CAMPAIGN_CONSTANTS.MAX_VALIDITY_DAYS) {
        throw new Error(`La validité doit être entre ${CAMPAIGN_CONSTANTS.MIN_VALIDITY_DAYS} et ${CAMPAIGN_CONSTANTS.MAX_VALIDITY_DAYS} jours`);
      }
    }

    const db = getDb();
    const campaignRef = doc(db, COLLECTIONS.CAMPAIGNS, campaignId);

    const updateData: Record<string, unknown> = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    // Trim strings
    if (updates.name) {
      updateData.name = updates.name.trim();
    }
    if (updates.rewardDescription) {
      updateData.rewardDescription = updates.rewardDescription.trim();
    }

    await updateDoc(campaignRef, updateData);
    console.log('[CampaignService] ✅ Campaign updated:', campaignId);
  }

  /**
   * Delete campaign
   */
  static async delete(campaignId: string): Promise<void> {
    const db = getDb();
    const campaignRef = doc(db, COLLECTIONS.CAMPAIGNS, campaignId);
    await deleteDoc(campaignRef);
    console.log('[CampaignService] ✅ Campaign deleted:', campaignId);
  }

  /**
   * Toggle campaign active status
   */
  static async toggleActive(campaignId: string, isActive: boolean): Promise<void> {
    await this.update(campaignId, { isActive });
  }

  /**
   * Create a timed promotion (Happy Hour / Special Event)
   */
  static async createTimedPromotion(data: {
    restaurantId: string;
    name: string;
    recurrence: 'one_shot' | 'recurring';
    rules: {
      startDate?: Date;
      endDate?: Date;
      daysOfWeek?: number[];
      startTime?: string;
      endTime?: string;
    };
    discount: {
      type: 'percentage' | 'fixed';
      value: number;
    };
    targetCategories: string[];
    bannerText: string;
    isActive?: boolean;
  }): Promise<string> {
    // Validation
    if (!data.name?.trim()) {
      throw new Error('Le nom de la promotion est requis');
    }

    if (data.recurrence === 'one_shot') {
      if (!data.rules.startDate || !data.rules.endDate) {
        throw new Error('Les dates de début et fin sont requises pour un événement unique');
      }
      if (data.rules.endDate < data.rules.startDate) {
        throw new Error('La date de fin doit être après la date de début');
      }
    } else if (data.recurrence === 'recurring') {
      if (!data.rules.daysOfWeek || data.rules.daysOfWeek.length === 0) {
        throw new Error('Au moins un jour doit être sélectionné pour un Happy Hour récurrent');
      }
      if (!data.rules.startTime || !data.rules.endTime) {
        throw new Error('Les heures de début et fin sont requises');
      }
      if (data.rules.endTime <= data.rules.startTime) {
        throw new Error('L\'heure de fin doit être après l\'heure de début');
      }
    }

    if (data.discount.value <= 0) {
      throw new Error('La valeur de la réduction doit être positive');
    }

    if (data.discount.type === 'percentage' && data.discount.value > 100) {
      throw new Error('La réduction ne peut pas dépasser 100%');
    }

    if (!data.bannerText?.trim()) {
      throw new Error('Le texte de la bannière est requis');
    }

    const db = getDb();
    const campaignsRef = collection(db, COLLECTIONS.CAMPAIGNS);

    const campaignData = {
      restaurantId: data.restaurantId,
      name: data.name.trim(),
      type: 'timed_promotion' as const,
      recurrence: data.recurrence,
      rules: data.rules,
      discount: data.discount,
      targetCategories: data.targetCategories,
      bannerText: data.bannerText.trim(),
      isActive: data.isActive ?? true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(campaignsRef, campaignData);
    console.log('[CampaignService] ✅ Timed promotion created:', docRef.id);
    return docRef.id;
  }

  /**
   * Update a timed promotion
   */
  static async updateTimedPromotion(
    campaignId: string,
    data: {
      restaurantId: string;
      name: string;
      recurrence: 'one_shot' | 'recurring';
      rules: {
        startDate?: Date;
        endDate?: Date;
        daysOfWeek?: number[];
        startTime?: string;
        endTime?: string;
      };
      discount: {
        type: 'percentage' | 'fixed';
        value: number;
      };
      targetCategories: string[];
      bannerText: string;
      isActive?: boolean;
    }
  ): Promise<void> {
    // Same validation as create
    if (!data.name?.trim()) {
      throw new Error('Le nom de la promotion est requis');
    }

    if (data.recurrence === 'one_shot') {
      if (!data.rules.startDate || !data.rules.endDate) {
        throw new Error('Les dates de début et fin sont requises pour un événement unique');
      }
      if (data.rules.endDate < data.rules.startDate) {
        throw new Error('La date de fin doit être après la date de début');
      }
    } else if (data.recurrence === 'recurring') {
      if (!data.rules.daysOfWeek || data.rules.daysOfWeek.length === 0) {
        throw new Error('Au moins un jour doit être sélectionné pour un Happy Hour récurrent');
      }
      if (!data.rules.startTime || !data.rules.endTime) {
        throw new Error('Les heures de début et fin sont requises');
      }
      if (data.rules.endTime <= data.rules.startTime) {
        throw new Error('L\'heure de fin doit être après l\'heure de début');
      }
    }

    if (data.discount.value <= 0) {
      throw new Error('La valeur de la réduction doit être positive');
    }

    if (data.discount.type === 'percentage' && data.discount.value > 100) {
      throw new Error('La réduction ne peut pas dépasser 100%');
    }

    if (!data.bannerText?.trim()) {
      throw new Error('Le texte de la bannière est requis');
    }

    const db = getDb();
    const campaignRef = doc(db, COLLECTIONS.CAMPAIGNS, campaignId);

    const updateData = {
      name: data.name.trim(),
      type: 'timed_promotion' as const,
      recurrence: data.recurrence,
      rules: data.rules,
      discount: data.discount,
      targetCategories: data.targetCategories,
      bannerText: data.bannerText.trim(),
      isActive: data.isActive,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(campaignRef, updateData);
    console.log('[CampaignService] ✅ Timed promotion updated:', campaignId);
  }
}
