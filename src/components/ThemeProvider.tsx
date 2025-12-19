// ========================================
// ThemeProvider Component
// ========================================
// Injects dynamic CSS variables based on restaurant branding

'use client';

import { useEffect } from 'react';
import type { RestaurantBranding } from '@/types/schema';

interface ThemeProviderProps {
  branding: RestaurantBranding;
  children: React.ReactNode;
}

/**
 * ThemeProvider - Injects CSS custom properties for dynamic theming
 *
 * Injects into :root:
 * - --brand-color: Primary color (buttons, accents)
 * - --brand-rgb: RGB values for opacity variations
 * - --brand-secondary: Secondary color (backgrounds, highlights)
 * - --brand-font: Font family
 * - --brand-radius: Border radius
 *
 * Usage:
 * ```tsx
 * <ThemeProvider branding={restaurant.branding}>
 *   <YourApp />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({ branding, children }: ThemeProviderProps) {
  useEffect(() => {
    // Extract branding values with fallbacks
    const primaryColor = branding.primaryColor || '#FF4500';
    const secondaryColor = branding.secondaryColor || '#FFF5F0';
    const fontFamily = branding.fontFamily || 'sans';
    const radius = branding.radius || 'md';

    // Convert hex to RGB for opacity variations
    const hexToRgb = (hex: string): string => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!result) return '255, 69, 0'; // Fallback

      return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
    };

    // Font family mapping
    const fontFamilyMap = {
      sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
      mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    };

    // Radius mapping (in pixels for easier CSS usage)
    const radiusMap = {
      none: '0px',
      sm: '6px',
      md: '8px',
      full: '9999px',
    };

    // Inject CSS variables into :root
    const root = document.documentElement;
    root.style.setProperty('--brand-color', primaryColor);
    root.style.setProperty('--brand-rgb', hexToRgb(primaryColor));
    root.style.setProperty('--brand-secondary', secondaryColor);
    root.style.setProperty('--brand-font', fontFamilyMap[fontFamily]);
    root.style.setProperty('--brand-radius', radiusMap[radius]);

    // Dark theme backgrounds
    root.style.setProperty('--background', '#121212');
    root.style.setProperty('--background-surface', '#1E1E1E');
    root.style.setProperty('--text-primary', '#FFFFFF');
    root.style.setProperty('--text-secondary', '#A0A0A0');

    // Cleanup on unmount (reset to defaults)
    return () => {
      root.style.removeProperty('--brand-color');
      root.style.removeProperty('--brand-rgb');
      root.style.removeProperty('--brand-secondary');
      root.style.removeProperty('--brand-font');
      root.style.removeProperty('--brand-radius');
    };
  }, [branding]);

  return <>{children}</>;
}
