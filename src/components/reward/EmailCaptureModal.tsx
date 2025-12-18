// ========================================
// Email Capture Modal
// ========================================
// Modal to capture customer email for reward

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Loader2, X } from 'lucide-react';
import { CustomerService } from '@/services/CustomerService';
import { toast } from 'sonner';

interface EmailCaptureModalProps {
  isOpen: boolean;
  reward: string;
  restaurantId: string;
  orderId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function EmailCaptureModal({
  isOpen,
  reward,
  restaurantId,
  orderId,
  onClose,
  onSuccess,
}: EmailCaptureModalProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Veuillez entrer votre email');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Email invalide');
      return;
    }

    setIsSubmitting(true);

    try {
      await CustomerService.saveCustomerEmail({
        restaurantId,
        email,
        orderId,
        rewardClaimed: reward,
        visitDate: new Date(),
      });

      toast.success('Récompense sauvegardée ! 🎉');
      onSuccess();
    } catch (error) {
      console.error('[Email Capture] Failed to save email:', error);
      toast.error('Erreur lors de la sauvegarde');
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-gray-900 rounded-2xl border border-gray-800 p-6 w-full max-w-md relative"
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>

              {/* Icon */}
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-white" />
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-white text-center mb-2">
                Sauvegardez votre gain
              </h2>
              <p className="text-gray-400 text-center mb-6">
                Entrez votre email pour recevoir votre récompense :
              </p>

              {/* Reward Display */}
              <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-lg p-4 mb-6">
                <p className="text-center text-orange-400 font-semibold text-lg">
                  {reward}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Votre email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemple@email.com"
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-700 disabled:to-gray-700 rounded-lg text-white font-semibold transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    'Sauvegarder ma récompense'
                  )}
                </button>
              </form>

              {/* Privacy note */}
              <p className="text-xs text-gray-500 text-center mt-4">
                Votre email sera utilisé uniquement pour vous envoyer votre récompense
                et des offres exclusives du restaurant
              </p>

              {/* Skip button */}
              <button
                onClick={onClose}
                className="w-full mt-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
              >
                Passer cette étape
              </button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
