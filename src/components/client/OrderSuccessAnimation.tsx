'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

interface OrderSuccessAnimationProps {
  visible: boolean;
}

export function OrderSuccessAnimation({ visible }: OrderSuccessAnimationProps) {
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; delay: number }>>([]);

  useEffect(() => {
    if (visible) {
      // Generate random confetti particles
      const particles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100, // Random horizontal position (0-100%)
        delay: Math.random() * 0.5, // Random delay (0-0.5s)
      }));
      setConfetti(particles);
    } else {
      setConfetti([]);
    }
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md"
        >
          {/* Confetti Particles */}
          {confetti.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ y: '-10%', opacity: 1 }}
              animate={{
                y: '110vh',
                opacity: 0,
                rotate: Math.random() * 360,
              }}
              transition={{
                duration: 2 + Math.random(),
                delay: particle.delay,
                ease: 'easeIn',
              }}
              className="absolute top-0"
              style={{
                left: `${particle.x}%`,
              }}
            >
              <Sparkles
                className="w-4 h-4"
                style={{
                  color: ['#FFD700', '#FF4500', '#FF6B6B', '#4ECDC4', '#95E1D3'][
                    Math.floor(Math.random() * 5)
                  ],
                }}
                fill="currentColor"
              />
            </motion.div>
          ))}

          {/* Success Card */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 10 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 20,
            }}
            className="relative z-10 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 max-w-sm mx-4 text-center"
          >
            {/* Animated Check Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 0.2,
                type: 'spring',
                stiffness: 200,
                damping: 15,
              }}
              className="mb-6 flex justify-center"
            >
              <div className="relative">
                {/* Pulse Ring */}
                <motion.div
                  animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: 'var(--brand-color, #22c55e)' }}
                />

                {/* Check Icon */}
                <div
                  className="relative w-24 h-24 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--brand-color, #22c55e)' }}
                >
                  <CheckCircle2 className="w-14 h-14 text-white" strokeWidth={2.5} />
                </div>
              </div>
            </motion.div>

            {/* Success Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                C&apos;est noté !
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                La cuisine prépare vos plats.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Vous serez notifié quand votre commande sera prête
              </p>
            </motion.div>

            {/* Sparkle Decorations */}
            <motion.div
              animate={{
                rotate: [0, 360],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="absolute -top-4 -right-4"
            >
              <Sparkles className="w-8 h-8 text-yellow-400" fill="currentColor" />
            </motion.div>
            <motion.div
              animate={{
                rotate: [360, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="absolute -bottom-4 -left-4"
            >
              <Sparkles className="w-6 h-6 text-yellow-400" fill="currentColor" />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
