// ========================================
// Social Image Generator - Canvas Merging Engine
// ========================================
// Fusionne photo + template + QR Code pour créer des images virales
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
 * Génère un QR Code en data URL using dynamic import
 */
async function generateQRCode(url: string, size: number = 120): Promise<string> {
  try {
    // Dynamic import de qrcode pour éviter les erreurs SSR
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
    console.error('QR generation error:', error);
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
 * Mode A : Standard Frame
 * Photo + Cadre + Logo restaurant en bas
 */
async function generateStandardFrame(
  options: SocialImageOptions
): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // Dimensions Instagram Story (1080x1920)
  canvas.width = 1080;
  canvas.height = 1920;

  try {
    // 1. Charger l'image webcam
    const webcamImg = await loadImage(options.webcamImageSrc);

    // 2. Dessiner l'image (crop center)
    const scale = Math.max(canvas.width / webcamImg.width, canvas.height / webcamImg.height);
    const x = (canvas.width - webcamImg.width * scale) / 2;
    const y = (canvas.height - webcamImg.height * scale) / 2;
    ctx.drawImage(webcamImg, x, y, webcamImg.width * scale, webcamImg.height * scale);

    // 3. Cadre blanc autour (bordure)
    const frameWidth = 40;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = frameWidth;
    ctx.strokeRect(frameWidth / 2, frameWidth / 2, canvas.width - frameWidth, canvas.height - frameWidth);

    // 4. Footer avec nom du restaurant
    const footerHeight = 200;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, canvas.height - footerHeight, canvas.width, footerHeight);

    // Logo (si disponible)
    if (options.restaurantLogo) {
      try {
        const logo = await loadImage(options.restaurantLogo);
        const logoSize = 80;
        ctx.drawImage(
          logo,
          canvas.width / 2 - logoSize / 2,
          canvas.height - footerHeight + 30,
          logoSize,
          logoSize
        );
      } catch (e) {
        console.warn('Logo loading failed:', e);
      }
    }

    // Texte restaurant
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(options.restaurantName, canvas.width / 2, canvas.height - 80);

    // QR Code dans le coin
    const qrCode = await generateQRCode(options.menuUrl, 120);
    if (qrCode) {
      const qrImg = await loadImage(qrCode);
      ctx.drawImage(qrImg, canvas.width - 140, canvas.height - 140, 120, 120);
    }

    return canvas.toDataURL('image/jpeg', 0.92);
  } catch (error) {
    console.error('Standard Frame generation error:', error);
    throw error;
  }
}

/**
 * Mode B : Foodie Passport
 * Style Polaroid avec texte manuscrit "Certified Tasty"
 */
async function generateFoodiePassport(
  options: SocialImageOptions
): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  canvas.width = 1080;
  canvas.height = 1920;

  try {
    // Background dégradé
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, options.primaryColor || '#FF6B6B');
    gradient.addColorStop(1, '#4ECDC4');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Polaroid blanc
    const polaroidWidth = 900;
    const polaroidHeight = 1100;
    const polaroidX = (canvas.width - polaroidWidth) / 2;
    const polaroidY = 200;

    // Ombre du polaroid
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 20;

    ctx.fillStyle = 'white';
    ctx.fillRect(polaroidX, polaroidY, polaroidWidth, polaroidHeight);

    ctx.shadowColor = 'transparent';

    // Photo dans le polaroid
    const photoMargin = 40;
    const photoWidth = polaroidWidth - photoMargin * 2;
    const photoHeight = 800;

    const webcamImg = await loadImage(options.webcamImageSrc);
    ctx.save();
    ctx.beginPath();
    ctx.rect(polaroidX + photoMargin, polaroidY + photoMargin, photoWidth, photoHeight);
    ctx.clip();

    const scale = Math.max(photoWidth / webcamImg.width, photoHeight / webcamImg.height);
    const x = polaroidX + photoMargin + (photoWidth - webcamImg.width * scale) / 2;
    const y = polaroidY + photoMargin + (photoHeight - webcamImg.height * scale) / 2;
    ctx.drawImage(webcamImg, x, y, webcamImg.width * scale, webcamImg.height * scale);

    ctx.restore();

    // Texte manuscrit en bas du polaroid
    ctx.fillStyle = '#333';
    ctx.font = 'italic 42px serif';
    ctx.textAlign = 'center';

    const date = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    ctx.fillText('✨ Certified Tasty ✨', canvas.width / 2, polaroidY + photoHeight + 140);
    ctx.font = 'italic 36px serif';
    ctx.fillText(`at ${options.restaurantName}`, canvas.width / 2, polaroidY + photoHeight + 190);
    ctx.font = '28px sans-serif';
    ctx.fillStyle = '#666';
    ctx.fillText(date, canvas.width / 2, polaroidY + photoHeight + 240);

    // QR Code en bas à droite du polaroid
    const qrCode = await generateQRCode(options.menuUrl, 100);
    if (qrCode) {
      const qrImg = await loadImage(qrCode);
      ctx.drawImage(
        qrImg,
        polaroidX + polaroidWidth - 130,
        polaroidY + polaroidHeight - 130,
        100,
        100
      );
    }

    return canvas.toDataURL('image/jpeg', 0.92);
  } catch (error) {
    console.error('Foodie Passport generation error:', error);
    throw error;
  }
}

/**
 * Mode C : Receipt Aesthetic
 * Design ticket de caisse avec photo à gauche
 */
async function generateReceiptAesthetic(
  options: SocialImageOptions
): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  canvas.width = 1080;
  canvas.height = 1920;

  try {
    // Background blanc cassé (papier)
    ctx.fillStyle = '#F5F5DC';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Split vertical : Photo à gauche (40%), Receipt à droite (60%)
    const splitX = canvas.width * 0.4;

    // 1. Photo à gauche (crop vertical)
    const webcamImg = await loadImage(options.webcamImageSrc);
    const photoScale = Math.max(splitX / webcamImg.width, canvas.height / webcamImg.height);
    const photoX = (splitX - webcamImg.width * photoScale) / 2;
    const photoY = (canvas.height - webcamImg.height * photoScale) / 2;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, splitX, canvas.height);
    ctx.clip();
    ctx.drawImage(webcamImg, photoX, photoY, webcamImg.width * photoScale, webcamImg.height * photoScale);
    ctx.restore();

    // Bordure pointillée
    ctx.setLineDash([20, 15]);
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(splitX, 0);
    ctx.lineTo(splitX, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Receipt à droite
    const receiptX = splitX + 60;
    const receiptWidth = canvas.width - receiptX - 60;

    // Header du ticket
    ctx.fillStyle = '#000';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('═══════════════', receiptX, 150);
    ctx.font = 'bold 56px monospace';
    ctx.fillText('RECEIPT', receiptX, 230);
    ctx.font = 'bold 48px monospace';
    ctx.fillText('═══════════════', receiptX, 280);

    // Nom du restaurant
    ctx.font = '42px sans-serif';
    ctx.fillText(options.restaurantName.toUpperCase(), receiptX, 380);

    // Date
    const now = new Date();
    const dateStr = now.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    ctx.font = '32px monospace';
    ctx.fillStyle = '#666';
    ctx.fillText(dateStr, receiptX, 450);

    // Lignes du ticket (style ticket de caisse)
    const items = [
      { label: '✨ Ambiance', value: '⭐⭐⭐⭐⭐' },
      { label: '🍽️  Plats', value: 'Délicieux' },
      { label: '🍷 Good Vibes', value: '100%' },
      { label: '😊 Sourires', value: 'Illimités' },
      { label: '📸 Moments', value: 'Inoubliables' },
    ];

    let y = 580;
    ctx.fillStyle = '#000';
    ctx.font = '38px monospace';

    items.forEach((item) => {
      ctx.fillText(item.label, receiptX, y);
      ctx.textAlign = 'right';
      ctx.fillText(item.value, receiptX + receiptWidth, y);
      ctx.textAlign = 'left';
      y += 100;

      // Ligne pointillée
      ctx.strokeStyle = '#CCC';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(receiptX, y - 30);
      ctx.lineTo(receiptX + receiptWidth, y - 30);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Total
    y += 50;
    ctx.font = 'bold 52px monospace';
    ctx.fillText('TOTAL:', receiptX, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = options.primaryColor || '#FF4500';
    ctx.fillText('Priceless', receiptX + receiptWidth, y);
    ctx.textAlign = 'left';

    // Footer avec QR
    y += 150;
    ctx.fillStyle = '#000';
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Scannez pour revivre', receiptX + receiptWidth / 2, y);
    ctx.fillText('l\'expérience', receiptX + receiptWidth / 2, y + 40);

    // QR Code centré en bas
    const qrCode = await generateQRCode(options.menuUrl, 180);
    if (qrCode) {
      const qrImg = await loadImage(qrCode);
      ctx.drawImage(
        qrImg,
        receiptX + receiptWidth / 2 - 90,
        y + 70,
        180,
        180
      );
    }

    // Texte "Merci de votre visite"
    ctx.font = 'italic 36px serif';
    ctx.fillStyle = '#666';
    ctx.fillText('Merci de votre visite ! ❤️', receiptX + receiptWidth / 2, canvas.height - 100);

    return canvas.toDataURL('image/jpeg', 0.92);
  } catch (error) {
    console.error('Receipt Aesthetic generation error:', error);
    throw error;
  }
}

/**
 * Fonction principale : génère l'image sociale selon le template
 */
export async function generateSocialImage(
  options: SocialImageOptions
): Promise<string> {
  switch (options.templateType) {
    case 'standard':
      return generateStandardFrame(options);
    case 'passport':
      return generateFoodiePassport(options);
    case 'receipt':
      return generateReceiptAesthetic(options);
    default:
      throw new Error(`Unknown template type: ${options.templateType}`);
  }
}

/**
 * Télécharge l'image générée
 */
export function downloadImage(dataUrl: string, filename: string = 'restotech-moment.jpg') {
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
export async function shareImage(dataUrl: string, restaurantName: string) {
  try {
    // Convertir data URL en Blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], 'restotech-moment.jpg', { type: 'image/jpeg' });

    if (navigator.share && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: `Mon moment chez ${restaurantName}`,
        text: `Découvrez ${restaurantName} !`,
      });
      return true;
    } else {
      // Fallback : télécharger
      downloadImage(dataUrl);
      return false;
    }
  } catch (error) {
    console.error('Share error:', error);
    throw error;
  }
}
