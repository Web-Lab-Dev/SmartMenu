// ========================================
// Smart Upsell API Route
// ========================================
// AI-powered product recommendation system
// - Uses OpenAI GPT-4o-mini to suggest complementary products
// - Analyzes cart contents and available menu items
// - Returns product ID and reason for suggestion

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface MenuProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  aiTags: string[];
}

interface UpsellRequest {
  cartItems: CartItem[];
  menuContext: MenuProduct[];
}

interface UpsellResponse {
  suggestedProductId: string;
  shortReason: string;
}

/**
 * POST /api/ai/upsell
 *
 * Analyzes the cart and suggests a complementary product
 * using OpenAI GPT-4o-mini.
 */
export async function POST(req: NextRequest) {
  try {
    console.log('[AI UPSELL] 🤖 Incoming upsell request');

    // DEBUG: Log first/last chars of API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      console.log('[AI UPSELL] 🔑 Using key:', apiKey.substring(0, 15) + '...' + apiKey.substring(apiKey.length - 4));
    } else {
      console.log('[AI UPSELL] ⚠️  No API key found!');
    }

    // Initialize OpenAI client with current env variable
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // Parse request body
    const body = await req.json() as UpsellRequest;
    const { cartItems, menuContext } = body;

    // Validate input
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json(
        { error: 'Cart items are required' },
        { status: 400 }
      );
    }

    if (!menuContext || !Array.isArray(menuContext) || menuContext.length === 0) {
      return NextResponse.json(
        { error: 'Menu context is required' },
        { status: 400 }
      );
    }

    // Prepare data for AI
    const cartSummary = cartItems.map(item =>
      `${item.productName} (x${item.quantity}) - ${item.unitPrice.toLocaleString()} FCFA`
    ).join(', ');

    const availableProducts = menuContext
      .filter(product => !cartItems.some(item => item.productId === product.id))
      .map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price.toLocaleString(),
        tags: product.aiTags.join(', '),
      }));

    if (availableProducts.length === 0) {
      console.log('[AI UPSELL] ⚠️  No products available for suggestion');
      return NextResponse.json(
        { suggestedProductId: null, shortReason: 'Aucun produit disponible' },
        { status: 200 }
      );
    }

    console.log(`[AI UPSELL] 📊 Analyzing ${cartItems.length} cart items against ${availableProducts.length} available products`);

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Tu es un serveur expert dans un restaurant haut de gamme en Afrique de l'Ouest (prix en FCFA).
Ta mission : suggérer UN SEUL produit complémentaire pertinent pour améliorer l'expérience client.

Règles strictes :
1. Suggère uniquement un produit qui complète bien la commande actuelle (par exemple : dessert après plat, boisson avec repas)
2. Reste concis : raison en maximum 8 mots
3. Sois naturel et chaleureux dans ton ton
4. Ne suggère JAMAIS un produit déjà dans le panier
5. Privilégie des suggestions logiques (éviter de suggérer 2 plats principaux par exemple)

Retourne UNIQUEMENT un objet JSON avec :
- suggestedProductId: string (ID du produit suggéré)
- shortReason: string (max 8 mots, ton chaleureux)

Exemple : { "suggestedProductId": "abc123", "shortReason": "Un dessert pour terminer en beauté ?" }`,
        },
        {
          role: 'user',
          content: `Panier actuel : ${cartSummary}

Produits disponibles :
${JSON.stringify(availableProducts, null, 2)}

Suggère un produit complémentaire pertinent.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
      max_tokens: 150,
    });

    const aiResponse = completion.choices[0]?.message?.content;

    if (!aiResponse) {
      console.error('[AI UPSELL] ❌ No response from OpenAI');
      return NextResponse.json(
        { error: 'AI response failed' },
        { status: 500 }
      );
    }

    // Parse AI response
    const suggestion: UpsellResponse = JSON.parse(aiResponse);

    // Validate suggestion
    if (!suggestion.suggestedProductId || !suggestion.shortReason) {
      console.error('[AI UPSELL] ❌ Invalid AI response format');
      return NextResponse.json(
        { error: 'Invalid AI response format' },
        { status: 500 }
      );
    }

    // Verify suggested product exists in menu
    const suggestedProduct = menuContext.find(p => p.id === suggestion.suggestedProductId);
    if (!suggestedProduct) {
      console.error('[AI UPSELL] ❌ AI suggested non-existent product:', suggestion.suggestedProductId);
      return NextResponse.json(
        { error: 'Suggested product not found' },
        { status: 500 }
      );
    }

    console.log(`[AI UPSELL] ✅ Suggestion: ${suggestedProduct.name} - "${suggestion.shortReason}"`);

    // Return suggestion
    return NextResponse.json(suggestion, { status: 200 });

  } catch (error) {
    console.error('[AI UPSELL] ❌ Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
