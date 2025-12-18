// ========================================
// Admin Layout Wrapper
// ========================================

'use client';

import { AdminLayout } from '@/components/layout/AdminLayout';
import { AIAssistantPanel } from '@/components/admin/AIAssistantPanel';
import { useState, type ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);

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
    </>
  );
}
