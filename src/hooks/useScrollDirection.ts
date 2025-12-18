'use client';

import { useEffect, useState, useRef } from 'react';

export type ScrollDirection = 'up' | 'down' | null;

interface UseScrollDirectionOptions {
  threshold?: number; // Minimum scroll distance to trigger direction change
}

/**
 * Hook to detect scroll direction
 * Used for hiding/showing FAB and other UI elements based on scroll
 *
 * @param options - Configuration options
 * @param options.threshold - Minimum scroll distance to trigger (default: 10px)
 * @returns Current scroll direction ('up' | 'down' | null)
 *
 * @example
 * ```tsx
 * const scrollDirection = useScrollDirection({ threshold: 10 });
 *
 * // Hide FAB when scrolling down
 * <FloatingCartButton
 *   className={scrollDirection === 'down' ? 'translate-y-full' : 'translate-y-0'}
 * />
 * ```
 */
export function useScrollDirection({
  threshold = 10,
}: UseScrollDirectionOptions = {}): ScrollDirection {
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>(null);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const updateScrollDirection = () => {
      const scrollY = window.scrollY;

      // Check if scroll distance exceeds threshold
      if (Math.abs(scrollY - lastScrollY.current) < threshold) {
        ticking.current = false;
        return;
      }

      // Determine direction
      const newDirection: ScrollDirection = scrollY > lastScrollY.current ? 'down' : 'up';

      // Only update if direction changed
      if (newDirection !== scrollDirection) {
        setScrollDirection(newDirection);
      }

      lastScrollY.current = scrollY > 0 ? scrollY : 0;
      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        // Use requestAnimationFrame for 60fps performance
        window.requestAnimationFrame(updateScrollDirection);
        ticking.current = true;
      }
    };

    // Initialize last scroll position
    lastScrollY.current = window.scrollY;

    // Add scroll listener
    window.addEventListener('scroll', onScroll, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, [scrollDirection, threshold]);

  return scrollDirection;
}
