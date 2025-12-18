// ========================================
// SocialCamera Component - Instagram Story Style
// ========================================
// Caméra avec templates viraux : Standard Frame, Foodie Passport, Receipt

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Camera,
  Download,
  Share2,
  RotateCw,
  Sparkles,
  Loader2,
  Wand2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  generateSocialImage,
  downloadImage,
  shareImage,
  type TemplateType,
} from '@/lib/social-image-generator';
import { useFaceTracking, type StickerType } from '@/hooks/useFaceTracking';
import { ARStickerOverlay } from './ARStickerOverlay';

interface SocialCameraProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantName: string;
  restaurantLogo?: string;
  menuUrl: string;
  primaryColor?: string;
}

type CSSFilter = 'none' | 'sepia' | 'grayscale' | 'contrast' | 'vintage';

const TEMPLATES: { id: TemplateType; label: string; emoji: string; description: string }[] = [
  { id: 'standard', label: 'Classic', emoji: '🖼️', description: 'Cadre élégant' },
  { id: 'passport', label: 'Passport', emoji: '✈️', description: 'Polaroid chic' },
  { id: 'receipt', label: 'Receipt', emoji: '🧾', description: 'Ticket rétro' },
];

const CSS_FILTERS: { id: CSSFilter; label: string; css: string }[] = [
  { id: 'none', label: 'Aucun', css: 'none' },
  { id: 'sepia', label: 'Sépia', css: 'sepia(0.8)' },
  { id: 'grayscale', label: 'N&B', css: 'grayscale(1)' },
  { id: 'contrast', label: 'Contraste', css: 'contrast(1.3) brightness(1.1)' },
  { id: 'vintage', label: 'Vintage', css: 'sepia(0.5) contrast(1.2) brightness(0.9)' },
];

/**
 * SocialCamera - Caméra avec templates Instagram Story
 */
export function SocialCamera({
  isOpen,
  onClose,
  restaurantName,
  restaurantLogo,
  menuUrl,
  primaryColor,
}: SocialCameraProps) {
  const webcamRef = useRef<Webcam>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const arCanvasRef = useRef<HTMLCanvasElement>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('passport');
  const [selectedFilter, setSelectedFilter] = useState<CSSFilter>('none');
  const [selectedSticker, setSelectedSticker] = useState<StickerType>('none');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showStickers, setShowStickers] = useState(false);

  // Initialiser videoRef depuis webcamRef
  useEffect(() => {
    const interval = setInterval(() => {
      if (webcamRef.current && !videoRef.current) {
        const video = (webcamRef.current as any).video;
        if (video) {
          videoRef.current = video;
          console.log('[SocialCamera] Video ref initialized:', video.videoWidth, 'x', video.videoHeight);
          clearInterval(interval);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Face tracking pour les stickers AR
  const { isLoading: faceLoading, faceDetection, error: faceError } = useFaceTracking({
    videoRef,
    enabled: !capturedImage && selectedSticker !== 'none',
    stickerType: selectedSticker,
  });

  // Capture photo HAUTE FIDÉLITÉ à résolution native
  const capturePhoto = useCallback(async () => {
    console.log('[Capture] Starting capture...');
    console.log('[Capture] webcamRef.current:', webcamRef.current);
    console.log('[Capture] videoRef.current:', videoRef.current);

    if (!webcamRef.current || !videoRef.current) {
      console.error('[Capture] Missing refs - webcam:', !!webcamRef.current, 'video:', !!videoRef.current);
      toast.error('Erreur: Caméra non initialisée');
      return;
    }

    const video = videoRef.current;
    console.log('[Capture] Video element:', video);
    console.log('[Capture] Video dimensions:', video.videoWidth, 'x', video.videoHeight);

    // Créer canvas à la RÉSOLUTION NATIVE de la caméra (pas la taille d'affichage)
    const nativeCanvas = document.createElement('canvas');
    const nativeWidth = video.videoWidth || 1080;
    const nativeHeight = video.videoHeight || 1920;

    nativeCanvas.width = nativeWidth;
    nativeCanvas.height = nativeHeight;

    const ctx = nativeCanvas.getContext('2d');
    if (!ctx) {
      console.error('[Capture] Failed to get canvas context');
      toast.error('Erreur: Canvas non disponible');
      return;
    }

    console.log('[Capture] Native resolution:', nativeWidth, 'x', nativeHeight);

    let finalImageSrc: string;

    try {
      console.log('[Capture] Step 1: Drawing video to canvas...');
      // 1. Dessiner la frame vidéo à résolution native
      ctx.drawImage(video, 0, 0, nativeWidth, nativeHeight);

      console.log('[Capture] Step 2: Applying "Night Mode" enhancement...');
      // 2. "NIGHT MODE" - Formule optimisée pour restaurants sombres
      // Utilise les filtres CSS Canvas (bien plus rapide que pixel-by-pixel)
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = nativeWidth;
      tempCanvas.height = nativeHeight;
      const tempCtx = tempCanvas.getContext('2d')!;

      // Appliquer la formule magique Night Mode
      tempCtx.filter = 'brightness(135%) contrast(115%) saturate(120%)';
      tempCtx.drawImage(nativeCanvas, 0, 0);

      // Réappliquer sur le canvas principal
      ctx.clearRect(0, 0, nativeWidth, nativeHeight);
      ctx.drawImage(tempCanvas, 0, 0);

      console.log('[Capture] Night Mode applied successfully');

      console.log('[Capture] Step 3: Applying CSS filters...');
      // 3. Appliquer le filtre CSS si sélectionné
      const filter = CSS_FILTERS.find((f) => f.id === selectedFilter);
      if (filter && filter.css !== 'none') {
        ctx.filter = filter.css;
        ctx.drawImage(nativeCanvas, 0, 0);
        ctx.filter = 'none';
      }

      console.log('[Capture] Step 4: Adding AR stickers...');
      // 4. Superposer les stickers AR si actifs
      if (selectedSticker !== 'none' && arCanvasRef.current) {
        const arCanvas = arCanvasRef.current;
        console.log('[Capture] AR Canvas dimensions:', arCanvas.width, 'x', arCanvas.height);
        if (arCanvas.width > 0 && arCanvas.height > 0) {
          // Redimensionner l'overlay AR à la résolution native
          ctx.drawImage(arCanvas, 0, 0, nativeWidth, nativeHeight);
        }
      }

      console.log('[Capture] Step 5: Exporting to data URL...');
      // 5. Export HAUTE QUALITÉ (qualité 0.95 - proche lossless)
      finalImageSrc = nativeCanvas.toDataURL('image/jpeg', 0.95);
      console.log('[Capture] Data URL length:', finalImageSrc.length);
      setCapturedImage(finalImageSrc);
      console.log('[Capture] Image captured successfully');
    } catch (error) {
      console.error('[Capture] Error during capture:', error);
      console.error('[Capture] Error stack:', error instanceof Error ? error.stack : 'No stack');
      toast.error(`Erreur lors de la capture: ${error instanceof Error ? error.message : 'Unknown'}`);
      return;
    }

    // Flash blanc
    const flash = document.createElement('div');
    flash.style.position = 'fixed';
    flash.style.inset = '0';
    flash.style.backgroundColor = 'white';
    flash.style.zIndex = '9999';
    flash.style.animation = 'flash 0.3s ease-out';
    document.body.appendChild(flash);

    setTimeout(() => {
      document.body.removeChild(flash);
    }, 300);

    // Générer l'image avec le template
    setIsGenerating(true);
    try {
      const result = await generateSocialImage({
        webcamImageSrc: finalImageSrc,
        templateType: selectedTemplate,
        restaurantName,
        restaurantLogo,
        menuUrl,
        primaryColor,
      });
      setGeneratedImage(result);
    } catch (error) {
      console.error('Image generation error:', error);
      toast.error('Erreur lors de la génération');
    } finally {
      setIsGenerating(false);
    }
  }, [selectedTemplate, selectedSticker, selectedFilter, restaurantName, restaurantLogo, menuUrl, primaryColor]);

  // Retour à la caméra
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
          toast.info('Image téléchargée (Partage non supporté)');
        }
      } catch (error) {
        toast.error('Erreur lors du partage');
      }
    }
  };

  // Close et reset
  const handleClose = () => {
    resetCamera();
    onClose();
  };

  // CSS pour le flash
  const flashKeyframes = `
    @keyframes flash {
      0% { opacity: 1; }
      100% { opacity: 0; }
    }
  `;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <style>{flashKeyframes}</style>
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
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <h2 className="text-white font-bold text-lg">Social Studio</h2>

          <button
            onClick={toggleCamera}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <RotateCw className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Main Content */}
        <div className="relative h-full flex flex-col">
          {/* Webcam ou Image capturée */}
          {!capturedImage ? (
            <>
              {/* Webcam avec ref pour AR - Configuration Native Anti-Zoom */}
              <div className="relative w-full h-full bg-black overflow-hidden">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  screenshotQuality={1.0}
                  videoConstraints={{
                    facingMode,
                    aspectRatio: 9 / 16, // Force portrait natif
                    width: { ideal: 1080, min: 720 },
                    height: { ideal: 1920, min: 1280 },
                  }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain', // CRUCIAL: évite le zoom excessif
                    filter: CSS_FILTERS.find((f) => f.id === selectedFilter)?.css || 'none',
                  }}
                  onUserMedia={(stream) => {
                    if (webcamRef.current) {
                      const video = (webcamRef.current as any).video;
                      if (video) {
                        videoRef.current = video;
                        console.log('[SocialCamera] Video initialized with resolution:', video.videoWidth, 'x', video.videoHeight);
                      } else {
                        console.error('[SocialCamera] Could not get video element from webcam');
                      }
                    }
                  }}
                />

                {/* AR Overlay Canvas */}
                {selectedSticker !== 'none' && videoRef.current && (
                  <ARStickerOverlay
                    videoRef={videoRef}
                    faceDetection={faceDetection}
                    stickerType={selectedSticker}
                    className="absolute inset-0 w-full h-full"
                  />
                )}

                {/* Canvas ref pour la capture */}
                <canvas
                  ref={arCanvasRef}
                  className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
                />

                {/* Indicateur de chargement AR */}
                {faceLoading && selectedSticker !== 'none' && (
                  <div className="absolute top-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md text-white text-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Chargement des filtres magiques...
                  </div>
                )}
              </div>

              {/* Stickers AR */}
              <div className="absolute bottom-56 left-0 right-0 px-4">
                <button
                  onClick={() => setShowStickers(!showStickers)}
                  className="mb-3 px-4 py-2 rounded-full bg-purple-500/80 backdrop-blur-md text-white font-medium flex items-center gap-2 mx-auto hover:bg-purple-600/80 transition-colors"
                >
                  <Wand2 className="w-4 h-4" />
                  Stickers AR
                </button>

                <AnimatePresence>
                  {showStickers && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
                    >
                      {[
                        { id: 'none' as StickerType, label: 'Aucun', emoji: '🚫' },
                        { id: 'chef' as StickerType, label: 'Chef', emoji: '👨‍🍳' },
                        { id: 'gourmand' as StickerType, label: 'Gourmand', emoji: '😋' },
                      ].map((sticker) => (
                        <button
                          key={sticker.id}
                          onClick={() => setSelectedSticker(sticker.id)}
                          className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${
                            selectedSticker === sticker.id
                              ? 'bg-purple-500 text-white'
                              : 'bg-white/20 backdrop-blur-md text-white hover:bg-white/30'
                          }`}
                        >
                          {sticker.emoji} {sticker.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Filtres CSS */}
              <div className="absolute bottom-44 left-0 right-0 px-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="mb-3 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md text-white font-medium flex items-center gap-2 mx-auto hover:bg-white/30 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  Filtres CSS
                </button>

                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
                    >
                      {CSS_FILTERS.map((filter) => (
                        <button
                          key={filter.id}
                          onClick={() => setSelectedFilter(filter.id)}
                          className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${
                            selectedFilter === filter.id
                              ? 'bg-white text-black'
                              : 'bg-white/20 backdrop-blur-md text-white hover:bg-white/30'
                          }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Templates carousel */}
              <div className="absolute bottom-32 left-0 right-0 px-4">
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`flex-shrink-0 px-5 py-3 rounded-2xl font-medium transition-all ${
                        selectedTemplate === template.id
                          ? 'bg-white text-black scale-105 shadow-lg'
                          : 'bg-white/20 backdrop-blur-md text-white hover:bg-white/30'
                      }`}
                    >
                      <div className="text-2xl mb-1">{template.emoji}</div>
                      <div className="text-sm font-bold">{template.label}</div>
                      <div className="text-xs opacity-80">{template.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Capture button */}
              <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                <button
                  onClick={capturePhoto}
                  className="w-20 h-20 rounded-full bg-white border-4 border-white/30 hover:scale-110 active:scale-95 transition-transform shadow-2xl"
                >
                  <Camera className="w-8 h-8 mx-auto text-black" />
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Image générée ou en cours */}
              <div className="flex-1 flex items-center justify-center bg-black">
                {isGenerating ? (
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
                    <p className="text-white font-medium">Création de votre chef-d&apos;œuvre...</p>
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
                      className="flex-1 px-6 py-4 rounded-xl bg-white/20 backdrop-blur-md text-white font-semibold hover:bg-white/30 transition-colors"
                    >
                      Reprendre
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex-1 px-6 py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
                      style={{ backgroundColor: primaryColor || '#FF4500' }}
                    >
                      <Download className="w-5 h-5" />
                      Télécharger
                    </button>
                    <button
                      onClick={handleShare}
                      className="flex-1 px-6 py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
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
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
