// ========================================
// Reward Page
// ========================================
// Scratch card reward page

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ScratchCard } from '@/components/client/ScratchCard';
import { EmailCaptureModal } from '@/components/reward/EmailCaptureModal';
import { Home } from 'lucide-react';

export default function RewardPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.restaurantId as string;
  const tableId = params.tableId as string;

  const [isRevealed, setIsRevealed] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailCaptured, setEmailCaptured] = useState(false);

  // Get order ID from session storage
  const splitBillData = typeof window !== 'undefined'
    ? sessionStorage.getItem('split-bill-data')
    : null;

  const orderId = splitBillData
    ? JSON.parse(splitBillData).orderId
    : 'demo-order-id';

  // Available rewards (in real app, this would come from restaurant config)
  const rewards = [
    '1 Café offert à votre prochaine visite !',
    '-10% sur votre prochaine commande',
    '1 Dessert offert',
    'Apéritif maison offert',
  ];

  // Randomly select a reward
  const reward = rewards[Math.floor(Math.random() * rewards.length)] || rewards[0] || '-10% sur votre prochaine commande';

  const handleRevealed = () => {
    setIsRevealed(true);
    setTimeout(() => {
      setShowEmailModal(true);
    }, 1000);
  };

  const handleEmailSuccess = () => {
    setShowEmailModal(false);
    setEmailCaptured(true);
  };

  const handleReturnHome = () => {
    // Clear session storage
    sessionStorage.removeItem('split-bill-data');
    router.push(`/menu/${restaurantId}/${tableId}`);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">
            Une dernière surprise ! 🎁
          </h1>
          <p className="text-gray-400">
            Grattez la carte pour découvrir votre récompense
          </p>
        </motion.div>

        {/* Scratch Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <ScratchCard
            overlayText="Grattez pour découvrir votre récompense!"
            onReveal={handleRevealed}
            overlayColor="#1f2937"
          >
            <div className="p-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl text-center min-h-[300px] flex flex-col items-center justify-center">
              <div className="text-6xl mb-4">🎁</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Félicitations !
              </h2>
              <p className="text-xl text-gray-800 font-semibold">
                {reward}
              </p>
            </div>
          </ScratchCard>
        </motion.div>

        {/* Success Message */}
        {emailCaptured && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center"
          >
            <p className="text-green-400 font-semibold mb-2">
              ✓ Récompense sauvegardée !
            </p>
            <p className="text-sm text-gray-400">
              Vous recevrez un email de confirmation avec les détails
            </p>
          </motion.div>
        )}

        {/* Return to Menu Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: isRevealed ? 1 : 0 }}
          transition={{ delay: isRevealed ? 1.5 : 0 }}
          onClick={handleReturnHome}
          className="w-full mt-8 py-4 px-6 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all"
        >
          <Home className="w-5 h-5" />
          Retour au menu
        </motion.button>
      </div>

      {/* Email Capture Modal */}
      <EmailCaptureModal
        isOpen={showEmailModal}
        reward={reward || ''}
        restaurantId={restaurantId}
        orderId={orderId || 'demo-order'}
        onClose={() => setShowEmailModal(false)}
        onSuccess={handleEmailSuccess}
      />
    </div>
  );
}
