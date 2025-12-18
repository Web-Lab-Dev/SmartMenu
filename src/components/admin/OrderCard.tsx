// ========================================
// Order Card Component for KDS
// ========================================
// Displays order information in Kitchen Display System

'use client';

import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Order } from '@/types/schema';
import { Clock, MessageSquare, Check, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';

interface OrderCardProps {
  order: Order;
  isDragging?: boolean;
  onStatusChange?: (orderId: string, newStatus: string) => Promise<void>;
}

/**
 * Order Card for KDS display
 * - Large table number
 * - Relative time indicator
 * - List of items with quantities
 * - Customer notes
 * - Color-coded by status
 * - Action buttons for status transitions
 */
export function OrderCard({ order, isDragging = false, onStatusChange }: OrderCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const isOld = Date.now() - order.createdAt.getTime() > 5 * 60 * 1000; // > 5 minutes
  const isPending = order.status === 'pending_validation';

  const handleStatusChange = async (newStatus: string) => {
    if (!onStatusChange || isProcessing) return;

    setIsProcessing(true);
    try {
      await onStatusChange(order.id, newStatus);
    } catch (error) {
      console.error('[OrderCard] Status change failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Status colors
  const statusColors = {
    pending_validation: 'border-red-500 bg-red-500/10',
    preparing: 'border-yellow-500 bg-yellow-500/10',
    ready: 'border-green-500 bg-green-500/10',
    served: 'border-gray-600 bg-gray-800/50',
    rejected: 'border-gray-600 bg-gray-800/50',
  };

  return (
    <div
      className={`
        bg-gray-800 rounded-lg border-2 p-4 transition-all
        ${statusColors[order.status]}
        ${isDragging ? 'opacity-50 rotate-2 scale-105' : 'hover:shadow-xl'}
        ${isOld && isPending ? 'animate-pulse' : ''}
      `}
    >
      {/* Header: Table + Time */}
      <div className="flex items-start justify-between mb-3">
        {/* Table Number - LARGE */}
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white">
              {order.tableLabelString || `Table ${order.tableId}`}
            </span>
            {isOld && isPending && (
              <span className="text-red-400 text-sm font-semibold animate-pulse">
                URGENT
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Commande #{order.id.slice(0, 6)}
          </p>
        </div>

        {/* Timer */}
        <div className="text-right">
          <div className="flex items-center gap-1 text-gray-300">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">
              {formatDistanceToNow(order.createdAt, {
                addSuffix: true,
                locale: fr,
              })}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {order.createdAt.toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-700 my-3" />

      {/* Items List */}
      <div className="space-y-2">
        {order.items.map((item, index) => (
          <div key={index} className="flex items-start gap-2">
            <span className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
              {item.quantity}
            </span>
            <div className="flex-1">
              <p className="text-white font-medium">{item.productName}</p>
              {item.options && item.options.length > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {item.options.map((opt) => `${opt.name}: ${opt.value}`).join(', ')}
                </p>
              )}
              {item.specialInstructions && (
                <p className="text-xs text-yellow-400 italic mt-1">
                  ⚠️ {item.specialInstructions}
                </p>
              )}
            </div>
            <span className="text-sm text-gray-400 flex-shrink-0">
              {formatCurrency(item.unitPrice * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      {/* Customer Note */}
      {order.customerNote && (
        <div className="mt-3 p-2 bg-gray-900 rounded border border-gray-700">
          <div className="flex items-start gap-2">
            <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-300 italic">{order.customerNote}</p>
          </div>
        </div>
      )}

      {/* Footer: Total + Action Buttons */}
      <div className="mt-3 pt-3 border-t border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-400 text-sm">Total</span>
          <span className="text-lg font-bold text-white">
            {formatCurrency(order.totalAmount)}
          </span>
        </div>

        {/* Action Buttons */}
        {onStatusChange && (
          <>
            {order.status === 'pending_validation' && (
              <button
                onClick={() => handleStatusChange('preparing')}
                disabled={isProcessing}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                {isProcessing ? 'Acceptation...' : 'Accepter la commande'}
              </button>
            )}

            {order.status === 'preparing' && (
              <button
                onClick={() => handleStatusChange('ready')}
                disabled={isProcessing}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-5 h-5" />
                {isProcessing ? 'Traitement...' : 'Marquer Prêt'}
              </button>
            )}

            {order.status === 'ready' && (
              <button
                onClick={() => handleStatusChange('served')}
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                {isProcessing ? 'Traitement...' : 'Marquer Servi'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
