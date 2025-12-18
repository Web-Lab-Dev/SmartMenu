// ========================================
// Admin Reviews Page - Complete Feedback Management
// ========================================
// Manage internal reviews + Google Review configuration

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { InternalReviewService, InternalReview } from '@/services/InternalReviewService';
import { RestaurantService } from '@/services/RestaurantService';
import { EmptyState } from '@/components/admin/EmptyState';
import { AdminPageWrapper } from '@/components/admin/AdminPageWrapper';
import { motion } from 'framer-motion';
import { Star, MessageSquare, Mail, Calendar, MapPin, Eye, Loader2, ExternalLink, Save, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { doc, updateDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/constants';

type TabType = 'reviews' | 'config';

/**
 * Admin Reviews Page - Complete Feedback Management
 *
 * Features:
 * - Internal reviews dashboard (rating <= 3)
 * - Google Review URL configuration
 * - Smart Review System (firewall)
 * - Mark as read functionality
 */
export default function AdminReviewsPage() {
  const { user, loading: authLoading } = useAuth();
  const { restaurantId } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<TabType>('reviews');
  const [reviews, setReviews] = useState<InternalReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // Google Review configuration
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [saving, setSaving] = useState(false);

  // Load reviews and restaurant config
  useEffect(() => {
    if (!restaurantId) return;

    const loadData = async () => {
      try {
        setLoading(true);

        // Load internal reviews
        const reviewsData = await InternalReviewService.getRestaurantReviews(restaurantId);
        setReviews(reviewsData);

        // Load restaurant config for Google Review URL
        const restaurantData = await RestaurantService.getById(restaurantId);
        if (restaurantData) {
          setGoogleReviewUrl((restaurantData as any).googleReviewUrl || '');
        }
      } catch (error) {
        console.error('[AdminReviews] Error loading:', error);
        toast.error('Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [restaurantId]);

  // Marquer comme lu
  const handleMarkAsRead = async (reviewId: string) => {
    setProcessingIds((prev) => new Set(prev).add(reviewId));

    try {
      await InternalReviewService.markAsRead(reviewId);

      // Mettre à jour l'état local
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, isRead: true } : r))
      );

      toast.success('Avis marqué comme lu');
    } catch (error) {
      console.error('[AdminReviews] Error marking as read:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(reviewId);
        return newSet;
      });
    }
  };

  // Sauvegarder la configuration Google Review
  const handleSaveConfig = async () => {
    if (!restaurantId) return;

    setSaving(true);
    try {
      const db = getDb();
      const restaurantRef = doc(db, COLLECTIONS.RESTAURANTS, restaurantId);
      await updateDoc(restaurantRef, {
        googleReviewUrl: googleReviewUrl.trim() || null,
        updatedAt: new Date(),
      });

      toast.success('Configuration sauvegardée');
    } catch (error) {
      console.error('[AdminReviews] Save error:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // Compter les nouveaux avis
  const unreadCount = reviews.filter((r) => !r.isRead).length;

  if (authLoading || loading) {
    return (
      <AdminPageWrapper loading={true}>
        <div />
      </AdminPageWrapper>
    );
  }

  if (!user) {
    return (
      <AdminPageWrapper loading={false}>
        <EmptyState
          icon={MessageSquare}
          title="Connexion requise"
          description="Veuillez vous connecter pour accéder aux avis internes"
        />
      </AdminPageWrapper>
    );
  }

  return (
    <AdminPageWrapper loading={false}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Gestion des Avis
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Feedback interne et configuration Google Review
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2 font-medium transition-colors relative ${
              activeTab === 'reviews'
                ? 'text-orange-600 dark:text-orange-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span>Avis Internes</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-semibold rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            {activeTab === 'reviews' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600 dark:bg-orange-400" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2 font-medium transition-colors relative ${
              activeTab === 'config'
                ? 'text-orange-600 dark:text-orange-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span>Configuration</span>
            </div>
            {activeTab === 'config' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600 dark:bg-orange-400" />
            )}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'reviews' && (
          <>
            {/* Liste des avis */}
            {reviews.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="Aucun avis interne"
                description="Les avis négatifs (≤3 étoiles) apparaîtront ici pour que vous puissiez les traiter en interne"
              />
            ) : (
              <div className="space-y-4">
                {reviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`glass-panel rounded-2xl p-6 ${
                  !review.isRead
                    ? 'border-2 border-orange-500/50 bg-orange-50/50 dark:bg-orange-900/10'
                    : ''
                }`}
              >
                {/* Header avec rating et badge nouveau */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {/* Stars */}
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <Star
                          key={value}
                          className={`w-5 h-5 ${
                            value <= review.rating
                              ? 'fill-orange-400 text-orange-400'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Badge Nouveau */}
                    {!review.isRead && (
                      <span className="px-3 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full">
                        Nouveau
                      </span>
                    )}
                  </div>

                  {/* Bouton Marquer comme lu */}
                  {!review.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(review.id)}
                      disabled={processingIds.has(review.id)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingIds.has(review.id) ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                      Marquer comme lu
                    </button>
                  )}
                </div>

                {/* Commentaire */}
                <div className="mb-4">
                  <p className="text-gray-900 dark:text-white leading-relaxed">
                    {review.comment}
                  </p>
                </div>

                {/* Métadonnées */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  {/* Date */}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {format(review.createdAt, "d MMMM yyyy 'à' HH:mm", {
                        locale: fr,
                      })}
                    </span>
                  </div>

                  {/* Table */}
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>Table {review.tableId}</span>
                  </div>

                  {/* Email (si fourni) */}
                  {review.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <a
                        href={`mailto:${review.email}`}
                        className="text-orange-600 dark:text-orange-400 hover:underline"
                      >
                        {review.email}
                      </a>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Info box */}
        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            💡 Système de Pare-Feu d'Avis
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Les clients satisfaits (≥4 étoiles) sont redirigés vers Google Maps pour poster
            un avis public. Les clients moins satisfaits (≤3 étoiles) laissent leur feedback
            ici, vous permettant de corriger les problèmes avant qu'ils n'impactent votre
            e-réputation.
          </p>
        </div>
          </>
        )}

        {/* Configuration Tab */}
        {activeTab === 'config' && (
          <div className="space-y-6">
            {/* Google Review URL Configuration */}
            <div className="glass-panel rounded-2xl p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shrink-0">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Lien Google Avis (Système Pare-Feu)
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Configurez l'URL où rediriger les clients satisfaits (≥4★) pour poster un avis public sur Google
                  </p>
                </div>
              </div>

              {/* URL Input */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    URL Google Review
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="url"
                      value={googleReviewUrl}
                      onChange={(e) => setGoogleReviewUrl(e.target.value)}
                      placeholder="https://g.page/r/..."
                      className="flex-1 px-4 py-3 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                    />
                    <button
                      onClick={handleSaveConfig}
                      disabled={saving}
                      className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Sauvegarde...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          Sauvegarder
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Les clients satisfaits (≥4★) seront automatiquement redirigés vers ce lien pour poster un avis Google
                  </p>
                </div>

                {/* Preview / Test Link */}
                {googleReviewUrl && (
                  <div className="flex items-center gap-2 text-sm">
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                    <a
                      href={googleReviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-600 dark:text-orange-400 hover:underline"
                    >
                      Tester le lien
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* How it works */}
            <div className="glass-panel rounded-2xl p-6 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10 border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Comment fonctionne le système ?
              </h4>
              <div className="space-y-3 text-sm text-green-800 dark:text-green-200">
                <div className="flex gap-3">
                  <span className="shrink-0">✅</span>
                  <p>
                    <strong>Clients satisfaits (4-5★):</strong> Redirigés automatiquement vers votre page Google pour laisser un avis public positif
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="shrink-0">⚠️</span>
                  <p>
                    <strong>Clients insatisfaits (1-3★):</strong> Le feedback reste interne dans l'onglet "Avis Internes", vous permettant de résoudre les problèmes en privé
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="shrink-0">🛡️</span>
                  <p>
                    <strong>Protection de votre e-réputation:</strong> Les avis négatifs n'affectent pas votre note Google publique
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminPageWrapper>
  );
}
