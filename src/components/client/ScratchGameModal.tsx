'use client';

import { useState, useEffect } from 'react';
import { ScratchCard } from './ScratchCard';
import { Gift, X, Sparkles, PartyPopper, Frown } from 'lucide-react';
import { toast } from 'sonner';
import type { Coupon } from '@/types/schema';
import { logger } from '@/lib/logger';

interface ScratchGameModalProps {
  /**
   * Campaign ID for the scratch game
   */
  campaignId: string;

  /**
   * Restaurant ID
   */
  restaurantId: string;

  /**
   * Restaurant name for dynamic title
   */
  restaurantName: string;

  /**
   * Callback when modal is closed
   */
  onClose: () => void;

  /**
   * Callback when game is completed (won or lost)
   */
  onComplete?: (result: { won: boolean; coupon?: Coupon }) => void;
}

interface GameResult {
  won: boolean;
  coupon?: Coupon;
  message: string;
}

/**
 * ScratchGameModal Component
 *
 * Interactive scratch card game modal for promotional campaigns.
 *
 * Features:
 * - Auto-fetches result from API on mount
 * - Smooth scratch card interaction
 * - Win/lose animations
 * - Automatic coupon saving to localStorage
 * - Beautiful UI with glassmorphism
 *
 * Flow:
 * 1. Modal opens
 * 2. API call generates coupon (win/lose)
 * 3. User scratches card
 * 4. Result is revealed with animation
 * 5. If won, coupon is saved to localStorage
 *
 * @example
 * ```tsx
 * <ScratchGameModal
 *   campaignId="campaign-123"
 *   restaurantId="resto-456"
 *   onClose={() => setShowGame(false)}
 * />
 * ```
 */
export function ScratchGameModal({
  campaignId,
  restaurantId,
  restaurantName,
  onClose,
  onComplete,
}: ScratchGameModalProps) {
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRevealed, setIsRevealed] = useState(false);
  const [deviceId, setDeviceId] = useState<string>('');

  // Get or create device ID
  useEffect(() => {
    const getDeviceId = () => {
      if (typeof window === 'undefined') return 'server-device';

      const STORAGE_KEY = 'deviceId';
      let id = localStorage.getItem(STORAGE_KEY);

      if (!id) {
        id = `device-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
        localStorage.setItem(STORAGE_KEY, id);
      }

      return id;
    };

    setDeviceId(getDeviceId());
  }, []);

  // Fetch game result on mount
  useEffect(() => {
    if (!deviceId) return;

    const fetchGameResult = async () => {
      try {
        setLoading(true);
        logger.log('[ScratchGame] Fetching result...', { campaignId, restaurantId, deviceId });

        const response = await fetch('/api/campaign/generate-coupon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaignId,
            restaurantId,
            deviceId,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erreur lors de la génération du coupon');
        }

        const result: GameResult = await response.json();
        logger.log('[ScratchGame] Result:', result);

        setGameResult(result);

        // Save coupon to localStorage if won
        if (result.won && result.coupon) {
          saveCouponToLocalStorage(result.coupon);
        }
      } catch (error) {
        logger.error('[ScratchGame] Error:', error);
        toast.error(error instanceof Error ? error.message : 'Erreur lors du chargement du jeu');
        onClose();
      } finally {
        setLoading(false);
      }
    };

    fetchGameResult();
  }, [campaignId, restaurantId, deviceId, onClose]);

  const saveCouponToLocalStorage = (coupon: Coupon) => {
    try {
      const STORAGE_KEY = 'saved_coupons';
      const existing = localStorage.getItem(STORAGE_KEY);
      const coupons: Coupon[] = existing ? JSON.parse(existing) : [];

      // Add new coupon
      coupons.push(coupon);

      // Save back to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(coupons));
      logger.log('[ScratchGame] Coupon saved to localStorage', coupon);
    } catch (error) {
      logger.error('[ScratchGame] Failed to save coupon:', error);
    }
  };

  const handleReveal = () => {
    setIsRevealed(true);
    onComplete?.(gameResult!);

    // Auto-close after delay - 15 seconds pour laisser le temps de copier
    setTimeout(() => {
      onClose();
    }, 15000);
  };

  const handleClose = () => {
    if (!isRevealed) {
      if (!confirm('Êtes-vous sûr de vouloir quitter sans gratter la carte?')) {
        return;
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      {/* Modal Container */}
      <div className="relative w-full max-w-md mx-4 animate-scale-in">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          aria-label="Fermer"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        {/* Loading State */}
        {loading && (
          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            <p className="text-white text-lg font-semibold">Préparation de votre jeu...</p>
          </div>
        )}

        {/* Game Card */}
        {!loading && gameResult && (
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-center">
              <Gift className="w-12 h-12 mx-auto mb-2 text-white" />
              <h2 className="text-2xl font-bold text-white">Tombola {restaurantName}</h2>
              <p className="text-white/90 text-sm mt-1">Grattez pour découvrir votre surprise!</p>
            </div>

            {/* Scratch Card */}
            <div className="p-6">
              <ScratchCard
                overlayText="✨ Grattez ici! ✨"
                overlayColor="#FFD700"
                brushSize={50}
                revealThreshold={60}
                onReveal={handleReveal}
                className="w-full h-64 rounded-xl shadow-lg"
              >
                {/* Win Result */}
                {gameResult.won && gameResult.coupon ? (
                  <div className="w-full h-full bg-gradient-to-br from-green-500 to-emerald-600 flex flex-col items-center justify-center p-6 text-center animate-bounce-in">
                    <PartyPopper className="w-20 h-20 text-white mb-4 animate-wiggle" />
                    <h3 className="text-3xl font-bold text-white mb-2">BRAVO! 🎉</h3>
                    <p className="text-white/90 mb-4">Vous avez gagné:</p>
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 mb-3">
                      <p className="text-xl font-bold text-white">
                        {gameResult.coupon.discountDescription}
                      </p>
                    </div>
                    <div className="bg-white/30 backdrop-blur-sm rounded-lg px-4 py-2 mb-3">
                      <p className="text-sm text-white/80">Code:</p>
                      <p className="text-2xl font-mono font-bold text-white tracking-wider">
                        {gameResult.coupon.code}
                      </p>
                    </div>
                    <p className="text-sm text-white/80">
                      Valable jusqu'au{' '}
                      {new Date(gameResult.coupon.validUntil).toLocaleDateString('fr-FR')}
                    </p>
                    <Sparkles className="w-8 h-8 text-yellow-300 mt-3 animate-pulse" />
                  </div>
                ) : (
                  /* Lose Result */
                  <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-700 flex flex-col items-center justify-center p-6 text-center">
                    <Frown className="w-16 h-16 text-white/80 mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">Pas de chance!</h3>
                    <p className="text-white/80 mb-3">
                      Ce n'est pas pour cette fois...
                    </p>
                    <p className="text-white/60 text-sm">
                      Retentez votre chance lors de votre prochaine visite!
                    </p>
                    <div className="mt-4 text-white/40 text-xs">
                      Merci de votre participation
                    </div>
                  </div>
                )}
              </ScratchCard>
            </div>

            {/* Footer Hint */}
            {!isRevealed && (
              <div className="px-6 pb-6 text-center">
                <p className="text-gray-400 text-sm animate-pulse">
                  👆 Glissez votre doigt pour gratter...
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
