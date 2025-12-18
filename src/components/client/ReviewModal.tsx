// ========================================
// ReviewModal Component - Smart Review System
// ========================================
// Pare-feu d'avis intelligent :
// - Rating >= 4 : Redirige vers Google Maps
// - Rating <= 3 : Collecte feedback interne
// - Maximise la e-réputation

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, ExternalLink, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantName: string;
  restaurantId: string;
  tableId: string;
  googleReviewUrl?: string; // Lien Google Maps pour avis
  onSubmitInternalReview?: (review: {
    rating: number;
    comment: string;
    email?: string;
  }) => Promise<void>;
}

type Step = 'rating' | 'positive' | 'negative';

/**
 * ReviewModal - Système de pare-feu d'avis
 *
 * Flow:
 * 1. Demande la notation (1-5 étoiles)
 * 2. Si >= 4 : Confettis + Redirection Google
 * 3. Si <= 3 : Formulaire feedback interne
 */
export function ReviewModal({
  isOpen,
  onClose,
  restaurantName,
  restaurantId,
  tableId,
  googleReviewUrl,
  onSubmitInternalReview
}: ReviewModalProps) {
  const [step, setStep] = useState<Step>('rating');
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset modal au close
  const handleClose = () => {
    setStep('rating');
    setRating(0);
    setHoveredRating(0);
    setComment('');
    setEmail('');
    onClose();
  };

  // Sélection de la note
  const handleRatingClick = (value: number) => {
    setRating(value);

    // Petit délai pour l'animation
    setTimeout(() => {
      if (value >= 4) {
        // Client content : Confettis !
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        setStep('positive');
      } else {
        // Client mécontent : Feedback interne
        setStep('negative');
      }
    }, 300);
  };

  // Redirection vers Google Maps
  const handleGoogleReview = () => {
    if (googleReviewUrl) {
      window.open(googleReviewUrl, '_blank');
      toast.success('Merci pour votre soutien ! 🙏');
      handleClose();
    } else {
      toast.error('Lien Google Maps non configuré');
    }
  };

  // Soumission avis interne
  const handleInternalSubmit = async () => {
    if (!comment.trim()) {
      toast.error('Veuillez nous dire ce qui n\'a pas été');
      return;
    }

    setIsSubmitting(true);

    try {
      if (onSubmitInternalReview) {
        await onSubmitInternalReview({
          rating,
          comment: comment.trim(),
          email: email.trim() || undefined,
        });
      }

      toast.success('Merci pour votre retour. Nous allons nous améliorer ! 💪');
      handleClose();
    } catch (error) {
      console.error('[ReviewModal] Error submitting:', error);
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md glass-panel rounded-3xl shadow-2xl p-6 z-10"
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          </button>

          {/* Étape 1 : Rating */}
          {step === 'rating' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Que pensez-vous de votre expérience ?
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
                Chez {restaurantName}
              </p>

              {/* Stars */}
              <div className="flex justify-center gap-2 mb-8">
                {[1, 2, 3, 4, 5].map((value) => (
                  <motion.button
                    key={value}
                    onClick={() => handleRatingClick(value)}
                    onMouseEnter={() => setHoveredRating(value)}
                    onMouseLeave={() => setHoveredRating(0)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-12 h-12 transition-all ${
                        value <= (hoveredRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  </motion.button>
                ))}
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Cliquez sur une étoile pour noter
              </p>
            </motion.div>
          )}

          {/* Étape 2 : Positive (>= 4 étoiles) */}
          {step === 'positive' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-center"
            >
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Génial ! Merci !
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Votre soutien est précieux pour notre équipe.
              </p>

              {/* Rating affiché */}
              <div className="flex justify-center gap-1 mb-6">
                {[1, 2, 3, 4, 5].map((value) => (
                  <Star
                    key={value}
                    className={`w-6 h-6 ${
                      value <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>

              {googleReviewUrl ? (
                <>
                  <button
                    onClick={handleGoogleReview}
                    className="w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 mb-3 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    style={{ backgroundColor: 'var(--brand-color, #FF4500)' }}
                  >
                    <ExternalLink className="w-5 h-5" />
                    Poster sur Google
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    Cela prend 10 secondes et aide énormément notre équipe en cuisine ! 🙏
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-500 mb-4">
                  Lien Google Maps non configuré
                </p>
              )}

              <button
                onClick={handleClose}
                className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Non merci
              </button>
            </motion.div>
          )}

          {/* Étape 3 : Negative (<= 3 étoiles) */}
          {step === 'negative' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-center"
            >
              <div className="text-6xl mb-4">😔</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Désolé que tout ne se soit pas passé comme prévu
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Aidez-nous à nous améliorer en nous disant ce qui n'a pas été.
              </p>

              {/* Rating affiché */}
              <div className="flex justify-center gap-1 mb-6">
                {[1, 2, 3, 4, 5].map((value) => (
                  <Star
                    key={value}
                    className={`w-6 h-6 ${
                      value <= rating
                        ? 'fill-orange-400 text-orange-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>

              {/* Formulaire interne */}
              <div className="space-y-4 mb-6 text-left">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Qu'est-ce qui n'a pas été ? *
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Dites-nous tout..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email (optionnel)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Pour qu'on vous recontacte"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <button
                onClick={handleInternalSubmit}
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--brand-color, #FF4500)' }}
              >
                <MessageSquare className="w-5 h-5" />
                {isSubmitting ? 'Envoi...' : 'Envoyer au Gérant'}
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
