'use client';

import { Toaster as SonnerToaster } from 'sonner';

/**
 * Toast notification component using Sonner
 * Pre-configured with app-wide styling and defaults
 *
 * Usage in components:
 * ```tsx
 * import { toast } from 'sonner';
 *
 * toast.success('Commande créée avec succès !');
 * toast.error('Une erreur est survenue');
 * toast.loading('Envoi en cours...');
 * toast.info('Information importante');
 * ```
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      expand={false}
      richColors
      closeButton
      duration={4000}
      toastOptions={{
        style: {
          fontFamily: 'var(--font-geist-sans)',
        },
        classNames: {
          toast: 'rounded-lg shadow-lg',
          title: 'text-sm font-medium',
          description: 'text-sm',
          actionButton: 'bg-blue-600 text-white hover:bg-blue-700',
          cancelButton: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
          closeButton: 'bg-white hover:bg-gray-100 border border-gray-200',
        },
      }}
    />
  );
}
