// ========================================
// SocialCamera Component - NATIVE IMPLEMENTATION
// ========================================
// Caméra native plein écran avec getUserMedia (no libraries)
// Qualité HD professionnelle avec templates viraux

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Download, Share2, RotateCw } from 'lucide-react';
import { toast } from 'sonner';
import {
  generateSocialImage,
  downloadImage,
  shareImage,
  type TemplateType,
} from '@/lib/social-image-generator';

interface SocialCameraProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantName: string;
  restaurantLogo?: string;
  menuUrl: string;
  primaryColor?: string;
}

type CSSFilter = 'natural' | 'vintage-warm' | 'neon-cool' | 'bw-chic';

const TEMPLATES: { id: TemplateType; label: string; emoji: string }[] = [
  { id: 'receipt', label: 'Receipt', emoji: '🧾' },
  { id: 'passport', label: 'Passport', emoji: '✈️' },
];

/**
 * FILTRES COLORIMÉTRIQUES
 * Chaque filtre combine correction de luminosité + style artistique
 * IMPORTANT: Ces mêmes valeurs CSS doivent être appliquées sur <video> (preview) et Canvas (capture)
 */
const CSS_FILTERS: { id: CSSFilter; label: string; css: string; icon: string }[] = [
  {
    id: 'natural',
    label: 'Naturel',
    css: 'brightness(120%) contrast(110%)',
    icon: '☀️',
  },
  {
    id: 'vintage-warm',
    label: 'Vintage',
    css: 'sepia(30%) brightness(115%) contrast(120%) saturate(110%) hue-rotate(-10deg)',
    icon: '🎞️',
  },
  {
    id: 'neon-cool',
    label: 'Néon',
    css: 'brightness(110%) contrast(125%) saturate(130%) hue-rotate(15deg)',
    icon: '🌃',
  },
  {
    id: 'bw-chic',
    label: 'N&B Chic',
    css: 'grayscale(100%) brightness(115%) contrast(130%)',
    icon: '🎬',
  },
];

export function SocialCamera({
  isOpen,
  onClose,
  restaurantName,
  restaurantLogo,
  menuUrl,
  primaryColor,
}: SocialCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('receipt');
  const [selectedFilter, setSelectedFilter] = useState<CSSFilter>('natural');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // Debug mode activé seulement en développement
  const isDebugMode = process.env.NODE_ENV === 'development';

  // Helper pour ajouter des logs visibles dans l'UI
  const addDebugLog = useCallback((message: string) => {
    if (!isDebugMode) return;
    setDebugLogs((prev) => [...prev.slice(-20), `[${new Date().toLocaleTimeString()}] ${message}`]);
  }, [isDebugMode]);

  // Initialiser la caméra avec getUserMedia (NATIVE)
  const initCamera = useCallback(async () => {
    setIsLoading(true);
    setCameraError(null);

    try {
      // Arrêter le stream précédent s'il existe
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Calculer le ratio exact de l'écran pour éviter le zoom
      const screenAspectRatio = window.outerHeight / window.outerWidth;

      // Contraintes NATIVE pour qualité maximale
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode,
          // Utilise le ratio exact de l'écran
          aspectRatio: { ideal: screenAspectRatio },
          // Demande la meilleure résolution possible
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Attendre que la vidéo soit prête
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => resolve();
          }
        });

        setIsLoading(false);
      }
    } catch (error) {
      console.error('[Camera] Error:', error);
      setIsLoading(false);

      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setCameraError('Accès caméra refusé. Veuillez autoriser l\'accès dans les paramètres.');
        } else if (error.name === 'NotFoundError') {
          setCameraError('Aucune caméra détectée sur cet appareil.');
        } else {
          setCameraError(`Erreur caméra: ${error.message}`);
        }
      } else {
        setCameraError('Impossible d\'accéder à la caméra.');
      }
    }
  }, [facingMode]);

  // Initialiser au montage et quand facingMode change
  useEffect(() => {
    if (isOpen) {
      initCamera();
    }

    return () => {
      // Nettoyer le stream au démontage
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, initCamera]);

  // Capture photo NATIVE HD
  const capturePhoto = useCallback(async () => {
    addDebugLog('═══ CAPTURE DÉMARRÉ ═══');
    addDebugLog(`Template: ${selectedTemplate}`);
    addDebugLog(`Restaurant: ${restaurantName}`);
    addDebugLog(`Menu URL: ${menuUrl}`);

    const video = videoRef.current;
    if (!video || !streamRef.current) {
      addDebugLog('❌ Caméra non initialisée');
      toast.error('Caméra non initialisée');
      return;
    }

    // Créer canvas à la résolution NATIVE HD
    const canvas = document.createElement('canvas');
    const width = video.videoWidth || 1920;
    const height = video.videoHeight || 1080;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      toast.error('Erreur canvas');
      return;
    }

    try {
      // 1. Récupérer le filtre CSS sélectionné
      const filter = CSS_FILTERS.find((f) => f.id === selectedFilter);
      addDebugLog(`Filtre sélectionné: ${filter?.label} (${filter?.css})`);

      // 2. Capturer la frame vidéo avec effet miroir pour selfie
      if (facingMode === 'user') {
        // Mode miroir pour selfie (correspond à la preview)
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -width, 0, width, height);
        ctx.restore();
      } else {
        // Mode normal pour caméra arrière
        ctx.drawImage(video, 0, 0, width, height);
      }

      // 3. Appliquer le filtre CSS (qui intègre déjà la correction de luminosité)
      // IMPORTANT: Même filtre que la preview vidéo pour cohérence visuelle
      if (filter) {
        const filterCanvas = document.createElement('canvas');
        filterCanvas.width = width;
        filterCanvas.height = height;
        const filterCtx = filterCanvas.getContext('2d')!;

        filterCtx.filter = filter.css;
        filterCtx.drawImage(canvas, 0, 0);

        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(filterCanvas, 0, 0);
      }

      // 4. Export HD
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.95);

      setCapturedImage(imageDataUrl);

      // Flash effet
      const flash = document.createElement('div');
      flash.style.cssText = `
        position: fixed;
        inset: 0;
        background: white;
        z-index: 9999;
        animation: flash 0.3s ease-out;
      `;
      document.body.appendChild(flash);
      setTimeout(() => document.body.removeChild(flash), 300);

      // Générer image avec template
      addDebugLog('═══ GÉNÉRATION IMAGE ═══');
      addDebugLog(`Appel generateSocialImage()`);
      addDebugLog(`Template: ${selectedTemplate}`);
      addDebugLog(`Restaurant: ${restaurantName}`);

      setIsGenerating(true);
      try {
        const result = await generateSocialImage({
          webcamImageSrc: imageDataUrl,
          templateType: selectedTemplate,
          restaurantName,
          restaurantLogo,
          menuUrl,
          primaryColor,
          onLog: addDebugLog, // Passer le callback de log
        });
        addDebugLog('✅ Image générée avec succès');
        addDebugLog(`Taille: ${(result.length / 1024).toFixed(0)}KB`);
        setGeneratedImage(result);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        addDebugLog(`❌ ERREUR: ${errorMsg}`);
        console.error('[Capture] Template generation error:', error);
        toast.error('Erreur génération template');
      } finally {
        setIsGenerating(false);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      addDebugLog(`❌ ERREUR CAPTURE: ${errorMsg}`);
      console.error('[Capture] Error:', error);
      toast.error('Erreur lors de la capture');
    }
  }, [selectedTemplate, selectedFilter, facingMode, restaurantName, restaurantLogo, menuUrl, primaryColor, addDebugLog]);

  // Retour caméra
  const resetCamera = () => {
    setCapturedImage(null);
    setGeneratedImage(null);
  };

  // Switch caméra
  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Download
  const handleDownload = () => {
    if (generatedImage) {
      downloadImage(generatedImage, `${restaurantName.toLowerCase().replace(/\s/g, '-')}-moment.jpg`);
      toast.success('Image téléchargée ! 📸');
    }
  };

  // Share
  const handleShare = async () => {
    if (generatedImage) {
      try {
        const shared = await shareImage(generatedImage, restaurantName);
        if (shared) {
          toast.success('Image partagée ! 🎉');
        } else {
          toast.info('Image téléchargée');
        }
      } catch (error) {
        toast.error('Erreur partage');
      }
    }
  };

  // Close
  const handleClose = () => {
    resetCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <style>{`
        @keyframes flash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black"
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <h2 className="text-white font-bold text-lg">Social Studio</h2>

          {!capturedImage && (
            <button
              onClick={toggleCamera}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30"
            >
              <RotateCw className="w-5 h-5 text-white" />
            </button>
          )}
        </div>

        {/* Main Content */}
        <div className="relative h-full flex flex-col">
          {!capturedImage ? (
            <>
              {/* Native Video Stream - FULL BLEED */}
              <div className="fixed inset-0 z-0 bg-black overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: CSS_FILTERS.find((f) => f.id === selectedFilter)?.css || 'none',
                    // Effet miroir pour caméra frontale (selfie)
                    transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                  }}
                />

                {/* Erreur caméra */}
                {cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center p-8">
                    <div className="bg-red-500/20 backdrop-blur-md text-white p-6 rounded-2xl text-center">
                      <p className="font-semibold mb-2">⚠️ Erreur Caméra</p>
                      <p className="text-sm opacity-90">{cameraError}</p>
                    </div>
                  </div>
                )}

                {/* Loading */}
                {isLoading && !cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-white mx-auto mb-4" />
                      <p>Initialisation caméra...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer - Studio Controls (Instagram Style) */}
              {!isLoading && !cameraError && (
                <div className="absolute bottom-0 left-0 right-0 z-10 pb-safe">
                  {/* Gradient Background */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent pointer-events-none" />

                  {/* Content */}
                  <div className="relative px-4 pb-8">
                    {/* All Controls in Horizontal Row */}
                    <div className="flex flex-col items-center gap-8">
                      {/* Templates + Filters in Single Row */}
                      <div className="flex items-center gap-3 justify-center flex-wrap">
                        {/* Templates */}
                        {TEMPLATES.map((template, index) => (
                          <motion.button
                            key={template.id}
                            onClick={() => setSelectedTemplate(template.id)}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`
                              flex flex-col items-center justify-center gap-1
                              w-16 h-16 rounded-full
                              transition-all duration-300 ease-out
                              ${
                                selectedTemplate === template.id
                                  ? 'bg-white scale-110 ring-4 ring-primary/50 shadow-xl'
                                  : 'bg-white/20 backdrop-blur-md scale-100 hover:scale-105'
                              }
                            `}
                          >
                            <span className="text-2xl">{template.emoji}</span>
                            {selectedTemplate === template.id && (
                              <span className="text-[8px] font-bold text-black -mt-0.5">
                                {template.label}
                              </span>
                            )}
                          </motion.button>
                        ))}

                        {/* Filters */}
                        {CSS_FILTERS.map((filter, index) => (
                          <motion.button
                            key={`filter-${filter.id}`}
                            onClick={() => setSelectedFilter(filter.id)}
                            whileTap={{ scale: 0.9 }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: (TEMPLATES.length + index) * 0.1 }}
                            className={`
                              flex flex-col items-center justify-center gap-1
                              w-16 h-16 rounded-full
                              transition-all duration-300 ease-out
                              ${
                                selectedFilter === filter.id
                                  ? 'bg-white scale-110 ring-4 ring-purple-500/50 shadow-xl'
                                  : 'bg-white/20 backdrop-blur-md scale-100 hover:scale-105'
                              }
                            `}
                          >
                            <span className="text-2xl">{filter.icon}</span>
                            {selectedFilter === filter.id && (
                              <span className="text-[8px] font-bold text-black -mt-0.5">
                                {filter.label}
                              </span>
                            )}
                          </motion.button>
                        ))}
                      </div>

                      {/* Shutter Button */}
                      <motion.button
                        onClick={capturePhoto}
                        whileTap={{ scale: 0.85 }}
                        className="relative group"
                      >
                        {/* Outer Ring */}
                        <div className="absolute inset-0 rounded-full bg-linear-to-br from-white/40 to-white/10 blur-lg group-hover:blur-xl transition-all" />

                        {/* Button */}
                        <div className="relative w-24 h-24 rounded-full bg-white shadow-2xl flex items-center justify-center border-4 border-white/30 group-hover:border-white/50 transition-all">
                          <div className="w-20 h-20 rounded-full bg-linear-to-br from-red-500 to-pink-600 flex items-center justify-center">
                            <Camera className="w-10 h-10 text-white" />
                          </div>
                        </div>
                      </motion.button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Image capturée/générée */}
              <div className="flex-1 flex items-center justify-center bg-black">
                {isGenerating ? (
                  <div className="text-center text-white">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-white mx-auto mb-4" />
                    <p>Création de votre chef-d&apos;œuvre...</p>
                  </div>
                ) : generatedImage ? (
                  <img
                    src={generatedImage}
                    alt="Generated"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : null}
              </div>

              {/* Actions */}
              {!isGenerating && generatedImage && (
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent">
                  <div className="flex gap-3">
                    <button
                      onClick={resetCamera}
                      className="flex-1 px-6 py-4 rounded-xl bg-white/20 backdrop-blur-md text-white font-semibold"
                    >
                      Reprendre
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex-1 px-6 py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
                      style={{ backgroundColor: primaryColor || '#FF4500' }}
                    >
                      <Download className="w-5 h-5" />
                      Télécharger
                    </button>
                    <button
                      onClick={handleShare}
                      className="flex-1 px-6 py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
                      style={{ backgroundColor: primaryColor || '#FF4500' }}
                    >
                      <Share2 className="w-5 h-5" />
                      Partager
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Panneau Debug Mobile (seulement en développement) */}
          {isDebugMode && (
            <>
              <button
                onClick={() => setShowDebugPanel(!showDebugPanel)}
                className="absolute top-20 right-4 w-12 h-12 bg-red-500 text-white rounded-full shadow-lg flex items-center justify-center font-bold z-50"
              >
                🐛
              </button>

              {showDebugPanel && (
                <div className="absolute top-20 left-4 right-4 bottom-20 bg-black/95 text-white p-4 rounded-xl overflow-auto z-40 font-mono text-xs">
                  <div className="flex justify-between items-center mb-2 sticky top-0 bg-black/95 pb-2">
                    <h3 className="font-bold">Debug Logs</h3>
                    <button
                      onClick={() => setDebugLogs([])}
                      className="text-red-400 text-xs"
                    >
                      Effacer
                    </button>
                  </div>
                  {debugLogs.length === 0 ? (
                    <p className="text-gray-400">Aucun log pour le moment...</p>
                  ) : (
                    debugLogs.map((log, i) => (
                      <div key={i} className="mb-1 pb-1 border-b border-gray-800">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
