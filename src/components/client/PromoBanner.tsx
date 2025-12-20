// ========================================
// PromoBanner Component
// ========================================
// Sticky banner for active Happy Hour / timed promotions

'use client';

import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Sparkles } from 'lucide-react';
import type { Campaign } from '@/types/schema';

interface PromoBannerProps {
  campaign: Campaign;
  timeRemaining: number | null; // milliseconds
  onClose?: () => void;
}

/**
 * Sticky banner at top of page showing active promotion
 * - Festive orange gradient background
 * - Promotion message
 * - Countdown if ending in < 1 hour
 * - Close button (hides until page refresh)
 * - Memoized for performance
 */
function PromoBannerComponent({ campaign, timeRemaining, onClose }: PromoBannerProps) {
  const [isClosed, setIsClosed] = useState(false);
  const [countdown, setCountdown] = useState(timeRemaining || 0);

  // ⚡ PERF: Update countdown with requestAnimationFrame instead of setInterval
  useEffect(() => {
    if (!timeRemaining || timeRemaining > 3600000) {
      // Not ending soon (> 1 hour)
      return;
    }

    setCountdown(timeRemaining);

    let rafId: number;
    let lastUpdate = Date.now();

    const updateCountdown = () => {
      const now = Date.now();
      const elapsed = now - lastUpdate;

      // Update every ~1000ms
      if (elapsed >= 1000) {
        lastUpdate = now;
        setCountdown((prev) => {
          const next = prev - elapsed;
          if (next <= 0) {
            return 0;
          }
          return next;
        });
      }

      // Schedule next frame if countdown not finished
      setCountdown((prev) => {
        if (prev > 0) {
          rafId = requestAnimationFrame(updateCountdown);
        }
        return prev;
      });
    };

    rafId = requestAnimationFrame(updateCountdown);

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [timeRemaining]);

  const handleClose = () => {
    setIsClosed(true);
    onClose?.();
  };

  // Format countdown
  const formatCountdown = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    }

    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
  };

  const showCountdown = timeRemaining && timeRemaining <= 3600000; // Show if < 1 hour

  return (
    <AnimatePresence>
      {!isClosed && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="sticky top-0 z-50 w-full"
        >
          <div
            className="relative overflow-hidden px-4 py-3 shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #FF7D29 0%, #FF5722 100%)',
            }}
          >
            {/* Animated background pulse */}
            <motion.div
              className="absolute inset-0 bg-white/10"
              animate={{
                opacity: [0.1, 0.2, 0.1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Content */}
            <div className="relative flex items-center justify-center gap-3">
              {/* Sparkles icon */}
              <Sparkles className="w-5 h-5 text-white flex-shrink-0" />

              {/* Banner text */}
              <p className="text-white font-bold text-center flex-1 text-sm md:text-base">
                {campaign.bannerText || campaign.name}
              </p>

              {/* Countdown (if ending soon) */}
              {showCountdown && countdown > 0 && (
                <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-full">
                  <Clock className="w-4 h-4 text-white" />
                  <span className="text-white font-mono font-bold text-sm">
                    {formatCountdown(countdown)}
                  </span>
                </div>
              )}

              {/* Close button */}
              <button
                onClick={handleClose}
                className="flex-shrink-0 w-6 h-6 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center transition-colors"
                aria-label="Fermer"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ⚡ PERF: Export memoized version to prevent unnecessary re-renders
export const PromoBanner = memo(PromoBannerComponent);
