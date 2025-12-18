import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

/**
 * Loading spinner component with optional text
 * Used throughout the app for async operations
 */
export function LoadingSpinner({
  size = 'md',
  text,
  className
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  const spinnerSize = sizeClasses[size];

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-solid border-blue-600 border-t-transparent',
          spinnerSize
        )}
        role="status"
        aria-label="Chargement en cours"
      />
      {text && (
        <p className="text-sm text-gray-600 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}

/**
 * Full page loading spinner
 * Used for page-level loading states
 */
export function FullPageSpinner({ text }: { text?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <LoadingSpinner size="lg" text={text || "Chargement..."} />
    </div>
  );
}

/**
 * Inline loading spinner
 * Used for button loading states
 */
export function InlineSpinner() {
  return (
    <div
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-t-transparent"
      role="status"
      aria-label="Chargement"
    />
  );
}
