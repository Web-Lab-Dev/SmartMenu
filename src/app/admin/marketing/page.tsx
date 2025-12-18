'use client';

import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminPageWrapper, EmptyState } from '@/components/admin';
import { CampaignService } from '@/services/CampaignService';
import type { Campaign, CampaignRewardType } from '@/types/schema';
import { toast } from 'sonner';
import { Plus, Trash2, ToggleLeft, ToggleRight, Edit2, Gift, Percent, DollarSign } from 'lucide-react';
import { CAMPAIGN_CONSTANTS, VALIDATION_LIMITS } from '@/lib/constants';
import { logger } from '@/lib/logger';

export default function MarketingPage() {
  const { restaurantId, loading: authLoading } = useAdminAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }
    loadCampaigns();
  }, [restaurantId]);

  const loadCampaigns = async () => {
    if (!restaurantId) return;

    try {
      setLoading(true);
      const data = await CampaignService.getByRestaurant(restaurantId);
      setCampaigns(data);
    } catch (error) {
      logger.error('[Marketing] Failed to load campaigns:', error);
      toast.error('Erreur lors du chargement des campagnes');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (campaignId: string, isActive: boolean) => {
    try {
      await CampaignService.toggleActive(campaignId, !isActive);
      toast.success(isActive ? 'Campagne désactivée' : 'Campagne activée');
      loadCampaigns();
    } catch (error) {
      logger.error('[Marketing] Failed to toggle campaign:', error);
      toast.error('Erreur lors de la modification');
    }
  };

  const handleDelete = async (campaignId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette campagne ?')) {
      return;
    }

    try {
      await CampaignService.delete(campaignId);
      toast.success('Campagne supprimée');
      loadCampaigns();
    } catch (error) {
      logger.error('[Marketing] Failed to delete campaign:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const getRewardIcon = (type: CampaignRewardType) => {
    switch (type) {
      case 'percentage':
        return <Percent className="w-5 h-5" />;
      case 'fixed_amount':
        return <DollarSign className="w-5 h-5" />;
      case 'free_item':
        return <Gift className="w-5 h-5" />;
    }
  };

  return (
    <>
    <AdminPageWrapper
      loading={authLoading || loading}
      loadingText="Chargement des campagnes..."
      isEmpty={!restaurantId || campaigns.length === 0}
      emptyState={
        !restaurantId ? (
          <div className="flex items-center justify-center h-96">
            <p className="text-gray-400">Veuillez vous connecter</p>
          </div>
        ) : (
          <EmptyState
            icon={Gift}
            title="Aucune campagne"
            description="Créez votre première campagne promotionnelle"
            action={{
              label: 'Créer une campagne',
              onClick: () => setShowCreateModal(true),
            }}
          />
        )
      }
    >
      <div className="space-y-6">
        {/* Action Bar */}
        <div className="flex items-center justify-between">
          <p className="text-gray-400">
            Créez des campagnes de tombola pour fidéliser vos clients
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Nouvelle Campagne
          </button>
        </div>

        {/* Campaigns List */}
        {campaigns.length > 0 && (
          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 bg-orange-500/10 rounded-lg text-orange-400">
                        {getRewardIcon(campaign.rewardType)}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          {campaign.name}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {campaign.rewardDescription}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Probabilité de gain
                        </p>
                        <p className="text-2xl font-bold text-white">
                          {campaign.winProbability}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Validité
                        </p>
                        <p className="text-2xl font-bold text-white">
                          {campaign.validityDays} <span className="text-sm text-gray-400 font-normal">jours</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Statut
                        </p>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            campaign.isActive
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-gray-700 text-gray-400 border border-gray-600'
                          }`}
                        >
                          {campaign.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-6">
                    <button
                      onClick={() => handleToggleActive(campaign.id, campaign.isActive)}
                      className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                      title={campaign.isActive ? 'Désactiver' : 'Activer'}
                    >
                      {campaign.isActive ? (
                        <ToggleRight className="w-6 h-6 text-green-400" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-gray-500" />
                      )}
                    </button>
                    <button
                      onClick={() => setEditingCampaign(campaign)}
                      className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Edit2 className="w-5 h-5 text-gray-400 hover:text-white" />
                    </button>
                    <button
                      onClick={() => handleDelete(campaign.id)}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-5 h-5 text-red-400 hover:text-red-300" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminPageWrapper>

    {/* Create/Edit Modal - Outside AdminPageWrapper */}
    {(showCreateModal || editingCampaign) && restaurantId && (
      <CampaignModal
        campaign={editingCampaign}
        restaurantId={restaurantId}
        onClose={() => {
          setShowCreateModal(false);
          setEditingCampaign(null);
        }}
        onSuccess={() => {
          setShowCreateModal(false);
          setEditingCampaign(null);
          loadCampaigns();
        }}
      />
    )}
    </>
  );
}

function CampaignModal({
  campaign,
  restaurantId,
  onClose,
  onSuccess,
}: {
  campaign: Campaign | null;
  restaurantId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEdit = !!campaign;
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: campaign?.name || '',
    winProbability: campaign?.winProbability || 20,
    rewardType: campaign?.rewardType || ('percentage' as CampaignRewardType),
    rewardValue: campaign?.rewardValue || 10,
    rewardDescription: campaign?.rewardDescription || '',
    validityDays: campaign?.validityDays || 30,
    isActive: campaign?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit) {
        await CampaignService.update(campaign.id, formData);
        toast.success('Campagne mise à jour');
      } else {
        await CampaignService.create({
          restaurantId,
          ...formData,
        });
        toast.success('Campagne créée');
      }
      onSuccess();
    } catch (error) {
      logger.error('[CampaignModal] Error:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-700">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {isEdit ? 'Modifier la campagne' : 'Nouvelle campagne'}
            </h2>
            <p className="text-gray-400 mt-1">
              Configurez les paramètres de votre campagne promotionnelle
            </p>
          </div>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nom de la campagne
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                maxLength={VALIDATION_LIMITS.CAMPAIGN_NAME_MAX}
                required
                className="w-full px-4 py-2.5 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="Ex: Promotion de Noël, Offre Spéciale Ramadan"
              />
            </div>

            {/* Reward Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Type de récompense
              </label>
              <select
                value={formData.rewardType}
                onChange={(e) =>
                  setFormData({ ...formData, rewardType: e.target.value as CampaignRewardType })
                }
                className="w-full px-4 py-2.5 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="percentage">Pourcentage de réduction</option>
                <option value="fixed_amount">Montant fixe</option>
                <option value="free_item">Article gratuit</option>
              </select>
            </div>

            {/* Reward Value */}
            {formData.rewardType !== 'free_item' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Valeur de la récompense
                  {formData.rewardType === 'percentage' && ' (%)'}
                  {formData.rewardType === 'fixed_amount' && ' (FCFA)'}
                </label>
                <input
                  type="number"
                  value={formData.rewardValue}
                  onChange={(e) => setFormData({ ...formData, rewardValue: parseInt(e.target.value) })}
                  min={0}
                  required
                  className="w-full px-4 py-2.5 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            )}

            {/* Free Item Name (only for free_item type) */}
            {formData.rewardType === 'free_item' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Article gratuit
                </label>
                <input
                  type="text"
                  value={formData.rewardDescription}
                  onChange={(e) => setFormData({ ...formData, rewardDescription: e.target.value })}
                  maxLength={VALIDATION_LIMITS.CAMPAIGN_REWARD_DESCRIPTION_MAX}
                  required
                  className="w-full px-4 py-2.5 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Ex: Coca-Cola, Tiramisu, Café offert"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Nom de l'article qui sera offert gratuitement
                </p>
              </div>
            )}

            {/* Reward Description */}
            {formData.rewardType !== 'free_item' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description de la récompense
                </label>
                <input
                  type="text"
                  value={formData.rewardDescription}
                  onChange={(e) => setFormData({ ...formData, rewardDescription: e.target.value })}
                  maxLength={VALIDATION_LIMITS.CAMPAIGN_REWARD_DESCRIPTION_MAX}
                  required
                  className="w-full px-4 py-2.5 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Ex: 10% de réduction sur votre prochaine commande"
                />
              </div>
            )}

            {/* Win Probability */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Probabilité de gain ({formData.winProbability}%)
              </label>
              <input
                type="range"
                value={formData.winProbability}
                onChange={(e) =>
                  setFormData({ ...formData, winProbability: parseInt(e.target.value) })
                }
                min={CAMPAIGN_CONSTANTS.MIN_WIN_PROBABILITY}
                max={CAMPAIGN_CONSTANTS.MAX_WIN_PROBABILITY}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Validity Days */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Durée de validité (jours)
              </label>
              <input
                type="number"
                value={formData.validityDays}
                onChange={(e) => setFormData({ ...formData, validityDays: parseInt(e.target.value) })}
                min={CAMPAIGN_CONSTANTS.MIN_VALIDITY_DAYS}
                max={CAMPAIGN_CONSTANTS.MAX_VALIDITY_DAYS}
                required
                className="w-full px-4 py-2.5 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {/* Is Active */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-300">
                Activer la campagne immédiatement
              </label>
            </div>
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
              className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sauvegarde...' : isEdit ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
