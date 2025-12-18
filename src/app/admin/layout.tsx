// ========================================
// Admin Layout Wrapper
// ========================================

import { AdminLayout } from '@/components/layout/AdminLayout';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
