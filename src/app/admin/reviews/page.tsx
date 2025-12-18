// ========================================
// Admin Reviews Page - Internal Feedback Dashboard
// ========================================
// Affiche les avis internes (<=3 étoiles) pour correction
// - Liste triée par date (plus récent en haut)
// - Badge "Nouveau" pour les non lus
// - Fonction "Marquer comme lu"

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { InternalReviewService, InternalReview } from '@/services/InternalReviewService';
import { AdminPageWrapper } from '@/components/admin/AdminPageWrapper';
import { EmptyState } from '@/components/admin/EmptyState';
import { motion } from 'framer-motion';
import { Star, MessageSquare, Mail, Calendar, MapPin, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Admin Reviews Page - Dashboard des avis internes
 *
 * Fonctionnalités:
 * - Liste tous les avis internes (rating <= 3)
 * - Tri par date décroissante
 * - Indicateur "Nouveau" pour isRead=false
 * - Marquer comme lu
 * - Affiche: Note, Commentaire, Date, Table, Email
 */
export default function AdminReviewsPage() {
  const { user, loading: authLoading } = useAuth();
  const [reviews, setReviews] = useState<InternalReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const restaurantId = user?.restaurantId;

  // Charger les avis
  useEffect(() => {
    if (!restaurantId) return;

    const loadReviews = async () => {
      try {
        setLoading(true);
        const data = await InternalReviewService.getRestaurantReviews(restaurantId);
        setReviews(data);
      } catch (error) {
        console.error('[AdminReviews] Error loading:', error);
        toast.error('Erreur lors du chargement des avis');
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
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
            Avis Internes
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Feedback des clients ayant donné une note ≤ 3 étoiles
          </p>
          {unreadCount > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''} avis
              </span>
            </div>
          )}
        </div>

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
      </div>
    </AdminPageWrapper>
  );
}
