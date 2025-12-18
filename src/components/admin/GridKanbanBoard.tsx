// ========================================
// Grid Kanban Board Component for KDS
// ========================================
// Compact grid layout with multiple cards per row

'use client';

import { useState, useEffect, useRef, useMemo, memo } from 'react';
import type { Order, OrderStatus } from '@/types/schema';
import { CompactOrderCard } from './CompactOrderCard';
import { OrderService } from '@/services/OrderService';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';

interface GridKanbanBoardProps {
  restaurantId: string;
}

interface Column {
  id: OrderStatus;
  title: string;
  orders: Order[];
  color: string;
}

/**
 * Grid Kanban Board with Compact Cards
 * - 2-3 cards per row in each column
 * - Sorted by urgency (oldest first)
 * - Fixed max height with internal scroll
 * - Real-time Firestore subscription
 */
function GridKanbanBoardComponent({ restaurantId }: GridKanbanBoardProps) {
  const [columns, setColumns] = useState<Column[]>([
    { id: 'pending_validation', title: 'À Faire', orders: [], color: 'red' },
    { id: 'preparing', title: 'En Préparation', orders: [], color: 'yellow' },
    { id: 'ready', title: 'Prêt / Servi', orders: [], color: 'green' },
  ]);

  const previousOrderCountRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Subscribe to orders
  useEffect(() => {
    console.log('[GridKDS] Subscribing to restaurant orders:', restaurantId);

    const unsubscribe = OrderService.subscribeToRestaurantOrders(
      restaurantId,
      (fetchedOrders) => {
        const orders = fetchedOrders as Order[];
        console.log('[GridKDS] Received orders update:', orders.length);

        // Play sound if new order arrived in pending_validation
        const pendingOrders = orders.filter(
          (o) => o.status === 'pending_validation'
        );
        if (pendingOrders.length > previousOrderCountRef.current) {
          playNotificationSound();
        }
        previousOrderCountRef.current = pendingOrders.length;

        // Sort orders by createdAt (oldest first = most urgent)
        const sortedOrders = [...orders].sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        );

        // Group orders by status
        setColumns([
          {
            id: 'pending_validation',
            title: 'À Faire',
            orders: sortedOrders.filter((o) => o.status === 'pending_validation'),
            color: 'red',
          },
          {
            id: 'preparing',
            title: 'En Préparation',
            orders: sortedOrders.filter((o) => o.status === 'preparing'),
            color: 'yellow',
          },
          {
            id: 'ready',
            title: 'Prêt / Servi',
            orders: sortedOrders.filter((o) => o.status === 'ready' || o.status === 'served'),
            color: 'green',
          },
        ]);
      }
    );

    return () => unsubscribe();
  }, [restaurantId]);

  // Initialize audio
  useEffect(() => {
    if (typeof window !== 'undefined' && !audioRef.current) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      audioRef.current = {
        play: () => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.frequency.value = 800;
          oscillator.type = 'sine';

          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.currentTime + 0.5
          );

          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.5);
        },
      } as any;
    }
  }, []);

  const playNotificationSound = () => {
    try {
      audioRef.current?.play();
      console.log('[GridKDS] Played notification sound');
    } catch (error) {
      console.error('[GridKDS] Failed to play sound:', error);
    }
  };

  // Handle status change via buttons
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await OrderService.updateOrderStatus(orderId, newStatus);
      toast.success('Commande mise à jour');
    } catch (error) {
      console.error('[GridKDS] Failed to update order:', error);
      toast.error('Erreur lors de la mise à jour');
      throw error;
    }
  };

  return (
    <div className="grid grid-cols-3 gap-4 h-full">
      {columns.map((column) => (
        <div
          key={column.id}
          className="flex flex-col bg-gray-900 rounded-lg p-4 border-2 border-gray-800"
        >
          {/* Column Header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              {column.title}
              <span
                className={`
                  px-2 py-0.5 rounded-full text-xs font-bold
                  ${column.color === 'red' ? 'bg-red-500 text-white' : ''}
                  ${column.color === 'yellow' ? 'bg-yellow-500 text-black' : ''}
                  ${column.color === 'green' ? 'bg-green-500 text-white' : ''}
                `}
              >
                {column.orders.length}
              </span>
            </h3>

            {/* Warning for old orders */}
            {column.id === 'pending_validation' &&
              column.orders.some(
                (o) => Date.now() - o.createdAt.getTime() > 5 * 60 * 1000
              ) && (
                <AlertCircle className="w-5 h-5 text-red-500 animate-pulse" />
              )}
          </div>

          {/* Orders Grid - Fixed height with scroll */}
          <div className="flex-1 overflow-y-auto max-h-[calc(100vh-250px)]">
            {column.orders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-sm">Aucune commande</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {column.orders.map((order) => (
                  <CompactOrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Export memoized version for performance
export const GridKanbanBoard = memo(GridKanbanBoardComponent);
