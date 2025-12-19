// ========================================
// Social Image Generator - SVG Template Engine (REFACTORED)
// ========================================
// Utilise des templates SVG pour une qualité native professionnelle
// Modes : Standard Frame, Foodie Passport, Receipt Aesthetic

export type TemplateType = 'standard' | 'passport' | 'receipt';

export interface SocialImageOptions {
  webcamImageSrc: string;
  templateType: TemplateType;
  restaurantName: string;
  restaurantLogo?: string;
  menuUrl: string;
  primaryColor?: string;
  onLog?: (message: string) => void; // Callback pour les logs
}

/**
 * Génère un QR Code en data URL
 */
async function generateQRCode(url: string, size: number = 200): Promise<string> {
  try {
    const QRCode = (await import('qrcode')).default;
    const canvas = document.createElement('canvas');
    await QRCode.toCanvas(canvas, url, {
      width: size,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return canvas.toDataURL();
  } catch (error) {
    console.error('[QR] Generation error:', error);
    return '';
  }
}

/**
 * Charge une image et retourne un HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Charge un template SVG et retourne le texte SVG
 */
async function loadSVGTemplate(templatePath: string): Promise<string> {
  try {
    console.log('[SVG] Loading template from:', templatePath);
    const response = await fetch(templatePath);
    if (!response.ok) {
      console.error('[SVG] Failed to load template, status:', response.status);
      throw new Error(`Failed to load template: ${templatePath}`);
    }
    const svgText = await response.text();
    console.log('[SVG] Template loaded successfully, length:', svgText.length);
    console.log('[SVG] First 200 chars:', svgText.substring(0, 200));
    return svgText;
  } catch (error) {
    console.error('[SVG] Template load error:', error);
    throw error;
  }
}

/**
 * Convertit un SVG string en Image pour le rendu canvas
 */
function svgStringToImage(svgString: string, onLog?: (message: string) => void): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    onLog?.(`[SVG→IMG] SVG length: ${svgString.length} chars`);

    // Vérifier si le restaurant name a bien été remplacé dans le SVG
    if (svgString.includes('Restaurant Name')) {
      onLog?.('[SVG→IMG] ⚠️ PROBLÈME: "Restaurant Name" encore présent dans le SVG !');
    }
    if (svgString.includes('2024-01-01')) {
      onLog?.('[SVG→IMG] ⚠️ PROBLÈME: "2024-01-01" encore présent dans le SVG !');
    }

    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      onLog?.('[SVG→IMG] ✓ Image chargée');
      resolve(img);
    };
    img.onerror = (err) => {
      onLog?.(`[SVG→IMG] ❌ Erreur chargement: ${err}`);
      reject(err);
    };
    img.src = url;
  });
}

/**
 * Remplace les placeholders dans le SVG avec les vraies données
 */
function customizeSVGTemplate(
  svgContent: string,
  options: {
    restaurantName: string;
    photoDataUrl: string;
    qrDataUrl: string;
    date?: string;
  },
  onLog?: (message: string) => void
): string {
  let customized = svgContent;

  onLog?.('[SVG] Début customization...');

  // Injecter la photo dans le masque
  if (options.photoDataUrl) {
    customized = customized.replace(
      /id="photo-mask"/,
      `id="photo-mask" href="${options.photoDataUrl}" preserveAspectRatio="xMidYMid slice"`
    );
    customized = customized.replace(
      /id="receipt-photo-mask"/,
      `id="receipt-photo-mask" href="${options.photoDataUrl}" preserveAspectRatio="xMidYMid slice"`
    );
    // Convertir rect en image
    customized = customized.replace(
      /<rect id="photo-mask"([^>]*)\/>/g,
      `<image id="photo-mask"$1/>`
    );
    customized = customized.replace(
      /<rect id="receipt-photo-mask"([^>]*)\/>/g,
      `<image id="receipt-photo-mask"$1/>`
    );
  }

  // Injecter le QR code
  if (options.qrDataUrl) {
    customized = customized.replace(
      /id="qr-placeholder"/,
      `id="qr-placeholder" href="${options.qrDataUrl}"`
    );
    customized = customized.replace(
      /id="receipt-qr-placeholder"/,
      `id="receipt-qr-placeholder" href="${options.qrDataUrl}"`
    );
    // Convertir rect en image
    customized = customized.replace(
      /<rect id="qr-placeholder"([^>]*)\/>/g,
      `<image id="qr-placeholder"$1/>`
    );
    customized = customized.replace(
      /<rect id="receipt-qr-placeholder"([^>]*)\/>/g,
      `<image id="receipt-qr-placeholder"$1/>`
    );
  }

  // Remplacer le nom du restaurant
  const restaurantName = options.restaurantName || 'Restaurant';

  onLog?.(`[SVG] Restaurant: ${restaurantName}`);

  // Passport template
  const restaurantNameMatch = customized.match(/<text id="restaurant-name"([^>]*)>.*?<\/text>/);
  if (restaurantNameMatch) {
    onLog?.('[SVG] ✓ Tag restaurant-name trouvé (Passport)');
  }
  customized = customized.replace(
    /<text id="restaurant-name"([^>]*)>.*?<\/text>/g,
    `<text id="restaurant-name"$1>${restaurantName}</text>`
  );

  // Receipt template
  const receiptRestaurantMatch = customized.match(/<text id="receipt-restaurant"([^>]*)>.*?<\/text>/);
  if (receiptRestaurantMatch) {
    onLog?.('[SVG] ✓ Tag receipt-restaurant trouvé (Receipt)');
  }
  customized = customized.replace(
    /<text id="receipt-restaurant"([^>]*)>.*?<\/text>/g,
    `<text id="receipt-restaurant"$1>${restaurantName.toUpperCase()}</text>`
  );

  // Formatter la date et l'heure ACTUELLES
  const now = new Date();

  // Format court pour Passport: "19 déc. 2024"
  const shortDate = now.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  onLog?.(`[SVG] Date (Passport): ${shortDate}`);
  customized = customized.replace(
    /<text id="date-stamp"([^>]*)>.*?<\/text>/g,
    `<text id="date-stamp"$1>${shortDate}</text>`
  );

  // Format complet pour Receipt: "19/12/2024 - 10:45"
  const fullDate = now.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const time = now.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const datetime = `${fullDate} - ${time}`;

  onLog?.(`[SVG] DateTime (Receipt): ${datetime}`);
  customized = customized.replace(
    /<text id="receipt-datetime"([^>]*)>.*?<\/text>/g,
    `<text id="receipt-datetime"$1>${datetime}</text>`
  );

  onLog?.('[SVG] ✅ Customization terminée');

  return customized;
}

/**
 * Mode A : Standard Frame
 * Photo plein écran avec cadre blanc simple
 */
async function generateStandardFrame(options: SocialImageOptions): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // Haute résolution Instagram Story
  canvas.width = 1080;
  canvas.height = 1920;

  try {
    // 1. Charger la photo webcam
    const webcamImg = await loadImage(options.webcamImageSrc);

    // 2. Dessiner la photo (cover - remplir tout l'écran)
    const scale = Math.max(canvas.width / webcamImg.width, canvas.height / webcamImg.height);
    const x = (canvas.width - webcamImg.width * scale) / 2;
    const y = (canvas.height - webcamImg.height * scale) / 2;
    ctx.drawImage(webcamImg, x, y, webcamImg.width * scale, webcamImg.height * scale);

    // 3. Cadre blanc élégant
    const frameWidth = 40;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = frameWidth;
    ctx.strokeRect(frameWidth / 2, frameWidth / 2, canvas.width - frameWidth, canvas.height - frameWidth);

    // 4. Footer avec nom restaurant et QR
    const footerHeight = 240;
    const gradient = ctx.createLinearGradient(0, canvas.height - footerHeight, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, canvas.height - footerHeight, canvas.width, footerHeight);

    // Logo restaurant (si disponible)
    if (options.restaurantLogo) {
      try {
        const logo = await loadImage(options.restaurantLogo);
        const logoSize = 100;
        ctx.drawImage(
          logo,
          canvas.width / 2 - logoSize / 2,
          canvas.height - footerHeight + 30,
          logoSize,
          logoSize
        );
      } catch (err) {
        console.warn('[StandardFrame] Logo load failed:', err);
      }
    }

    // Nom restaurant
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(options.restaurantName, canvas.width / 2, canvas.height - footerHeight + 150);

    // QR Code
    const qrCode = await generateQRCode(options.menuUrl, 140);
    if (qrCode) {
      const qrImg = await loadImage(qrCode);
      ctx.drawImage(qrImg, canvas.width / 2 - 70, canvas.height - 150, 140, 140);
    }

    // Message
    ctx.font = '24px Arial, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText('Scannez pour commander', canvas.width / 2, canvas.height - 15);

    return canvas.toDataURL('image/jpeg', 0.95);
  } catch (error) {
    console.error('[StandardFrame] Error:', error);
    throw error;
  }
}

/**
 * Mode B : Foodie Passport (Template SVG)
 * Cadre polaroid chic avec texte manuscrit
 */
async function generateFoodiePassport(options: SocialImageOptions): Promise<string> {
  const { onLog } = options;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  canvas.width = 1080;
  canvas.height = 1920;

  try {
    // 1. Générer le QR code
    onLog?.('[Passport] Génération QR code...');
    const qrCode = await generateQRCode(options.menuUrl, 200);
    onLog?.(qrCode ? '[Passport] ✓ QR code généré' : '[Passport] ❌ QR code failed');

    // 2. Charger le template SVG
    onLog?.('[Passport] Chargement template SVG...');
    const svgTemplate = await loadSVGTemplate('/templates/passport-frame.svg');
    onLog?.(`[Passport] ✓ Template chargé (${svgTemplate.length} chars)`);

    // 3. Personnaliser le SVG avec les données
    onLog?.('[Passport] Personnalisation SVG...');
    const customizedSVG = customizeSVGTemplate(svgTemplate, {
      restaurantName: options.restaurantName,
      photoDataUrl: options.webcamImageSrc,
      qrDataUrl: qrCode,
      date: new Date().toLocaleDateString('fr-FR'),
    }, onLog);
    onLog?.('[Passport] ✓ SVG personnalisé');

    // 4. Convertir SVG en Image
    onLog?.('[Passport] Conversion SVG → Image...');
    const svgImage = await svgStringToImage(customizedSVG, onLog);
    onLog?.('[Passport] ✓ Image convertie');

    // 5. Dessiner sur le canvas à haute résolution
    ctx.drawImage(svgImage, 0, 0, canvas.width, canvas.height);
    onLog?.('[Passport] ✓ Image dessinée sur canvas');

    // 6. Export haute qualité
    onLog?.('[Passport] ✅ Export terminé');
    return canvas.toDataURL('image/jpeg', 0.95);
  } catch (error) {
    onLog?.(`[Passport] ❌ ERREUR: ${error instanceof Error ? error.message : 'Unknown'}`);
    console.error('[FoodiePassport] Error:', error);
    // Fallback to standard frame
    return generateStandardFrame(options);
  }
}

/**
 * Mode C : Receipt Aesthetic (Template SVG)
 * Style ticket de caisse rétro
 */
async function generateReceiptAesthetic(options: SocialImageOptions): Promise<string> {
  const { onLog } = options;

  onLog?.('[Receipt] Génération QR code...');

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  canvas.width = 1080;
  canvas.height = 1920;

  try {
    // 1. Générer le QR code
    const qrCode = await generateQRCode(options.menuUrl, 200);
    onLog?.(qrCode ? '[Receipt] ✓ QR code généré' : '[Receipt] ❌ QR code failed');

    // 2. Charger le template SVG
    onLog?.('[Receipt] Chargement template SVG...');
    const svgTemplate = await loadSVGTemplate('/templates/receipt-texture.svg');
    onLog?.(`[Receipt] ✓ Template chargé (${svgTemplate.length} chars)`);

    // 3. Personnaliser le SVG
    onLog?.('[Receipt] Personnalisation SVG...');
    const customizedSVG = customizeSVGTemplate(svgTemplate, {
      restaurantName: options.restaurantName,
      photoDataUrl: options.webcamImageSrc,
      qrDataUrl: qrCode,
    }, onLog);
    onLog?.('[Receipt] ✓ SVG personnalisé');

    // 4. Convertir SVG en Image
    onLog?.('[Receipt] Conversion SVG → Image...');
    const svgImage = await svgStringToImage(customizedSVG, onLog);
    onLog?.('[Receipt] ✓ Image convertie');

    // 5. Dessiner sur canvas
    ctx.drawImage(svgImage, 0, 0, canvas.width, canvas.height);
    onLog?.('[Receipt] ✓ Image dessinée sur canvas');

    // 6. Export haute qualité
    const result = canvas.toDataURL('image/jpeg', 0.95);
    onLog?.('[Receipt] ✅ Export terminé');
    return result;
  } catch (error) {
    onLog?.(`[Receipt] ❌ ERREUR: ${error instanceof Error ? error.message : 'Unknown'}`);
    console.error('[ReceiptAesthetic] Error:', error);
    // Fallback to standard frame
    return generateStandardFrame(options);
  }
}

/**
 * Point d'entrée principal - Génère l'image sociale finale
 */
export async function generateSocialImage(options: SocialImageOptions): Promise<string> {
  console.log('[SocialImageGenerator] Starting generation with template:', options.templateType);

  try {
    switch (options.templateType) {
      case 'passport':
        return await generateFoodiePassport(options);
      case 'receipt':
        return await generateReceiptAesthetic(options);
      case 'standard':
      default:
        return await generateStandardFrame(options);
    }
  } catch (error) {
    console.error('[SocialImageGenerator] Fatal error:', error);
    throw error;
  }
}

/**
 * Télécharge l'image générée
 */
export function downloadImage(dataUrl: string, filename: string = 'moment.jpg'): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Partage l'image via Web Share API
 */
export async function shareImage(dataUrl: string, restaurantName: string): Promise<boolean> {
  try {
    // Convertir data URL en Blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], `${restaurantName}-moment.jpg`, { type: 'image/jpeg' });

    // Vérifier si Web Share API est disponible
    if (navigator.share && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: `Mon moment chez ${restaurantName}`,
        text: `Découvrez ${restaurantName} !`,
        files: [file],
      });
      return true;
    }

    // Fallback: télécharger l'image
    downloadImage(dataUrl, `${restaurantName.toLowerCase().replace(/\s/g, '-')}-moment.jpg`);
    return false;
  } catch (error) {
    console.error('[Share] Error:', error);
    return false;
  }
}
