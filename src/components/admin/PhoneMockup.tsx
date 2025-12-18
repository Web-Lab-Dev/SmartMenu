// ========================================
// PhoneMockup Component
// ========================================
// Realistic iPhone mockup for live branding preview

'use client';

import Image from 'next/image';
import { Bell, ShoppingBag, Search } from 'lucide-react';
import type { RestaurantBranding } from '@/types/schema';

interface PhoneMockupProps {
  restaurantName: string;
  branding: RestaurantBranding;
}

/**
 * iPhone mockup with live preview
 * Shows real-time branding changes (colors, fonts, logo, cover)
 */
export default function PhoneMockup({ restaurantName, branding }: PhoneMockupProps) {
  // Extract branding values with defaults
  const primaryColor = branding.primaryColor || '#FF4500';
  const logoUrl = branding.logoUrl || branding.logo;
  const coverUrl = branding.coverUrl || branding.coverImage;
  const fontFamily = branding.fontFamily || 'sans';
  const radius = branding.radius || 'md';

  // Font family mapping
  const fontFamilyMap = {
    sans: 'ui-sans-serif, system-ui, sans-serif',
    serif: 'ui-serif, Georgia, serif',
    mono: 'ui-monospace, monospace',
  };

  // Radius mapping
  const radiusMap = {
    none: '0px',
    sm: '6px',
    md: '8px',
    full: '9999px',
  };

  const selectedFont = fontFamilyMap[fontFamily];
  const selectedRadius = radiusMap[radius];

  return (
    <div className="relative w-full h-full flex items-center justify-center p-8">
      {/* iPhone Frame */}
      <div className="relative" style={{ width: '375px', height: '812px' }}>
        {/* iPhone Body (Bezel) */}
        <div className="absolute inset-0 bg-gray-900 rounded-[60px] shadow-2xl p-3">
          {/* Screen */}
          <div className="relative w-full h-full bg-white rounded-[48px] overflow-hidden" style={{ fontFamily: selectedFont }}>
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-gray-900 rounded-b-3xl z-50" />

            {/* Status Bar Icons */}
            <div className="absolute top-0 left-0 right-0 h-12 z-40 flex items-center justify-between px-8 pt-2">
              <span className="text-xs font-semibold text-gray-900">9:41</span>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
                <svg className="w-3 h-3 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="absolute inset-0 overflow-y-auto pt-12 bg-gradient-to-b from-gray-50 to-white">
              {/* Sticky Header with Glassmorphism */}
              <div className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-gray-200/50">
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    {/* Logo & Name */}
                    <div className="flex items-center gap-2.5">
                      {logoUrl ? (
                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white ring-2 ring-gray-200">
                          <Image
                            src={logoUrl}
                            alt={restaurantName}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {restaurantName[0]}
                        </div>
                      )}
                      <div>
                        <h1 className="font-bold text-sm text-gray-900">
                          {restaurantName}
                        </h1>
                        <p className="text-[10px] text-gray-500">Table 12</p>
                      </div>
                    </div>

                    {/* Call Waiter Button */}
                    <button
                      className="flex items-center gap-1.5 px-3 py-1.5 backdrop-blur-md bg-white/70 border border-gray-200/50"
                      style={{
                        borderRadius: selectedRadius,
                        color: primaryColor,
                      }}
                    >
                      <Bell size={14} />
                      <span className="text-xs font-medium">Appeler</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Cover Image (Hero) */}
              {coverUrl && (
                <div className="relative w-full h-36 bg-gray-200">
                  <Image
                    src={coverUrl}
                    alt="Cover"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
              )}

              {/* Search Bar */}
              <div className="px-4 py-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un plat..."
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-100 text-sm border-0 outline-none"
                    style={{ borderRadius: selectedRadius }}
                    disabled
                  />
                </div>
              </div>

              {/* Category Pills */}
              <div className="px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
                {['Tous', 'Entrées', 'Plats', 'Desserts'].map((cat, idx) => (
                  <button
                    key={cat}
                    className="px-4 py-1.5 text-xs font-medium whitespace-nowrap"
                    style={{
                      backgroundColor: idx === 0 ? primaryColor : 'transparent',
                      color: idx === 0 ? 'white' : '#6B7280',
                      borderRadius: selectedRadius,
                      border: idx === 0 ? 'none' : '1px solid #E5E7EB',
                    }}
                    disabled
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Sample Product Cards */}
              <div className="px-4 space-y-3 pb-24">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white border border-gray-200 overflow-hidden shadow-sm"
                    style={{ borderRadius: selectedRadius }}
                  >
                    <div className="flex gap-3 p-3">
                      {/* Product Image */}
                      <div
                        className="w-20 h-20 bg-gray-200 shrink-0"
                        style={{ borderRadius: selectedRadius }}
                      />
                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-gray-900 mb-0.5">
                          Plat Exemple {i}
                        </h3>
                        <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                          Description courte du plat avec quelques détails
                        </p>
                        <div className="flex items-center justify-between">
                          <span
                            className="font-bold text-sm"
                            style={{ color: primaryColor }}
                          >
                            2,500 FCFA
                          </span>
                          <button
                            className="px-3 py-1.5 text-xs font-medium text-white"
                            style={{
                              backgroundColor: primaryColor,
                              borderRadius: selectedRadius,
                            }}
                            disabled
                          >
                            Ajouter
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating Cart Button (FAB) */}
            <div className="absolute bottom-6 right-4 z-50">
              <button
                className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white relative"
                style={{ backgroundColor: primaryColor }}
                disabled
              >
                <ShoppingBag size={22} />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  3
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white rounded-full opacity-50" />
      </div>

      {/* Label */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-center">
        <p className="text-xs text-gray-400">Aperçu iPhone</p>
      </div>
    </div>
  );
}
