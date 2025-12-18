// ========================================
// ARStickerOverlay Component
// ========================================
// Canvas overlay transparent qui affiche les stickers AR suivant le visage

'use client';

import { useEffect, useRef } from 'react';
import type { FaceDetection, StickerType } from '@/hooks/useFaceTracking';

interface ARStickerOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  faceDetection: FaceDetection | null;
  stickerType: StickerType;
  className?: string;
}

/**
 * Overlay canvas qui affiche les stickers AR
 */
export function ARStickerOverlay({
  videoRef,
  faceDetection,
  stickerType,
  className,
}: ARStickerOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stickerImagesRef = useRef<{ [key: string]: HTMLImageElement }>({});

  // Précharger les images de stickers
  useEffect(() => {
    const images = {
      chef: new Image(),
      gourmand: new Image(),
    };

    images.chef.src = '/stickers/chef-hat.svg';
    images.gourmand.src = '/stickers/food-glasses.svg';

    // Attendre que les images soient chargées
    Promise.all([
      new Promise((resolve) => { images.chef.onload = resolve; }),
      new Promise((resolve) => { images.gourmand.onload = resolve; }),
    ]).then(() => {
      console.log('[ARSticker] ✅ Stickers loaded');
      stickerImagesRef.current = images;
    });
  }, []);

  // Dessiner les stickers sur le canvas
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current || !faceDetection || stickerType === 'none') {
      // Clear canvas
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Adapter la taille du canvas à la vidéo
    canvas.width = video.videoWidth || video.clientWidth;
    canvas.height = video.videoHeight || video.clientHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const { landmarks, detection } = faceDetection;
    const points = landmarks.positions;

    // Calcul des positions clés
    const nose = points[30]; // Nez
    const leftEye = points[36]; // Œil gauche
    const rightEye = points[45]; // Œil droit
    const topOfHead = points[19]; // Haut du crâne (approximatif)

    // Largeur du visage
    const faceWidth = detection.box.width;
    const faceHeight = detection.box.height;

    // === FILTRE CHEF (Toque) ===
    if (stickerType === 'chef' && stickerImagesRef.current.chef) {
      const hat = stickerImagesRef.current.chef;
      const hatWidth = faceWidth * 1.2; // 20% plus large que le visage
      const hatHeight = hatWidth * (hat.height / hat.width); // Aspect ratio

      // Position au-dessus de la tête
      const hatX = topOfHead.x - hatWidth / 2;
      const hatY = topOfHead.y - hatHeight * 0.8; // Un peu au-dessus

      ctx.save();
      ctx.drawImage(hat, hatX, hatY, hatWidth, hatHeight);
      ctx.restore();
    }

    // === FILTRE GOURMAND (Lunettes food) ===
    if (stickerType === 'gourmand' && stickerImagesRef.current.gourmand) {
      const glasses = stickerImagesRef.current.gourmand;

      // Distance entre les yeux
      const eyeDistance = Math.sqrt(
        Math.pow(rightEye.x - leftEye.x, 2) +
        Math.pow(rightEye.y - leftEye.y, 2)
      );

      const glassesWidth = eyeDistance * 2.2; // Largeur basée sur distance yeux
      const glassesHeight = glassesWidth * (glasses.height / glasses.width);

      // Centre entre les deux yeux
      const centerX = (leftEye.x + rightEye.x) / 2;
      const centerY = (leftEye.y + rightEye.y) / 2;

      // Angle de rotation (si le visage est penché)
      const angle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle);
      ctx.drawImage(
        glasses,
        -glassesWidth / 2,
        -glassesHeight / 2,
        glassesWidth,
        glassesHeight
      );
      ctx.restore();
    }
  }, [faceDetection, stickerType, videoRef]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        pointerEvents: 'none', // Ne pas bloquer les interactions
      }}
    />
  );
}
