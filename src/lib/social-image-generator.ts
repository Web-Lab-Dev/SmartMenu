// ========================================
// Social Image Generator - SVG Template Engine (REFACTORED)
// ========================================
// Utilise des templates SVG pour une qualité native professionnelle
// Modes : Receipt Aesthetic, Foodie Passport

export type TemplateType = 'passport' | 'receipt';

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
    const response = await fetch(templatePath);
    if (!response.ok) {
      console.error('[SVG] Failed to load template, status:', response.status);
      throw new Error(`Failed to load template: ${templatePath}`);
    }
    return await response.text();
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
  // IMPORTANT: Use [\s\S] instead of . to match newlines
  const restaurantNameMatch = customized.match(/<text id="restaurant-name"([^>]*)>[\s\S]*?<\/text>/);
  if (restaurantNameMatch) {
    onLog?.('[SVG] ✓ Tag restaurant-name trouvé (Passport)');
    onLog?.(`[SVG] Match content: ${restaurantNameMatch[0].substring(0, 100)}`);
  } else {
    onLog?.('[SVG] ❌ Tag restaurant-name NON trouvé !');
  }
  customized = customized.replace(
    /<text id="restaurant-name"([^>]*)>[\s\S]*?<\/text>/g,
    `<text id="restaurant-name"$1>${restaurantName}</text>`
  );

  // Receipt template
  const receiptRestaurantMatch = customized.match(/<text id="receipt-restaurant"([^>]*)>[\s\S]*?<\/text>/);
  if (receiptRestaurantMatch) {
    onLog?.('[SVG] ✓ Tag receipt-restaurant trouvé (Receipt)');
    onLog?.(`[SVG] Match content: ${receiptRestaurantMatch[0].substring(0, 100)}`);
  } else {
    onLog?.('[SVG] ❌ Tag receipt-restaurant NON trouvé !');
  }
  customized = customized.replace(
    /<text id="receipt-restaurant"([^>]*)>[\s\S]*?<\/text>/g,
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
    /<text id="date-stamp"([^>]*)>[\s\S]*?<\/text>/g,
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
    /<text id="receipt-datetime"([^>]*)>[\s\S]*?<\/text>/g,
    `<text id="receipt-datetime"$1>${datetime}</text>`
  );

  onLog?.('[SVG] ✅ Customization terminée');

  return customized;
}

/**
 * Mode A : Foodie Passport (Template SVG)
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
    throw error;
  }
}

/**
 * Mode B : Receipt Aesthetic (Template SVG)
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
    throw error;
  }
}

/**
 * Point d'entrée principal - Génère l'image sociale finale
 */
export async function generateSocialImage(options: SocialImageOptions): Promise<string> {
  console.log('[SocialImageGenerator] Starting generation with template:', options.templateType);

  try {
    switch (options.templateType) {
      case 'receipt':
        return await generateReceiptAesthetic(options);
      case 'passport':
      default:
        return await generateFoodiePassport(options);
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
