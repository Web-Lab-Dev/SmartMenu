// ========================================
// Waiter Calls Panel Component
// ========================================
// Displays pending waiter call requests from customers

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, X } from 'lucide-react';
import { WaiterCallService, type WaiterCall } from '@/services/WaiterCallService';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface WaiterCallsPanelProps {
  restaurantId: string;
}

export function WaiterCallsPanel({ restaurantId }: WaiterCallsPanelProps) {
  const [calls, setCalls] = useState<WaiterCall[]>([]);

  useEffect(() => {
    console.log('[WaiterCallsPanel] Component mounted with restaurantId:', restaurantId);

    if (!restaurantId) {
      console.warn('[WaiterCallsPanel] No restaurantId provided, skipping subscription');
      return;
    }

    console.log('[WaiterCallsPanel] Setting up subscription for restaurantId:', restaurantId);

    const unsubscribe = WaiterCallService.subscribeToRestaurantCalls(
      restaurantId,
      (updatedCalls) => {
        console.log('[WaiterCallsPanel] Received calls update:', updatedCalls);
        setCalls(updatedCalls);
      }
    );

    return () => {
      console.log('[WaiterCallsPanel] Unsubscribing from calls');
      unsubscribe();
    };
  }, [restaurantId]);

  const handleAcknowledge = async (callId: string) => {
    try {
      await WaiterCallService.acknowledgeCall(callId);
    } catch (error) {
      console.error('[WaiterCallsPanel] Error acknowledging call:', error);
    }
  };

  const handleComplete = async (callId: string) => {
    try {
      await WaiterCallService.completeCall(callId);
    } catch (error) {
      console.error('[WaiterCallsPanel] Error completing call:', error);
    }
  };

  // Debugging logs
  useEffect(() => {
    console.log('[WaiterCallsPanel] Rendering with calls count:', calls.length);
  }, [calls.length]);

  if (calls.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 w-80">
      <AnimatePresence>
        {calls.map((call) => (
          <motion.div
            key={call.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            className={`
              mb-3 p-4 rounded-xl shadow-2xl border-2
              ${
                call.status === 'pending'
                  ? 'bg-red-500/10 border-red-500 animate-pulse'
                  : 'bg-yellow-500/10 border-yellow-500'
              }
            `}
          >
            <div className="flex items-start gap-3">
              <div
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0
                  ${call.status === 'pending' ? 'bg-red-500' : 'bg-yellow-500'}
                `}
              >
                <Bell className="w-6 h-6 text-white animate-bounce" />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-bold text-white mb-1">
                  {call.tableLabelString}
                </h4>
                <p className="text-sm text-gray-300">
                  {call.status === 'pending' ? 'Appel en attente' : 'En cours'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDistanceToNow(call.createdAt, {
                    addSuffix: true,
                    locale: fr,
                  })}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {call.status === 'pending' && (
                  <button
                    onClick={() => handleAcknowledge(call.id)}
                    className="p-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors"
                    title="Pris en compte"
                  >
                    <Check className="w-5 h-5 text-white" />
                  </button>
                )}
                <button
                  onClick={() => handleComplete(call.id)}
                  className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                  title="Terminé"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
