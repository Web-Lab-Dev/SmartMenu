// ========================================
// Admin Feedback Page
// ========================================
// View customer feedback (internal/negative reviews)

'use client';

import { useEffect, useState } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { FeedbackService } from '@/services/FeedbackService';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Star, MessageSquare, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import type { Feedback } from '@/types/schema';
import { formatRelativeTime } from '@/lib/utils';

export default function FeedbackPage() {
  const { restaurantId, loading: authLoading } = useAdminAuth();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    average: number;
    distribution: Record<number, number>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeedback = async () => {
      if (!restaurantId) return;

      try {
        // Get negative feedback only (rating <= 3)
        const negativeFeedback = await FeedbackService.getNegativeFeedback(restaurantId);
        setFeedback(negativeFeedback);

        // Get stats
        const feedbackStats = await FeedbackService.getFeedbackStats(restaurantId);
        setStats(feedbackStats);
      } catch (error) {
        console.error('[Admin Feedback] Failed to load feedback:', error);
        toast.error('Erreur lors du chargement des avis');
      } finally {
        setLoading(false);
      }
    };

    loadFeedback();
  }, [restaurantId]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" text="Chargement des avis..." />
      </div>
    );
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-orange-500 text-orange-500' : 'text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Avis Clients</h2>
        <p className="text-gray-400">
          Feedback interne des clients ayant donné une note de 3 ou moins
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Feedback */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-2">Total des avis</p>
                <p className="text-3xl font-bold text-white">{stats.total}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10">
                <MessageSquare className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </div>

          {/* Average Rating */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-2">Note moyenne</p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold text-white">
                    {stats.average.toFixed(1)}
                  </p>
                  <Star className="w-6 h-6 fill-orange-500 text-orange-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Negative Feedback Count */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-2">Avis négatifs</p>
                <p className="text-3xl font-bold text-red-400">{feedback.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-red-500/10">
                <TrendingDown className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Avis à traiter</h3>

        {feedback.length === 0 ? (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Aucun avis négatif récent</p>
            <p className="text-sm text-gray-500 mt-2">
              C'est une bonne nouvelle ! Continuez comme ça.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedback.map((item) => (
              <div
                key={item.id}
                className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    {renderStars(item.rating)}
                    <p className="text-xs text-gray-500 mt-1">
                      {formatRelativeTime(item.createdAt)}
                    </p>
                  </div>
                  <div className="px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
                    <span className="text-red-400 text-xs font-semibold">
                      {item.rating}/5
                    </span>
                  </div>
                </div>

                {item.message && (
                  <div className="bg-gray-900 rounded-lg p-4">
                    <p className="text-gray-300 italic">"{item.message}"</p>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between text-xs text-gray-500">
                  <span>Commande #{item.orderId.slice(0, 8)}</span>
                  <span>Session #{item.customerSessionId.slice(0, 8)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Distribution Chart */}
      {stats && stats.total > 0 && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Répartition des notes
          </h3>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center gap-4">
                <div className="flex items-center gap-1 w-20">
                  {renderStars(rating)}
                </div>
                <div className="flex-1">
                  <div className="w-full bg-gray-900 rounded-full h-6 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        rating >= 4
                          ? 'bg-green-500'
                          : rating === 3
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{
                        width: `${((stats.distribution[rating] || 0) / stats.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="text-sm text-gray-400 w-16 text-right">
                  {stats.distribution[rating] || 0} avis
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
