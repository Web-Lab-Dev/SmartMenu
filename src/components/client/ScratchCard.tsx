'use client';

import { useRef, useEffect, useState, TouchEvent, MouseEvent } from 'react';

interface ScratchCardProps {
  /**
   * Content to reveal under the scratch surface
   */
  children: React.ReactNode;

  /**
   * Percentage of surface that needs to be scratched to auto-reveal (0-100)
   * Default: 50
   */
  revealThreshold?: number;

  /**
   * Callback when card is fully revealed
   */
  onReveal?: () => void;

  /**
   * Width of the scratch brush
   * Default: 40
   */
  brushSize?: number;

  /**
   * Color of the scratch overlay
   * Default: '#C0C0C0' (silver)
   */
  overlayColor?: string;

  /**
   * Custom overlay image URL (optional, overrides overlayColor)
   */
  overlayImage?: string;

  /**
   * Text to display on the scratch surface
   */
  overlayText?: string;

  /**
   * Class name for the container
   */
  className?: string;
}

/**
 * ScratchCard Component
 *
 * A customizable scratch card component using HTML5 Canvas.
 * Supports both mouse and touch interactions.
 *
 * Features:
 * - Smooth scratching with configurable brush size
 * - Auto-reveal when threshold is reached
 * - Touch and mouse support
 * - Customizable overlay (color or image)
 * - Performance optimized with RAF
 *
 * @example
 * ```tsx
 * <ScratchCard
 *   overlayText="Grattez ici!"
 *   onReveal={() => console.log('Revealed!')}
 * >
 *   <div>YOU WON! 🎉</div>
 * </ScratchCard>
 * ```
 */
export function ScratchCard({
  children,
  revealThreshold = 50,
  onReveal,
  brushSize = 40,
  overlayColor = '#C0C0C0',
  overlayImage,
  overlayText = 'Grattez ici!',
  className = '',
}: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScratching, setIsScratching] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [scratchPercentage, setScratchPercentage] = useState(0);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Set canvas size to match container
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Draw overlay
    if (overlayImage) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        drawOverlayText(ctx, canvas);
      };
      img.src = overlayImage;
    } else {
      // Solid color overlay with gradient effect
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, overlayColor);
      gradient.addColorStop(0.5, lightenColor(overlayColor, 20));
      gradient.addColorStop(1, overlayColor);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawOverlayText(ctx, canvas);
    }
  }, [overlayColor, overlayImage, overlayText]);

  const drawOverlayText = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    if (!overlayText) return;

    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;
    ctx.fillText(overlayText, canvas.width / 2, canvas.height / 2);
    ctx.restore();
  };

  const scratch = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const canvasX = (x - rect.left) * scaleX;
    const canvasY = (y - rect.top) * scaleY;

    // Use destination-out to erase the overlay
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(canvasX, canvasY, brushSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // Check scratch percentage (throttled)
    requestAnimationFrame(() => checkScratchPercentage());
  };

  const checkScratchPercentage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    let transparentPixels = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] < 128) transparentPixels++;
    }

    const percentage = (transparentPixels / (pixels.length / 4)) * 100;
    setScratchPercentage(percentage);

    if (percentage >= revealThreshold && !isRevealed) {
      revealCard();
    }
  };

  const revealCard = () => {
    setIsRevealed(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Fade out animation
        let opacity = 1;
        const fadeOut = () => {
          opacity -= 0.1;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.globalAlpha = opacity;
          if (opacity > 0) {
            requestAnimationFrame(fadeOut);
          } else {
            canvas.style.display = 'none';
            onReveal?.();
          }
        };
        fadeOut();
      }
    }
  };

  // Mouse handlers
  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    setIsScratching(true);
    scratch(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!isScratching) return;
    scratch(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    setIsScratching(false);
  };

  // Touch handlers
  const handleTouchStart = (e: TouchEvent<HTMLCanvasElement>) => {
    setIsScratching(true);
    const touch = e.touches[0];
    scratch(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: TouchEvent<HTMLCanvasElement>) => {
    if (!isScratching) return;
    const touch = e.touches[0];
    scratch(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    setIsScratching(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ touchAction: 'none' }}
    >
      {/* Content to reveal */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>

      {/* Scratch overlay canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-pointer touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'none' }}
      />

      {/* Progress indicator (optional, for debugging) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          {scratchPercentage.toFixed(0)}%
        </div>
      )}
    </div>
  );
}

/**
 * Utility: Lighten a hex color
 */
function lightenColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
  const B = Math.min(255, (num & 0x0000ff) + amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}
