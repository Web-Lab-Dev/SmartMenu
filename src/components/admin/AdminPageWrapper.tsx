import { ReactNode } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface AdminPageWrapperProps {
  loading: boolean;
  children: ReactNode;
  loadingText?: string;
  emptyState?: ReactNode;
  isEmpty?: boolean;
}

/**
 * Wrapper component for admin pages that handles loading and empty states
 * Eliminates duplication of loading UI across admin pages
 */
export function AdminPageWrapper({
  loading,
  children,
  loadingText = 'Chargement...',
  emptyState,
  isEmpty = false,
}: AdminPageWrapperProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" text={loadingText} />
      </div>
    );
  }

  if (isEmpty && emptyState) {
    return <>{emptyState}</>;
  }

  return <>{children}</>;
}
