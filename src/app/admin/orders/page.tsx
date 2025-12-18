// ========================================
// KDS (Kitchen Display System) Page
// ========================================
// Real-time order management with Kanban board

'use client';

import { useAdminAuth } from '@/hooks/useAdminAuth';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import dynamic from 'next/dynamic';

// Lazy load GridKanbanBoard for compact view
const GridKanbanBoard = dynamic(
  () => import('@/components/admin/GridKanbanBoard').then((mod) => ({ default: mod.GridKanbanBoard })),
  {
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" text="Chargement du tableau..." />
      </div>
    ),
    ssr: false,
  }
);

export default function OrdersPage() {
  const { restaurantId, loading } = useAdminAuth();

  if (loading || !restaurantId) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" text="Chargement du KDS..." />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-12rem)]">
      <GridKanbanBoard restaurantId={restaurantId} />
    </div>
  );
}
