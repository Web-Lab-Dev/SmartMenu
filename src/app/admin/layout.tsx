// ========================================
// Admin Layout Wrapper
// ========================================

'use client';

import { AdminLayout } from '@/components/layout/AdminLayout';
import { AIAssistantPanel } from '@/components/admin/AIAssistantPanel';
import { WaiterCallsPanel } from '@/components/admin/WaiterCallsPanel';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useState, type ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const { restaurantId } = useAdminAuth();

  return (
    <>
      <AdminLayout
        onAIAssistantToggle={setIsAIAssistantOpen}
        isAIAssistantOpen={isAIAssistantOpen}
      >
        {children}
      </AdminLayout>

      {/* AI Assistant Panel */}
      <AIAssistantPanel
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
      />

      {/* Waiter Calls Notifications */}
      {restaurantId && <WaiterCallsPanel restaurantId={restaurantId} />}
    </>
  );
}
