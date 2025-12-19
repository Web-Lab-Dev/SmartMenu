// ========================================
// SocialCamera Component - NATIVE IMPLEMENTATION
// ========================================
// Caméra native plein écran avec getUserMedia (no libraries)
// Qualité HD professionnelle avec templates viraux

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Download, Share2, RotateCw, Sparkles } from 'lucide-react';
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

type CSSFilter = 'none' | 'sepia' | 'grayscale' | 'contrast' | 'vintage';

const TEMPLATES: { id: TemplateType; label: string; emoji: string }[] = [
  { id: 'standard', label: 'Classic', emoji: '🖼️' },
  { id: 'passport', label: 'Passport', emoji: '✈️' },
  { id: 'receipt', label: 'Receipt', emoji: '🧾' },
];

const CSS_FILTERS: { id: CSSFilter; label: string; css: string }[] = [
  { id: 'none', label: 'Aucun', css: 'none' },
  { id: 'sepia', label: 'Sépia', css: 'sepia(0.8)' },
  { id: 'grayscale', label: 'N&B', css: 'grayscale(1)' },
  { id: 'contrast', label: 'Contraste', css: 'contrast(1.3) brightness(1.1)' },
  { id: 'vintage', label: 'Vintage', css: 'sepia(0.5) contrast(1.2)' },
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
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('passport');
  const [selectedFilter, setSelectedFilter] = useState<CSSFilter>('none');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // Helper pour ajouter des logs visibles dans l'UI
  const addDebugLog = (message: string) => {
    setDebugLogs((prev) => [...prev.slice(-20), `[${new Date().toLocaleTimeString()}] ${message}`]);
    console.log(message);
  };

  // Initialiser la caméra avec getUserMedia (NATIVE)
  const initCamera = useCallback(async () => {
    console.log('[Camera] Initializing with facingMode:', facingMode);
    setIsLoading(true);
    setCameraError(null);

    try {
      // Arrêter le stream précédent s'il existe
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Calculer le ratio exact de l'écran pour éviter le zoom
      const screenAspectRatio = window.outerHeight / window.outerWidth;
      console.log('[Camera] Screen aspect ratio:', screenAspectRatio);

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

      console.log('[Camera] Requesting media with constraints:', constraints);

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Attendre que la vidéo soit prête
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              console.log(
                '[Camera] Video ready:',
                videoRef.current?.videoWidth,
                'x',
                videoRef.current?.videoHeight
              );
              resolve();
            };
          }
        });

        setIsLoading(false);
        console.log('[Camera] Initialized successfully');
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
      console.log('╔═══════════════════════════════════════════════════╗');
      console.log('║  SOCIAL CAMERA OPENED                            ║');
      console.log('╚═══════════════════════════════════════════════════╝');
      console.log('[SocialCamera] Component props:', {
        restaurantName,
        menuUrl,
        selectedTemplate,
      });
      initCamera();
    }

    return () => {
      // Nettoyer le stream au démontage
      if (streamRef.current) {
        console.log('[Camera] Cleaning up stream');
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
      console.error('[Capture] ABORT - Missing refs:', { video: !!video, stream: !!streamRef.current });
      toast.error('Caméra non initialisée');
      return;
    }

    console.log('[Capture] Starting HD capture...');
    console.log('[Capture] Video dimensions:', video.videoWidth, 'x', video.videoHeight);

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
      // 1. Capturer la frame vidéo avec effet miroir pour selfie
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

      // 2. Appliquer "Night Mode" (amélioration automatique)
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext('2d')!;

      tempCtx.filter = 'brightness(135%) contrast(115%) saturate(120%)';
      tempCtx.drawImage(canvas, 0, 0);

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(tempCanvas, 0, 0);

      console.log('[Capture] Night Mode applied');

      // 3. Appliquer filtre CSS si sélectionné
      const filter = CSS_FILTERS.find((f) => f.id === selectedFilter);
      if (filter && filter.css !== 'none') {
        const filterCanvas = document.createElement('canvas');
        filterCanvas.width = width;
        filterCanvas.height = height;
        const filterCtx = filterCanvas.getContext('2d')!;

        filterCtx.filter = filter.css;
        filterCtx.drawImage(canvas, 0, 0);

        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(filterCanvas, 0, 0);

        console.log('[Capture] CSS filter applied:', filter.id);
      }

      // 4. Export HD
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      console.log('[Capture] Captured image size:', imageDataUrl.length, 'bytes');

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
        });
        addDebugLog('✅ Image générée avec succès');
        addDebugLog(`Taille: ${(result.length / 1024).toFixed(0)}KB`);
        setGeneratedImage(result);
      } catch (error) {
        addDebugLog(`❌ ERREUR: ${error instanceof Error ? error.message : 'Unknown'}`);
        console.error('[Capture] Template generation error:', error);
        toast.error('Erreur génération template');
      } finally {
        setIsGenerating(false);
      }
    } catch (error) {
      addDebugLog(`❌ ERREUR CAPTURE: ${error instanceof Error ? error.message : 'Unknown'}`);
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

              {/* Filtres CSS */}
              {!isLoading && !cameraError && (
                <div className="absolute bottom-44 left-0 right-0 px-4 z-10">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="mb-3 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md text-white font-medium flex items-center gap-2 mx-auto"
                  >
                    <Sparkles className="w-4 h-4" />
                    Filtres
                  </button>

                  <AnimatePresence>
                    {showFilters && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="flex gap-2 overflow-x-auto pb-2"
                      >
                        {CSS_FILTERS.map((filter) => (
                          <button
                            key={filter.id}
                            onClick={() => setSelectedFilter(filter.id)}
                            className={`px-4 py-2 rounded-full font-medium whitespace-nowrap ${
                              selectedFilter === filter.id
                                ? 'bg-white text-black'
                                : 'bg-white/20 backdrop-blur-md text-white'
                            }`}
                          >
                            {filter.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Templates */}
              {!isLoading && !cameraError && (
                <div className="absolute bottom-32 left-0 right-0 px-4 z-10">
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {TEMPLATES.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template.id)}
                        className={`flex-shrink-0 px-5 py-3 rounded-2xl font-medium ${
                          selectedTemplate === template.id
                            ? 'bg-white text-black scale-105'
                            : 'bg-white/20 backdrop-blur-md text-white'
                        }`}
                      >
                        <div className="text-2xl mb-1">{template.emoji}</div>
                        <div className="text-sm font-bold">{template.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bouton Capture */}
              {!isLoading && !cameraError && (
                <div className="absolute bottom-8 left-0 right-0 flex justify-center z-10">
                  <button
                    onClick={capturePhoto}
                    className="w-20 h-20 rounded-full bg-white border-4 border-white/30 hover:scale-110 active:scale-95 transition-transform shadow-2xl"
                  >
                    <Camera className="w-8 h-8 mx-auto text-black" />
                  </button>
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

          {/* Panneau Debug Mobile */}
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
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
