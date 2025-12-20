'use client';

import { useState, useEffect } from 'react';
import { CampaignService } from '@/services/CampaignService';
import { CategoryService } from '@/services/CategoryService';
import type { Campaign, RecurrenceType, Category } from '@/types/schema';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { Sparkles, Calendar, Clock, Repeat, Tag, Percent } from 'lucide-react';

interface TimedPromotionFormProps {
  campaign?: Campaign | null;
  restaurantId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Dimanche', short: 'Dim' },
  { value: 1, label: 'Lundi', short: 'Lun' },
  { value: 2, label: 'Mardi', short: 'Mar' },
  { value: 3, label: 'Mercredi', short: 'Mer' },
  { value: 4, label: 'Jeudi', short: 'Jeu' },
  { value: 5, label: 'Vendredi', short: 'Ven' },
  { value: 6, label: 'Samedi', short: 'Sam' },
];

export function TimedPromotionForm({
  campaign,
  restaurantId,
  onClose,
  onSuccess,
}: TimedPromotionFormProps) {
  const isEdit = !!campaign;
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState({
    name: campaign?.name || '',
    recurrence: (campaign?.recurrence || 'recurring') as RecurrenceType,

    // One-shot fields
    startDate: campaign?.rules?.startDate
      ? new Date(campaign.rules.startDate).toISOString().split('T')[0]
      : '',
    endDate: campaign?.rules?.endDate
      ? new Date(campaign.rules.endDate).toISOString().split('T')[0]
      : '',

    // Recurring fields
    daysOfWeek: campaign?.rules?.daysOfWeek || [5], // Default to Friday
    startTime: campaign?.rules?.startTime || '17:00',
    endTime: campaign?.rules?.endTime || '20:00',

    // Discount
    discountType: (campaign?.discount?.type || 'percentage') as 'percentage' | 'fixed',
    discountValue: campaign?.discount?.value || 20,

    // Targeting
    targetCategories: campaign?.targetCategories || [],

    // Banner
    bannerText: campaign?.bannerText || '',

    isActive: campaign?.isActive ?? true,
  });

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await CategoryService.getRestaurantCategories(restaurantId);
        setCategories(data);
      } catch (error) {
        logger.error('[TimedPromotionForm] Failed to load categories:', error);
      }
    };
    loadCategories();
  }, [restaurantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!formData.name.trim()) {
        throw new Error('Le nom de la promotion est requis');
      }

      if (formData.recurrence === 'one_shot') {
        if (!formData.startDate || !formData.endDate) {
          throw new Error('Les dates de début et fin sont requises');
        }
        if (new Date(formData.endDate) < new Date(formData.startDate)) {
          throw new Error('La date de fin doit être après la date de début');
        }
      } else {
        if (formData.daysOfWeek.length === 0) {
          throw new Error('Veuillez sélectionner au moins un jour');
        }
        if (!formData.startTime || !formData.endTime) {
          throw new Error('Les heures de début et fin sont requises');
        }
        if (formData.endTime <= formData.startTime) {
          throw new Error('L\'heure de fin doit être après l\'heure de début');
        }
      }

      if (formData.discountValue <= 0) {
        throw new Error('La valeur de la réduction doit être positive');
      }

      if (formData.discountType === 'percentage' && formData.discountValue > 100) {
        throw new Error('La réduction ne peut pas dépasser 100%');
      }

      if (!formData.bannerText.trim()) {
        throw new Error('Le texte de la bannière est requis');
      }

      // Prepare data
      const campaignData = {
        restaurantId,
        name: formData.name.trim(),
        recurrence: formData.recurrence,
        rules: formData.recurrence === 'one_shot'
          ? {
              startDate: new Date(formData.startDate),
              endDate: new Date(formData.endDate),
            }
          : {
              daysOfWeek: formData.daysOfWeek,
              startTime: formData.startTime,
              endTime: formData.endTime,
            },
        discount: {
          type: formData.discountType,
          value: formData.discountValue,
        },
        targetCategories: formData.targetCategories,
        bannerText: formData.bannerText.trim(),
        isActive: formData.isActive,
      };

      if (isEdit && campaign) {
        await CampaignService.updateTimedPromotion(campaign.id, campaignData);
        toast.success('Promotion mise à jour');
      } else {
        await CampaignService.createTimedPromotion(campaignData);
        toast.success('Promotion créée');
      }

      onSuccess();
    } catch (error) {
      logger.error('[TimedPromotionForm] Error:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day: number) => {
    setFormData((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day].sort(),
    }));
  };

  const toggleCategory = (categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      targetCategories: prev.targetCategories.includes(categoryId)
        ? prev.targetCategories.filter((id) => id !== categoryId)
        : [...prev.targetCategories, categoryId],
    }));
  };

  // Generate banner preview
  const generateBannerPreview = () => {
    if (formData.bannerText) {
      return formData.bannerText;
    }

    const discountText = formData.discountType === 'percentage'
      ? `-${formData.discountValue}%`
      : `-${formData.discountValue} FCFA`;

    if (formData.recurrence === 'recurring') {
      const dayNames = formData.daysOfWeek
        .sort()
        .map((d) => DAYS_OF_WEEK[d].short)
        .join(', ');
      return `🔥 Happy Hour ! ${discountText} tous les ${dayNames} de ${formData.startTime} à ${formData.endTime}`;
    } else {
      return `🎉 Offre Spéciale ! ${discountText} jusqu'au ${new Date(formData.endDate).toLocaleDateString('fr-FR')}`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-700">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-orange-500/10 rounded-lg">
                <Sparkles className="w-6 h-6 text-orange-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">
                {isEdit ? 'Modifier la promotion' : 'Nouvelle promotion'}
              </h2>
            </div>
            <p className="text-gray-400">
              Créez des Happy Hours ou événements spéciaux pour booster vos ventes
            </p>
          </div>

          {/* Recurrence Type Switch */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              <Repeat className="w-4 h-4 inline mr-2" />
              Type de promotion
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, recurrence: 'recurring' })}
                className={`p-4 rounded-xl border-2 transition-all ${
                  formData.recurrence === 'recurring'
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                }`}
              >
                <div className="text-left">
                  <div className="font-semibold text-white mb-1">Happy Hour Récurrent</div>
                  <div className="text-xs text-gray-400">Tous les vendredis, week-ends, etc.</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, recurrence: 'one_shot' })}
                className={`p-4 rounded-xl border-2 transition-all ${
                  formData.recurrence === 'one_shot'
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                }`}
              >
                <div className="text-left">
                  <div className="font-semibold text-white mb-1">Événement Unique</div>
                  <div className="text-xs text-gray-400">Noël, Ramadan, Saint-Valentin</div>
                </div>
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nom de la promotion
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              maxLength={100}
              className="w-full px-4 py-2.5 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              placeholder="Ex: Happy Hour Vendredi, Spécial Réveillon"
            />
          </div>

          {/* Date/Time Configuration */}
          {formData.recurrence === 'one_shot' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Date de début
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Date de fin
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
          ) : (
            <>
              {/* Days of Week */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Jours actifs
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`p-3 rounded-lg text-sm font-semibold transition-all ${
                        formData.daysOfWeek.includes(day.value)
                          ? 'bg-orange-500 text-black'
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                    >
                      {day.short}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Heure de début
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Heure de fin
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* Discount Configuration */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-300">
              <Percent className="w-4 h-4 inline mr-2" />
              Réduction
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <select
                  value={formData.discountType}
                  onChange={(e) =>
                    setFormData({ ...formData, discountType: e.target.value as 'percentage' | 'fixed' })
                  }
                  className="w-full px-4 py-2.5 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="percentage">Pourcentage (%)</option>
                  <option value="fixed">Montant fixe (FCFA)</option>
                </select>
              </div>
              <div>
                <input
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: parseInt(e.target.value) || 0 })}
                  min={0}
                  max={formData.discountType === 'percentage' ? 100 : undefined}
                  required
                  className="w-full px-4 py-2.5 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder={formData.discountType === 'percentage' ? '20' : '5000'}
                />
              </div>
            </div>
          </div>

          {/* Category Targeting */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              <Tag className="w-4 h-4 inline mr-2" />
              Catégories ciblées
              <span className="text-gray-500 text-xs ml-2">(Laisser vide pour toute la carte)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className={`p-3 rounded-lg text-sm font-medium text-left transition-all ${
                    formData.targetCategories.includes(category.id)
                      ? 'bg-orange-500 text-black'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {category.icon && <span className="mr-2">{category.icon}</span>}
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Banner Text */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Texte de la bannière
            </label>
            <input
              type="text"
              value={formData.bannerText}
              onChange={(e) => setFormData({ ...formData, bannerText: e.target.value })}
              required
              maxLength={200}
              className="w-full px-4 py-2.5 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              placeholder={generateBannerPreview()}
            />
            {/* Live Preview */}
            <div className="mt-3 p-4 rounded-lg" style={{ background: 'linear-gradient(135deg, #FF7D29 0%, #FF5722 100%)' }}>
              <div className="text-center">
                <p className="text-lg font-bold text-black">
                  {formData.bannerText || generateBannerPreview()}
                </p>
              </div>
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-300">
              Activer la promotion immédiatement
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Sauvegarde...' : isEdit ? 'Mettre à jour' : 'Créer la promotion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
