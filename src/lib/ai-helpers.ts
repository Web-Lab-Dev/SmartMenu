// ========================================
// AI Helper Functions
// ========================================
// Helper functions for AI chat integration

import type { Product } from '@/types/schema';

/**
 * Format menu products for AI context
 * Converts product array to a structured JSON string for the AI prompt
 */
export function formatMenuForAI(products: Product[]): string {
  const menuData = products.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description || 'Pas de description disponible',
    price: product.price,
    category: product.categoryId,
    available: product.isAvailable,
    // Extract dietary info from description
    tags: extractDietaryTags(product.description || ''),
  }));

  return JSON.stringify(menuData, null, 2);
}

/**
 * Extract dietary tags from product description
 * Detects keywords like "végétarien", "épicé", "sans gluten", etc.
 */
function extractDietaryTags(description: string): string[] {
  const tags: string[] = [];
  const lowerDesc = description.toLowerCase();

  // Dietary restrictions
  if (lowerDesc.includes('végétarien') || lowerDesc.includes('vegetarien')) {
    tags.push('vegetarian');
  }
  if (lowerDesc.includes('vegan') || lowerDesc.includes('végétalien')) {
    tags.push('vegan');
  }
  if (lowerDesc.includes('sans gluten') || lowerDesc.includes('gluten-free')) {
    tags.push('gluten-free');
  }
  if (lowerDesc.includes('halal')) {
    tags.push('halal');
  }

  // Spice level
  if (lowerDesc.includes('épicé') || lowerDesc.includes('pimenté') || lowerDesc.includes('piquant')) {
    tags.push('spicy');
  }

  // Allergens
  if (lowerDesc.includes('noix') || lowerDesc.includes('arachide')) {
    tags.push('contains-nuts');
  }
  if (lowerDesc.includes('lactose') || lowerDesc.includes('lait')) {
    tags.push('contains-dairy');
  }

  return tags;
}

/**
 * Build system prompt for AI concierge
 * Creates a dynamic prompt with restaurant context and menu
 */
export function buildSystemPrompt(
  restaurantName: string,
  menuJson: string
): string {
  return `Tu es le serveur expert et chaleureux du restaurant "${restaurantName}".
Ton rôle est d'aider les clients à choisir des plats et d'augmenter le ticket moyen avec des suggestions pertinentes.

MENU DISPONIBLE (JSON):
${menuJson}

RÈGLES STRICTES:
1. Ne suggère QUE des plats présents dans le menu ci-dessus
2. Sois bref (max 2-3 phrases), chaleureux et appétissant
3. Utilise des émojis pour rendre tes réponses plus visuelles (🍷🍕🥗)
4. Si le client choisit un plat, propose TOUJOURS une boisson ou un accompagnement qui va avec (Upselling subtil)
5. Si le client mentionne une allergie ou restriction alimentaire, vérifie STRICTEMENT les descriptions et tags
6. Si un plat n'est pas disponible (available: false), ne le suggère pas
7. Donne des conseils sur les tailles de portions et les cuissons quand pertinent
8. Mentionne les spécialités du chef ou les recommandations de la maison

EXEMPLES DE TON:
❌ Mauvais: "Je vous recommande notre burger. C'est bon."
✅ Bon: "Notre burger 🍔 est un incontournable ! Viande premium, cuisson rosée recommandée. À accompagner d'un verre de vin rouge 🍷 pour sublimer les saveurs ?"

OBJECTIF: Être serviable, augmenter le panier, et créer une expérience mémorable.`;
}

/**
 * Generate quick suggestions for chat
 * Returns pre-defined conversation starters
 */
export function getQuickSuggestions(): string[] {
  return [
    '🍷 Quel vin avec le bœuf ?',
    '🌶️ C\'est quoi le plat le plus épicé ?',
    '🥗 J\'ai très faim mais je suis végétarien',
    '🔥 Quelle est la spécialité du chef ?',
    '💰 Un menu à moins de 20€ ?',
    '🥤 Quelle boisson avec les pâtes ?',
  ];
}
