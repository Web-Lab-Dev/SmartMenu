// ========================================
// Feedback Flow Component
// ========================================
// Conditional feedback flow with star rating

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ExternalLink, MessageSquare, Copy, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { FeedbackService } from '@/services/FeedbackService';

interface FeedbackFlowProps {
  restaurantId: string;
  orderId: string;
  customerSessionId: string;
  restaurantName: string;
  googleMapsUrl?: string;
  onComplete: (rating: number) => void;
}

export function FeedbackFlow({
  restaurantId,
  orderId,
  customerSessionId,
  restaurantName,
  googleMapsUrl,
  onComplete,
}: FeedbackFlowProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [showBranchA, setShowBranchA] = useState(false); // Rating >= 4
  const [showBranchB, setShowBranchB] = useState(false); // Rating <= 3
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleStarClick = async (value: number) => {
    setRating(value);

    // Trigger confetti for high ratings
    if (value >= 4) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f97316', '#ef4444', '#fbbf24'],
      });

      setTimeout(() => setShowBranchA(true), 500);
    } else {
      // Show feedback form for low ratings
      setTimeout(() => setShowBranchB(true), 300);
    }
  };

  const handleGoogleReview = () => {
    const reviewText = `Super expérience chez ${restaurantName} ! Je recommande.`;

    // Copy review text to clipboard
    navigator.clipboard.writeText(reviewText);
    setCopied(true);
    toast.success('Avis copié dans le presse-papiers !');

    // Open Google Maps review
    if (googleMapsUrl) {
      window.open(googleMapsUrl, '_blank');
    } else {
      // Fallback: Google search for restaurant
      window.open(
        `https://www.google.com/search?q=${encodeURIComponent(restaurantName + ' avis')}`,
        '_blank'
      );
    }

    setTimeout(() => {
      onComplete(rating);
    }, 1000);
  };

  const handleInternalFeedback = async () => {
    if (!feedbackMessage.trim()) {
      toast.error('Veuillez entrer un commentaire');
      return;
    }

    setIsSubmitting(true);

    try {
      await FeedbackService.submitFeedback({
        restaurantId,
        orderId,
        customerSessionId,
        rating,
        message: feedbackMessage,
      });

      toast.success('Merci pour votre retour !');
      setTimeout(() => {
        onComplete(rating);
      }, 1000);
    } catch (error) {
      console.error('[Feedback] Failed to submit:', error);
      toast.error('Erreur lors de l\'envoi du feedback');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {/* Star Rating Screen */}
          {!showBranchA && !showBranchB && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <h2 className="text-3xl font-bold text-white mb-2">
                Comment c'était ?
              </h2>
              <p className="text-gray-400 mb-8">
                Votre avis nous aide à nous améliorer
              </p>

              {/* Star Rating */}
              <div className="flex justify-center gap-4 mb-8">
                {[1, 2, 3, 4, 5].map((value) => (
                  <motion.button
                    key={value}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleStarClick(value)}
                    onMouseEnter={() => setHoverRating(value)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-12 h-12 transition-all ${
                        value <= (hoverRating || rating)
                          ? 'fill-orange-500 text-orange-500'
                          : 'text-gray-600'
                      }`}
                    />
                  </motion.button>
                ))}
              </div>

              <p className="text-sm text-gray-500">
                Cliquez sur les étoiles pour noter
              </p>
            </motion.div>
          )}

          {/* Branch A: High Rating (>= 4 stars) */}
          {showBranchA && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <Star className="w-10 h-10 text-white fill-white" />
              </motion.div>

              <h2 className="text-3xl font-bold text-white mb-4">
                Génial ! 🎉
              </h2>
              <p className="text-gray-300 mb-8">
                Aidez-nous en partageant votre expérience sur Google
              </p>

              <div className="space-y-4">
                <button
                  onClick={handleGoogleReview}
                  className="w-full py-4 px-6 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/50"
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5" />
                      Avis copié ! Aller sur Google
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      Copier mon avis & aller sur Google Maps
                    </>
                  )}
                  <ExternalLink className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onComplete(rating)}
                  className="w-full py-3 text-gray-400 hover:text-white transition-colors"
                >
                  Passer cette étape
                </button>
              </div>
            </motion.div>
          )}

          {/* Branch B: Low Rating (<= 3 stars) */}
          {showBranchB && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-10 h-10 text-gray-400" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">
                Mince, désolé...
              </h2>
              <p className="text-gray-400 mb-6">
                Dites-nous ce qui n'a pas été
              </p>

              <textarea
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                placeholder="Qu'est-ce qui n'a pas fonctionné ?"
                rows={5}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none mb-6"
              />

              <button
                onClick={handleInternalFeedback}
                disabled={isSubmitting || !feedbackMessage.trim()}
                className="w-full py-4 px-6 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 disabled:text-gray-500 rounded-xl text-white font-semibold transition-all shadow-lg"
              >
                {isSubmitting ? 'Envoi...' : 'Envoyer mon feedback'}
              </button>

              <p className="text-xs text-gray-500 mt-4">
                Votre avis restera privé et nous aidera à améliorer notre service
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
