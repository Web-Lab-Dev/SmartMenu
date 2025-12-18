// ========================================
// Kanban Board Component for KDS
// ========================================
// Drag & drop board with 3 columns for order statuses

'use client';

import { useState, useEffect, useRef, useMemo, memo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { Order, OrderStatus } from '@/types/schema';
import { OrderCard } from './OrderCard';
import { OrderService } from '@/services/OrderService';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';

interface KanbanBoardProps {
  restaurantId: string;
}

interface Column {
  id: OrderStatus;
  title: string;
  orders: Order[];
  color: string;
}

/**
 * Kanban Board with drag & drop for orders
 * - 3 columns: Incoming, Preparing, Ready/Served
 * - Real-time Firestore subscription
 * - Optimistic UI updates
 * - Audio alert for new orders
 * - Memoized for performance
 */
function KanbanBoardComponent({ restaurantId }: KanbanBoardProps) {
  const [columns, setColumns] = useState<Column[]>([
    { id: 'pending_validation', title: 'À Faire', orders: [], color: 'red' },
    { id: 'preparing', title: 'En Préparation', orders: [], color: 'yellow' },
    { id: 'ready', title: 'Prêt / Servi', orders: [], color: 'green' },
  ]);

  const previousOrderCountRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Subscribe to orders
  useEffect(() => {
    console.log('[KDS] Subscribing to restaurant orders:', restaurantId);

    const unsubscribe = OrderService.subscribeToRestaurantOrders(
      restaurantId,
      (fetchedOrders) => {
        const orders = fetchedOrders as Order[];
        console.log('[KDS] Received orders update:', orders.length);

        // Play sound if new order arrived in pending_validation
        const pendingOrders = orders.filter(
          (o) => o.status === 'pending_validation'
        );
        if (pendingOrders.length > previousOrderCountRef.current) {
          playNotificationSound();
        }
        previousOrderCountRef.current = pendingOrders.length;

        // Group orders by status
        setColumns([
          {
            id: 'pending_validation',
            title: 'À Faire',
            orders: orders.filter((o) => o.status === 'pending_validation'),
            color: 'red',
          },
          {
            id: 'preparing',
            title: 'En Préparation',
            orders: orders.filter((o) => o.status === 'preparing'),
            color: 'yellow',
          },
          {
            id: 'ready',
            title: 'Prêt / Servi',
            orders: orders.filter((o) => o.status === 'ready' || o.status === 'served'),
            color: 'green',
          },
        ]);
      }
    );

    return () => unsubscribe();
  }, [restaurantId]);

  // Initialize audio
  useEffect(() => {
    // Create simple beep sound using Web Audio API
    if (typeof window !== 'undefined' && !audioRef.current) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // We'll play sound programmatically instead of using an audio element
      audioRef.current = {
        play: () => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.frequency.value = 800; // Hz
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
      console.log('[KDS] Played notification sound');
    } catch (error) {
      console.error('[KDS] Failed to play sound:', error);
    }
  };

  // Memoize handleDragEnd to prevent re-creation on every render
  const handleDragEnd = useMemo(() => async (result: any) => {
    const { source, destination, draggableId } = result;

    // Dropped outside the list
    if (!destination) return;

    // Dropped in same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceColumnId = source.droppableId as OrderStatus;
    const destColumnId = destination.droppableId as OrderStatus;

    // Can't move to "ready" column (only preparing -> ready is allowed via button)
    if (destColumnId === 'ready' && sourceColumnId !== 'preparing') {
      toast.error('Vous ne pouvez déplacer que depuis "En Préparation" vers "Prêt"');
      return;
    }

    // Optimistic UI update
    setColumns((prevColumns) => {
      const newColumns = [...prevColumns];
      const sourceColumn = newColumns.find((col) => col.id === sourceColumnId);
      const destColumn = newColumns.find((col) => col.id === destColumnId);

      if (!sourceColumn || !destColumn) return prevColumns;

      const [movedOrder] = sourceColumn.orders.splice(source.index, 1);
      if (!movedOrder) return prevColumns;

      destColumn.orders.splice(destination.index, 0, movedOrder);

      return newColumns;
    });

    // Update in Firestore
    try {
      await OrderService.updateOrderStatus(draggableId, destColumnId);
      toast.success('Commande mise à jour');
    } catch (error) {
      console.error('[KDS] Failed to update order:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  }, []);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-3 gap-6 h-full">
        {columns.map((column) => (
          <Droppable key={column.id} droppableId={column.id}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`
                  flex flex-col bg-gray-900 rounded-lg p-4 border-2 transition-colors
                  ${snapshot.isDraggingOver ? 'border-orange-500 bg-gray-800' : 'border-gray-800'}
                `}
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

                {/* Orders List */}
                <div className="flex-1 overflow-y-auto space-y-3">
                  {column.orders.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-sm">Aucune commande</p>
                    </div>
                  ) : (
                    column.orders.map((order, index) => (
                      <Draggable key={order.id} draggableId={order.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <OrderCard order={order} isDragging={snapshot.isDragging} />
                          </div>
                        )}
                      </Draggable>
                    ))
                  )}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}

// Export memoized version for performance
export const KanbanBoard = memo(KanbanBoardComponent);
