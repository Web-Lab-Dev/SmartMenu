// ========================================
// Compact Order Card Component for KDS Grid View
// ========================================
// Ultra-compact card for high-density KDS display

'use client';

import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Order } from '@/types/schema';
import { Clock, Check, ArrowRight, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface CompactOrderCardProps {
  order: Order;
  onStatusChange?: (orderId: string, newStatus: string) => Promise<void>;
}

/**
 * Compact Order Card for Grid KDS
 * - Minimal design for high density
 * - Shows: Table, Timer, Item count, Action button
 * - Color-coded borders
 * - Urgent indicator for old orders
 */
export function CompactOrderCard({ order, onStatusChange }: CompactOrderCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const isOld = Date.now() - order.createdAt.getTime() > 5 * 60 * 1000; // > 5 minutes
  const isPending = order.status === 'pending_validation';

  const handleStatusChange = async (newStatus: string) => {
    if (!onStatusChange || isProcessing) return;

    setIsProcessing(true);
    try {
      await onStatusChange(order.id, newStatus);
    } catch (error) {
      console.error('[CompactOrderCard] Status change failed:', error);
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

  // Get button config based on status
  const getActionButton = () => {
    switch (order.status) {
      case 'pending_validation':
        return {
          label: 'Accepter',
          icon: Check,
          onClick: () => handleStatusChange('preparing'),
          className: 'bg-green-600 hover:bg-green-700',
        };
      case 'preparing':
        return {
          label: 'Prêt',
          icon: ArrowRight,
          onClick: () => handleStatusChange('ready'),
          className: 'bg-orange-600 hover:bg-orange-700',
        };
      case 'ready':
        return {
          label: 'Servi',
          icon: Check,
          onClick: () => handleStatusChange('served'),
          className: 'bg-blue-600 hover:bg-blue-700',
        };
      default:
        return null;
    }
  };

  const actionButton = getActionButton();
  const ActionIcon = actionButton?.icon;

  return (
    <div
      className={`
        bg-gray-800 rounded-lg border-2 p-3 transition-all hover:shadow-lg
        ${statusColors[order.status]}
        ${isOld && isPending ? 'ring-2 ring-red-500 animate-pulse' : ''}
      `}
    >
      {/* Header: Table + Timer */}
      <div className="flex items-center justify-between mb-2">
        {/* Table Number */}
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-white">
            {order.tableLabelString || `T${order.tableId}`}
          </span>
          {isOld && isPending && (
            <AlertCircle className="w-4 h-4 text-red-400 animate-pulse" />
          )}
        </div>

        {/* Timer */}
        <div className="flex items-center gap-1 text-xs text-gray-300">
          <Clock className="w-3 h-3" />
          <span className={isOld ? 'text-red-400 font-bold' : ''}>
            {formatDistanceToNow(order.createdAt, {
              addSuffix: false,
              locale: fr,
            }).replace('environ ', '')}
          </span>
        </div>
      </div>

      {/* Items Summary - Compact */}
      <div className="mb-2 max-h-16 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
        {order.items.map((item, index) => (
          <div key={index} className="flex items-center gap-1 text-xs text-gray-300">
            <span className="w-4 h-4 rounded-full bg-gray-700 flex items-center justify-center text-[10px] font-semibold shrink-0">
              {item.quantity}
            </span>
            <span className="truncate">{item.productName}</span>
          </div>
        ))}
      </div>

      {/* Action Button - Compact */}
      {actionButton && onStatusChange && (
        <button
          onClick={actionButton.onClick}
          disabled={isProcessing}
          className={`
            w-full ${actionButton.className} text-white font-semibold py-2 px-3 rounded
            transition-colors disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center gap-1.5 text-sm
          `}
        >
          {ActionIcon && <ActionIcon className="w-4 h-4" />}
          {isProcessing ? '...' : actionButton.label}
        </button>
      )}
    </div>
  );
}
