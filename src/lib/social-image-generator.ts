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
    if (!response.ok) throw new Error(`Failed to load template: ${templatePath}`);
    return await response.text();
  } catch (error) {
    console.error('[SVG] Template load error:', error);
    throw error;
  }
}

/**
 * Convertit un SVG string en Image pour le rendu canvas
 */
function svgStringToImage(svgString: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = reject;
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
  }
): string {
  let customized = svgContent;

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
  customized = customized.replace(
    /<text id="restaurant-name"([^>]*)>.*?<\/text>/,
    `<text id="restaurant-name"$1>${options.restaurantName}</text>`
  );
  customized = customized.replace(
    /<text id="receipt-restaurant"([^>]*)>.*?<\/text>/,
    `<text id="receipt-restaurant"$1>${options.restaurantName.toUpperCase()}</text>`
  );

  // Ajouter la date
  const date = options.date || new Date().toLocaleDateString('fr-FR');
  customized = customized.replace(
    /<text id="date-stamp"([^>]*)>.*?<\/text>/,
    `<text id="date-stamp"$1>${date}</text>`
  );

  const datetime = new Date().toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  customized = customized.replace(
    /<text id="receipt-datetime"([^>]*)>.*?<\/text>/,
    `<text id="receipt-datetime"$1>${datetime}</text>`
  );

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
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  canvas.width = 1080;
  canvas.height = 1920;

  try {
    // 1. Générer le QR code
    const qrCode = await generateQRCode(options.menuUrl, 200);

    // 2. Charger le template SVG
    const svgTemplate = await loadSVGTemplate('/templates/passport-frame.svg');

    // 3. Personnaliser le SVG avec les données
    const customizedSVG = customizeSVGTemplate(svgTemplate, {
      restaurantName: options.restaurantName,
      photoDataUrl: options.webcamImageSrc,
      qrDataUrl: qrCode,
      date: new Date().toLocaleDateString('fr-FR'),
    });

    // 4. Convertir SVG en Image
    const svgImage = await svgStringToImage(customizedSVG);

    // 5. Dessiner sur le canvas à haute résolution
    ctx.drawImage(svgImage, 0, 0, canvas.width, canvas.height);

    // 6. Export haute qualité
    return canvas.toDataURL('image/jpeg', 0.95);
  } catch (error) {
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
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  canvas.width = 1080;
  canvas.height = 1920;

  try {
    // 1. Générer le QR code
    const qrCode = await generateQRCode(options.menuUrl, 200);

    // 2. Charger le template SVG
    const svgTemplate = await loadSVGTemplate('/templates/receipt-texture.svg');

    // 3. Personnaliser le SVG
    const customizedSVG = customizeSVGTemplate(svgTemplate, {
      restaurantName: options.restaurantName,
      photoDataUrl: options.webcamImageSrc,
      qrDataUrl: qrCode,
    });

    // 4. Convertir SVG en Image
    const svgImage = await svgStringToImage(customizedSVG);

    // 5. Dessiner sur canvas
    ctx.drawImage(svgImage, 0, 0, canvas.width, canvas.height);

    // 6. Export haute qualité
    return canvas.toDataURL('image/jpeg', 0.95);
  } catch (error) {
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
