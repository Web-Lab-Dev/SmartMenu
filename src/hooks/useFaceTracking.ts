// ========================================
// useFaceTracking Hook - AR Face Detection
// ========================================
// Détecte les visages et landmarks en temps réel avec face-api.js

import { useEffect, useState, useRef } from 'react';
import * as faceapi from 'face-api.js';

export type StickerType = 'none' | 'chef' | 'gourmand';

export interface FaceDetection {
  landmarks: faceapi.FaceLandmarks68;
  detection: faceapi.FaceDetection;
}

interface UseFaceTrackingOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  enabled: boolean;
  stickerType: StickerType;
}

/**
 * Hook pour le face tracking AR
 */
export function useFaceTracking({ videoRef, enabled, stickerType }: UseFaceTrackingOptions) {
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [faceDetection, setFaceDetection] = useState<FaceDetection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const detectionIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Charger les modèles face-api
  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Charger les modèles depuis le dossier public
        const MODEL_URL = '/face-models';

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
        ]);

        console.log('[FaceTracking] ✅ Models loaded successfully');
        setIsReady(true);
      } catch (err) {
        console.error('[FaceTracking] ❌ Failed to load models:', err);
        setError('Impossible de charger les filtres AR');
      } finally {
        setIsLoading(false);
      }
    };

    loadModels();
  }, []);

  // Boucle de détection
  useEffect(() => {
    if (!isReady || !enabled || !videoRef.current || stickerType === 'none') {
      setFaceDetection(null);
      return;
    }

    const video = videoRef.current;

    const detect = async () => {
      try {
        if (video.readyState !== 4) return;

        // Détection avec TinyFaceDetector (plus rapide pour mobile)
        const detection = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({
            inputSize: 224,
            scoreThreshold: 0.5,
          }))
          .withFaceLandmarks(true);

        if (detection) {
          setFaceDetection(detection);
        } else {
          setFaceDetection(null);
        }
      } catch (err) {
        console.warn('[FaceTracking] Detection error:', err);
      }
    };

    // Détecter toutes les 100ms (10 FPS pour économiser les ressources)
    detectionIntervalRef.current = setInterval(detect, 100);

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isReady, enabled, videoRef, stickerType]);

  return {
    isLoading,
    isReady,
    faceDetection,
    error,
  };
}
