// ========================================
// Order Tracker Component
// ========================================
// Real-time order status tracking for customers

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OrderService } from '@/services/OrderService';
import type { Order } from '@/types/schema';
import { Clock, CheckCircle2, ChefHat, UtensilsCrossed, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';

interface OrderTrackerProps {
  restaurantId: string;
  tableId: string;
  customerSessionId: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Order Tracker Component
 * - Shows all orders for current customer session
 * - Real-time status updates from Firestore
 * - Visual progress indicator
 * - Collapsible/expandable
 */
export function OrderTracker({
  restaurantId,
  tableId,
  customerSessionId,
  isOpen,
  onClose,
}: OrderTrackerProps) {
  const [orders, setOrders] = useState<Order[]>([]);

  // Subscribe to table orders
  useEffect(() => {
    if (!restaurantId || !tableId || !customerSessionId) return;

    console.log('[OrderTracker Component] Subscribing to orders:', {
      restaurantId,
      tableId,
      customerSessionId,
    });

    const unsubscribe = OrderService.subscribeToTableOrders(
      restaurantId,
      tableId,
      customerSessionId,
      (fetchedOrders) => {
        console.log('[OrderTracker Component] Orders received:', fetchedOrders);
        setOrders(fetchedOrders as Order[]);
      }
    );

    return () => unsubscribe();
  }, [restaurantId, tableId, customerSessionId]);

  // Filter to only active orders (not served)
  const activeOrders = orders.filter((o) => o.status !== 'served' && o.status !== 'rejected');

  // Don't show if no orders at all
  if (orders.length === 0) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-orange-500 to-red-500">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-white" />
              <h3 className="font-semibold text-white">
                Mes Commandes ({activeOrders.length})
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Orders List */}
          <div className="max-h-96 overflow-y-auto">
            {activeOrders.length > 0 ? (
              activeOrders.map((order) => (
                <OrderStatusCard key={order.id} order={order} />
              ))
            ) : (
              <div className="p-8 text-center">
                <div className="text-5xl mb-4">✅</div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Toutes vos commandes sont servies !
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Bon appétit ! 🍽️
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface OrderStatusCardProps {
  order: Order;
}

function OrderStatusCard({ order }: OrderStatusCardProps) {
  const steps = [
    {
      id: 'pending_validation',
      label: 'En attente',
      icon: Clock,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      id: 'preparing',
      label: 'En préparation',
      icon: ChefHat,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      id: 'ready',
      label: 'Prêt !',
      icon: CheckCircle2,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === order.status);
  const isRejected = order.status === 'rejected';

  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
      {/* Order Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            Commande #{order.id.slice(0, 6)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatDistanceToNow(order.createdAt, {
              addSuffix: true,
              locale: fr,
            })}
          </p>
        </div>
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {formatCurrency(order.totalAmount)}
        </p>
      </div>

      {/* Rejected State */}
      {isRejected && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-3">
          <p className="text-sm font-medium text-red-900 dark:text-red-300">
            ⚠️ Commande refusée
          </p>
          {order.rejectionReason && (
            <p className="text-xs text-red-700 dark:text-red-400 mt-1">
              {order.rejectionReason}
            </p>
          )}
        </div>
      )}

      {/* Progress Steps */}
      {!isRejected && (
        <div className="flex items-center justify-between mb-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;

            return (
              <div key={step.id} className="flex items-center">
                {/* Step Circle */}
                <div className="flex flex-col items-center">
                  <motion.div
                    initial={false}
                    animate={{
                      scale: isCurrent ? 1.1 : 1,
                      backgroundColor: isActive
                        ? 'rgb(249, 115, 22)' // orange-500
                        : 'rgb(229, 231, 235)', // gray-200
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isActive ? 'shadow-lg' : ''
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isActive ? 'text-white' : 'text-gray-400'
                      }`}
                    />
                  </motion.div>
                  <p
                    className={`text-xs mt-1 font-medium ${
                      isActive
                        ? 'text-orange-600 dark:text-orange-400'
                        : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </p>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 h-0.5 mx-1 mb-6 transition-colors ${
                      index < currentStepIndex
                        ? 'bg-orange-500'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Items Summary */}
      <div className="space-y-1">
        {order.items.slice(0, 3).map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400"
          >
            <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-semibold shrink-0">
              {item.quantity}
            </span>
            <span className="truncate">{item.productName}</span>
          </div>
        ))}
        {order.items.length > 3 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
            +{order.items.length - 3} autre{order.items.length - 3 > 1 ? 's' : ''}...
          </p>
        )}
      </div>
    </div>
  );
}
