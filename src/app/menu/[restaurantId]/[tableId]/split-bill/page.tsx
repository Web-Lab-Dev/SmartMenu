// ========================================
// Split Bill Page
// ========================================
// Visual bill splitting interface

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SplitBillView } from '@/components/checkout/SplitBillView';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { OrderService } from '@/services/OrderService';
import { toast } from 'sonner';
import type { Order, SplitBillItem } from '@/types/schema';

export default function SplitBillPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.restaurantId as string;
  const tableId = params.tableId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLastOrder = async () => {
      try {
        // Get customer session ID from localStorage or generate one
        const sessionId = localStorage.getItem('customerSessionId') || 'demo-session';

        // Subscribe to table orders and get the most recent one
        const unsubscribe = OrderService.subscribeToTableOrders(
          restaurantId,
          tableId,
          sessionId,
          (orders) => {
            // Get the most recent served or ready order
            const recentOrder = orders
              .filter((o) => o.status === 'served' || o.status === 'ready')
              .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

            if (recentOrder) {
              setOrder(recentOrder as Order);
            } else {
              toast.error('Aucune commande à payer');
              router.push(`/menu/${restaurantId}/${tableId}`);
            }
            setLoading(false);
          }
        );

        return () => unsubscribe();
      } catch (error) {
        console.error('[Split Bill] Failed to load order:', error);
        toast.error('Erreur lors du chargement de la commande');
        setLoading(false);
      }
    };

    loadLastOrder();
  }, [restaurantId, tableId, router]);

  const handlePaymentClick = (amount: number, items: SplitBillItem[]) => {
    console.log('[Split Bill] Payment clicked:', { amount, items });

    // Store split bill data in sessionStorage for payment page
    sessionStorage.setItem(
      'split-bill-data',
      JSON.stringify({
        orderId: order?.id,
        amount,
        items: items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.selectedQuantity,
          unitPrice: item.unitPrice,
        })),
      })
    );

    // Navigate to feedback page (payment would happen here in real app)
    router.push(`/menu/${restaurantId}/${tableId}/feedback`);
    toast.success(`Paiement de ${amount.toLocaleString()} FCFA validé !`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Chargement de la commande..." />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-white text-lg mb-4">Aucune commande trouvée</p>
          <button
            onClick={() => router.push(`/menu/${restaurantId}/${tableId}`)}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg text-white font-medium transition-colors"
          >
            Retour au menu
          </button>
        </div>
      </div>
    );
  }

  return <SplitBillView order={order} onPaymentClick={handlePaymentClick} />;
}
